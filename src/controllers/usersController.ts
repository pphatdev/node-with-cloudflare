import { sql } from "drizzle-orm";
import { Context } from "hono";
import { users } from "../db/schemas/users";
import { getTotal, isUnique, pagination } from "../db/schema-helper";
import { Response } from '../libs/utils/response';
import { User } from "../types/users";
import { z } from 'zod';
import bcryptjs from "bcryptjs";
const { hash, compare } = bcryptjs;

const response = new Response();

export class UsersController {

    /**
     * Validate user input
     * This method ensures that the input data meets the required schema before processing.
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
            email: z.string().email(),
            name: z.string().min(2).max(100),
            password: z.string().min(6).max(100),
            role: z.enum(["user", "admin"]),
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
     * Fetches a list of users with optional search and pagination.
     * @param {Context} c - The Hono context object containing request data.
     * @returns {Promise<any>} - A JSON response containing the list of users or an error message.
    */
    static async getUsers(c: Context): Promise<any> {
        try {
            const { search = "", status = true, is_deleted } = c.get("validated") || {};
            const { id, email, name, password_hash, email_verified, role, created_date, updated_date } = users

            const where = sql`${users.status} = ${status ? 1 : 0} AND ${users.is_deleted} = ${is_deleted ? 1 : 0} AND ${users.name} LIKE ${`%${search}%`}`;

            // Get total count
            const total = await getTotal(c, users, where);

            // Pagination List
            const { results, success } = await pagination(c, {
                select: { id, email, name, password_hash, email_verified, role, created_date, updated_date },
                table: users,
                where
            });

            if (!success)
                return c.json(response.error("Failed to fetch users", 500), 500);

            const data: User[] = results.map((row: User) => ({
                ...row,
            }));

            return c.json(response.paginate(data, total, 200, "Request was successful"), 200);

        } catch (error) {
            console.error("Error in getUsers:", error);
            return c.json(response.error("Failed to fetch users", 500), 500);
        }
    }

    /**
     * Hashes a password using bcrypt.
     * @param {string} password - The plain text password to hash.
     * @returns {Promise<string>} - The hashed password.
     */
    static async hashPassword(password: string): Promise<string> {
        const saltRounds = 10; // Higher = more secure but slower
        const hashedPassword = await hash(password, saltRounds);
        return hashedPassword;
    }

    /**
     * Verifies a password against a hashed password using bcrypt.
     * @param {string} password - The plain text password to verify.
     * @param {string} hashedPassword - The hashed password to compare against.
     * @returns {Promise<boolean>} - True if the password matches, false otherwise.
     */
    static async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
        return await compare(password, hashedPassword);
    }


    /**
     * Creates a new user in the database.
     * @param {Context} c - The Hono context object containing request data.
     * @returns {Promise<any>} - A JSON response containing the created user or an error message.
     */
    static async createUsers(c: Context): Promise<any> {
        try {
            const db = c.get("db");
            const params = c.get("validated");
            const newPassword = await UsersController.hashPassword(params.password);

            const notExistingEmail = await isUnique(c, {
                table: users,
                field: 'email',
                value: params.email
            });

            if (!notExistingEmail) {
                // @ts-ignore
                return c.json(response.error([[{ field: "email", message: "Email already exists", type: "validation" }]], 401), 401);
            }

            const { success, results } = await db.insert(users).values({ ...params, password_hash: newPassword }).run();

            if (!success) {
                return c.json(response.error("Failed to create user", 500), 500);
            }

            return c.json(response.success(results, 201, "User created successfully"), 201);
        } catch (error) {
            console.error("Error in createUsers:", error);
            return c.json(response.error("Failed to create user", 500), 500);
        }
    }


    /**
     * Fetches the details of a specific user.
     * @param {Context} c - The Hono context object containing request data.
     * @returns {Promise<any>} - A JSON response containing the user details or an error message.
     */
    static async getDetailUser(c: Context): Promise<any> {
        try {
            const { id } = c.get("validated");
            const db = c.get("db");

            const { results, success } = await db
                .select()
                .from(users)
                .where(sql`${users.id} = ${id}`)
                .run();

            if (!success) {
                return c.json(response.error("Project not found", 404), 404);
            }

            const data: User = results[0];

            return c.json(response.success(data, 200, "Project fetched successfully"), 200);

        } catch (error) {
            console.error("Error in getDetailProject:", error);
            return c.json(response.error("Failed to fetch project details", 500), 500);
        }
    }

    /**
     * Updates an existing user in the database.
     * @param {Context} c - The Hono context object containing request data.
     * @returns {Promise<any>} - A JSON response containing the updated user or an error message.
    */
    static async updateUser(c: Context): Promise<any> {
        try {
            const { id } = c.get("validated");
            const db = c.get("db");
            const params = c.get("validated");
            delete params.created_date;

            const { success } = await db
                .update(users)
                .set(params)
                .where(sql`${users.id} = ${id}`)
                .run();

            if (!success) {
                return c.json(response.error("Failed to update user", 500), 500);
            }

            return c.json(response.success({}, 200, "User updated successfully"), 200);

        } catch (error) {
            console.error("Error in updateUser:", error);
            return c.json(response.error("Failed to update user", 500), 500);
        }
    }


    /**
     * Deletes a user from the database.
     * @param {Context} c - The Hono context object containing request data.
     * @returns {Promise<any>} - A JSON response indicating the result of the deletion.
     */
    static async deleteUser(c: Context): Promise<any> {
        try {
            const { id } = c.get("validated");
            const db = c.get("db");

            const { success } = await db
                .update(users)
                .set({ status: 0, is_deleted: 1 })
                .where(sql`${users.id} = ${id}`)
                .run();

            if (!success) {
                return c.json(response.error("Failed to delete user", 500), 500);
            }

            return c.json(response.success({}, 200, "User deleted successfully"), 200);

        } catch (error) {
            console.error("Error in deleteUser:", error);
            return c.json(response.error("Failed to delete user", 500), 500);
        }
    }
}

export const {
    getUsers,
    validation,
    createUsers,
    updateUser,
    deleteUser
} = UsersController;

export default UsersController;