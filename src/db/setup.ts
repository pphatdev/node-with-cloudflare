import { Context } from "hono";
import { z } from "zod";
import { Response } from "../libs/utils/response";
import { createProjectsTableQuery } from "./projects";

const response = new Response();

// Define schema
const InitSchema = z.object({
    // db: z.string().min(1, "Database name is required")
});

export const initialize = async (c: Context) => {
    try {
        const body = await c.req.parseBody();
        const result = InitSchema.safeParse(body);

        const tables = [
            createProjectsTableQuery
        ];

        if (!result.success) {
            // @ts-ignore
            const errors = Array.from(result.error.errors).map(err => [`${err.message} field ${err.path.join(".")}`]);
            // @ts-ignore
            return c.json(response.error([errors], 400));
        }

        const db = await c.get("db");
        const res = await db.run(createProjectsTableQuery);
        if (res) {
            tables.push("projects");
        }

        return c.json(response.success({ tables }, 200, "Database initialized successfully"));
    } catch (error) {
        console.error("Failed to initialize database:", error);
        throw new Error("Database initialization failed");
    }
}