import { Hono } from "hono";
import { Validation } from "../../shared/utils/validation";
import { authorize } from "../../middlewares/auth";
import { validateCategory } from "./categories.validator";
import { CategoriesController } from "./categories.controller";

const router = new Hono();

router.get("/", Validation.list, CategoriesController.list);
router.get("/:id", Validation.get, CategoriesController.detail);

router.use("*", authorize);

router.post("/", validateCategory, CategoriesController.create);
router.patch("/:id", Validation.update, validateCategory, CategoriesController.update);
router.delete("/:id", Validation.delete, CategoriesController.softDelete);

export default router;
