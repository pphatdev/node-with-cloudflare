import { count } from "drizzle-orm";
import { Context } from "hono";

export class SchemaHelper {

    /**
     * Gets the total count of records in a table based on the provided conditions.
     * @param {c} - The Hono context.
     * @param {table} - The database table to query.
     * @param {where} - The conditions for the query.
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
     * @param {c} - The Hono context.
     * @param {select} - The fields to select from the table.
     * @param {table} - The database table to query.
     * @param {where} - The conditions for the query.
     * @returns An object containing the paginated results and success status.
     */
    static async pagination(c: Context, { select, table, where, }: { select: any, table: any, where: any, }): Promise<{ results: any[], success: boolean }> {
        const db = c.get("db");
        const { page = 1, limit = 10, sort = "id", } = c.get("validated") || {};

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

}

export const { getTotal, pagination } = SchemaHelper;
export default SchemaHelper;