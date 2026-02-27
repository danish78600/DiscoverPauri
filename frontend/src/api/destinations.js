import { apiRequest } from "./client";

/** @returns {Promise<any[]>} */
export function getAllDestinations() {
  return apiRequest("/api/destinations");
}

/**
 * @param {string} slug
 * @returns {Promise<any>}
 */
export function getDestinationBySlug(slug) {
  if (!slug) {
    return Promise.reject(new Error("slug is required"));
  }

  return apiRequest(`/api/destinations/${encodeURIComponent(String(slug))}`);
}

/**
 * @param {any} payload
 * @param {string} token
 * @returns {Promise<any>}
 */
export function createDestination(payload, token) {
  return apiRequest("/api/destinations", {
    method: "POST",
    body: payload,
    token,
  });
}

/**
 * @param {string} id
 * @param {any} updates
 * @param {string} token
 * @returns {Promise<any>}
 */
export function updateDestination(id, updates, token) {
  if (!id) return Promise.reject(new Error("id is required"));

  return apiRequest(`/api/destinations/${encodeURIComponent(String(id))}`, {
    method: "PUT",
    body: updates,
    token,
  });
}

/**
 * @param {string} id
 * @param {string} token
 * @returns {Promise<{ message: string }>} */
export function deleteDestination(id, token) {
  if (!id) return Promise.reject(new Error("id is required"));

  return apiRequest(`/api/destinations/${encodeURIComponent(String(id))}`, {
    method: "DELETE",
    token,
  });
}
