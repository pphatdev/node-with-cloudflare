import { Hono } from "hono";
import { Validation } from "../../../libs/utils/validation";
import { createSession, deleteSession, getDetailSession, getSessions, updateSession, validation } from "../../../controllers/sessionsController";
import { authorize } from "../../../middlewares/authorize";
const app = new Hono();

/**
 * Fetches a list of sessions.
 * @route GET /api/sessions
 * @param { page: number, limit: number, sort: string, search: string }
 */
app.get("/", Validation.list, getSessions);


/**
 * Fetches a session by ID.
 * @route GET /api/sessions/:id
 * @param { id: number }
 */
app.get("/:id", Validation.get, getDetailSession);


/**
 * Middleware for authorization
 */
app.use('*', authorize);


/**
 * Creates a new session.
 * @route POST /api/sessions
 * @param { user_id: number, expires_date: string }
 */
app.post("/", validation, createSession);


/**
 * Updates an existing session.
 * @route PATCH /api/sessions/:id
 * @param { user_id: number, expires_date: string }
 */
app.patch("/:id", Validation.update, validation, updateSession);


/**
 * Deletes a session.
 * @route DELETE /api/sessions/:id
 */
app.delete("/:id", Validation.delete, deleteSession);


export default app;