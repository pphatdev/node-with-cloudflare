import { Context } from "hono";
import { jwtVerify } from "jose";
import { secret } from "../libs/utils";
import { Response } from "../libs/utils/response";
const response = new Response();

export class AuthsMiddleware {
    /**
     * Middleware to authorize requests using JWT.
     * It checks for the Authorization header, verifies the JWT,
     * and sets the user in the context if valid.
     */
    static async authorize(c: Context, next: () => Promise<void>) {
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
            await next();
        } catch (e) {
            return c.json(response.error("Invalid token", 401), 401);
        }
    }
}

export const { authorize } = AuthsMiddleware;
export default AuthsMiddleware;