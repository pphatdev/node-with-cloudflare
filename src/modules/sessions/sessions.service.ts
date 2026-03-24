import { sql } from "drizzle-orm";
import { sessions } from "../../db/schemas/sessions";
import { getTotal, paginate } from "../../shared/helpers/db.helper";
import type { Session } from "../../shared/types/sessions";

export type SessionQueryParams = {
    search?: string;
    status?: boolean;
    is_deleted?: boolean;
    page?: number;
    limit?: number;
    sort?: string;
};

export class SessionsService {
    static async findAll(db: any, params: SessionQueryParams): Promise<{ data: Session[]; total: number }> {
        const { search = "", status = true, is_deleted = false, page, limit, sort } = params;
        const { id, user_id, token, expires_date, created_date, updated_date, devices, ip_address } = sessions;

        const where = sql`${sessions.status} = ${status ? 1 : 0} AND ${sessions.is_deleted} = ${is_deleted ? 1 : 0} AND ${sessions.user_id} LIKE ${`%${search}%`}`;

        const total = await getTotal(db, sessions, where);
        const { results, success } = await paginate(db, {
            select: { id, token, user_id, devices, ip_address, expires_date, created_date, updated_date },
            table: sessions,
            where, page, limit, sort,
        });

        if (!success) throw new Error("Failed to fetch sessions");
        return { data: results, total };
    }

    static async findById(db: any, id: number): Promise<Session | null> {
        const { results } = await db
            .select()
            .from(sessions)
            .where(sql`${sessions.id} = ${id}`)
            .run();
        return results[0] ?? null;
    }

    static async create(db: any, params: any): Promise<void> {
        const { success } = await db.insert(sessions).values(params).run();
        if (!success) throw new Error("Failed to create session");
    }

    static async update(db: any, id: number, params: any): Promise<void> {
        const updated = { ...params };
        delete updated.created_date;
        const { success } = await db.update(sessions).set(updated).where(sql`${sessions.id} = ${id}`).run();
        if (!success) throw new Error("Failed to update session");
    }

    static async delete(db: any, id: number): Promise<void> {
        const { success } = await db.delete(sessions).where(sql`${sessions.id} = ${id}`).run();
        if (!success) throw new Error("Failed to delete session");
    }
}
