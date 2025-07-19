import { Context } from "hono";
import { z } from "zod";
import { Response } from "./response";

const response = new Response();


export class Validation {

    /**
     * Validates the query parameters for the list endpoint.
     * @param {Context} c - The Hono context object.
     * @satisfies { page: number, limit: number, sort: string, search: string }
     * @param {Function} next - The next middleware function to call if validation passes.
     * @returns {Promise<void>} - Returns a JSON response with validation errors if validation fails
     */
    static list = async (c: Context, next: () => Promise<void>): Promise<void> => {

        const params = { ...await c.req.parseBody(), ...c.req.query() };

        // create a new object with converted types
        const validatedParams = {
            page: params.page ? Number(params.page) : undefined,
            limit: params.limit ? Number(params.limit) : undefined,
            sort: params.sort,
            search: params.search,
        };

        const schema = z.object({
            page: z.number().min(1).optional(),
            limit: z.number().min(1).max(200).optional(),
            sort: z.string().optional(),
            search: z.string().optional(),
        });

        // @ts-ignore
        const { success, error } = schema.safeParse(validatedParams);

        if (!success) {
            // @ts-ignore
            const errors = Array.from(error.errors).map(err => [`${err.message} field ${err.path.join(".")}`]);
            // @ts-ignore
            return c.json(response.error([errors], 400));
        }

        await next();
    }
}