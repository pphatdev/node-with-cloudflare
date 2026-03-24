import { Hono } from "hono";
import { Env } from "./middlewares/db";
import dbMiddleware from "./middlewares/db";
import { corsMiddleware } from "./middlewares/cors";
import { initialize } from "./db/setup";

// Module routes
import articlesRoutes from "./modules/articles/articles.routes";
import authRoutes from "./modules/auth/auth.routes";
import categoriesRoutes from "./modules/categories/categories.routes";
import projectsRoutes from "./modules/projects/projects.routes";
import sessionsRoutes from "./modules/sessions/sessions.routes";
import usersRoutes from "./modules/users/users.routes";

const app = new Hono();

// Homepage
app.get("/", (c) => c.text("Welcome to the homepage"));

// API v1
const api = new Hono();
api.use("*", corsMiddleware, dbMiddleware);
api.post("/setup", initialize);

api.route("/auth", authRoutes);
api.route("/articles", articlesRoutes);
api.route("/posts", articlesRoutes);
api.route("/categories", categoriesRoutes);
api.route("/projects", projectsRoutes);
api.route("/sessions", sessionsRoutes);
api.route("/users", usersRoutes);

app.route("/v1/api", api);

export default {
    fetch: (request: Request, env: Env, ctx: any) => {
        return app.fetch(request, env, ctx);
    },
};
