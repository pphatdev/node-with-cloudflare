import { sql } from "drizzle-orm";
import { compare } from "bcryptjs";
import { SignJWT } from "jose";
import { sessions } from "../../db/schemas/sessions";
import { users } from "../../db/schemas/users";

export class AuthService {
    static async findUserByEmail(db: any, email: string): Promise<any | null> {
        const { results } = await db
            .select()
            .from(users)
            .where(sql`${users.email} = ${email}`)
            .limit(1)
            .run();
        return results[0] ?? null;
    }

    static async validatePassword(plain: string, hash: string): Promise<boolean> {
        return compare(plain, hash);
    }

    static async generateToken(payload: Record<string, any>, secret: string, expiresIn = "2h"): Promise<string> {
        return new SignJWT(payload)
            .setProtectedHeader({ alg: "HS256" })
            .setIssuedAt()
            .setExpirationTime(expiresIn)
            .sign(new TextEncoder().encode(secret));
    }

    static async createSession(db: any, params: {
        userId: number;
        token: string;
        userAgent: string | undefined;
        ipAddress: string | undefined;
        expiresAt: string;
    }): Promise<void> {
        const now = new Date().toISOString();
        await db.insert(sessions).values({
            user_id: params.userId,
            token: params.token,
            devices: params.userAgent,
            ip_address: params.ipAddress,
            created_date: now,
            updated_date: now,
            expires_date: params.expiresAt,
        }).run();
    }

    static async findActiveSession(db: any, token: string): Promise<any | null> {
        const { results } = await db
            .select()
            .from(sessions)
            .where(sql`${sessions.token} = ${token} AND ${sessions.status} = 1`)
            .limit(1)
            .run();
        return results[0] ?? null;
    }

    static async revokeSession(db: any, userId: number, token: string): Promise<boolean> {
        const { success } = await db
            .update(sessions)
            .set({ status: 0 })
            .where(sql`${sessions.user_id} = ${userId} AND ${sessions.token} = ${token}`)
            .run();
        return success;
    }

    static async getUserById(db: any, id: number): Promise<any | null> {
        const { results } = await db
            .select()
            .from(users)
            .where(sql`${users.id} = ${id}`)
            .limit(1)
            .run();
        return results[0] ?? null;
    }

    static async refreshSession(db: any, sessionId: any, newToken: string, expiresAt: string): Promise<boolean> {
        const now = new Date().toISOString();
        const { success } = await db
            .update(sessions)
            .set({ token: newToken, updated_date: now, expires_date: expiresAt })
            .where(sql`${sessions.id} = ${sessionId}`)
            .run();
        return success;
    }
}
