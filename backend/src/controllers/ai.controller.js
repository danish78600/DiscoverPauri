import { GoogleGenerativeAI } from "@google/generative-ai";

function cleanString(value) {
  return String(value ?? "").trim();
}

function toPositiveIntOrNull(value) {
  const text = String(value ?? "").trim();
  if (!text) return null;
  const n = Number(text);
  if (!Number.isFinite(n)) return null;
  const i = Math.max(1, Math.floor(n));
  return i;
}

function toIntInRange(value, { min, max, fallback }) {
  const n = toPositiveIntOrNull(value);
  if (!n) return fallback;
  return Math.max(min, Math.min(max, n));
}

function buildPrompt(payload) {
  const from = cleanString(payload.from || payload.origin);
  const destination = cleanString(payload.destination || payload.to);
  const startDate = cleanString(payload.startDate);
  const endDate = cleanString(payload.endDate);
  const days = toPositiveIntOrNull(payload.days);
  const travelers = toPositiveIntOrNull(payload.travelers);
  const budget = cleanString(payload.budget);
  const pace = cleanString(payload.pace);
  const interests = Array.isArray(payload.interests)
    ? payload.interests.map(cleanString).filter(Boolean)
    : cleanString(payload.interests);
  const notes = cleanString(payload.notes);

  const interestsText = Array.isArray(interests)
    ? interests.join(", ")
    : interests;

  const tripWindowLines = [
    startDate ? `Start date: ${startDate}` : null,
    endDate ? `End date: ${endDate}` : null,
    days ? `Trip length (days): ${days}` : null,
  ].filter(Boolean);

  const travelerLines = [
    from ? `Starting from: ${from}` : null,
    travelers ? `Number of travelers: ${travelers}` : null,
    budget ? `Budget: ${budget}` : null,
    pace ? `Pace: ${pace}` : null,
    interestsText ? `Interests: ${interestsText}` : null,
    notes ? `Notes/constraints: ${notes}` : null,
  ].filter(Boolean);

  return [
    "You are an expert trip planner.",
    "Create a practical, realistic itinerary with local tips.",
    "Return plain readable text (no JSON, no markdown code fences).",
    "Use short headings and bullet points.",
    "",
    "Trip details:",
    `Destination: ${destination || "(missing)"}`,
    ...tripWindowLines,
    ...travelerLines,
    "",
    "Format:",
    "Title",
    "Summary (2-4 lines)",
    "Day-by-day plan:",
    "- Day 1: Morning / Afternoon / Evening",
    "- Day 2: Morning / Afternoon / Evening",
    "Food suggestions",
    "Stay suggestions",
    "Local tips",
    "Packing list",
    "Safety notes",
    "Booking checklist",
  ].join("\n");
}

function wantsEventStream(req) {
  const accept = cleanString(req.headers?.accept);
  if (accept.includes("text/event-stream")) return true;
  const streamQuery = cleanString(req.query?.stream);
  return streamQuery === "1" || streamQuery.toLowerCase() === "true";
}

function writeSse(res, { event, data }) {
  if (event) res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(data ?? {})}\n\n`);
}

export async function generateTripPlan(req, res) {
  console.log("🔥 generateTripPlan API HIT");
  try {
    const apiKey = cleanString(process.env.GEMINI_API_KEY);
    if (!apiKey) {
      return res
        .status(500)
        .json({ message: "GEMINI_API_KEY is not configured on the server" });
    }

    const timeoutMs = toIntInRange(process.env.GEMINI_TIMEOUT_MS, {
      min: 5000,
      max: 180000,
      fallback: 90000,
    });

    const payload = req.body || {};
    const destination = cleanString(payload.destination || payload.to);
    if (!destination) {
      return res.status(400).json({ message: "destination is required" });
    }

    const maxOutputTokens = toIntInRange(process.env.GEMINI_MAX_OUTPUT_TOKENS, {
      min: 256,
      max: 4096,
      fallback: 4096,
    });

    const prompt = buildPrompt(payload);
    const modelName =
      cleanString(process.env.GEMINI_MODEL) || "gemini-2.5-flash";

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: modelName,
      generationConfig: {
        temperature: 0.5,
        maxOutputTokens,
      },
    });

    if (wantsEventStream(req)) {
      res.status(200);
      res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
      res.setHeader("Cache-Control", "no-cache, no-transform");
      res.setHeader("Connection", "keep-alive");
      // Helps some proxies/CDNs avoid buffering SSE.
      res.setHeader("X-Accel-Buffering", "no");
      res.flushHeaders?.();

      writeSse(res, {
        event: "meta",
        data: { model: modelName, maxOutputTokens },
      });

      let fullText = "";
      let clientClosed = false;
      let timedOut = false;

      const timeoutId = setTimeout(() => {
        timedOut = true;
        clientClosed = true;
        try {
          writeSse(res, {
            event: "error",
            data: {
              message: `Timed out after ${Math.ceil(timeoutMs / 1000)}s`,
            },
          });
        } catch {
          // ignore
        }

        try {
          res.end();
        } catch {
          // ignore
        }
      }, timeoutMs);

      req.on("close", () => {
        clientClosed = true;
        clearTimeout(timeoutId);
      });

      try {
        const result = await model.generateContentStream(prompt);

        // eslint-disable-next-line no-restricted-syntax
        for await (const chunk of result.stream) {
          if (clientClosed || timedOut) break;
          const delta = chunk?.text?.() || "";
          if (!delta) continue;
          fullText += delta;
          writeSse(res, { event: "delta", data: { delta } });
        }

        clearTimeout(timeoutId);

        if (!clientClosed && !timedOut) {
          writeSse(res, { event: "done", data: { text: fullText.trim() } });
          res.end();
        }
      } catch (streamErr) {
        console.error(streamErr);
        clearTimeout(timeoutId);
        if (!clientClosed) {
          writeSse(res, {
            event: "error",
            data: { message: "Failed to generate trip plan" },
          });
          res.end();
        }
      }

      return;
    }

    let genTimeoutId;
    const timeoutPromise = new Promise((_, reject) => {
      genTimeoutId = setTimeout(
        () => reject(new Error("Timed out")),
        timeoutMs,
      );
    });

    let result;
    try {
      result = await Promise.race([
        model.generateContent(prompt),
        timeoutPromise,
      ]);
    } finally {
      if (genTimeoutId) clearTimeout(genTimeoutId);
    }
    const text = (result?.response?.text?.() || "").trim();

    return res.status(200).json({
      plan: text || `Trip plan for ${destination} (no output received)`,
    });
  } catch (err) {
    console.error(err);
    if (String(err?.message || "") === "Timed out") {
      return res
        .status(504)
        .json({ message: "Trip plan generation timed out. Please try again." });
    }
    return res.status(500).json({ message: "Failed to generate trip plan" });
  }
}
