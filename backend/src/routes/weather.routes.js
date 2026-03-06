import { Router } from "express";
import { getWeatherByCity } from "../controllers/weather.controller.js";

const router = Router();

// GET /api/weather/:city
router.get("/:city", getWeatherByCity);

export default router;
