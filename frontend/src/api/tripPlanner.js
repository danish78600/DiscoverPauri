import { ApiError, apiRequest, getApiBaseUrl } from "./client";

/**
 * @param {{
 *  destination: string,
 *  from?: string,
 *  startDate?: string,
 *  endDate?: string,
 *  days?: number | string,
 *  travelers?: number | string,
 *  budget?: string,
 *  pace?: string,
 *  interests?: string | string[],
 *  notes?: string,
 * }} payload
 */
export async function generateTripPlan(payload) {
  return apiRequest("/api/ai/trip-plan", {
    method: "POST",
    body: payload,
  });
}

function buildUrl(path) {
  const base = getApiBaseUrl();
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

/**
 * Streams the plan using Server-Sent Events (SSE).
 *
 * @param {unknown} payload
 * @param {{
 *  onDelta?: (delta: string) => void,
 *  onDone?: (fullText: string) => void,
 *  onError?: (message: string) => void,
 * }} [handlers]
 */
export async function generateTripPlanStream(payload, handlers = {}) {
  const url = buildUrl("/api/ai/trip-plan");

  const timeoutMs =
    handlers && typeof handlers === "object" && "timeoutMs" in handlers
      ? Number(handlers.timeoutMs)
      : 90000;
  const controller = new AbortController();
  const timeoutId = Number.isFinite(timeoutMs)
    ? setTimeout(() => controller.abort(), Math.max(1, timeoutMs))
    : null;

  let res;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "text/event-stream",
      },
      body: JSON.stringify(payload ?? {}),
      signal: controller.signal,
    });
  } catch (err) {
    if (controller.signal.aborted) {
      throw new Error("Trip plan generation timed out. Please try again.");
    }
    throw err;
  }

  const contentType = res.headers.get("content-type") || "";
  if (!res.ok) {
    const data = contentType.includes("application/json")
      ? await res.json().catch(() => null)
      : await res.text().catch(() => "");

    const message =
      (data &&
        typeof data === "object" &&
        "message" in data &&
        String(data.message)) ||
      (typeof data === "string" && data) ||
      `Request failed (${res.status})`;

    throw new ApiError({ message, status: res.status, data });
  }

  if (!res.body) {
    throw new Error("Streaming response not supported by the browser");
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();

  let buffer = "";
  let fullText = "";
  let doneReceived = false;

  function handleEventBlock(block) {
    const lines = String(block).split("\n");
    let event = "message";
    /** @type {string[]} */
    const dataLines = [];

    for (const line of lines) {
      if (!line) continue;
      if (line.startsWith("event:")) {
        event = line.slice("event:".length).trim() || event;
        continue;
      }
      if (line.startsWith("data:")) {
        dataLines.push(line.slice("data:".length).trim());
      }
    }

    const dataText = dataLines.join("\n").trim();
    if (!dataText) return;

    let data;
    try {
      data = JSON.parse(dataText);
    } catch {
      data = { text: dataText };
    }

    if (event === "delta") {
      const delta =
        data && typeof data === "object" ? String(data.delta || "") : "";
      if (delta) {
        fullText += delta;
        handlers.onDelta?.(delta);
      }
      return;
    }

    if (event === "done") {
      const text =
        data && typeof data === "object" ? String(data.text || "") : "";
      if (text) fullText = text;
      doneReceived = true;
      handlers.onDone?.(fullText);
      return;
    }

    if (event === "error") {
      const message =
        data && typeof data === "object" ? String(data.message || "") : "";
      const finalMessage = message || "Streaming failed";
      handlers.onError?.(finalMessage);
      throw new Error(finalMessage);
    }
  }

  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      let idx;
      // Parse SSE blocks separated by blank line
      while ((idx = buffer.indexOf("\n\n")) !== -1) {
        const block = buffer.slice(0, idx);
        buffer = buffer.slice(idx + 2);
        handleEventBlock(block);
      }
    }

    if (buffer.trim()) {
      handleEventBlock(buffer);
    }

    // If server closed without a done event, still finish.
    if (!doneReceived) handlers.onDone?.(fullText);
  } catch (err) {
    if (controller.signal.aborted) {
      throw new Error("Trip plan generation timed out. Please try again.");
    }
    throw err;
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
    try {
      await reader.cancel();
    } catch {
      // ignore
    }
  }
}
