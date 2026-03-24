import { Hono } from "hono";
import { authorize } from "../../middlewares/auth";
import { AuthController } from "./auth.controller";
import { validateCreateUser } from "../users/users.validator";
import { UsersController } from "../users/users.controller";

const router = new Hono();

router.post("/register", validateCreateUser, UsersController.create);
router.post("/login", AuthController.login);
router.post("/logout", authorize, AuthController.logout);
router.post("/refresh", authorize, AuthController.refreshToken);
router.get("/me", authorize, AuthController.getMe);
router.get("/verify", AuthController.verifyToken);

export default router;
