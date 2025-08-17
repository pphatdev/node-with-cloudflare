import { Context } from "hono";

export type SchemaHelper = {
    getTotal: GetTotal;
    pagination: Pagination;
}


export type GetTotal = (c: Context, table: any, where: any) => Promise<number>;
export type Pagination = (c: Context, params: PaginationParams) => Promise<PaginationResponse>;
export type PaginationResponse = {
    results: any[];
    success: boolean;
};
export type PaginationParams = {
    select: any;
    table: any;
    where: any;
}

export type IsUniqueParams = {
    table: any;
    field: string;
    value: string;
}