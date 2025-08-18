import { Hono } from "hono";
import { login } from "../../../controllers/authsController";
const app = new Hono();

/**
 * Handles user login.
 * @route POST /v1/api/auth/login
 * @param { email: string, password: string }
 */
app.post("/login", login);



export default app;