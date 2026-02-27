import mongoose from "mongoose";
import Destination from "../models/destination.model.js";

function slugify(value) {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function generateUniqueSlug(base) {
  let slug = slugify(base);
  if (!slug) slug = "destination";

  const exists = await Destination.exists({ slug });
  if (!exists) return slug;

  let counter = 2;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const nextSlug = `${slug}-${counter}`;
    const nextExists = await Destination.exists({ slug: nextSlug });
    if (!nextExists) return nextSlug;
    counter += 1;
  }
}

export async function createDestination(req, res) {
  try {
    const payload = req.body || {};

    if (!payload.name) {
      return res.status(400).json({ message: "name is required" });
    }

    const slug = payload.slug
      ? slugify(payload.slug)
      : await generateUniqueSlug(payload.name);

    const destination = await Destination.create({
      ...payload,
      slug,
    });

    return res.status(201).json(destination);
  } catch (err) {
    console.error(err);

    if (err?.code === 11000) {
      return res
        .status(409)
        .json({ message: "Destination slug already exists" });
    }

    return res.status(500).json({ message: "Failed to create destination" });
  }
}

export async function getAllDestinations(_req, res) {
  try {
    const destinations = await Destination.find().sort({ createdAt: -1 });
    return res.status(200).json(destinations);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to fetch destinations" });
  }
}

export async function getDestinationBySlug(req, res) {
  try {
    const { slug } = req.params;
    if (!slug) return res.status(400).json({ message: "slug is required" });

    const destination = await Destination.findOne({ slug });
    if (!destination)
      return res.status(404).json({ message: "Destination not found" });

    return res.status(200).json(destination);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to fetch destination" });
  }
}

export async function updateDestination(req, res) {
  try {
    const { id } = req.params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "valid id is required" });
    }

    const updates = req.body || {};

    if (typeof updates.slug === "string") {
      updates.slug = slugify(updates.slug);
    }

    const destination = await Destination.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });

    if (!destination)
      return res.status(404).json({ message: "Destination not found" });

    return res.status(200).json(destination);
  } catch (err) {
    console.error(err);

    if (err?.code === 11000) {
      return res
        .status(409)
        .json({ message: "Destination slug already exists" });
    }

    return res.status(500).json({ message: "Failed to update destination" });
  }
}

export async function deleteDestination(req, res) {
  try {
    const { id } = req.params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "valid id is required" });
    }

    const destination = await Destination.findByIdAndDelete(id);
    if (!destination)
      return res.status(404).json({ message: "Destination not found" });

    return res.status(200).json({ message: "Destination deleted" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to delete destination" });
  }
}

export async function getFeaturedDestinations(_req, res) {
  try {
    const destinations = await Destination.find({ isFeatured: true }).sort({
      createdAt: -1,
    });
    return res.status(200).json(destinations);
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ message: "Failed to fetch featured destinations" });
  }
}
