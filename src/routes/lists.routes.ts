import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { requireRole } from "../middlewares/role.middleware.js";
import {
  createList,
  getListDetails,
  getLists,
} from "../controllers/lists/lists.controller.js";

const router = Router();

// Criar hospital
router.post("/create", requireAuth, createList);

// Obter detalhes de uma lista
router.get("/:id", requireAuth, getListDetails);

router.get("/", requireAuth, getLists);

export default router;
