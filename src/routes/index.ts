import { Hono } from 'hono';
import WebRoutes from './v1/web/web';
import ApiRoutes from './v1/api/api';

const app = new Hono();
app.route('/', WebRoutes);
app.route('/', ApiRoutes);

export default {
    fetch: (request: Request, env: any, ctx: any) => {
        return app.fetch(request, env, ctx);
    },
};