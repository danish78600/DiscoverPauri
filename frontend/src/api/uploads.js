import { ApiError, getApiBaseUrl } from "./client";

/**
 * @param {File} file
 * @param {string} token
 * @returns {Promise<{ url: string, filename: string }>} */
export async function uploadImage(file, token) {
  if (!file) {
    throw new Error("file is required");
  }

  if (!token) {
    throw new Error("token is required");
  }

  const base = getApiBaseUrl();
  const url = `${base}/api/uploads`;

  const form = new FormData();
  form.append("file", file);

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: form,
  });

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
