import { Context } from 'hono';
import { Response } from '../libs/utils/response';
import { z } from 'zod';
import { sessions } from '../db/schemas/sessions';
import { sql } from 'drizzle-orm';
import { getTotal, pagination } from '../db/schema-helper';
import { Session } from '../types/sessions';

const response = new Response();

export class SessionsController {

    /**
     * Validate the request parameters for session creation
     * @param {Context} c - The Hono context object containing request data.
     * @param {Function} next - The next middleware function to call if validation passes.
     */
    static async validation(c: Context, next: () => Promise<void>): Promise<void> {
        /**
         * Accept both query parameters and body
         * This allows for flexibility in how the request is made
        */
        const params = {
            ...await c.req.parseBody(),
            ...await c.req.raw.json(),
            created_date: new Date().toISOString(),
            updated_date: new Date().toISOString(),
        };

        const schema = z.object({
            user_id: z.number().int(),
            expires_date: z.string().optional(),
            created_date: z.string().optional(),
            updated_date: z.string().optional(),
        });

        // @ts-ignore
        const { success, error } = schema.safeParse(params);

        if (!success) {
            // @ts-ignore
            return c.json(response.error([Array.from(error.errors).map(err => {
                // @ts-ignore
                return { field: err.path.join("."), message: err.message, type: err.code };
            })], 400));
        }
        c.set("validated", {
            ...params,
            ...c.get("validated") || {}
        });
        await next();
    }


    /**
     * Create a new session
     * @param {Context} c - The Hono context object containing request data.
     * @returns {Promise<any>} - The result of the session creation.
     */
    static async createSession(c: Context): Promise<any> {
        const params = c.get("validated");
        const db = c.get("db");

        try {
            const { success, results } = await db.insert(sessions).values(params).run();
            console.log("Create session results:", results, "success:", success);

            if (!success) {
                return c.json(response.error("Failed to create session", 500), 500);
            }

            return c.json(response.success({}, 201, "Session created successfully"), 201);

        } catch (error) {
            console.error("Error in createSession:", error);
            return c.json(response.error("Failed to create session", 500), 500);
        }
    }

    /**
     * Update an existing session
     * @param {Context} c - The Hono context object containing request data.
     * @returns {Promise<any>} - The result of the session update.
     */
    static async updateSession(c: Context): Promise<any> {
        try {
            const { id } = c.get("validated");
            const db = c.get("db");
            const params = c.get("validated");
            delete params.created_date;

            const { success } = await db
                .update(sessions)
                .set(params)
                .where(sql`${sessions.id} = ${id}`)
                .run();

            if (!success) {
                return c.json(response.error("Failed to update session", 500), 500);
            }

            return c.json(response.success({}, 200, "Session updated successfully"), 200);

        } catch (error) {
            console.error("Error in updateSession:", error);
            return c.json(response.error("Failed to update session", 500), 500);
        }
    }


    /**
     * Delete an existing session
     * @param {Context} c - The Hono context object containing request data.
     * @returns {Promise<any>} - The result of the session deletion.
     */
    static async deleteSession(c: Context): Promise<any> {
        try {
            const { id } = c.get("validated");
            const db = c.get("db");

            const { success } = await db
                .delete(sessions)
                .where(sql`${sessions.id} = ${id}`)
                .run();

            if (!success) {
                return c.json(response.error("Failed to delete session", 500), 500);
            }

            return c.json(response.success({}, 200, "Session deleted successfully"), 200);

        } catch (error) {
            console.error("Error in deleteSession:", error);
            return c.json(response.error("Failed to delete session", 500), 500);
        }
    }


    /**
     * Get session details by ID
     * @param {Context} c - The Hono context object containing request data.
     * @returns {Promise<any>} - A JSON response containing the list of sessions or an error message.
     */
    static async getSessions(c: Context): Promise<any> {
        try {
            const { search = "", status = true, is_deleted } = c.get("validated") || {};
            const { id, user_id, expires_date, created_date, updated_date } = sessions

            const where = sql`${sessions.status} = ${status ? 1 : 0} AND ${sessions.is_deleted} = ${is_deleted ? 1 : 0} AND ${sessions.user_id} LIKE ${`%${search}%`}`;

            // Get total count
            const total = await getTotal(c, sessions, where);

            // Pagination List
            const { results, success } = await pagination(c, {
                select: { id, user_id, expires_date, created_date, updated_date },
                table: sessions,
                where
            });

            if (!success)
                return c.json(response.error("Failed to fetch sessions", 500), 500);

            const data: Session[] = results.map((row: Session) => ({
                ...row,
            }));

            return c.json(response.paginate(data, total, 200, "Request was successful"), 200);

        } catch (error) {
            console.error("Error in getUsers:", error);
            return c.json(response.error("Failed to fetch users", 500), 500);
        }
    }


    /**
     * Get session details by ID
     * @param {Context} c - The Hono context object containing request data.
     * @returns {Promise<any>} - The result of the session detail retrieval.
     */
    static async getDetailSession(c: Context): Promise<any> {
        try {
            const { id } = c.get("validated");
            const db = c.get("db");

            const result = await db
                .select()
                .from(sessions)
                .where(sql`${sessions.id} = ${id}`)
                .run();

            if (result.length === 0) {
                return c.json(response.error("Session not found", 404), 404);
            }

            return c.json(response.success(result[0], 200, "Session fetched successfully"), 200);

        } catch (error) {
            console.error("Error in getSessionById:", error);
            return c.json(response.error("Failed to fetch session", 500), 500);
        }
    }

}

export const {
    getSessions,
    validation,
    createSession,
    updateSession,
    deleteSession,
    getDetailSession
} = SessionsController;

export default SessionsController;