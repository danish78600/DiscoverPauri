import { apiRequest } from "./client";

/**
 * @param {string} city
 */
export function getWeather(city) {
  const safe = String(city || "").trim();
  return apiRequest(`/api/weather/${encodeURIComponent(safe)}`);
}
