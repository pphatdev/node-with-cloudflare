import { Hono } from "hono";
import { login } from "../../../controllers/authsController";
import { createUsers, validation } from "../../../controllers/usersController";
const app = new Hono();

/**
 * Handles user login.
 * @route POST /v1/api/auth/login
 * @param { email: string, password: string }
 */
app.post("/login", login);

/**
 * Handles user registration.
 * @route POST /v1/api/auth/register
 * @param { email: string, password: string, role: string, name?: string }
 */
app.post("/register", validation, createUsers);



export default app;