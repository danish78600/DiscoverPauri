import mongoose from "mongoose";
import Destination from "../models/destination.model.js";
import Review from "../models/review.model.js";
import Trek from "../models/trek.model.js";

function normalizeTargetType(value) {
  const v = String(value || "")
    .trim()
    .toLowerCase();
  if (!v) return null;
  if (v === "destination" || v === "destinations") return "destination";
  if (v === "trek" || v === "treks") return "trek";
  return null;
}

function parseRating(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  const rounded = Math.round(n);
  if (rounded < 1 || rounded > 5) return null;
  return rounded;
}

async function getTargetSnapshot(targetType, targetId) {
  if (targetType === "destination") {
    const destination =
      await Destination.findById(targetId).select("name slug");
    if (!destination) return null;
    return {
      targetName: destination.name || "",
      targetSlug: destination.slug || "",
    };
  }

  if (targetType === "trek") {
    const trek = await Trek.findById(targetId).select("title slug");
    if (!trek) return null;
    return { targetName: trek.title || "", targetSlug: trek.slug || "" };
  }

  return null;
}

async function recalculateTargetRatings(targetType, targetId) {
  const [summary] = await Review.aggregate([
    {
      $match: {
        targetType,
        targetId: new mongoose.Types.ObjectId(String(targetId)),
        status: "approved",
      },
    },
    {
      $group: {
        _id: null,
        average: { $avg: "$rating" },
        count: { $sum: 1 },
      },
    },
  ]);

  const average = summary?.average ? Number(summary.average) : 0;
  const count = summary?.count ? Number(summary.count) : 0;

  if (targetType === "destination") {
    await Destination.findByIdAndUpdate(
      targetId,
      {
        averageRating: average,
        totalReviews: count,
      },
      { runValidators: true },
    );
    return;
  }

  if (targetType === "trek") {
    await Trek.findByIdAndUpdate(
      targetId,
      {
        ratingAverage: average,
        ratingCount: count,
      },
      { runValidators: true },
    );
  }
}

export async function submitReview(req, res) {
  try {
    const body = req.body || {};
    const targetType = normalizeTargetType(body.targetType);
    const targetId = body.targetId;
    const rating = parseRating(body.rating);
    const text = String(body.text ?? "").trim();

    if (!targetType) {
      return res.status(400).json({ message: "targetType is required" });
    }

    if (!targetId || !mongoose.Types.ObjectId.isValid(targetId)) {
      return res.status(400).json({ message: "valid targetId is required" });
    }

    if (!rating) {
      return res.status(400).json({ message: "rating must be 1-5" });
    }

    if (!text) {
      return res.status(400).json({ message: "text is required" });
    }

    const snapshot = await getTargetSnapshot(targetType, targetId);
    if (!snapshot) {
      return res.status(404).json({ message: "Target not found" });
    }

    const review = await Review.create({
      targetType,
      targetId,
      ...snapshot,
      user: req.user?._id,
      rating,
      text,
      status: "pending",
    });

    return res.status(201).json(review);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to submit review" });
  }
}

export async function getApprovedReviews(req, res) {
  try {
    const targetType = normalizeTargetType(req.query?.targetType);
    const targetId = req.query?.targetId;

    if (!targetType) {
      return res.status(400).json({ message: "targetType is required" });
    }

    if (!targetId || !mongoose.Types.ObjectId.isValid(targetId)) {
      return res.status(400).json({ message: "valid targetId is required" });
    }

    const reviews = await Review.find({
      targetType,
      targetId,
      status: "approved",
    })
      .populate("user", "name avatarUrl")
      .sort({ createdAt: -1 });

    return res.status(200).json(reviews);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to fetch reviews" });
  }
}

export async function getPendingReviews(req, res) {
  try {
    const filter = { status: "pending" };
    const targetType = normalizeTargetType(req.query?.targetType);
    const targetId = req.query?.targetId;

    if (targetType) {
      filter.targetType = targetType;
    }

    if (targetId) {
      if (!mongoose.Types.ObjectId.isValid(targetId)) {
        return res.status(400).json({ message: "valid targetId is required" });
      }
      filter.targetId = targetId;
    }

    const reviews = await Review.find(filter)
      .populate("user", "name email avatarUrl")
      .sort({ createdAt: -1 })
      .limit(200);

    return res.status(200).json(reviews);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to fetch pending reviews" });
  }
}

export async function approveReview(req, res) {
  try {
    const { id } = req.params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "valid id is required" });
    }

    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    if (review.status !== "approved") {
      review.status = "approved";
      review.moderatedAt = new Date();
      review.moderatedBy = req.user?._id || null;
      review.moderationNote = null;
      await review.save();
      await recalculateTargetRatings(review.targetType, review.targetId);
    }

    return res.status(200).json(review);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to approve review" });
  }
}

export async function rejectReview(req, res) {
  try {
    const { id } = req.params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "valid id is required" });
    }

    const reason =
      req.body?.reason != null ? String(req.body.reason).trim() : "";

    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    const wasApproved = review.status === "approved";
    review.status = "rejected";
    review.moderatedAt = new Date();
    review.moderatedBy = req.user?._id || null;
    review.moderationNote = reason || null;
    await review.save();

    if (wasApproved) {
      await recalculateTargetRatings(review.targetType, review.targetId);
    }

    return res.status(200).json(review);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to reject review" });
  }
}
