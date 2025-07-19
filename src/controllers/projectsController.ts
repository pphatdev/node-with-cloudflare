import { Context } from "hono";
import { Response } from "../libs/utils/response";
import { projects } from "../db/projects";
import { z } from "zod";

const response = new Response();

class ProjectsController {

    static createValidation = async (c: Context, next: () => Promise<void>): Promise<void> => {
        // Accept both query parameters and body
        // This allows for flexibility in how the request is made
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
            const errors = Array.from(error.errors).map(err => {
                return {
                    // @ts-ignore
                    field: err.path.join("."),
                    // @ts-ignore
                    message: err.message,
                };
            });
            // @ts-ignore
            return c.json(response.error([errors], 400));
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
            const db = c.get("db");
            const result = await db.select().from(projects).all();
            return c.json(response.success(result, 200, "Projects fetched successfully"));
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