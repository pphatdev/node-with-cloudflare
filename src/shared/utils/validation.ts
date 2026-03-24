import { Context } from "hono";
import { z } from "zod";
import { Response } from "./response";

const response = new Response();

export class Validation {

    static list = async (c: Context, next: () => Promise<void>): Promise<void> => {
        const params = {
            ...await c.req.parseBody(),
            ...c.req.query(),
        };

        const validatedParams = {
            page: params.page ? Number(params.page) : undefined,
            limit: params.limit ? Number(params.limit) : undefined,
            sort: params.sort,
            search: params.search,
            status: params.status === undefined ? true : params.status === "true",
            is_deleted: params.is_deleted === undefined ? false : params.is_deleted === "true",
        };

        const schema = z.object({
            page: z.number().min(1).optional(),
            limit: z.number().min(1).max(200).optional(),
            sort: z.string().optional(),
            search: z.string().optional(),
            status: z.boolean().optional(),
            is_deleted: z.boolean().optional(),
        });

        // @ts-ignore
        const { success, error } = schema.safeParse(validatedParams);

        if (!success) {
            // @ts-ignore
            const errors = Array.from(error.errors).map(err => [`${err.message} field ${err.path.join(".")}`]);
            // @ts-ignore
            return c.json(response.error([errors], 400));
        }

        c.set("validated", { ...params, ...validatedParams });
        await next();
    };

    static delete = async (c: Context, next: () => Promise<void>): Promise<void> => {
        const params = {
            ...c.req.param(),
            ...c.req.query(),
            ...await c.req.parseBody(),
        };

        const validatedParams = {
            id: params.id ? Number(params.id) : undefined,
            status: params.status === undefined ? true : params.status === "true",
            is_deleted: params.is_deleted === undefined ? false : params.is_deleted === "true",
        };

        // @ts-ignore
        const { success, error } = z.object({ id: z.number().min(1) }).safeParse(validatedParams);

        if (!success) {
            // @ts-ignore
            return c.json(response.error([Array.from(error.errors).map(err => ({
                // @ts-ignore
                field: err.path.join("."), message: err.message, type: err.code,
            }))], 400));
        }

        c.set("validated", { ...params, ...validatedParams });
        await next();
    };

    static update = async (c: Context, next: () => Promise<void>): Promise<void> => {
        const params = c.req.param();
        const validatedParams = { id: params.id ? Number(params.id) : undefined };

        // @ts-ignore
        const { success, error } = z.object({ id: z.number().min(1) }).safeParse(validatedParams);

        if (!success) {
            // @ts-ignore
            return c.json(response.error([Array.from(error.errors).map(err => ({
                // @ts-ignore
                field: err.path.join("."), message: err.message, type: err.code,
            }))], 400));
        }

        c.set("validated", params);
        await next();
    };

    static get = async (c: Context, next: () => Promise<void>): Promise<void> => {
        const params = c.req.param();
        const validatedParams = { id: params.id ? Number(params.id) : undefined };

        // @ts-ignore
        const { success, error } = z.object({ id: z.number().min(1) }).safeParse(validatedParams);

        if (!success) {
            // @ts-ignore
            return c.json(response.error([Array.from(error.errors).map(err => ({
                // @ts-ignore
                field: err.path.join("."), message: err.message, type: err.code,
            }))], 400));
        }

        c.set("validated", params);
        await next();
    };

    static getBySlug = async (c: Context, next: () => Promise<void>): Promise<void> => {
        const params = c.req.param();

        // @ts-ignore
        const { success, error } = z.object({
            slug: z.string().min(1).max(200).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Invalid slug format"),
        }).safeParse(params);

        if (!success) {
            // @ts-ignore
            return c.json(response.error([Array.from(error.errors).map(err => ({
                // @ts-ignore
                field: err.path.join("."), message: err.message, type: err.code,
            }))], 400));
        }

        c.set("validated", params);
        await next();
    };
}
