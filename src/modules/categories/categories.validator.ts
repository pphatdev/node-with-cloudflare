import { z } from "zod";
import { Context } from "hono";
import { Response } from "../../shared/utils/response";
import { isUnique } from "../../shared/helpers/db.helper";
import { categories } from "../../db/schemas/categories";
import { parseBody } from "../../shared/utils/json";

const response = new Response();

export const validateCategory = async (c: Context, next: () => Promise<void>): Promise<void> => {
    const db = c.get("db");
    const params: Record<string, any> = {
        ...await parseBody(c),
        created_date: new Date().toISOString(),
        updated_date: new Date().toISOString(),
    };

    const schema = z.object({
        name: z.string().min(2).max(100),
        slug: z.string().min(2).max(200).refine(
            async (value) => await isUnique(db, { table: categories, field: "slug", value }),
            { message: "Slug must be unique" }
        ),
        description: z.string().max(500).optional(),
        parent_id: z.number().int().optional(),
        image: z.string().url().optional(),
        is_active: z.boolean().default(true),
        status: z.boolean().default(true),
        created_date: z.string().optional(),
        updated_date: z.string().optional(),
    });

    // @ts-ignore
    const { success, error } = await schema.safeParseAsync(params);

    if (params.parent_id != null) {
        const notExisting = await isUnique(db, { table: categories, field: "id", value: params.parent_id });
        if (notExisting) {
            // @ts-ignore
            return c.json(response.error([[{ field: "parent_id", message: "Parent ID does not exist", type: "validation" }]], 400), 400);
        }
    }

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
        status: Boolean(params.status),
        is_active: Boolean(params.is_active),
    });
    await next();
};
