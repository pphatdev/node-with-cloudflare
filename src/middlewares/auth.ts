import { Context, Next } from "hono";
import { jwtVerify } from "jose";
import { sql } from "drizzle-orm";
import { secret, getSecret } from "../config";
import { Response } from "../shared/utils/response";
import { sessions } from "../db/schemas/sessions";

const response = new Response();

export const authorize = async (c: Context, next: Next) => {
    const authHeader = c.req.header("Authorization");

    if (!authHeader) return c.json(response.error("Unauthorized", 401), 401);
    if (!authHeader.startsWith("Bearer ")) return c.json(response.error("Invalid token format", 400), 400);

    const token = authHeader.split(" ")[1];

    try {
        const { payload } = await jwtVerify(token, new TextEncoder().encode(getSecret(c)));
        c.set("user", payload);

        const db = c.get("db");
        const { results } = await db
            .select()
            .from(sessions)
            .where(sql`${sessions.token} = ${token} AND ${sessions.status} = 1`)
            .limit(1)
            .run();

        if (results.length === 0) return c.json(response.error("Token has been revoked", 401), 401);

        await next();
    } catch {
        return c.json(response.error("Invalid token", 401), 401);
    }
};
