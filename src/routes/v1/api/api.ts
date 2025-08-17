import { Hono } from 'hono';
import { initialize } from '../../../db/setup';
import Projects from './projects';
import Articles from './articles';
import Users from "./users";
import Sessions from "./sessions";
import Categories from "./categories";
import drizzleMiddleware from '../../../middlewares/drizzle';

const app = new Hono();

app.use('*', drizzleMiddleware);
app.post('/setup', initialize);

/**
 * API routes for Projects
 */
app.route('/projects', Projects);

/**
 * API routes for Articles
 */
app.route('/articles', Articles);

/**
 * API routes for Users
 */
app.route('/users', Users);

/**
 * API routes for Sessions
 */
app.route('/sessions', Sessions);

/**
 * API routes for Categories
 */
app.route('/categories', Categories);


export default app;