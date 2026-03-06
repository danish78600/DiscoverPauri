import { Router } from "express";
import { generateTripPlan } from "../controllers/ai.controller.js";

const router = Router();

// POST /api/ai/trip-plan
router.post("/trip-plan", generateTripPlan);

export default router;
