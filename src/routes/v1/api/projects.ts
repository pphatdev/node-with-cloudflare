import { Hono } from "hono";
import { createProject, createValidation, getProjects, deleteProject } from "../../../controllers/projectsController";
import { Validation } from "../../../libs/utils/validation";

const app = new Hono();

/**
 * Fetches a list of projects.
 * @route GET /api/projects
 * @param { page: number, limit: number, sort: string, search: string }
 */
app.get("/", Validation.list, getProjects);


/**
 * Creates a new project.
 * @route POST /api/projects
 * @param { name: string, description: string, image: string, published: boolean, tags: string[], source: string, authors: string[], languages: string[] }
 */
app.post("/", createValidation, createProject);


/**
 * Deletes a project by ID.
 * @route DELETE /api/projects/:id
 * @param { id: number }
*/
app.delete("/:id", Validation.delete, deleteProject)

export default app;