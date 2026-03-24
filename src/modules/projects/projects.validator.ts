import { z } from "zod";
import { Context } from "hono";
import { Response } from "../../shared/utils/response";
import { parseBody } from "../../shared/utils/json";

const response = new Response();

export const validateProject = async (c: Context, next: () => Promise<void>): Promise<void> => {
    const params: Record<string, any> = {
        ...await parseBody(c),
        created_date: new Date().toISOString(),
        updated_date: new Date().toISOString(),
    };

    const schema = z.object({
        name: z.string().min(2).max(100),
        description: z.string().min(10).max(1000),
        image: z.string().url(),
        published: z.boolean(),
        tags: z.array(z.string().min(2).max(100)),
        source: z.array(z.string().min(2).max(100)),
        authors: z.array(z.string().min(2).max(100)),
        languages: z.array(z.string().min(2).max(100)),
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

    c.set("validated", {
        ...params,
        ...c.get("validated") || {},
        tags: JSON.stringify(params.tags),
        source: JSON.stringify(params.source),
        authors: JSON.stringify(params.authors),
        languages: JSON.stringify(params.languages),
    });
    await next();
};
