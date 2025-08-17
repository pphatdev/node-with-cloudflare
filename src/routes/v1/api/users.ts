import { Hono } from "hono";
import { Validation } from "../../../libs/utils/validation";
import { createUsers, deleteUser, getUsers, updateUser, validation } from "../../../controllers/usersController";
const app = new Hono();

/**
 * Fetches a list of users.
 * @route GET /api/users
 * @param { page: number, limit: number, sort: string, search: string }
 */
app.get("/", Validation.list, getUsers);


/**
 * Fetches a user by ID.
 * @route GET /api/users/:id
 * @param { id: number }
 */
app.get("/:id", Validation.get, getUsers);


/**
 * Creates a new user.
 * @route POST /api/users
 * @param { email: string, name: string, password: string, role: string }
 */
app.post("/", validation, createUsers);


/**
 * Updates an existing user.
 * @route PATCH /api/users/:id
 * @param { email: string, name: string, password: string, role: string }
 */
app.patch("/:id", Validation.update, validation, updateUser);


/**
 * Deletes a user.
 * @route DELETE /api/users/:id
 */
app.delete("/:id", Validation.delete, deleteUser);


export default app;