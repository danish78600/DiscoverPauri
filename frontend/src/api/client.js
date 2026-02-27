const DEFAULT_API_BASE_URL = "https://discoverpauri-backend.onrender.com";

export class ApiError extends Error {
  /** @param {{ message: string, status: number, data?: unknown }} args */
  constructor({ message, status, data }) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

function getApiBaseUrl() {
  const value = import.meta.env.VITE_API_URL;
  const base = value ? String(value) : DEFAULT_API_BASE_URL;
  return base.replace(/\/$/, "");
}

export { getApiBaseUrl };

/**
 * @param {string} path
 * @param {{
 *  method?: string,
 *  body?: unknown,
 *  token?: string | null,
 *  headers?: Record<string, string>
 * }} [options]
 */
export async function apiRequest(path, options = {}) {
  const url = `${getApiBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`;
  const method = options.method || "GET";

  /** @type {Record<string, string>} */
  const headers = {
    ...(options.headers || {}),
  };

  let body;
  if (options.body !== undefined) {
    headers["Content-Type"] = headers["Content-Type"] || "application/json";
    body = JSON.stringify(options.body);
  }

  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`;
  }

  const res = await fetch(url, { method, headers, body });

  const contentType = res.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  const data = isJson
    ? await res.json().catch(() => null)
    : await res.text().catch(() => "");

  if (!res.ok) {
    const message =
      (data &&
        typeof data === "object" &&
        "message" in data &&
        String(data.message)) ||
      (typeof data === "string" && data) ||
      `Request failed (${res.status})`;

    throw new ApiError({ message, status: res.status, data });
  }

  return data;
}
