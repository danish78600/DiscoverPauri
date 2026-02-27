import mongoose from "mongoose";
import Trek from "../models/trek.model.js";

function slugify(value) {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function generateUniqueSlug(base) {
  let slug = slugify(base);
  if (!slug) slug = "trek";

  const exists = await Trek.exists({ slug });
  if (!exists) return slug;

  let counter = 2;
  while (true) {
    const nextSlug = `${slug}-${counter}`;
    const nextExists = await Trek.exists({ slug: nextSlug });
    if (!nextExists) return nextSlug;
    counter += 1;
  }
}

function parseDifficultyQuery(value) {
  if (!value) return null;

  if (Array.isArray(value)) {
    return value.map((v) => String(v).toLowerCase().trim()).filter(Boolean);
  }

  return String(value)
    .split(",")
    .map((v) => v.toLowerCase().trim())
    .filter(Boolean);
}

export async function createTrek(req, res) {
  try {
    const payload = req.body || {};

    if (!payload.title) {
      return res.status(400).json({ message: "title is required" });
    }

    if (payload.durationDays == null) {
      return res.status(400).json({ message: "durationDays is required" });
    }

    const slug = payload.slug
      ? slugify(payload.slug)
      : await generateUniqueSlug(payload.title);

    const trek = await Trek.create({
      ...payload,
      slug,
    });

    return res.status(201).json(trek);
  } catch (err) {
    console.error(err);

    if (err?.code === 11000) {
      return res.status(409).json({ message: "Trek slug already exists" });
    }

    return res.status(500).json({ message: "Failed to create trek" });
  }
}

export async function getAllTreks(req, res) {
  try {
    const filter = {};
    const difficulties = parseDifficultyQuery(req.query?.difficulty);

    if (difficulties?.length) {
      filter.difficulty =
        difficulties.length === 1 ? difficulties[0] : { $in: difficulties };
    }

    const treks = await Trek.find(filter).sort({ createdAt: -1 });
    return res.status(200).json(treks);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to fetch treks" });
  }
}

export async function getTrekBySlug(req, res) {
  try {
    const { slug } = req.params;
    if (!slug) return res.status(400).json({ message: "slug is required" });

    const trek = await Trek.findOne({ slug });
    if (!trek) return res.status(404).json({ message: "Trek not found" });

    return res.status(200).json(trek);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to fetch trek" });
  }
}

export async function updateTrek(req, res) {
  try {
    const { id } = req.params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "valid id is required" });
    }

    const updates = req.body || {};

    if (typeof updates.slug === "string") {
      updates.slug = slugify(updates.slug);
    }

    const trek = await Trek.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });

    if (!trek) return res.status(404).json({ message: "Trek not found" });

    return res.status(200).json(trek);
  } catch (err) {
    console.error(err);

    if (err?.code === 11000) {
      return res.status(409).json({ message: "Trek slug already exists" });
    }

    return res.status(500).json({ message: "Failed to update trek" });
  }
}

export async function deleteTrek(req, res) {
  try {
    const { id } = req.params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "valid id is required" });
    }

    const trek = await Trek.findByIdAndDelete(id);
    if (!trek) return res.status(404).json({ message: "Trek not found" });

    return res.status(200).json({ message: "Trek deleted" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to delete trek" });
  }
}
