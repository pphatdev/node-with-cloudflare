import { sql } from "drizzle-orm";
import { Context } from "hono";
import { articles } from "../db/schemas/articles";
import { getTotal, isUnique, pagination } from "../db/schema-helper";
import { Response } from "../libs/utils/response";
import { Article } from "../types/articles";
import { z } from 'zod';
import { users } from "../db/schemas/users";
import { categories } from "../db/schemas/categories";
import { toJSONParse } from "../libs/utils";

const response = new Response();


export class ArticlesController {

    /**
     * Validates the incoming request data for creating or updating an article.
     * @param {Context} c - The Hono context object containing request data.
     * @param {Function} next - The next middleware function to call if validation passes.
     */
    static validation = async (c: Context, next: () => Promise<void>): Promise<void> => {
        const getParams = {
            ...await c.req.parseBody(),
            ...await c.req.raw.json(),
        }

        const params = {
            ...getParams,
            author_id: Number(getParams?.author_id || 0),
            category_id: Number(getParams?.category_id || 0),
            published: Boolean(getParams?.published || false),
            is_featured: Boolean(getParams?.is_featured || false),
            created_date: new Date().toISOString(),
            updated_date: new Date().toISOString(),
            content: JSON.stringify(getParams, null, 2)
        };

        const schema = z.object({
            title: z.string().min(2).max(200),
            slug: z.string().min(2).max(200)
                .refine(
                    async (value) => await isUnique(c, { table: articles, field: 'slug', value }),
                    { message: 'Slug must be unique' }
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
            meta_keywords: z.array(z.string()).optional(),
            is_featured: z.boolean().default(false),
            view_count: z.number().int().default(0),
            tags: z.array(z.string().min(2).max(100)),
        });

        // @ts-ignore
        const { success, error } = await schema.safeParseAsync(params);

        // check reference field
        if (params.category_id != null && params.category_id != undefined) {
            const notExistingCategories = await isUnique(c, {
                table: categories,
                field: 'id',
                value: params.category_id
            });

            if (notExistingCategories) {
                // @ts-ignore
                return c.json(
                    // @ts-ignore
                    response.error([[{ field: "category_id", message: "Category ID does not exist", type: "validation" }]], 400),
                    400
                );
            }
        }

        // check reference field
        if (params.author_id != null && params.author_id != undefined) {
            const notExistingAuthors = await isUnique(c, {
                table: users,
                field: 'id',
                value: params.author_id
            });

            if (notExistingAuthors) {
                // @ts-ignore
                return c.json(
                    // @ts-ignore
                    response.error([[{ field: "author_id", message: "Author ID does not exist", type: "validation" }]], 400),
                    400
                );
            }
        }

        if (!success) {
            // @ts-ignore
            return c.json(response.error([Array.from(error.errors).map(err => {
                // @ts-ignore
                return { field: err.path.join("."), message: err.message, type: err.code };
            })], 400));
        }
        c.set("validated", {
            ...params,
            ...c.get("validated") || {},
            tags: JSON.stringify(params.tags),
            meta_keywords: JSON.stringify(params.meta_keywords)
        });
        await next();
    }

    /**
     * Fetches a list of articles with optional search and pagination.
     * @param {Context} c - The Hono context object containing request data.
     * @returns {Promise<any>} - A JSON response containing the list of articles or an error message.
     */
    static async getArticles(c: Context): Promise<any> {
        try {
            const { search = "", status = true, is_deleted } = c.get("validated") || {};
            const { id, title, slug, content, excerpt, published, published_date, featured_image, meta_title, meta_description, meta_keywords, is_featured, view_count, tags, created_date, updated_date } = articles

            const where = sql`${articles.status} = ${status ? 1 : 0} AND ${articles.is_deleted} = ${is_deleted ? 1 : 0} AND ${articles.title} LIKE ${`%${search}%`}`;

            // Get total count
            const total = await getTotal(c, articles, where);

            // Pagination List
            const { results, success } = await pagination(c, {
                select: { id, title, slug, content, excerpt, published, published_date, featured_image, meta_title, meta_description, meta_keywords, is_featured, view_count, tags, is_deleted, status, created_date, updated_date },
                table: articles,
                where
            });

            if (!success)
                return c.json(response.error("Failed to fetch articles", 500), 500);

            const data: Article[] = results.map((row: Article) => ({
                ...row,
                content: toJSONParse(row.content),
                tags: toJSONParse(row.tags),
                meta_keywords: toJSONParse(row.meta_keywords),
            }));

            return c.json(response.paginate(data, total, 200, "Request was successful"), 200);

        } catch (error) {
            console.error("Error in getArticles:", error);
            return c.json(response.error("Failed to fetch articles", 500), 500);
        }
    }

    /**
     * Creates a new article in the database.
     * @param {Context} c - The Hono context object containing request data.
     * @returns {Promise<any>} - A JSON response containing the created article or an error message.
     */
    static async createArticle(c: Context): Promise<any> {
        const user = c.get("user");
        const params = c.get("validated");
        const db = c.get("db");

        try {
            const { success, results } = await db.insert(articles).values({ ...params, author_id: user.id }).run();
            console.log("Create article results:", results, "success:", success);

            if (!success) {
                return c.json(response.error("Failed to create article", 500), 500);
            }

            return c.json(response.success({}, 201, "Article created successfully"), 201);

        } catch (error) {
            console.error("Error in createArticle:", error);
            return c.json(response.error("Failed to create article", 500), 500);
        }
    }

    /**
     * Updates an existing article.
     * @param {Context} c - The Hono context object containing request data.
     * @returns {Promise<any>} - A JSON response indicating the success or failure of the update.
     */
    static async updateArticle(c: Context): Promise<any> {
        try {
            const params = c.get("validated");
            delete params.created_date;

            const db = c.get("db");
            const { success } = await db
                .update(articles)
                .set(params)
                .where(sql`${articles.id} = ${params.id}`)
                .run();

            if (!success) {
                return c.json(response.error("Failed to update article", 500), 500);
            }

            return c.json(response.success({}, 200, "Article updated successfully"), 200);

        } catch (error) {
            console.error("Error in updateArticle:", error);
            return c.json(response.error("Failed to update article", 500), 500);
        }
    }

    /**
     * Deletes an article.
     * @param {Context} c - The Hono context object containing request data.
     * @returns {Promise<any>} - A JSON response indicating the success or failure of the deletion.
     */
    static async deleteArticle(c: Context): Promise<any> {
        try {
            const db = c.get("db");
            const id = c.get("id");
            const { success } = await db
                .update(articles)
                .set({ status: 0, is_deleted: 1 })
                .where(sql`${articles.id} = ${id}`)
                .run();

            if (!success) {
                return c.json(response.error("Failed to delete article", 500), 500);
            }

            return c.json(response.success({}, 200, "Article deleted successfully"), 200);

        } catch (error) {
            console.error("Error in deleteArticle:", error);
            return c.json(response.error("Failed to delete article", 500), 500);
        }
    }

    /**
     * Get article details by ID.
     * @param {Context} c - The Hono context object containing request data.
     * @returns {Promise<any>} - A JSON response containing the article details or an error message.
     */
    static async getDetailArticles(c: Context): Promise<any> {
        try {
            const { id } = c.get("validated");
            const db = c.get("db");

            // First, get the article
            const { results: articleResults, success: articleSuccess } = await db
                .select()
                .from(articles)
                .where(sql`${articles.id} = ${id}`)
                .run();

            if (!articleSuccess || articleResults.length === 0) {
                return c.json(response.error("Article not found", 404), 404);
            }

            const article = articleResults[0];

            // Get author info
            const { results: authorResults } = await db
                .select()
                .from(users)
                .where(sql`${users.id} = ${article.author_id}`)
                .run();

            // Get category info
            const { results: categoryResults } = await db
                .select()
                .from(categories)
                .where(sql`${categories.id} = ${article.category_id}`)
                .run();

            const data = {
                // id: article.id,
                title: article.title,
                slug: `/${article.slug}/${categoryResults[0].slug}`,
                content: JSON.stringify(toJSONParse(article.content)),
                description: article.excerpt,
                cover: article.featured_image,
                meta: {
                    title: article.meta_title,
                    description: article.meta_description,
                    keywords: toJSONParse(article.meta_keywords)
                },
                is_featured: Boolean(article.is_featured),
                view_count: article.view_count,
                tags: toJSONParse(article.tags),
                published: Boolean(article.published),
                published_date: article.published_date,
                modified_date: article.updated_date,
                category: categoryResults[0] ? {
                    id: categoryResults[0].id,
                    name: categoryResults[0].name,
                    slug: categoryResults[0].slug
                } : null,
                author: authorResults[0] ? {
                    id: authorResults[0].id,
                    name: authorResults[0].name,
                    email: authorResults[0].email
                } : null
            };

            return c.json(response.success(data, 200, "Article fetched successfully"), 200);

        } catch (error) {
            console.error("Error in getDetailArticles:", error);
            return c.json(response.error("Failed to retrieve article", 500), 500);
        }
    }
}


export const {
    getArticles,
    createArticle,
    validation,
    deleteArticle,
    updateArticle,
    getDetailArticles
} = ArticlesController;

export default ArticlesController;