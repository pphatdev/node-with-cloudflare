import { Context } from "hono";
import { users } from "../db/schema";
import { eq, sql } from 'drizzle-orm';
import { compare } from "bcryptjs";
import { Response } from '../libs/utils/response';
import { z } from 'zod';
import { SignJWT } from "jose";
import { secret } from "../libs/utils";

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

        // Generate JWT token
        const token = await new SignJWT({ id: userId, username: name })
            .setProtectedHeader({ alg: 'HS256' })
            .setIssuedAt()
            .setExpirationTime('2h')
            .sign(new TextEncoder().encode(secret));

        return c.json(response.success({
            type: "Bearer",
            token,
            user: { ...results[0], password_hash: undefined } // Exclude password hash from response
        }, 200, "Login successfully"), 200);
    }
}

export const {
    login,
    // register,
    // logout
} = AuthsController;


export default AuthsController;