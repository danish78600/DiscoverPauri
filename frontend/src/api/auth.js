import { apiRequest } from "./client";

/**
 * @param {{ name: string, email: string, password: string }} payload
 * @returns {Promise<{ token: string, user: unknown }>}
 */
export function signup(payload) {
  return apiRequest("/api/auth/signup", {
    method: "POST",
    body: payload,
  });
}

/**
 * @param {{ email: string, password: string }} payload
 * @returns {Promise<{ token: string, user: unknown }>}
 */
export function login(payload) {
  return apiRequest("/api/auth/login", {
    method: "POST",
    body: payload,
  });
}

/**
 * @param {string} token
 * @returns {Promise<{ message: string }>}
 */
export function logout(token) {
  return apiRequest("/api/auth/logout", {
    method: "POST",
    token,
  });
}
