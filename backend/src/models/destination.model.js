import mongoose from "mongoose";

const destinationSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, required: true, index: true },
    slug: {
      type: String,
      trim: true,
      required: true,
      unique: true,
      index: true,
    },
    shortDescription: { type: String, trim: true, default: "" },
    description: { type: String, trim: true, default: "" },
    images: { type: [String], default: [] },

    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      default: null,
      index: true,
    },

    location: {
      district: { type: String, trim: true, default: null },
      state: { type: String, trim: true, default: null },
      address: { type: String, trim: true, default: null },
      coordinates: {
        lat: { type: Number, default: null },
        lng: { type: Number, default: null },
      },
    },

    bestTimeToVisit: { type: [String], default: [] },
    entryFee: { type: String, trim: true, default: "" },
    timing: { type: String, trim: true, default: "" },
    howToReach: { type: String, trim: true, default: "" },
    thingsToCarry: { type: [String], default: [] },

    isFeatured: { type: Boolean, default: false, index: true },

    averageRating: { type: Number, default: 0, min: 0, max: 5 },
    totalReviews: { type: Number, default: 0, min: 0 },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export default mongoose.model("Destination", destinationSchema);
