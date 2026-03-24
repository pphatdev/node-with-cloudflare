import { z } from "zod";
import { Context } from "hono";
import { Response } from "../../shared/utils/response";

const response = new Response();

export const validateSession = async (c: Context, next: () => Promise<void>): Promise<void> => {
    const params = {
        ...await c.req.parseBody(),
        ...await c.req.raw.json(),
        created_date: new Date().toISOString(),
        updated_date: new Date().toISOString(),
    };

    const schema = z.object({
        user_id: z.number().int(),
        expires_date: z.string().optional(),
        created_date: z.string().optional(),
        updated_date: z.string().optional(),
    });

    // @ts-ignore
    const { success, error } = schema.safeParse(params);

    if (!success) {
        // @ts-ignore
        return c.json(response.error([Array.from(error.errors).map(err => ({
            // @ts-ignore
            field: err.path.join("."), message: err.message, type: err.code,
        }))], 400));
    }

    c.set("validated", { ...params, ...c.get("validated") || {} });
    await next();
};
