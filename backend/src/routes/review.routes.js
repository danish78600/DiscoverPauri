import { Router } from "express";
import {
  approveReview,
  getApprovedReviews,
  getPendingReviews,
  rejectReview,
  submitReview,
} from "../controllers/review.controller.js";
import { protect, requireAdmin } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/approved", getApprovedReviews);
router.post("/", protect, submitReview);

router.get("/pending", protect, requireAdmin, getPendingReviews);
router.patch("/:id/approve", protect, requireAdmin, approveReview);
router.patch("/:id/reject", protect, requireAdmin, rejectReview);

export default router;
