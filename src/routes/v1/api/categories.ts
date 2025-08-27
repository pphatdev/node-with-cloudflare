import { Hono } from "hono";
import { Validation } from "../../../libs/utils/validation";
import { authorize } from "../../../middlewares/authorize";
import { createCategories, deleteCategories, getCategories, getDetailCategory, updateCategories, validation } from "../../../controllers/categoriesController";
const app = new Hono();

/**
 * Fetches a list of categories.
 * @route GET /api/categories
 * @param { page: number, limit: number, sort: string, search: string }
 */
app.get("/", Validation.list, getCategories);


/**
 * Fetches a session by ID.
 * @route GET /api/categories/:id
 * @param { id: number }
 */
app.get("/:id", Validation.get, getDetailCategory);


/**
 * Middleware for authorization
 */
app.use('*', authorize);


/**
 * Creates a new session.
 * @route POST /api/categories
 * @param { name: string, slug: string, description: string, parent_id?: number, image?: string, is_active: boolean }
 */
app.post("/", validation, createCategories);


/**
 * Updates an existing session.
 * @route PATCH /api/categories/:id
 * @param { name: string, slug: string, description: string, parent_id?: number, image?: string, is_active: boolean }
 */
app.patch("/:id", Validation.update, validation, updateCategories);


/**
 * Deletes a session.
 * @route DELETE /api/categories/:id
 */
app.delete("/:id", Validation.delete, deleteCategories);


export default app;