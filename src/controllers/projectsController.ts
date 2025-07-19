import { Context } from "hono";
import { Response } from "../libs/utils/response";
import { projects } from "../db/projects";
import { z } from "zod";
import { like } from "drizzle-orm";
import { getTotal } from "../libs/utils";

const response = new Response();

interface ProjectDbRow {
    id: number;
    name: string;
    description: string;
    image: string;
    published: boolean;
    tags: string | string[];
    source: string;
    authors: string | string[];
    languages: string | string[];
    [key: string]: any;
}

interface Project {
    id: number;
    name: string;
    description: string;
    image: string;
    published: boolean;
    tags: string[];
    source: string;
    authors: string[];
    languages: string[];
    [key: string]: any;
}


class ProjectsController {

    static createValidation = async (c: Context, next: () => Promise<void>): Promise<void> => {
        /**
         * Accept both query parameters and body
         * This allows for flexibility in how the request is made
        */
        const params = {
            ...await c.req.parseBody(),
            ...await c.req.raw.json()
        };

        const schema = z.object({
            name: z.string().min(2).max(100),
            description: z.string().min(10).max(1000),
            image: z.string().url(),
            published: z.boolean(),
            tags: z.array(z.string().min(2).max(100)),
            source: z.string().url(),
            authors: z.array(z.string().min(2).max(100)),
            languages: z.array(z.string().min(2).max(100))
        });

        // @ts-ignore
        const { success, error } = schema.safeParse(params);

        if (!success) {
            // @ts-ignore
            return c.json(response.error([Array.from(error.errors).map(err => {
                return { field: err.path.join("."), message: err.message, type: err.code };
            })], 400));
        }
        c.set("validated", {
            ...params,
            tags: JSON.stringify(params.tags),
            authors: JSON.stringify(params.authors),
            languages: JSON.stringify(params.languages),
        });
        await next();
    }


    static async getProjects(c: Context): Promise<any> {
        try {
            const params = c.get("validatedParams");
            const { page = 1, limit = 10, sort = "id", search = "" } = params;

            const offset = (page - 1) * limit;
            const db = c.get("db");

            // Get total count
            const total = await getTotal(c, projects, search);

            // Get paginated results
            const query = db.select()
                .from(projects)
                .where(like(projects.name, `%${search}%`))
                .orderBy(projects[sort])
                .limit(limit)
                .offset(offset);

            const { results, success } = await query.run();

            if (!success) {
                return c.json(response.error("Failed to fetch projects", 500), 500);
            }

            const data: Project[] = results.map((row: ProjectDbRow) => ({
                ...row,
                tags: Array.isArray(row.tags) ? row.tags : JSON.parse(row.tags || "[]"),
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

}

export const {
    getProjects,
    createProject,
    createValidation
} = ProjectsController;

export default ProjectsController;