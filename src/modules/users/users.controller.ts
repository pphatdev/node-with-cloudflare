import { Context } from "hono";
import { Response } from "../../shared/utils/response";
import { UsersService } from "./users.service";

const response = new Response();

export class UsersController {
    static async list(c: Context): Promise<any> {
        const db = c.get("db");
        const { search, status, is_deleted, page, limit, sort } = c.get("validated") || {};
        try {
            const { data, total } = await UsersService.findAll(db, { search, status, is_deleted, page, limit, sort });
            return c.json(response.paginate(data, total, 200, "Request was successful"), 200);
        } catch (error) {
            console.error("Error in list users:", error);
            return c.json(response.error("Failed to fetch users", 500), 500);
        }
    }

    static async detail(c: Context): Promise<any> {
        const db = c.get("db");
        const { id } = c.get("validated") || {};
        try {
            const data = await UsersService.findById(db, id);
            if (!data) return c.json(response.error("User not found", 404), 404);
            return c.json(response.success(data, 200, "User fetched successfully"), 200);
        } catch (error) {
            console.error("Error in user detail:", error);
            return c.json(response.error("Failed to fetch user", 500), 500);
        }
    }

    static async create(c: Context): Promise<any> {
        const db = c.get("db");
        const params = c.get("validated");
        try {
            const results = await UsersService.create(db, params);
            return c.json(response.success(results, 201, "User created successfully"), 201);
        } catch (error: any) {
            if (error?.type === "validation") {
                // @ts-ignore
                return c.json(response.error([[{ field: error.field, message: error.message, type: "validation" }]], 401), 401);
            }
            console.error("Error in create user:", error);
            return c.json(response.error("Failed to create user", 500), 500);
        }
    }

    static async update(c: Context): Promise<any> {
        const db = c.get("db");
        const params = c.get("validated");
        try {
            await UsersService.update(db, params.id, params);
            return c.json(response.success({}, 200, "User updated successfully"), 200);
        } catch (error) {
            console.error("Error in update user:", error);
            return c.json(response.error("Failed to update user", 500), 500);
        }
    }

    static async softDelete(c: Context): Promise<any> {
        const db = c.get("db");
        const { id } = c.get("validated");
        try {
            await UsersService.softDelete(db, id);
            return c.json(response.success({}, 200, "User deleted successfully"), 200);
        } catch (error) {
            console.error("Error in delete user:", error);
            return c.json(response.error("Failed to delete user", 500), 500);
        }
    }
}
