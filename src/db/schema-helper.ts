import { count, eq } from "drizzle-orm";
import { Context } from "hono";
import { IsUniqueParams, PaginationParams, PaginationResponse } from "../types/schema-helper";

export class SchemaHelper {

    /**
     * Gets the total count of records in a table based on the provided conditions.
     * @param {Context} [c] The Hono context.
     * @param {any} [table] The database table to query.
     * @param {any} [where] The conditions for the query.
     * @returns The total count of records.
     */
    static async getTotal(c: Context, table: any, where: any): Promise<number> {
        const db = c.get("db");

        // Get total count
        const countQuery = db.select({ count: count() })
            .from(table)
            .where(where);

        const { results: countResults } = await countQuery.run();
        const total = countResults?.[0]?.['count(*)'] || 0;

        return total;
    }

    /**
     * Paginates the results from a database query.
     * @param {Context} [c] The Hono context.
     * @param {PaginationParams} [params] The parameters for pagination, including select fields, table, and where conditions.
     * @returns An object containing the paginated results and success status.
     */
    static async pagination(c: Context, params: PaginationParams): Promise<PaginationResponse> {
        const db = c.get("db");
        const { page = 1, limit = 10, sort = "id", } = c.get("validated") || {};
        const { select, table, where } = params;

        const offset = (page - 1) * limit;
        const query = db
            .select(select)
            .from(table)
            .where(where)
            .orderBy(table[sort])
            .limit(limit)
            .offset(offset);
        const { results, success } = await query.run();
        return { results, success };
    }

    /**
     * Checks if a value is unique in a specific table and field.
     * @param {Context} [c] The Hono context.

     * @returns {Promise<boolean>} Whether the value is unique.
     */
    static async isUnique(c: Context, params: IsUniqueParams): Promise<boolean> {
        try {
            const db = c.get("db");
            const { table, field, value } = params;
            const query = db.select({ count: count() })
                .from(table)
                .where(eq(table[field], value))
                .limit(1);
            const { results } = await query.run();
            const total = results?.[0]?.['count(*)'] || 0;
            return total === 0;
        } catch (error) {
            console.error("Error in isUnique:", error);
            return false;
        }
    }
}

export const { getTotal, pagination, isUnique } = SchemaHelper;
export default SchemaHelper;