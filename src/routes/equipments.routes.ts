import { Router } from "express";
import {
  createEquipment,
  getEquipmentsByHospital,
} from "../controllers/equipments/equipments.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { requireRole } from "../middlewares/role.middleware.js";

const router = Router();

// Criar equipamento
router.post("/create", requireAuth, requireRole(["admin"]), createEquipment);
router.get("/:hospitalId", requireAuth, getEquipmentsByHospital);

export default router;
