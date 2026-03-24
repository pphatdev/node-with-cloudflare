import { Hono } from "hono";
import { Validation } from "../../shared/utils/validation";
import { authorize } from "../../middlewares/auth";
import { validateProject } from "./projects.validator";
import { ProjectsController } from "./projects.controller";

const router = new Hono();

router.get("/", Validation.list, ProjectsController.list);
router.get("/:id", Validation.get, ProjectsController.detail);

router.use("*", authorize);

router.post("/", validateProject, ProjectsController.create);
router.patch("/:id", Validation.update, validateProject, ProjectsController.update);
router.delete("/:id", Validation.delete, ProjectsController.softDelete);

export default router;
