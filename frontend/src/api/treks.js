import { apiRequest } from "./client";

/** @returns {Promise<any[]>} */
export function getAllTreks() {
  return apiRequest("/api/treks");
}

/**
 * @param {string} slug
 * @returns {Promise<any>}
 */
export function getTrekBySlug(slug) {
  if (!slug) {
    return Promise.reject(new Error("slug is required"));
  }

  return apiRequest(`/api/treks/${encodeURIComponent(String(slug))}`);
}

/**
 * @param {any} payload
 * @param {string} token
 * @returns {Promise<any>}
 */
export function createTrek(payload, token) {
  return apiRequest("/api/treks", { method: "POST", body: payload, token });
}

/**
 * @param {string} id
 * @param {any} updates
 * @param {string} token
 * @returns {Promise<any>}
 */
export function updateTrek(id, updates, token) {
  if (!id) return Promise.reject(new Error("id is required"));
  return apiRequest(`/api/treks/${encodeURIComponent(String(id))}`, {
    method: "PUT",
    body: updates,
    token,
  });
}

/**
 * @param {string} id
 * @param {string} token
 * @returns {Promise<{ message: string }>} */
export function deleteTrek(id, token) {
  if (!id) return Promise.reject(new Error("id is required"));
  return apiRequest(`/api/treks/${encodeURIComponent(String(id))}`, {
    method: "DELETE",
    token,
  });
}
