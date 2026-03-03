import { apiRequest } from "./client";

function toQuery(params) {
  const entries = Object.entries(params || {}).filter(([, v]) => v != null);
  if (!entries.length) return "";

  const qs = entries
    .map(
      ([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`,
    )
    .join("&");
  return qs ? `?${qs}` : "";
}

export function getApprovedReviews({ targetType, targetId }) {
  return apiRequest(
    `/api/reviews/approved${toQuery({ targetType, targetId })}`,
  );
}

export function submitReview(payload, token) {
  return apiRequest("/api/reviews", {
    method: "POST",
    body: payload,
    token,
  });
}

export function getPendingReviews(token, params) {
  return apiRequest(`/api/reviews/pending${toQuery(params)}`, { token });
}

export function approveReview(id, token) {
  return apiRequest(`/api/reviews/${encodeURIComponent(String(id))}/approve`, {
    method: "PATCH",
    token,
  });
}

export function rejectReview(id, token, reason) {
  const body = reason != null && String(reason).trim() ? { reason } : undefined;

  return apiRequest(`/api/reviews/${encodeURIComponent(String(id))}/reject`, {
    method: "PATCH",
    body,
    token,
  });
}
