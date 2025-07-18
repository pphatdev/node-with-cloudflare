import { Hono } from 'hono';
import UserRoutes from './users';

const app = new Hono().basePath('/api');

app.get('/', (c) => {
    return c.json({ message: 'Welcome to the API homepage' });
});

app.route('/users', UserRoutes);

app.get('/status', (c) => {
    return c.json({ status: 'API is running' });
});

export default app;
