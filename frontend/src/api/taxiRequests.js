import { apiRequest } from "./client";

/**
 * @param {{
 *  destinationId?: string | null,
 *  pickupLocation: string,
 *  dropLocation: string,
 *  dateTime: string,
 *  passengers: number,
 *  tripType: "local" | "outstation",
 *  contactNumber: string,
 * }} payload
 * @returns {Promise<any>}
 */
export function createTaxiRequest(payload) {
  return apiRequest("/api/taxi-requests", {
    method: "POST",
    body: payload,
  });
}

/**
 * @param {string} token
 * @returns {Promise<any[]>}
 */
export function getAllTaxiRequests(token) {
  return apiRequest("/api/taxi-requests", { token });
}

/**
 * @param {string} id
 * @param {{ driverName: string, driverContact: string }} payload
 * @param {string} token
 * @returns {Promise<any>}
 */
export function assignTaxiRequest(id, payload, token) {
  if (!id) return Promise.reject(new Error("id is required"));

  return apiRequest(
    `/api/taxi-requests/${encodeURIComponent(String(id))}/assign`,
    {
      method: "PUT",
      body: payload,
      token,
    },
  );
}

/**
 * @param {string} id
 * @param {{ status?: "pending" | "assigned" | "completed", driverNotes?: string }} payload
 * @param {string} token
 * @returns {Promise<any>}
 */
export function updateTaxiRequest(id, payload, token) {
  if (!id) return Promise.reject(new Error("id is required"));
  return apiRequest(`/api/taxi-requests/${encodeURIComponent(String(id))}`, {
    method: "PUT",
    body: payload,
    token,
  });
}

/**
 * Public: fetch request info by public token (no auth)
 * @param {string} publicToken
 * @returns {Promise<any>}
 */
export function getPublicTaxiRequest(publicToken) {
  const token = String(publicToken || "").trim();
  if (!token) return Promise.reject(new Error("publicToken is required"));
  return apiRequest(`/api/taxi-requests/public/${encodeURIComponent(token)}`);
}
