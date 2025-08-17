import { count, eq, sql } from "drizzle-orm";
import { Context } from "hono";
import { getTotal, isUnique, pagination } from "../db/schema-helper";
import { Response } from '../libs/utils/response';
import { z } from 'zod';
import { categories } from '../db/schemas/categories';
import { Category } from "../types/categories";

const response = new Response();

export class CategoriesController {

    /**
     * Validate user input
     * This method ensures that the input data meets the required schema before processing.
     * @param {Context} c - The Hono context object containing request data.
     * @param {Function} next - The next middleware function to call if validation passes.
    */
    static async validation(c: Context, next: () => Promise<void>): Promise<void> {
        /**
         * Accept both query parameters and body
         * This allows for flexibility in how the request is made
        */
        const params = {
            ...await c.req.parseBody(),
            ...await c.req.raw.json(),
            created_date: new Date().toISOString(),
            updated_date: new Date().toISOString(),
        };

        const schema = z.object({
            name: z.string().min(2).max(100),
            slug: z.string().min(2).max(200)
                .refine(
                    async (value) => await isUnique(c, {
                        table: categories,
                        field: 'slug',
                        value
                    }),
                    { message: 'Slug must be unique' }
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

        if (!success) {
            // @ts-ignore
            return c.json(response.error([Array.from(error.errors).map(err => {
                // @ts-ignore
                return { field: err.path.join("."), message: err.message, type: err.code };
            })], 400));
        }

        // check reference field
        if (params.parent_id != null && params.parent_id != undefined) {

            const notExitingParentID = await isUnique(c, {
                table: categories,
                field: 'id',
                value: params.parent_id
            });

            if (notExitingParentID) {
                // @ts-ignore
                return c.json(
                    // @ts-ignore
                    response.error([[{ field: "parent_id", message: "Parent ID does not exist", type: "validation" }]], 400),
                    400
                );
            }
        }


        c.set("validated", {
            ...params,
            ...c.get("validated") || {},
            ...{
                status: Boolean(params.status),
                is_active: Boolean(params.is_active)
            }
        });
        await next();
    }

    /**
     * Fetches a list of categories with optional search and pagination.
     * @param {Context} c - The Hono context object containing request data.
     * @returns {Promise<any>} - A JSON response containing the list of categories or an error message.
    */
    static async getCategories(c: Context): Promise<any> {
        try {
            const { search = "", status = true, is_deleted } = c.get("validated") || {};
            const { id, name, slug, description, parent_id, image, is_active } = categories
            const where = sql`${categories.status} = ${status ? 1 : 0} AND ${categories.is_deleted} = ${is_deleted ? 1 : 0} AND ${categories.name} LIKE ${`%${search}%`}`;

            // Get total count
            const total = await getTotal(c, categories, where);

            // Pagination List
            const { results, success } = await pagination(c, {
                select: { id, name, slug, description, parent_id, image, is_active },
                table: categories,
                where
            });

            if (!success)
                return c.json(response.error("Failed to fetch categories", 500), 500);

            const data: Category[] = results.map((row: Category) => ({
                ...row,
            }));

            return c.json(response.paginate(data, total, 200, "Request was successful"), 200);

        } catch (error) {
            console.error("Error in getUsers:", error);
            return c.json(response.error("Failed to fetch users", 500), 500);
        }
    }

    /**
     * Creates a new categories in the database.
     * @param {Context} c - The Hono context object containing request data.
     * @returns {Promise<any>} - A JSON response containing the created user or an error message.
     */
    static async createCategories(c: Context): Promise<any> {
        const db = c.get("db");
        const params = c.get("validated");
        const { success, results } = await db.insert(categories).values(params).run();

        if (!success) {
            return c.json(response.error("Failed to create categories", 500), 500);
        }

        try {

            return c.json(response.success(results, 201, "Categories created successfully"), 201);
        } catch (error) {
            console.error("Error in createCategories:", error);
            return c.json(response.error("Failed to create categories", 500), 500);
        }
    }


    /**
     * Fetches the details of a specific categories.
     * @param {Context} c - The Hono context object containing request data.
     * @returns {Promise<any>} - A JSON response containing the user details or an error message.
     */
    static async getDetailCategory(c: Context): Promise<any> {
        try {
            const { id } = c.get("validated");
            const db = c.get("db");

            const { results, success } = await db
                .select()
                .from(categories)
                .where(sql`${categories.id} = ${id}`)
                .run();

            if (!success) {
                return c.json(response.error("Category not found", 404), 404);
            }

            const data: Category = results[0];

            return c.json(response.success(data, 200, "Category fetched successfully"), 200);

        } catch (error) {
            console.error("Error in getDetailCategory:", error);
            return c.json(response.error("Failed to fetch category details", 500), 500);
        }
    }

    /**
     * Updates an existing categories in the database.
     * @param {Context} c - The Hono context object containing request data.
     * @returns {Promise<any>} - A JSON response containing the updated categories or an error message.
    */
    static async updateCategories(c: Context): Promise<any> {
        try {
            const { id } = c.get("validated");
            const db = c.get("db");
            const params = c.get("validated");
            delete params.created_date;

            const { success } = await db
                .update(categories)
                .set(params)
                .where(sql`${categories.id} = ${id}`)
                .run();

            if (!success) {
                return c.json(response.error("Failed to update user", 500), 500);
            }

            return c.json(response.success({}, 200, "User updated successfully"), 200);

        } catch (error) {
            console.error("Error in updateUser:", error);
            return c.json(response.error("Failed to update user", 500), 500);
        }
    }


    /**
     * Deletes a categories from the database.
     * @param {Context} c - The Hono context object containing request data.
     * @returns {Promise<any>} - A JSON response indicating the result of the deletion.
     */
    static async deleteCategories(c: Context): Promise<any> {
        try {
            const { id } = c.get("validated");
            const db = c.get("db");

            const { success } = await db
                .update(categories)
                .set({ status: 0, is_deleted: 1 })
                .where(sql`${categories.id} = ${id}`)
                .run();

            if (!success) {
                return c.json(response.error("Failed to delete user", 500), 500);
            }

            return c.json(response.success({}, 200, "User deleted successfully"), 200);

        } catch (error) {
            console.error("Error in deleteUser:", error);
            return c.json(response.error("Failed to delete user", 500), 500);
        }
    }
}

export const {
    validation,
    createCategories,
    getCategories,
    getDetailCategory,
    updateCategories,
    deleteCategories
} = CategoriesController;

export default CategoriesController;