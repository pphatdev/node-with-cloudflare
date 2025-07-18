import { AnyD1Database, drizzle, DrizzleD1Database } from 'drizzle-orm/d1';
import { MiddlewareHandler } from 'hono';

export interface Env {
    DB: AnyD1Database;
    CLOUDFLARE_DATABASE_ID: DrizzleD1Database;
}

const drizzleMiddleware: MiddlewareHandler = async (c, next) => {
    if (!c.env.DB) {
        console.error("DB binding is missing in environment.");
        return c.text("Database not configured", 500);
    }
    // Only wrap with drizzle if not already a DrizzleD1Database
    c.set("db", drizzle(c.env.DB));
    await next();
};

export default drizzleMiddleware;