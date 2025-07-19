import { Hono } from "hono";
import { getProjects } from "../../../controllers/projectsController";
import drizzleMiddleware from "../../../middlewares/drizzle";

const app = new Hono();

app.use("*", drizzleMiddleware);
app.get("/", getProjects);

export default app;