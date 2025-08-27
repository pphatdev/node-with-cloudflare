import { Hono } from "hono";
import { login, logout, verifyToken } from "../../../controllers/authsController";
import { createUsers, validation } from "../../../controllers/usersController";
import { authorize } from "../../../middlewares/authorize";
const app = new Hono();

/**
 * Handles user registration.
 * @route POST /v1/api/auth/register
 * @param { email: string, password: string, role: string, name?: string }
 */
app.post("/register", validation, createUsers);


/**
 * Handles user login.
 * @route POST /v1/api/auth/login
 * @param { email: string, password: string }
 */
app.post("/login", login);


/**
 * Handles user logout.
 * @route POST /v1/api/auth/logout
 * @param { token: string }
 */
app.post('/logout', authorize, logout);


/**
 * Verifies the user's token.
 * @route GET /v1/api/auth/verify
 * @param { token: string }
 */
app.get('/verify', verifyToken);

export default app;