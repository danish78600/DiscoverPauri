import mongoose from "mongoose";

const trekSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    summary: {
      type: String,
      default: "",
      trim: true,
    },

    description: {
      type: String,
      default: "",
      trim: true,
    },

    difficulty: {
      type: String,
      enum: ["easy", "moderate", "hard"],
      default: "moderate",
    },

    durationDays: {
      type: Number,
      required: true,
      min: 1,
    },

    distanceKm: {
      type: Number,
      default: null,
    },

    maxAltitudeM: {
      type: Number,
      default: null,
    },

    bestSeason: {
      type: [String],
      default: [],
    },

    location: {
      village: { type: String, default: null, trim: true },
      district: { type: String, default: null, trim: true },
      region: { type: String, default: null, trim: true },
      distanceFromPauriKm: { type: Number, default: null },
      distanceFromPauriText: { type: String, default: null, trim: true },
      coordinates: {
        lat: { type: Number, default: null },
        lng: { type: Number, default: null },
      },
    },

    stayOptions: {
      type: [String],
      default: [],
    },

    taxi: {
      pickupOptions: { type: [String], default: [] },
      route: { type: String, default: null, trim: true },
      priceEstimateInr: {
        min: { type: Number, default: null },
        max: { type: Number, default: null },
        note: { type: String, default: null, trim: true },
      },
      recommendedVehicle: { type: String, default: null, trim: true },
      ctaLabel: { type: String, default: null, trim: true },
      notes: { type: [String], default: [] },
    },

    price: {
      type: Number,
      default: null,
    },

    heroImageUrl: {
      type: String,
      default: null,
    },

    imageUrls: {
      type: [String],
      default: [],
    },

    isFeatured: {
      type: Boolean,
      default: false,
    },

    ratingAverage: {
      type: Number,
      default: 0,
    },

    ratingCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true },
);

export default mongoose.model("Trek", trekSchema);
