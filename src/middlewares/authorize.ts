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
     */
    static async authorize(c: Context, next: Next) {
        const authHeader = c.req.header('Authorization');

        if (!authHeader) {
            return c.json(response.error("Unauthorized", 401), 401);
        }

        if (!authHeader.startsWith('Bearer ')) {
            return c.json(response.error("Invalid token format", 400), 400);
        }

        const token = authHeader.split(' ')[1];

        try {
            const { payload } = await jwtVerify(token, new TextEncoder().encode(secret));
            c.set('user', payload);

            // check revoked session
            const db = c.get("db");
            const { results } = await db
                .select()
                .from(sessions)
                .where(sql`${sessions.token} = ${token} and ${sessions.status} = 1`)
                .limit(1)
                .run();

            if (results.length === 0) {
                return c.json(response.error("Token has been revoked", 401), 401);
            }

            await next();
        } catch (e) {
            return c.json(response.error("Invalid token", 401), 401);
        }
    }
}

export const { authorize } = AuthsMiddleware;
export default AuthsMiddleware;