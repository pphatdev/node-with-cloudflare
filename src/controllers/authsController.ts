import { Context } from "hono";
import { sql } from 'drizzle-orm';
import { z } from 'zod';
import { compare } from "bcryptjs";
import { Response } from '../libs/utils/response';
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
            return c.json(response.error([Array.from(error.errors).map(err => ({ field: err.path.join("."), message: err.message, type: err.code }))], 400));
        }

        const { email, password } = params;
        const db = c.get("db");

        try {
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

            // expiry
            const expiresAtIso = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();

            // Generate JWT token
            const token = await new SignJWT({ id: userId, username: name, userAgent, ipAddress })
                .setProtectedHeader({ alg: 'HS256' })
                .setIssuedAt()
                .setExpirationTime('2h')
                .sign(new TextEncoder().encode(secret));

            try {
                // insert token to database
                const loginDate = new Date().toISOString();
                await db.insert(sessions).values({
                    user_id: userId,
                    token,
                    devices: userAgent,
                    ip_address: ipAddress,
                    created_date: loginDate,
                    updated_date: loginDate,
                    expires_date: expiresAtIso
                }).run();
            } catch (error) {
                console.error("Error inserting session:", error);
            }

            return c.json(response.success({
                type: "Bearer",
                token,
                user: { ...results[0], password_hash: undefined } // Exclude password hash from response
            }, 200, "Login successfully"), 200);
        } catch (error) {
            console.error("Error during login:", error);
            return c.json(response.error("Internal server error", 500), 500);
        }
    }


    /**
     * Verifies the user's token.
     * @param {Context} c - The Hono context object containing request data.
     * @returns {Promise<any>} - A JSON response indicating the verification result.
     */
    static async verifyToken(c: Context): Promise<any> {
        const authHeader = c.req.header("Authorization");

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            // @ts-ignore
            return c.json({
                status: 401,
                success: false,
                version: Response.VERSION,
                message: "❌ No token provided. Make sure to include it in the Authorization header."
            }, 401);
        }

        const token = authHeader.split(" ")[1];
        const db = c.get("db");

        try {
            const { results } = await db.select().from(sessions).where(sql`${sessions.token} = ${token} and ${sessions.status} = 1`).run();
            console.log(results);

            if (results.length === 0) {
                return c.json({
                    status: 401,
                    success: false,
                    version: Response.VERSION,
                    message: "❌ Token has been revoked. Please log in again."
                }, 401);
            }

            // check token expiration
            const isExpired = results[0].expires_at < new Date();
            if (isExpired) {
                return c.json({
                    status: 401,
                    success: false,
                    version: Response.VERSION,
                    message: "❌ Token is expired. Please log in again."
                }, 401);
            }

            return c.json({
                status: 200,
                success: true,
                version: Response.VERSION,
                message: "✅ Token is valid"
            }, 200);
        } catch (error) {
            console.error("Error verifying token:", error);
            return c.json({
                status: 500,
                success: false,
                version: Response.VERSION,
                message: "❌ Internal server error"
            }, 500);
        }
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

    /**
     * Refreshes the access token for an authenticated user.
     */
    static async refreshToken(c: Context): Promise<any> {
        // Read Authorization header
        const authHeader = c.req.header("Authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            // @ts-ignore
            return c.json(response.error([{ field: "token", message: "No token provided", type: "validation" }], 401, "Refresh failed"), 401);
        }
        const currentToken = authHeader.split(" ")[1];

        const db = c.get("db");

        try {
            // Find active session by token
            const { results } = await db.select().from(sessions).where(sql`${sessions.token} = ${currentToken} and ${sessions.status} = 1`).limit(1).run();

            if (!results || results.length === 0) {
                // @ts-ignore
                return c.json(response.error([{ field: "token", message: "Invalid or revoked token", type: "validation" }], 401, "Refresh failed"), 401);
            }

            const session = results[0];

            // Optional: treat expired sessions as invalid for refresh
            if (session.expires_date && new Date(session.expires_date) < new Date()) {
                // @ts-ignore
                return c.json(response.error([{ field: "token", message: "Token expired", type: "validation" }], 401, "Refresh failed"), 401);
            }

            // Prepare device info and payload
            const userAgent = c.req.header("User-Agent");
            const connInfo = getConnInfo(c);
            const ipAddress = connInfo.remote.address;

            // Get user info from session or users table if needed
            // Attempt to use session.user_id and users table for name
            let userId = session.user_id;
            let username = session.username ?? session.name; // fallback
            if (!username) {
                const { results: userResults } = await db.select().from(users).where(sql`${users.id} = ${userId}`).limit(1).run();
                if (userResults && userResults.length) {
                    username = userResults[0].name;
                }
            }

            // Generate a new access token (2 hours)
            const newToken = await new SignJWT({ id: userId, username, userAgent, ipAddress })
                .setProtectedHeader({ alg: 'HS256' })
                .setIssuedAt()
                .setExpirationTime('2h')
                .sign(new TextEncoder().encode(secret));

            // Update session with new token and new expiry
            const nowIso = new Date().toISOString();
            const expiresAtIso = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(); // 2 hours

            try {
                const { success } = await db
                    .update(sessions)
                    .set({ token: newToken, updated_date: nowIso, expires_at: expiresAtIso })
                    .where(sql`${sessions.id} = ${session.id}`)
                    .run();

                if (!success) {
                    console.error("Failed to update session on refresh");
                    return c.json(response.error("Failed to refresh token", 500), 500);
                }
            } catch (err) {
                console.error("Error updating session during refresh:", err);
                return c.json(response.error("Failed to refresh token", 500), 500);
            }

            // Exclude password_hash if user object present on session or fetch user object
            let userObj = session;
            if (userObj && userObj.password_hash) userObj.password_hash = undefined;

            return c.json(response.success({
                type: "Bearer",
                token: newToken,
                user: userObj
            }, 200, "Token refreshed successfully"), 200);
        } catch (error) {
            console.error("Error refreshing token:", error);
            return c.json(response.error("Internal server error", 500), 500);
        }
    }
}


export const { login, logout, verifyToken, refreshToken } = AuthsController;


export default AuthsController;