import { Router } from "express";
import { login, register, logout, me } from "../controllers/auth.controller.js";
import { refreshTokenController } from "../controllers/auth/refresh.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { requireRole } from "../middlewares/role.middleware.js";

const router = Router();

router.post("/login", login);

router.post("/register", register);

router.post("/logout", requireAuth, logout);

router.post("/refresh", refreshTokenController);

// router.get("/me", requireAuth, requireRole(["admin"]), me);
router.get("/me", requireAuth, me);

export default router;
