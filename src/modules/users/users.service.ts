import { sql } from "drizzle-orm";
import bcryptjs from "bcryptjs";
import { users } from "../../db/schemas/users";
import { getTotal, paginate, isUnique } from "../../shared/helpers/db.helper";
import type { User } from "../../shared/types/users";

const { hash, compare } = bcryptjs;

export type UserQueryParams = {
    search?: string;
    status?: boolean;
    is_deleted?: boolean;
    page?: number;
    limit?: number;
    sort?: string;
};

export class UsersService {
    static async hashPassword(password: string): Promise<string> {
        return hash(password, 10);
    }

    static async verifyPassword(password: string, hashed: string): Promise<boolean> {
        return compare(password, hashed);
    }

    static async findAll(db: any, params: UserQueryParams): Promise<{ data: User[]; total: number }> {
        const { search = "", status = true, is_deleted = false, page, limit, sort } = params;
        const { id, email, name, password_hash, email_verified, role, created_date, updated_date } = users;

        const where = sql`${users.status} = ${status ? 1 : 0} AND ${users.is_deleted} = ${is_deleted ? 1 : 0} AND ${users.name} LIKE ${`%${search}%`}`;

        const total = await getTotal(db, users, where);
        const { results, success } = await paginate(db, {
            select: { id, email, name, password_hash, email_verified, role, created_date, updated_date },
            table: users,
            where, page, limit, sort,
        });

        if (!success) throw new Error("Failed to fetch users");
        return { data: results, total };
    }

    static async findById(db: any, id: number): Promise<User | null> {
        const { results } = await db
            .select()
            .from(users)
            .where(sql`${users.id} = ${id}`)
            .run();
        return results[0] ?? null;
    }

    static async create(db: any, params: any): Promise<any> {
        const emailUnique = await isUnique(db, { table: users, field: "email", value: params.email });
        if (!emailUnique) {
            throw { type: "validation", field: "email", message: "Email already exists" };
        }

        const passwordHash = await UsersService.hashPassword(params.password);
        const { success, results } = await db.insert(users).values({ ...params, password_hash: passwordHash }).run();
        if (!success) throw new Error("Failed to create user");
        return results;
    }

    static async update(db: any, id: number, params: any): Promise<void> {
        const updated = { ...params };
        delete updated.created_date;
        const { success } = await db.update(users).set(updated).where(sql`${users.id} = ${id}`).run();
        if (!success) throw new Error("Failed to update user");
    }

    static async softDelete(db: any, id: number): Promise<void> {
        const { success } = await db.update(users).set({ status: 0, is_deleted: 1 }).where(sql`${users.id} = ${id}`).run();
        if (!success) throw new Error("Failed to delete user");
    }
}
