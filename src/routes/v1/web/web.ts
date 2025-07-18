import { Hono } from 'hono';

const app = new Hono().basePath('/');

app.get('/', (c) => {
    return c.text('Welcome to the homepage');
});

export default app;
