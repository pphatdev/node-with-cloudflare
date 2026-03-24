import { Hono } from "hono";
import { Validation } from "../../shared/utils/validation";
import { authorize } from "../../middlewares/auth";
import { validateSession } from "./sessions.validator";
import { SessionsController } from "./sessions.controller";

const router = new Hono();

router.get("/", Validation.list, SessionsController.list);
router.get("/:id", Validation.get, SessionsController.detail);

router.use("*", authorize);

router.post("/", validateSession, SessionsController.create);
router.patch("/:id", Validation.update, validateSession, SessionsController.update);
router.delete("/:id", Validation.delete, SessionsController.remove);

export default router;
