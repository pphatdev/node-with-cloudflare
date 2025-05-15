import { Hono } from 'hono';
import WebRoutes from './routes/web';
import ApiRoutes from './routes/api';

const app = new Hono();
app.route('/', WebRoutes);
app.route('/', ApiRoutes);

export default {
    fetch: (request: Request, env: any, ctx: any) => {
        return app.fetch(request, env, ctx);
    },
};