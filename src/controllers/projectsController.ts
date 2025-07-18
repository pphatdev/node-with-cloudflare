import { Context } from "hono";
import { Response } from "../libs/utils/response";
import { projects } from "../db/projects";

const response = new Response();

class ProjectsController {

    /**
     * Fetches all projects from the database.
     * @param c - The Hono context object.
     * @return A JSON response containing the list of projects or an error message.
     *
    */
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

}

export const {
    getProjects
} = ProjectsController;

export default ProjectsController;