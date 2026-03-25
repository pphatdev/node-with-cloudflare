import { count, eq } from "drizzle-orm";

export type PaginationParams = {
    select: any;
    table: any;
    where: any;
    page?: number;
    limit?: number;
    sort?: string;
};

export type PaginationResponse = {
    results: any[];
    success: boolean;
};

export type IsUniqueParams = {
    table: any;
    field: string;
    value: any;
};

export async function getTotal(db: any, table: any, where: any): Promise<number> {
    const { results } = await db.select({ count: count() }).from(table).where(where).run();
    return results?.[0]?.["count(*)"] || 0;
}

export async function paginate(db: any, params: PaginationParams): Promise<PaginationResponse> {
	const { select, table, where, page = 1, limit = 10, sort = "id" } = params;
	const offset = (page - 1) * limit;
	let query = db
		.select(select)
		.from(table)
		.where(where)
		.orderBy(table[sort]);

	if (limit !== -1) {
		query = query.limit(limit).offset(offset);
	}

	const { results, success } = await query.run();
    return { results, success };
}

export async function isUnique(db: any, params: IsUniqueParams): Promise<boolean> {
    try {
        const { table, field, value } = params;
        const { results } = await db
            .select({ count: count() })
            .from(table)
            .where(eq(table[field], value))
            .limit(1)
            .run();
        return (results?.[0]?.["count(*)"] || 0) === 0;
    } catch {
        return false;
    }
}
