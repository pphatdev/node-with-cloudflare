export const toJSONParse = (data: any): any =>
    Array.isArray(data) ? data : JSON.parse(data || "[]");
