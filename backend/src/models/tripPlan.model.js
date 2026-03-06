import mongoose from "mongoose";

const tripPlanSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      type: String,
      trim: true,
      default: null,
      maxlength: 200,
    },
    destination: {
      type: String,
      trim: true,
      required: true,
      maxlength: 200,
      index: true,
    },
    from: {
      type: String,
      trim: true,
      default: null,
      maxlength: 200,
    },
    startDate: {
      type: String,
      trim: true,
      default: null,
      maxlength: 30,
    },
    endDate: {
      type: String,
      trim: true,
      default: null,
      maxlength: 30,
    },
    days: {
      type: Number,
      default: null,
      min: 1,
      max: 365,
    },
    travelers: {
      type: Number,
      default: null,
      min: 1,
      max: 50,
    },
    budget: {
      type: String,
      trim: true,
      default: null,
      maxlength: 120,
    },
    pace: {
      type: String,
      trim: true,
      default: null,
      maxlength: 40,
    },
    interests: {
      type: [String],
      default: [],
    },
    notes: {
      type: String,
      trim: true,
      default: null,
      maxlength: 2000,
    },
    planText: {
      type: String,
      trim: true,
      required: true,
      maxlength: 200000,
    },
    aiProvider: {
      type: String,
      trim: true,
      default: "gemini",
      maxlength: 40,
    },
    aiModel: {
      type: String,
      trim: true,
      default: null,
      maxlength: 80,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export default mongoose.model("TripPlan", tripPlanSchema);
