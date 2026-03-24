import { Context } from "hono";
import { Response } from "../../shared/utils/response";
import { ProjectsService } from "./projects.service";

const response = new Response();

export class ProjectsController {
    static async list(c: Context): Promise<any> {
        const db = c.get("db");
        const { search, status, is_deleted, page, limit, sort } = c.get("validated") || {};
        try {
            const { data, total } = await ProjectsService.findAll(db, { search, status, is_deleted, page, limit, sort });
            return c.json(response.paginate(data, total, 200, "Request was successful"), 200);
        } catch (error) {
            console.error("Error in list projects:", error);
            return c.json(response.error("Failed to fetch projects", 500), 500);
        }
    }

    static async detail(c: Context): Promise<any> {
        const db = c.get("db");
        const { id } = c.get("validated") || {};
        try {
            const data = await ProjectsService.findById(db, id);
            if (!data) return c.json(response.error("Project not found", 404), 404);
            return c.json(response.success(data, 200, "Project fetched successfully"), 200);
        } catch (error) {
            console.error("Error in project detail:", error);
            return c.json(response.error("Failed to fetch project", 500), 500);
        }
    }

    static async create(c: Context): Promise<any> {
        const db = c.get("db");
        const params = c.get("validated");
        try {
            await ProjectsService.create(db, params);
            return c.json(response.success({}, 201, "Project created successfully"), 201);
        } catch (error) {
            console.error("Error in create project:", error);
            return c.json(response.error("Failed to create project", 500), 500);
        }
    }

    static async update(c: Context): Promise<any> {
        const db = c.get("db");
        const params = c.get("validated");
        try {
            await ProjectsService.update(db, params.id, params);
            return c.json(response.success({}, 200, "Project updated successfully"), 200);
        } catch (error) {
            console.error("Error in update project:", error);
            return c.json(response.error("Failed to update project", 500), 500);
        }
    }

    static async softDelete(c: Context): Promise<any> {
        const db = c.get("db");
        const { id } = c.get("validated");
        try {
            await ProjectsService.softDelete(db, id);
            return c.json(response.success({}, 200, "Project deleted successfully"), 200);
        } catch (error) {
            console.error("Error in delete project:", error);
            return c.json(response.error("Failed to delete project", 500), 500);
        }
    }
}
