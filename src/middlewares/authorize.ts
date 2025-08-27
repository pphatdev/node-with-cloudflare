import { Context, Next } from "hono";
import { jwtVerify } from "jose";
import { secret } from "../libs/utils";
import { Response } from "../libs/utils/response";
import { sessions } from "../db/schemas/sessions";
import { sql } from 'drizzle-orm';
const response = new Response();

export class AuthsMiddleware {
    /**
     * Middleware to authorize requests using JWT.
     * It checks for the Authorization header, verifies the JWT,
     * and sets the user in the context if valid.
     * @param c - The Hono context object.
     * @param next - The next middleware function.
     * @returns A promise that resolves when the middleware is complete.
     */
    static async authorize(c: Context, next: Next) {
        const authHeader = c.req.header('Authorization');

        // Check if the Authorization header is present and properly formatted
        if (!authHeader) return c.json(response.error("Unauthorized", 401), 401);

        // Check if the Authorization header starts with 'Bearer '
        if (!authHeader.startsWith('Bearer ')) return c.json(response.error("Invalid token format", 400), 400);

        // Extract the token from the Authorization header
        const token = authHeader.split(' ')[1];

        try {
            // Verify the JWT using the secret
            const textSecret = new TextEncoder().encode(secret);
            const { payload } = await jwtVerify(token, textSecret);

            // Set the user in the context for downstream handlers
            c.set('user', payload);

            // check revoked session
            const db = c.get("db");
            const { results } = await db.select()
                .from(sessions)
                .where(sql`${sessions.token} = ${token} and ${sessions.status} = 1`)
                .limit(1)
                .run();

            // If no active session is found, the token has been revoked
            if (results.length === 0) return c.json(response.error("Token has been revoked", 401), 401);

            await next();
        } catch (e) {
            return c.json(response.error("Invalid token", 401), 401);
        }
    }
}

export const { authorize } = AuthsMiddleware;
export default AuthsMiddleware;