import { Context } from "hono";

export const toJSONParse = (data: any): any =>
    Array.isArray(data) ? data : JSON.parse(data || "[]");

/**
 * Safely parse request body — works in Cloudflare Workers where the body stream can only be consumed once.
 * Tries JSON first, falls back to parseBody() for form data.
 */
export const parseBody = async (c: Context): Promise<Record<string, any>> => {
    try {
        return await c.req.json();
    } catch {
        try {
            return await c.req.parseBody() as Record<string, any>;
        } catch {
            return {};
        }
    }
};
