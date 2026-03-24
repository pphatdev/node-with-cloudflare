import { Hono } from "hono";
import { Validation } from "../../shared/utils/validation";
import { authorize } from "../../middlewares/auth";
import { validateArticle } from "./articles.validator";
import { ArticlesController } from "./articles.controller";

const router = new Hono();

router.get("/", Validation.list, ArticlesController.list);
router.get("/:slug", Validation.getBySlug, ArticlesController.detail);

router.use("*", authorize);

router.post("/", validateArticle, ArticlesController.create);
router.patch("/:id", Validation.update, validateArticle, ArticlesController.update);
router.delete("/:id", Validation.delete, ArticlesController.softDelete);

export default router;
