import { Context } from "hono";
import { like, count } from "drizzle-orm";

export const getTotal = async (c: Context, table: any, search: string) => {
    const db = c.get("db");
    // Get total count
    const countQuery = db.select({ count: count() })
        .from(table)
        .where(like(table.name, `%${search}%`));

    const { results: countResults } = await countQuery.run();
    const total = countResults?.[0]?.['count(*)'] || 0;

    return total;
}