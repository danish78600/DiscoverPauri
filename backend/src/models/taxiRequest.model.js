import mongoose from "mongoose";
import crypto from "crypto";

const taxiRequestSchema = new mongoose.Schema(
  {
    publicToken: {
      type: String,
      trim: true,
      unique: true,
      index: true,
      default: () => crypto.randomUUID(),
    },

    destination: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Destination",
      default: null,
      index: true,
    },

    pickupLocation: { type: String, trim: true, required: true },
    dropLocation: { type: String, trim: true, required: true },
    dateTime: { type: Date, required: true },
    passengers: { type: Number, required: true, min: 1, max: 30 },
    tripType: {
      type: String,
      required: true,
      enum: ["local", "outstation"],
    },
    contactNumber: { type: String, trim: true, required: true },

    status: {
      type: String,
      required: true,
      enum: ["pending", "assigned", "completed"],
      default: "pending",
      index: true,
    },

    driverNotes: {
      type: String,
      trim: true,
      default: "",
    },

    assignedDriver: {
      name: { type: String, trim: true, default: null },
      contact: { type: String, trim: true, default: null },
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    assignedAt: { type: Date, default: null },

    completedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export default mongoose.model("TaxiRequest", taxiRequestSchema);
