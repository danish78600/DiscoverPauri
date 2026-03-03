import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    targetType: {
      type: String,
      required: true,
      enum: ["destination", "trek"],
      index: true,
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },

    targetName: { type: String, trim: true, default: "" },
    targetSlug: { type: String, trim: true, default: "" },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },

    moderationNote: {
      type: String,
      trim: true,
      default: null,
      maxlength: 500,
    },
    moderatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    moderatedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

reviewSchema.index({ targetType: 1, targetId: 1, status: 1, createdAt: -1 });

export default mongoose.model("Review", reviewSchema);
