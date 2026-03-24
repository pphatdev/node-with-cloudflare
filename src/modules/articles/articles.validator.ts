import { z } from "zod";
import { Context } from "hono";
import { Response } from "../../shared/utils/response";
import { isUnique } from "../../shared/helpers/db.helper";
import { articles } from "../../db/schemas/articles";
import { users } from "../../db/schemas/users";
import { categories } from "../../db/schemas/categories";
import { parseBody } from "../../shared/utils/json";

const response = new Response();

export const validateArticle = async (c: Context, next: () => Promise<void>): Promise<void> => {
    const db = c.get("db");
    const raw = await parseBody(c);

    const params: Record<string, any> = {
        ...raw,
        view_count: Number(raw?.view_count || 0),
        author_id: Number(raw?.author_id || 0),
        category_id: Number(raw?.category_id || 0),
        published: Boolean(raw?.published || false),
        is_featured: Boolean(raw?.is_featured || false),
        created_date: new Date().toISOString(),
        updated_date: new Date().toISOString(),
    };

    const schema = z.object({
        title: z.string().min(2).max(200),
        slug: z.string().min(2).max(200).refine(
            async (value) => await isUnique(db, { table: articles, field: "slug", value }),
            { message: "Slug must be unique" }
        ),
        content: z.string().min(10).max(10000),
        excerpt: z.string().min(10).max(500),
        author_id: z.number().int(),
        category_id: z.number().int(),
        published: z.boolean(),
        published_date: z.string().optional(),
        featured_image: z.string().url().optional(),
        meta_title: z.string().max(200).optional(),
        meta_description: z.string().max(500).optional(),
        meta_keywords: z.string().min(5).max(255).optional(),
        is_featured: z.boolean().default(false),
        view_count: z.number().int().default(0),
        tags: z.string().min(5).max(255).optional(),
        moderators: z.string().optional(),
    });

    // @ts-ignore
    const { success, error } = await schema.safeParseAsync(params);

    if (params.category_id != null && params.category_id !== 0) {
        const notExisting = await isUnique(db, { table: categories, field: "id", value: params.category_id });
        if (notExisting) {
            // @ts-ignore
            return c.json(response.error([[{ field: "category_id", message: "Category ID does not exist", type: "validation" }]], 400), 400);
        }
    }

    if (params.author_id != null && params.author_id !== 0) {
        const notExisting = await isUnique(db, { table: users, field: "id", value: params.author_id });
        if (notExisting) {
            // @ts-ignore
            return c.json(response.error([[{ field: "author_id", message: "Author ID does not exist", type: "validation" }]], 400), 400);
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
        tags: JSON.stringify(params.tags),
        moderators: JSON.stringify(params.moderators),
        meta_keywords: JSON.stringify(params.meta_keywords),
    });
    await next();
};
