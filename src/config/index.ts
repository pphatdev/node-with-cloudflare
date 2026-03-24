export const secret = "default_secret";

export const getSecret = (c: any): string => {
    return c?.env?.JWT_SECRET || secret;
};

export const AppConfig = {
    jwt: {
        secret,
        expiresIn: "2h",
    },
    cors: {
        allowedOrigins: [
            "http://localhost:3000",
            "http://localhost:5173",
            "http://localhost:8080",
            "http://127.0.0.1:3000",
            "http://127.0.0.1:5173",
            "http://127.0.0.1:8080",
        ],
        allowedDomains: [".pphat.top", ".pphat.pro"],
    },
};

export default AppConfig;
