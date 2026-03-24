import { Context } from "hono";
import { Response } from "../shared/utils/response";
import { createProjectsTable } from "./schemas/projects";
import { createArticlesTable } from './schemas/articles';
import { createCategoriesTable } from './schemas/categories';
import { createSessionsTable } from "./schemas/sessions";
import { createUsersTable } from "./schemas/users";
import { createPasswordResetTokensTable } from "./schemas/password-reset-tokens";

const response = new Response();
const tables: Record<string, unknown>[] = [];

export const initialize = async (c: Context) => {
    try {
        const db = c.env.DB;
        if (!db?.prepare) throw new Error("D1 database binding is unavailable");

        const usersTable = await createUsersTable(db);
        const categoriesTable = await createCategoriesTable(db);
        const projectsTable = await createProjectsTable(db);
        const articlesTable = await createArticlesTable(db);
        const sessionsTable = await createSessionsTable(db);
        const passwordResetTokensTable = await createPasswordResetTokensTable(db);

        tables.push(
            projectsTable,
            articlesTable,
            categoriesTable,
            sessionsTable,
            usersTable,
            passwordResetTokensTable
        );

        const result = response.success(tables, 200, "Database initialized successfully");
        return c.json(result);
    } catch (error) {
        console.error("Failed to initialize database:", error);
        throw new Error("Database initialization failed");
    }
}