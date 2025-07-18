interface Success {
    status: number;
    success: boolean;
    message?: string;
    version: string;
    data: Array<Object> | Object;
}

interface Error {
    status: number;
    success: boolean;
    message: string;
    version: string;
    reason?: string;
}

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
        }
    }

    error(message: string | string[], status = 400): Error {
        return {
            status,
            version: Response.VERSION,
            success: false,
            message: Array.isArray(message) ? message[0] : message
        };
    }
}
