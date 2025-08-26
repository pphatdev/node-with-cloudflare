import { Context } from 'hono';

export const corsMiddleware = async (c: Context, next: () => Promise<void>) => {
    const origin = c.req.header('origin');
    const allowedOrigins = [
        'http://localhost:3000',
        'http://localhost:5173',
        'http://localhost:8080',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:5173',
        'http://127.0.0.1:8080',
    ];

    // Check if origin ends with allowed domains
    const allowedDomains = ['.pphat.top', '.pphat.pro'];
    const isDomainAllowed = allowedDomains.some(domain =>
        origin?.endsWith(domain)
    );

    if (origin && (allowedOrigins.includes(origin) || isDomainAllowed)) {
        c.header('Access-Control-Allow-Origin', origin);
    }

    c.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    c.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    c.header('Access-Control-Allow-Credentials', 'true');

    if (c.req.method === 'OPTIONS') {
        return c.text('__options__');
    }

    await next();
};