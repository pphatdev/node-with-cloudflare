import { Hono } from 'hono';
import Projects from './projects';
import { initialize } from '../../../db/setup';
import drizzleMiddleware from '../../../middlewares/drizzle';

const app = new Hono().basePath('/api');

app.use('*', drizzleMiddleware);
app.post('/setup', initialize);
app.route('/projects', Projects);

export default app;