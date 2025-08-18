import { Hono } from "hono";
import { createProject, validation, getProjects, deleteProject, updateProject, getDetailProject } from "../../../controllers/projectsController";
import { Validation } from "../../../libs/utils/validation";

const app = new Hono();

/**
 * Fetches a list of projects.
 * @route GET /api/projects
 * @param { page: number, limit: number, sort: string, search: string }
 * @returns { Array<{ id: number, name: string, description: string, image: string, published: boolean, tags: string[], source: string[], authors: string[], languages: string[] }> }
 * @throws { 400 } Validation error
 * @throws { 500 } Internal server error
 */
app.get("/", Validation.list, getProjects);


/**
 * Creates a new project.
 * @route POST /api/projects
 * @param { name: string, description: string, image: string, published: boolean, tags: string[], source: string[], authors: string[], languages: string[] }
 * @returns { { id: number, name: string, description: string, image: string, published: boolean, tags: string[], source: string[], authors: string[], languages: string[] } }
 * @throws { 400 } Validation error
 * @throws { 500 } Internal server error
 */
app.post("/", validation, createProject);


/**
 * Updates an existing project.
 * @route PATCH /api/projects/:id
 * @param { id: number, name: string, description: string, image: string, published: boolean, tags: string[], source: string[], authors: string[], languages: string[] }
 * @returns { { id: number, name: string, description: string, image: string, published: boolean, tags: string[], source: string[], authors: string[], languages: string[] } }
 * @throws { 404 } Project not found
 * @throws { 400 } Validation error
*/
app.patch("/:id", Validation.update, validation, updateProject);


/**
 * Fetches a project by ID.
 * @route GET /api/projects/:id
 * @param { id: number }
 * @returns { { id: number, name: string, description: string, image: string, published: boolean, tags: string[], source: string[], authors: string[], languages: string[] } }
 */
app.get("/:id", Validation.get, getDetailProject);


/**
 * Deletes a project by ID.
 * @route DELETE /api/projects/:id
 * @param { id: number }
 * @returns { { message: string } }
 * @throws { 404 } Project not found
*/
app.delete("/:id", Validation.delete, deleteProject)

export default app;