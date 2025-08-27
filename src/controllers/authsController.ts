import { Context } from "hono";
import { sql } from 'drizzle-orm';
import { compare } from "bcryptjs";
import { Response } from '../libs/utils/response';
import { z } from 'zod';
import { SignJWT } from "jose";
import { secret } from "../libs/utils";
import { sessions } from '../db/schemas/sessions';
import { getConnInfo } from 'hono/cloudflare-workers'
import { users } from '../db/schemas/users';


const response = new Response();

export class AuthsController {

    /**
     * Handles user login.
     * @param {Context} c - The Hono context object containing request data.
     * @returns {Promise<any>} - A JSON response containing the login result or an error message.
     */
    static async login(c: Context): Promise<any> {
        const params = {
            ...await c.req.parseBody(),
            ...await c.req.raw.json()
        };

        const schema = z.object({
            email: z.string().email(),
            password: z.string().min(6).max(100)
        });

        // @ts-ignore
        const { success, error } = await schema.safeParseAsync(params);

        if (!success) {
            // @ts-ignore
            return c.json(response.error([Array.from(error.errors).map(err => {
                // @ts-ignore
                return { field: err.path.join("."), message: err.message, type: err.code };
            })], 400));
        }

        const db = c.get("db");

        const { email, password } = params;
        const { results } = await db.select().from(users).where(sql`${users.email} = ${email}`).limit(1).run();

        if (results[0] == null && results[0] == undefined) {
            // @ts-ignore
            return c.json(response.error([[{ field: "email", message: "Email not found", type: "validation" }]], 401), 401);
        }

        const { password_hash: passwordFromDB, id: userId, name } = results[0];
        const isPasswordMatch = await compare(password, passwordFromDB);

        if (!isPasswordMatch) {
            // @ts-ignore
            return c.json(response.error([[{ field: "password", message: "Invalid password", type: "validation" }]], 400), 400);
        }

        // get device info
        const userAgent = c.req.header("User-Agent");
        const connInfo = getConnInfo(c);
        const ipAddress = connInfo.remote.address;

        // Generate JWT token
        const token = await new SignJWT({ id: userId, username: name, userAgent, ipAddress })
            .setProtectedHeader({ alg: 'HS256' })
            .setIssuedAt()
            .setExpirationTime('2h')
            .sign(new TextEncoder().encode(secret));

        try {
            // insert token to database
            const loginDate = new Date().toISOString();
            await db.insert(sessions).values({ user_id: userId, token, devices: userAgent, ip_address: ipAddress, created_date: loginDate, updated_date: loginDate }).run();
        } catch (error) {
            console.error("Error inserting session:", error);
        }

        return c.json(response.success({
            type: "Bearer",
            token,
            user: { ...results[0], password_hash: undefined } // Exclude password hash from response
        }, 200, "Login successfully"), 200);
    }

    /**
     * Handles user logout.
     * @param {Context} c - The Hono context object containing request data.
     * @returns {Promise<any>} - A JSON response indicating the logout result.
     */
    static async logout(c: Context): Promise<any> {
        // Extract the token from the Authorization header
        const authHeader = c.req.header("Authorization");

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            // @ts-ignore
            return c.json(response.error([{ field: "token", message: "No token provided", type: "validation" }], 401, "Logout failed"), 401);
        }

        // Get the token from the Authorization header
        const token = authHeader.split(" ")[1];

        // Insert the token into the blacklist table
        const db = c.get("db");
        const user = c.get("user");

        // revoke all sessions of the user
        try {
            const { success } = await db
                .update(sessions)
                .set({ status: 0 })
                .where(sql`${sessions.user_id} = ${user.id} and ${sessions.token} = ${token}`)
                .run();
            if (!success) {
                return c.json(response.error("Failed to revoke sessions", 500), 500);
            }
        } catch (error) {
            console.error("Error in revoking sessions:", error);
            return c.json(response.error("Failed to revoke sessions", 500), 500);
        }

        return c.json(response.success({}, 200, "Logout successful"), 200);
    }
}


export const {
    login,
    logout
} = AuthsController;


export default AuthsController;