import { Router } from "express";
import crypto from "crypto";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { protect, requireAdmin } from "../middleware/auth.middleware.js";

const router = Router();

function ensureCloudinaryConfigured() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error(
      "Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET in backend/.env",
    );
  }

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
  });
}

async function uploadBufferToCloudinary(buffer, options) {
  return await new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: options.folder,
        public_id: options.publicId,
        resource_type: "image",
      },
      (err, result) => {
        if (err) return reject(err);
        if (!result) return reject(new Error("Cloudinary upload failed"));
        return resolve(result);
      },
    );

    stream.end(buffer);
  });
}

function fileFilter(_req, file, cb) {
  const mime = String(file.mimetype || "").toLowerCase();

  if (
    mime.startsWith("image/") &&
    [
      "image/jpeg",
      "image/jpg",
      "image/pjpeg",
      "image/png",
      "image/webp",
      "image/gif",
      "image/svg+xml",
      "image/avif",
    ].includes(mime)
  ) {
    cb(null, true);
    return;
  }

  cb(new Error("Only image uploads are allowed"), false);
}

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});

router.post(
  "/",
  protect,
  requireAdmin,
  upload.single("file"),
  async (req, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "file is required" });
      }

      ensureCloudinaryConfigured();

      const folder = String(process.env.CLOUDINARY_FOLDER || "discover-pauri");
      const publicId = `${Date.now()}-${crypto.randomBytes(12).toString("hex")}`;

      const result = await uploadBufferToCloudinary(req.file.buffer, {
        folder,
        publicId,
      });

      const url = result.secure_url || result.url;
      if (!url) {
        return res
          .status(502)
          .json({ message: "Cloudinary did not return a URL" });
      }

      return res
        .status(201)
        .json({ url, filename: result.public_id || publicId });
    } catch (err) {
      return next(err);
    }
  },
);

router.use((err, _req, res, next) => {
  if (!err) return next();

  if (err instanceof multer.MulterError) {
    return res.status(400).json({ message: err.message });
  }

  const message = err instanceof Error ? err.message : "Upload failed";
  const status = /Cloudinary is not configured/i.test(message) ? 500 : 400;
  return res.status(status).json({ message });
});

export default router;
