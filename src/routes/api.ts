import { Hono } from 'hono';

const app = new Hono().basePath('/api');

app.get('/', (c) => {
    return c.json({ message: 'Welcome to the API homepage' });
});

export default app;
