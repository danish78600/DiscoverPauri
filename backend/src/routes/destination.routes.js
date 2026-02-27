import { Router } from "express";
import {
  createDestination,
  deleteDestination,
  getAllDestinations,
  getDestinationBySlug,
  getFeaturedDestinations,
  updateDestination,
} from "../controllers/destination.controller.js";
import { protect, requireAdmin } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/", getAllDestinations);
router.get("/featured", getFeaturedDestinations);
router.get("/:slug", getDestinationBySlug);

router.post("/", protect, requireAdmin, createDestination);
router.put("/:id", protect, requireAdmin, updateDestination);
router.delete("/:id", protect, requireAdmin, deleteDestination);

export default router;
