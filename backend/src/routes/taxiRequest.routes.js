import { Router } from "express";
import {
  assignTaxiRequest,
  createTaxiRequest,
  getAllTaxiRequests,
  getPublicTaxiRequest,
  updateTaxiRequest,
} from "../controllers/taxiRequest.controller.js";
import { protect, requireAdmin } from "../middleware/auth.middleware.js";

const router = Router();

// Public: allow anyone to request a taxi
router.post("/", createTaxiRequest);

// Public: allow request tracking by a random token
router.get("/public/:token", getPublicTaxiRequest);

// Admin: view + assign
router.get("/", protect, requireAdmin, getAllTaxiRequests);
router.put("/:id/assign", protect, requireAdmin, assignTaxiRequest);
router.put("/:id", protect, requireAdmin, updateTaxiRequest);

export default router;
