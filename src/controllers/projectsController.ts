import { Context } from "hono";
import { Response } from "../libs/utils/response";
import { projects } from "../db/schemas/projects";
import { z } from "zod";
import { sql } from "drizzle-orm";
import { Project } from "../types/projects";
import { getTotal, pagination } from "../db/schema-helper";
import { toJSONParse } from "../libs/utils";

const response = new Response();
class ProjectsController {

    static validation = async (c: Context, next: () => Promise<void>): Promise<void> => {
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
            description: z.string().min(10).max(1000),
            image: z.string().url(),
            published: z.boolean(),
            tags: z.array(z.string().min(2).max(100)),
            source: z.array(z.string().min(2).max(100)),
            authors: z.array(z.string().min(2).max(100)),
            languages: z.array(z.string().min(2).max(100))
        });

        // @ts-ignore
        const { success, error } = schema.safeParse(params);

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
            source: JSON.stringify(params.source),
            authors: JSON.stringify(params.authors),
            languages: JSON.stringify(params.languages),
        });
        await next();
    }

    static async getProjects(c: Context): Promise<any> {
        try {
            const { search = "", status = true, is_deleted } = c.get("validated") || {};
            const { id, name, description, image, published, tags, source, authors, languages } = projects

            const where = sql`${projects.status} = ${status ? 1 : 0} AND ${projects.is_deleted} = ${is_deleted ? 1 : 0} AND ${projects.name} LIKE ${`%${search}%`}`;

            // Get total count
            const total = await getTotal(c, projects, where);

            // Pagination List
            const { results, success } = await pagination(c, {
                select: { id, name, description, image, published, tags, source, authors, languages },
                table: projects,
                where
            });

            if (!success)
                return c.json(response.error("Failed to fetch projects", 500), 500);

            const data: Project[] = results.map((row: Project) => ({
                ...row,
                tags: toJSONParse(row.tags),
                source: toJSONParse(row.source),
                authors: toJSONParse(row.authors),
                languages: toJSONParse(row.languages),
            }));

            return c.json(response.paginate(data, total, 200, "Request was successful"), 200);

        } catch (error) {
            console.error("Error in getProjects:", error);
            return c.json(response.error("Failed to fetch projects", 500), 500);
        }
    }

    static async createProject(c: Context): Promise<any> {
        try {
            const params = c.get("validated");
            const db = c.get("db");
            const { success } = await db.insert(projects).values(params).run();

            if (!success) {
                return c.json(response.error("Failed to create project", 500), 500);
            }

            return c.json(response.success({}, 201, "Project created successfully"), 201);

        } catch (error) {
            console.error("Error in createProject:", error);
            return c.json(response.error("Failed to create project", 500), 500);
        }
    }

    static async updateProject(c: Context): Promise<any> {
        try {
            const params = c.get("validated");
            delete params.created_date;

            const db = c.get("db");
            const { success } = await db
                .update(projects)
                .set(params)
                .where(sql`${projects.id} = ${params.id}`)
                .run();

            if (!success) {
                return c.json(response.error("Failed to update project", 500), 500);
            }

            return c.json(response.success({}, 200, "Project updated successfully"), 200);

        } catch (error) {
            console.error("Error in updateProject:", error);
            return c.json(response.error("Failed to update project", 500), 500);
        }
    }

    static async deleteProject(c: Context): Promise<any> {
        try {
            const db = c.get("db");
            const id = c.get("id");
            const { success } = await db
                .update(projects)
                .set({ status: 0, is_deleted: 1 })
                .where(sql`${projects.id} = ${id}`)
                .run();

            if (!success) {
                return c.json(response.error("Failed to delete project", 500), 500);
            }

            return c.json(response.success({}, 200, "Project deleted successfully"), 200);

        } catch (error) {
            console.error("Error in deleteProject:", error);
            return c.json(response.error("Failed to delete project", 500), 500);
        }
    }

    static async getDetailProject(c: Context): Promise<any> {
        try {
            const { id } = c.get("validated");
            const db = c.get("db");

            const { results, success } = await db
                .select()
                .from(projects)
                .where(sql`${projects.id} = ${id}`)
                .run();

            if (!success) {
                return c.json(response.error("Project not found", 404), 404);
            }

            const data: Project = {
                ...results[0],
                tags: toJSONParse(results[0].tags),
                source: toJSONParse(results[0].source),
                authors: toJSONParse(results[0].authors),
                languages: toJSONParse(results[0].languages),
            };

            return c.json(response.success(data, 200, "Project fetched successfully"), 200);

        } catch (error) {
            console.error("Error in getDetailProject:", error);
            return c.json(response.error("Failed to fetch project details", 500), 500);
        }
    }
};

export const { validation, getProjects, createProject, deleteProject, updateProject, getDetailProject } = ProjectsController;
export default ProjectsController;