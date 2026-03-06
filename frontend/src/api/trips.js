import { apiRequest } from "./client";

/**
 * @param {unknown} payload
 * @param {string} token
 */
export function saveTripPlan(payload, token) {
  return apiRequest("/api/trips", {
    method: "POST",
    body: payload,
    token,
  });
}

/**
 * @param {string} token
 */
export function getMyTrips(token) {
  return apiRequest("/api/trips", { token });
}
