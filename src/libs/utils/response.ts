interface Success {
    status: number;
    success: boolean;
    message?: string;
    version: string;
    data: Array<Object> | Object;
}

interface Error extends Omit<Success, 'data'> {}

interface PaginatedResponse extends Success { total: number; }

interface ResponseHandler {
    success: (data: Array<Object> | Object, status?: number, message?: string) => Success;
    error: (message: string, status?: number) => Error;
}

export class Response implements ResponseHandler {
    static readonly VERSION = "v1";

    success(data: Array<Object> | Object, status = 200, message = "Request was successful"): Success {
        return {
            status,
            version: Response.VERSION,
            message: message,
            success: true,
            data
        };
    }

    error(message: string | string[], status = 400): Error {
        return {
            status,
            success: false,
            version: Response.VERSION,
            message: Array.isArray(message) ? message[0] : message
        };
    }

    paginate(data: Array<Object> | Object, total: number, status = 200, message = "Request was successful"): PaginatedResponse {
        return {
            status,
            version: Response.VERSION,
            message: message,
            success: true,
            total: total,
            data: Array.isArray(data) ? data : [data],
        };
    }
}
