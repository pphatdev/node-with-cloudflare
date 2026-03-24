import { Context } from "hono";
import { Response } from "../../shared/utils/response";
import { CategoriesService } from "./categories.service";

const response = new Response();

export class CategoriesController {
    static async list(c: Context): Promise<any> {
        const db = c.get("db");
        const { search, status, is_deleted, page, limit, sort } = c.get("validated") || {};
        try {
            const { data, total } = await CategoriesService.findAll(db, { search, status, is_deleted, page, limit, sort });
            return c.json(response.paginate(data, total, 200, "Request was successful"), 200);
        } catch (error) {
            console.error("Error in list categories:", error);
            return c.json(response.error("Failed to fetch categories", 500), 500);
        }
    }

    static async detail(c: Context): Promise<any> {
        const db = c.get("db");
        const { id } = c.get("validated") || {};
        try {
            const data = await CategoriesService.findById(db, id);
            if (!data) return c.json(response.error("Category not found", 404), 404);
            return c.json(response.success(data, 200, "Category fetched successfully"), 200);
        } catch (error) {
            console.error("Error in category detail:", error);
            return c.json(response.error("Failed to fetch category", 500), 500);
        }
    }

    static async create(c: Context): Promise<any> {
        const db = c.get("db");
        const params = c.get("validated");
        try {
            const results = await CategoriesService.create(db, params);
            return c.json(response.success(results, 201, "Category created successfully"), 201);
        } catch (error) {
            console.error("Error in create category:", error);
            return c.json(response.error("Failed to create category", 500), 500);
        }
    }

    static async update(c: Context): Promise<any> {
        const db = c.get("db");
        const params = c.get("validated");
        try {
            await CategoriesService.update(db, params.id, params);
            return c.json(response.success({}, 200, "Category updated successfully"), 200);
        } catch (error) {
            console.error("Error in update category:", error);
            return c.json(response.error("Failed to update category", 500), 500);
        }
    }

    static async softDelete(c: Context): Promise<any> {
        const db = c.get("db");
        const { id } = c.get("validated");
        try {
            await CategoriesService.softDelete(db, id);
            return c.json(response.success({}, 200, "Category deleted successfully"), 200);
        } catch (error) {
            console.error("Error in delete category:", error);
            return c.json(response.error("Failed to delete category", 500), 500);
        }
    }
}
