import { Hono } from "hono";
import { Validation } from "../../shared/utils/validation";
import { authorize } from "../../middlewares/auth";
import { validateCreateUser } from "./users.validator";
import { UsersController } from "./users.controller";

const router = new Hono();

router.use("*", authorize);

router.get("/", Validation.list, UsersController.list);
router.get("/:id", Validation.get, UsersController.detail);
router.post("/", validateCreateUser, UsersController.create);
router.patch("/:id", Validation.update, validateCreateUser, UsersController.update);
router.delete("/:id", Validation.delete, UsersController.softDelete);

export default router;
