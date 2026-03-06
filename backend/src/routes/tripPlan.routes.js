import { Router } from "express";
import { protect } from "../middleware/auth.middleware.js";
import {
  listMyTripPlans,
  saveTripPlan,
} from "../controllers/tripPlan.controller.js";

const router = Router();

// GET /api/trips
router.get("/", protect, listMyTripPlans);

// POST /api/trips
router.post("/", protect, saveTripPlan);

export default router;
