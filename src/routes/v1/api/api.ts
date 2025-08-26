import { Hono } from 'hono';
import { initialize } from '../../../db/setup';
import Auths from './auth';
import Projects from './projects';
import Articles from './articles';
import Users from "./users";
import Sessions from "./sessions";
import Categories from "./categories";
import drizzleMiddleware from '../../../middlewares/drizzle';
import { corsMiddleware } from '../../../middlewares/cores';

const app = new Hono();


/**
 * Middleware to initialize the database connection
 */
app.use('*', corsMiddleware, drizzleMiddleware);

/**
 * Middleware to initialize the database connection
 */
app.post('/setup', initialize);

/**
 * API routes for Authentication
 */
app.route('/auth', Auths);

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