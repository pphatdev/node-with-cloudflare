import { Hono } from 'hono';
import { Env } from '../middlewares/drizzle';
import WebRoutes from './v1/web/web';
import ApiRoutes from './v1/api/api';
const app = new Hono();

app.route('/', WebRoutes);
app.route('/v1/api', ApiRoutes);

export default {
    fetch: (request: Request, env: Env, ctx: any) => {
        return app.fetch(request, env, ctx);
    },
};