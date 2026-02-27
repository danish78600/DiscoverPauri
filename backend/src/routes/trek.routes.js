import { Router } from "express";
import {
  createTrek,
  deleteTrek,
  getAllTreks,
  getTrekBySlug,
  updateTrek,
} from "../controllers/trek.controller.js";
import { protect, requireAdmin } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/", getAllTreks);
router.get("/:slug", getTrekBySlug);

router.post("/", protect, requireAdmin, createTrek);
router.put("/:id", protect, requireAdmin, updateTrek);
router.delete("/:id", protect, requireAdmin, deleteTrek);

export default router;
