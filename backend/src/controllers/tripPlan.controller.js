import TripPlan from "../models/tripPlan.model.js";

function cleanString(value) {
  return String(value ?? "").trim();
}

function toPositiveIntOrNull(value) {
  const text = cleanString(value);
  if (!text) return null;
  const n = Number(text);
  if (!Number.isFinite(n)) return null;
  const i = Math.floor(n);
  if (i <= 0) return null;
  return i;
}

function toStringArray(value) {
  if (Array.isArray(value)) {
    return value.map(cleanString).filter(Boolean);
  }
  const text = cleanString(value);
  if (!text) return [];
  // Accept comma-separated interests from the UI.
  return text
    .split(",")
    .map((x) => cleanString(x))
    .filter(Boolean);
}

function extractTitle(planText) {
  const text = cleanString(planText);
  if (!text) return null;
  const firstLine = text
    .split(/\r?\n/)
    .map((x) => x.trim())
    .find(Boolean);
  if (!firstLine) return null;
  return firstLine.slice(0, 200);
}

export async function saveTripPlan(req, res) {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ message: "Not authorized" });
    }

    const payload = req.body || {};

    const destination = cleanString(payload.destination || payload.to);
    const from = cleanString(payload.from || payload.origin);
    const startDate = cleanString(payload.startDate);
    const endDate = cleanString(payload.endDate);
    const days = toPositiveIntOrNull(payload.days);
    const travelers = toPositiveIntOrNull(payload.travelers);
    const budget = cleanString(payload.budget);
    const pace = cleanString(payload.pace);
    const interests = toStringArray(payload.interests);
    const notes = cleanString(payload.notes);

    const planText = cleanString(payload.planText || payload.plan);

    if (!destination) {
      return res.status(400).json({ message: "destination is required" });
    }

    if (!planText) {
      return res.status(400).json({ message: "planText is required" });
    }

    const created = await TripPlan.create({
      user: userId,
      title: extractTitle(planText),
      destination,
      from: from || null,
      startDate: startDate || null,
      endDate: endDate || null,
      days,
      travelers,
      budget: budget || null,
      pace: pace || null,
      interests,
      notes: notes || null,
      planText,
      aiProvider: cleanString(payload.aiProvider) || "gemini",
      aiModel: cleanString(payload.aiModel) || null,
    });

    return res.status(201).json(created);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to save trip plan" });
  }
}

export async function listMyTripPlans(req, res) {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ message: "Not authorized" });
    }

    const trips = await TripPlan.find({ user: userId }).sort({ createdAt: -1 });
    return res.status(200).json(trips);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to fetch trip plans" });
  }
}
