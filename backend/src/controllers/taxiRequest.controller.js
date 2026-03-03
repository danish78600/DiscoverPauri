import mongoose from "mongoose";
import TaxiRequest from "../models/taxiRequest.model.js";

function cleanString(value) {
  const text = String(value ?? "").trim();
  return text;
}

function toPositiveInt(value) {
  const n = Number(String(value ?? "").trim());
  if (!Number.isFinite(n)) return null;
  const i = Math.floor(n);
  if (i <= 0) return null;
  return i;
}

function toDate(value) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

function isValidStatus(value) {
  return ["pending", "assigned", "completed"].includes(String(value || ""));
}

export async function createTaxiRequest(req, res) {
  try {
    const payload = req.body || {};

    const pickupLocation = cleanString(payload.pickupLocation);
    const dropLocation = cleanString(payload.dropLocation);
    const dateTime = toDate(payload.dateTime);
    const passengers = toPositiveInt(payload.passengers);
    const tripType = cleanString(payload.tripType).toLowerCase();
    const contactNumber = cleanString(payload.contactNumber);

    if (!pickupLocation) {
      return res.status(400).json({ message: "pickupLocation is required" });
    }

    if (!dropLocation) {
      return res.status(400).json({ message: "dropLocation is required" });
    }

    if (!dateTime) {
      return res.status(400).json({ message: "dateTime is required" });
    }

    if (!passengers) {
      return res.status(400).json({ message: "passengers is required" });
    }

    if (!tripType || !["local", "outstation"].includes(tripType)) {
      return res
        .status(400)
        .json({ message: "tripType must be local or outstation" });
    }

    if (!contactNumber) {
      return res.status(400).json({ message: "contactNumber is required" });
    }

    let destination = null;
    if (payload.destinationId) {
      const id = String(payload.destinationId);
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: "destinationId is invalid" });
      }
      destination = id;
    }

    const created = await TaxiRequest.create({
      destination,
      pickupLocation,
      dropLocation,
      dateTime,
      passengers,
      tripType,
      contactNumber,
      status: "pending",
    });

    return res.status(201).json(created);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to create taxi request" });
  }
}

export async function getAllTaxiRequests(req, res) {
  try {
    const requests = await TaxiRequest.find({}).sort({ createdAt: -1 });
    return res.status(200).json(requests);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to fetch taxi requests" });
  }
}

export async function assignTaxiRequest(req, res) {
  try {
    const { id } = req.params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "valid id is required" });
    }

    const payload = req.body || {};
    const driverName = cleanString(payload.driverName);
    const driverContact = cleanString(payload.driverContact);

    if (!driverName) {
      return res.status(400).json({ message: "driverName is required" });
    }

    if (!driverContact) {
      return res.status(400).json({ message: "driverContact is required" });
    }

    const updated = await TaxiRequest.findByIdAndUpdate(
      id,
      {
        status: "assigned",
        assignedDriver: { name: driverName, contact: driverContact },
        assignedBy: req.user?._id || null,
        assignedAt: new Date(),
      },
      { new: true, runValidators: true },
    );

    if (!updated) {
      return res.status(404).json({ message: "Taxi request not found" });
    }

    return res.status(200).json(updated);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to assign taxi request" });
  }
}

export async function updateTaxiRequest(req, res) {
  try {
    const { id } = req.params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "valid id is required" });
    }

    const payload = req.body || {};
    const status = payload.status != null ? cleanString(payload.status) : "";
    const driverNotes =
      payload.driverNotes != null ? cleanString(payload.driverNotes) : null;

    /** @type {Record<string, any>} */
    const patch = {};

    if (status) {
      const normalized = status.toLowerCase();
      if (!isValidStatus(normalized)) {
        return res.status(400).json({ message: "status is invalid" });
      }

      patch.status = normalized;

      if (normalized === "pending") {
        patch.assignedDriver = { name: null, contact: null };
        patch.assignedBy = null;
        patch.assignedAt = null;
        patch.completedAt = null;
      }

      if (normalized === "completed") {
        patch.completedAt = new Date();
      }

      if (normalized !== "completed") {
        patch.completedAt = null;
      }
    }

    if (driverNotes !== null) {
      if (driverNotes.length > 2000) {
        return res.status(400).json({ message: "driverNotes is too long" });
      }
      patch.driverNotes = driverNotes;
    }

    const updated = await TaxiRequest.findByIdAndUpdate(id, patch, {
      new: true,
      runValidators: true,
    });

    if (!updated) {
      return res.status(404).json({ message: "Taxi request not found" });
    }

    return res.status(200).json(updated);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to update taxi request" });
  }
}

export async function getPublicTaxiRequest(req, res) {
  try {
    const token = String(req.params.token || "").trim();
    if (!token) {
      return res.status(400).json({ message: "token is required" });
    }

    const doc = await TaxiRequest.findOne({ publicToken: token }).select({
      status: 1,
      pickupLocation: 1,
      dropLocation: 1,
      dateTime: 1,
      passengers: 1,
      tripType: 1,
      assignedDriver: 1,
      assignedAt: 1,
      completedAt: 1,
      driverNotes: 1,
      createdAt: 1,
      updatedAt: 1,
    });

    if (!doc) {
      return res.status(404).json({ message: "Taxi request not found" });
    }

    return res.status(200).json(doc);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to fetch taxi request" });
  }
}
