import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import connectDB from "./config/db.js";
import authRoutes from "./routes/auth.routes.js";
import destinationRoutes from "./routes/destination.routes.js";
import taxiRequestRoutes from "./routes/taxiRequest.routes.js";
import trekRoutes from "./routes/trek.routes.js";
import uploadRoutes from "./routes/upload.routes.js";
import reviewRoutes from "./routes/review.routes.js";
import aiRoutes from "./routes/ai.routes.js";
import tripPlanRoutes from "./routes/tripPlan.routes.js";
import weatherRoutes from "./routes/weather.routes.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json({ limit: "1mb" }));

const uploadsDir = path.join(process.cwd(), "public", "uploads");
if (fs.existsSync(uploadsDir)) {
  app.use("/uploads", express.static(uploadsDir));
}

app.use("/api/auth", authRoutes);
app.use("/api/destinations", destinationRoutes);
app.use("/api/taxi-requests", taxiRequestRoutes);
app.use("/api/treks", trekRoutes);
app.use("/api/uploads", uploadRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/trips", tripPlanRoutes);
app.use("/api/weather", weatherRoutes);

app.get("/", (_req, res) => {
  res.json({ ok: true, name: "Discover Pauri API" });
});

const port = process.env.PORT || 5000;

async function start() {
  await connectDB();
  app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`Server running on port ${port}`);
  });
}

start().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("Failed to start server:", err);
  process.exit(1);
});
