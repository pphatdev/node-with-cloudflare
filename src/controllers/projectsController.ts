import { Context } from "hono";
import { Response } from "../libs/utils/response";
import { projects } from "../db/projects";
import { z } from "zod";
import { sql } from "drizzle-orm";
import { getTotal } from "../libs/utils";
import { Project } from "../types/projects";

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
            ...c.get("validated") || {},
            ...params,
            tags: JSON.stringify(params.tags),
            source: JSON.stringify(params.source),
            authors: JSON.stringify(params.authors),
            languages: JSON.stringify(params.languages),
        });
        await next();
    }

    static async getProjects(c: Context): Promise<any> {
        try {
            const params = c.get("validated");
            const { page = 1, limit = 10, sort = "id", search = "", status = true, is_deleted } = params;

            const offset = (page - 1) * limit;
            const db = c.get("db");

            const where = sql`${projects.status} = ${status ? 1 : 0} AND ${projects.is_deleted} = ${is_deleted ? 1 : 0} AND ${projects.name} LIKE ${`%${search}%`}`;

            // Get total count
            const total = await getTotal(c, projects, where);

            // Get paginated results
            const query = db
                .select({
                    id: projects.id,
                    name: projects.name,
                    description: projects.description,
                    image: projects.image,
                    published: projects.published,
                    tags: projects.tags,
                    source: projects.source,
                    authors: projects.authors,
                    languages: projects.languages
                })
                .from(projects)
                .where(where)
                .orderBy(projects[sort])
                .limit(limit)
                .offset(offset);

            const { results, success } = await query.run();

            if (!success) {
                return c.json(response.error("Failed to fetch projects", 500), 500);
            }

            const data: Project[] = results.map((row: Project) => ({
                ...row,
                tags: Array.isArray(row.tags) ? row.tags : JSON.parse(row.tags || "[]"),
                source: Array.isArray(row.source) ? row.source : JSON.parse(row.source || "[]"),
                authors: Array.isArray(row.authors) ? row.authors : JSON.parse(row.authors || "[]"),
                languages: Array.isArray(row.languages) ? row.languages : JSON.parse(row.languages || "[]"),
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
}

export const {
    validation,
    getProjects,
    createProject,
    deleteProject,
    updateProject
} = ProjectsController;

export default ProjectsController;