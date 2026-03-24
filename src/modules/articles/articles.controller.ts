import { Context } from "hono";
import { Response } from "../../shared/utils/response";
import { toJSONParse } from "../../shared/utils/json";
import { ArticlesService } from "./articles.service";

const response = new Response();

export class ArticlesController {
    static async list(c: Context): Promise<any> {
        const db = c.get("db");
        const { search, status, is_deleted, page, limit, sort } = c.get("validated") || {};
        try {
            const { data, total } = await ArticlesService.findAll(db, { search, status, is_deleted, page, limit, sort });
            return c.json(response.paginate(data, total, 200, "Request was successful"), 200);
        } catch (error) {
            if (ArticlesService.isMissingTableError(error)) {
                try {
                    await ArticlesService.ensureTable(c.env?.DB);
                    return c.json(response.paginate([], 0, 200, "Request was successful"), 200);
                } catch {}
            }
            console.error("Error in list articles:", error);
            return c.json(response.error("Failed to fetch articles", 500), 500);
        }
    }

    static async detail(c: Context): Promise<any> {
        const db = c.get("db");
        const { slug } = c.get("validated") || {};
        try {
            const result = await ArticlesService.findBySlug(db, slug);
            if (!result) return c.json(response.error("Article not found", 404), 404);

            const { article, author } = result;
            const parsedTags = toJSONParse(article.tags);
            const tags = Array.isArray(parsedTags) ? parsedTags : parsedTags ? [parsedTags] : [];

            return c.json({
                id: article.slug,
                title: article.title,
                slug: article.slug,
                description: article.excerpt,
                tags,
                authors: author ? [{ name: author.name, profile: "", url: "" }] : [],
                thumbnail: article.featured_image,
                published: Boolean(article.published),
                createdAt: article.created_date,
                updatedAt: article.updated_date,
                content: article.content,
                filePath: `posts/${article.slug}/index.mdx`,
            }, 200);
        } catch (error) {
            if (ArticlesService.isMissingTableError(error)) {
                try {
                    await ArticlesService.ensureTable(c.env?.DB);
                    return c.json(response.error("Article not found", 404), 404);
                } catch {}
            }
            console.error("Error in article detail:", error);
            return c.json(response.error("Failed to retrieve article", 500), 500);
        }
    }

    static async create(c: Context): Promise<any> {
        const db = c.get("db");
        const user = c.get("user");
        const params = c.get("validated");
        try {
            await ArticlesService.create(db, params, user.id);
            return c.json(response.success({}, 201, "Article created successfully"), 201);
        } catch (error) {
            console.error("Error in create article:", error);
            return c.json(response.error("Failed to create article", 500), 500);
        }
    }

    static async update(c: Context): Promise<any> {
        const db = c.get("db");
        const params = c.get("validated");
        try {
            await ArticlesService.update(db, params);
            return c.json(response.success({}, 200, "Article updated successfully"), 200);
        } catch (error) {
            console.error("Error in update article:", error);
            return c.json(response.error("Failed to update article", 500), 500);
        }
    }

    static async softDelete(c: Context): Promise<any> {
        const db = c.get("db");
        const { id } = c.get("validated");
        try {
            await ArticlesService.softDelete(db, id);
            return c.json(response.success({}, 200, "Article deleted successfully"), 200);
        } catch (error) {
            console.error("Error in delete article:", error);
            return c.json(response.error("Failed to delete article", 500), 500);
        }
    }
}
