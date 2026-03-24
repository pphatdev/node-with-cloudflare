import { Context } from "hono";
import { z } from "zod";
import { getConnInfo } from "hono/cloudflare-workers";
import { Response } from "../../shared/utils/response";
import { secret } from "../../config";
import { AuthService } from "./auth.service";
import type { User } from "../../shared/types/users";

const response = new Response();

export class AuthController {
    static async login(c: Context): Promise<any> {
        const params = {
            ...await c.req.parseBody(),
            ...await c.req.raw.json(),
        };

        const schema = z.object({
            email: z.string().email(),
            password: z.string().min(6).max(100),
        });

        // @ts-ignore
        const { success, error } = await schema.safeParseAsync(params);
        if (!success) {
            // @ts-ignore
            return c.json(response.error([Array.from(error.errors).map(err => ({
                // @ts-ignore
                field: err.path.join("."), message: err.message, type: err.code,
            }))], 400));
        }

        const db = c.get("db");
        try {
            const user = await AuthService.findUserByEmail(db, params.email as string);
            if (!user) {
                // @ts-ignore
                return c.json(response.error([[{ field: "email", message: "Email not found", type: "validation" }]], 401), 401);
            }

            const isMatch = await AuthService.validatePassword(params.password as string, user.password_hash);
            if (!isMatch) {
                // @ts-ignore
                return c.json(response.error([[{ field: "password", message: "Invalid password", type: "validation" }]], 400), 400);
            }

            const userAgent = c.req.header("User-Agent");
            const connInfo = getConnInfo(c);
            const ipAddress = connInfo.remote.address;
            const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();

            const token = await AuthService.generateToken(
                { id: user.id, username: user.name, userAgent, ipAddress },
                secret
            );
            await AuthService.createSession(db, { userId: user.id, token, userAgent, ipAddress, expiresAt });

            return c.json(response.success({
                type: "Bearer",
                token,
                user: { ...user, password_hash: undefined },
            }, 200, "Login successfully"), 200);
        } catch (error) {
            console.error("Error during login:", error);
            return c.json(response.error("Internal server error", 500), 500);
        }
    }

    static async logout(c: Context): Promise<any> {
        const authHeader = c.req.header("Authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            // @ts-ignore
            return c.json(response.error([{ field: "token", message: "No token provided", type: "validation" }], 401), 401);
        }

        const token = authHeader.split(" ")[1];
        const db = c.get("db");
        const user = c.get("user");
        try {
            const ok = await AuthService.revokeSession(db, user.id, token);
            if (!ok) return c.json(response.error("Failed to revoke session", 500), 500);
            return c.json(response.success({}, 200, "Logout successful"), 200);
        } catch (error) {
            console.error("Error revoking session:", error);
            return c.json(response.error("Failed to revoke session", 500), 500);
        }
    }

    static async verifyToken(c: Context): Promise<any> {
        const authHeader = c.req.header("Authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            return c.json({ status: 401, success: false, version: Response.VERSION, message: "❌ No token provided. Make sure to include it in the Authorization header." }, 401);
        }

        const token = authHeader.split(" ")[1];
        const db = c.get("db");
        try {
            const session = await AuthService.findActiveSession(db, token);
            if (!session) {
                return c.json({ status: 401, success: false, version: Response.VERSION, message: "❌ Token has been revoked. Please log in again." }, 401);
            }
            if (session.expires_at && new Date(session.expires_at) < new Date()) {
                return c.json({ status: 401, success: false, version: Response.VERSION, message: "❌ Token is expired. Please log in again." }, 401);
            }
            return c.json({ status: 200, success: true, version: Response.VERSION, message: "✅ Token is valid" }, 200);
        } catch (error) {
            console.error("Error verifying token:", error);
            return c.json({ status: 500, success: false, version: Response.VERSION, message: "❌ Internal server error" }, 500);
        }
    }

    static async refreshToken(c: Context): Promise<any> {
        const authHeader = c.req.header("Authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            // @ts-ignore
            return c.json(response.error([{ field: "token", message: "No token provided", type: "validation" }], 401), 401);
        }

        const currentToken = authHeader.split(" ")[1];
        const db = c.get("db");
        try {
            const session = await AuthService.findActiveSession(db, currentToken);
            if (!session) {
                // @ts-ignore
                return c.json(response.error([{ field: "token", message: "Invalid or revoked token", type: "validation" }], 401), 401);
            }
            if (session.expires_date && new Date(session.expires_date) < new Date()) {
                // @ts-ignore
                return c.json(response.error([{ field: "token", message: "Token expired", type: "validation" }], 401), 401);
            }

            const userAgent = c.req.header("User-Agent");
            const connInfo = getConnInfo(c);
            const ipAddress = connInfo.remote.address;
            const userId = session.user_id;
            let username = session.username ?? session.name;
            if (!username) {
                const user = await AuthService.getUserById(db, userId);
                username = user?.name;
            }

            const newToken = await AuthService.generateToken({ id: userId, username, userAgent, ipAddress }, secret);
            const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
            const ok = await AuthService.refreshSession(db, session.id, newToken, expiresAt);
            if (!ok) return c.json(response.error("Failed to refresh token", 500), 500);

            return c.json(response.success({ type: "Bearer", token: newToken }, 200, "Token refreshed successfully"), 200);
        } catch (error) {
            console.error("Error refreshing token:", error);
            return c.json(response.error("Internal server error", 500), 500);
        }
    }

    static async getMe(c: Context): Promise<any> {
        const user = c.get("user");
        const db = c.get("db");
        try {
            const userData = await AuthService.getUserById(db, user.id);
            if (!userData) return c.json(response.error("User not found", 404), 404);

            const data: Partial<User> = { ...userData };
            delete data.password_hash;
            delete (data as any).is_deleted;
            delete (data as any).status;
            delete (data as any).created_date;
            delete (data as any).updated_date;

            return c.json(response.success(data, 200, "User fetched successfully"), 200);
        } catch (error) {
            console.error("Error retrieving profile:", error);
            return c.json(response.error("Internal server error", 500), 500);
        }
    }
}
