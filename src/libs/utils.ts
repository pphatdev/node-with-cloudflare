class Utils {
    /**
     * Utility function to parse JSON strings into arrays.
     * @param {data} - The data to parse, can be a JSON string or an array.
     * @returns The parsed array if the input is a JSON string, or the input itself if it's already an array.
    */
    static toJSONParse = (data: any) => Array.isArray(data) ? data : JSON.parse(data || "[]");
}

export const { toJSONParse } = Utils;
export default Utils;