import { Router } from "express";
import {
  getHospitalInfo,
  createHospital,
} from "../controllers/hospitals/hospital.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { requireRole } from "../middlewares/role.middleware.js";

const router = Router();

// Criar hospital
router.post("/create", requireAuth, requireRole(["admin"]), createHospital);

// Buscar hospital por id
router.get("/:id", requireAuth, getHospitalInfo);

export default router;
