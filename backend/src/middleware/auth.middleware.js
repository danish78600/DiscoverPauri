import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

export async function protect(req, res, next) {
  try {
    const header = req.headers?.authorization;
    if (!header || !header.toLowerCase().startsWith("bearer ")) {
      return res.status(401).json({ message: "Not authorized" });
    }

    const token = header.slice(7).trim();
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return res.status(500).json({ message: "JWT_SECRET is not configured" });
    }

    const decoded = jwt.verify(token, secret);
    const userId = decoded?.id;

    if (!userId) {
      return res.status(401).json({ message: "Not authorized" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(401).json({ message: "Not authorized" });
    }

    req.user = user;
    return next();
  } catch (err) {
    return res.status(401).json({ message: "Not authorized" });
  }
}

export function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin only" });
  }
  return next();
}
