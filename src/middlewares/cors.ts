import { Context } from "hono";
import AppConfig from "../config";

export const corsMiddleware = async (c: Context, next: () => Promise<void>) => {
    const origin = c.req.header("origin");
    const { allowedOrigins, allowedDomains } = AppConfig.cors;

    const isDomainAllowed = allowedDomains.some(domain => origin?.endsWith(domain));

    if (origin && (allowedOrigins.includes(origin) || isDomainAllowed)) {
        c.header("Access-Control-Allow-Origin", origin);
    }

    c.header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
    c.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
    c.header("Access-Control-Allow-Credentials", "true");

    if (c.req.method === "OPTIONS") {
        return c.text("__options__");
    }

    await next();
};
