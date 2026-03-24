import { sql } from "drizzle-orm";
import { categories } from "../../db/schemas/categories";
import { getTotal, paginate } from "../../shared/helpers/db.helper";
import type { Category } from "../../shared/types/categories";

export type CategoryQueryParams = {
    search?: string;
    status?: boolean;
    is_deleted?: boolean;
    page?: number;
    limit?: number;
    sort?: string;
};

export class CategoriesService {
    static async findAll(db: any, params: CategoryQueryParams): Promise<{ data: Category[]; total: number }> {
        const { search = "", status = true, is_deleted = false, page, limit, sort } = params;
        const { id, name, slug, description, parent_id, image, is_active } = categories;

        const where = sql`${categories.status} = ${status ? 1 : 0} AND ${categories.is_deleted} = ${is_deleted ? 1 : 0} AND ${categories.name} LIKE ${`%${search}%`}`;

        const total = await getTotal(db, categories, where);
        const { results, success } = await paginate(db, {
            select: { id, name, slug, description, parent_id, image, is_active },
            table: categories,
            where, page, limit, sort,
        });

        if (!success) throw new Error("Failed to fetch categories");
        return { data: results, total };
    }

    static async findById(db: any, id: number): Promise<Category | null> {
        const { results } = await db
            .select()
            .from(categories)
            .where(sql`${categories.id} = ${id}`)
            .run();
        return results[0] ?? null;
    }

    static async create(db: any, params: any): Promise<any> {
        const { success, results } = await db.insert(categories).values(params).run();
        if (!success) throw new Error("Failed to create category");
        return results;
    }

    static async update(db: any, id: number, params: any): Promise<void> {
        const updated = { ...params };
        delete updated.created_date;
        const { success } = await db.update(categories).set(updated).where(sql`${categories.id} = ${id}`).run();
        if (!success) throw new Error("Failed to update category");
    }

    static async softDelete(db: any, id: number): Promise<void> {
        const { success } = await db.update(categories).set({ status: 0, is_deleted: 1 }).where(sql`${categories.id} = ${id}`).run();
        if (!success) throw new Error("Failed to delete category");
    }
}
