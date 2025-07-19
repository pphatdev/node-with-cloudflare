import { Context } from "hono";
import { like, count } from "drizzle-orm";

export const getTotal = async (c: Context, table: any, where: any) => {
    const db = c.get("db");
    // Get total count
    const countQuery = db.select({ count: count() })
        .from(table)
        .where(where);

    const { results: countResults } = await countQuery.run();
    const total = countResults?.[0]?.['count(*)'] || 0;

    return total;
}