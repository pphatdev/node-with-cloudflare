import { Context } from "hono";
import { Response } from "../../shared/utils/response";
import { SessionsService } from "./sessions.service";

const response = new Response();

export class SessionsController {
    static async list(c: Context): Promise<any> {
        const db = c.get("db");
        const { search, status, is_deleted, page, limit, sort } = c.get("validated") || {};
        try {
            const { data, total } = await SessionsService.findAll(db, { search, status, is_deleted, page, limit, sort });
            return c.json(response.paginate(data, total, 200, "Request was successful"), 200);
        } catch (error) {
            console.error("Error in list sessions:", error);
            return c.json(response.error("Failed to fetch sessions", 500), 500);
        }
    }

    static async detail(c: Context): Promise<any> {
        const db = c.get("db");
        const { id } = c.get("validated") || {};
        try {
            const data = await SessionsService.findById(db, id);
            if (!data) return c.json(response.error("Session not found", 404), 404);
            return c.json(response.success(data, 200, "Session fetched successfully"), 200);
        } catch (error) {
            console.error("Error in session detail:", error);
            return c.json(response.error("Failed to fetch session", 500), 500);
        }
    }

    static async create(c: Context): Promise<any> {
        const db = c.get("db");
        const params = c.get("validated");
        try {
            await SessionsService.create(db, params);
            return c.json(response.success({}, 201, "Session created successfully"), 201);
        } catch (error) {
            console.error("Error in create session:", error);
            return c.json(response.error("Failed to create session", 500), 500);
        }
    }

    static async update(c: Context): Promise<any> {
        const db = c.get("db");
        const params = c.get("validated");
        try {
            await SessionsService.update(db, params.id, params);
            return c.json(response.success({}, 200, "Session updated successfully"), 200);
        } catch (error) {
            console.error("Error in update session:", error);
            return c.json(response.error("Failed to update session", 500), 500);
        }
    }

    static async remove(c: Context): Promise<any> {
        const db = c.get("db");
        const { id } = c.get("validated");
        try {
            await SessionsService.delete(db, id);
            return c.json(response.success({}, 200, "Session deleted successfully"), 200);
        } catch (error) {
            console.error("Error in delete session:", error);
            return c.json(response.error("Failed to delete session", 500), 500);
        }
    }
}
