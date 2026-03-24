import { sql } from "drizzle-orm";
import { articles, createArticlesTableQuery } from "../../db/schemas/articles";
import { users } from "../../db/schemas/users";
import { getTotal, paginate } from "../../shared/helpers/db.helper";
import { toJSONParse } from "../../shared/utils/json";
import type { Article } from "../../shared/types/articles";

export type ArticleQueryParams = {
    search?: string;
    status?: boolean;
    is_deleted?: boolean;
    page?: number;
    limit?: number;
    sort?: string;
};

export class ArticlesService {
    static isMissingTableError(error: unknown): boolean {
        const message = error instanceof Error ? error.message : String(error);
        return message.includes("no such table: articles");
    }

    static async ensureTable(dbBinding: any): Promise<void> {
        if (!dbBinding?.prepare) throw new Error("Database binding unavailable");
        await dbBinding.prepare(createArticlesTableQuery).run();
    }

    static async findAll(db: any, params: ArticleQueryParams): Promise<{ data: Article[]; total: number }> {
        const { search = "", status = true, is_deleted = false, page, limit, sort } = params;
        const { id, title, slug, content, excerpt, published, published_date, featured_image, meta_title, meta_description, meta_keywords, is_featured, view_count, tags, moderators, is_deleted: _d, status: _s, created_date, updated_date } = articles;

        const where = sql`${articles.status} = ${status ? 1 : 0} AND ${articles.is_deleted} = ${is_deleted ? 1 : 0} AND ${articles.title} LIKE ${`%${search}%`}`;

        const total = await getTotal(db, articles, where);
        const { results, success } = await paginate(db, {
            select: { id, title, slug, content, excerpt, published, published_date, featured_image, meta_title, meta_description, meta_keywords, is_featured, view_count, tags, moderators, is_deleted: _d, status: _s, created_date, updated_date },
            table: articles,
            where, page, limit, sort,
        });

        if (!success) throw new Error("Failed to fetch articles");

        const data: Article[] = results.map((item: any) => ({
            ...item,
            tags: toJSONParse(item.tags),
            moderators: toJSONParse(item.moderators),
            meta_keywords: toJSONParse(item.meta_keywords),
            is_featured: Boolean(item.is_featured),
            published: Boolean(item.published),
        }));

        return { data, total };
    }

    static async findBySlug(db: any, slug: string): Promise<{ article: any; author: any } | null> {
        const { results, success } = await db
            .select()
            .from(articles)
            .where(sql`${articles.slug} = ${slug} AND ${articles.status} = 1 AND ${articles.is_deleted} = 0`)
            .run();

        if (!success || results.length === 0) return null;

        const article = results[0];
        const { results: authorResults } = await db
            .select()
            .from(users)
            .where(sql`${users.id} = ${article.author_id}`)
            .run();

        return { article, author: authorResults[0] ?? null };
    }

    static async create(db: any, params: any, authorId: number): Promise<void> {
        const { success } = await db.insert(articles).values({ ...params, author_id: authorId }).run();
        if (!success) throw new Error("Failed to create article");
    }

    static async update(db: any, params: any): Promise<void> {
        const updated = { ...params };
        delete updated.created_date;
        const { success } = await db.update(articles).set(updated).where(sql`${articles.id} = ${params.id}`).run();
        if (!success) throw new Error("Failed to update article");
    }

    static async softDelete(db: any, id: number): Promise<void> {
        const { success } = await db.update(articles).set({ status: 0, is_deleted: 1 }).where(sql`${articles.id} = ${id}`).run();
        if (!success) throw new Error("Failed to delete article");
    }
}
