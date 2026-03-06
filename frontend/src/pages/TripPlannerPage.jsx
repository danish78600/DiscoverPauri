import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import { generateTripPlan } from "../api/tripPlanner";

function cleanString(value) {
  return String(value ?? "").trim();
}

function toPositiveIntOrEmpty(value) {
  const text = String(value ?? "").trim();
  if (!text) return "";
  const n = Number(text);
  if (!Number.isFinite(n)) return "";
  const i = Math.max(1, Math.floor(n));
  return String(i);
}

function asArrayOfStrings(value) {
  if (Array.isArray(value))
    return value.map((v) => cleanString(v)).filter(Boolean);
  return [];
}

function normalizeHeading(value) {
  const text = cleanString(value).replace(/:$/, "");
  if (!text) return "";
  return text
    .split(/\s+/)
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}

function isHeadingLine(value) {
  const text = cleanString(value);
  if (!text) return false;
  if (text.endsWith(":")) return true;
  return /^(summary|day-by-day plan|day by day plan|day-by-day itinerary|itinerary|food suggestions|stay suggestions|local tips|packing list|safety notes|booking checklist|assumptions)$/i.test(
    text,
  );
}

function parsePlanText(rawText) {
  const text = cleanString(rawText);
  if (!text) {
    return { title: "Your itinerary", summary: "", sections: [] };
  }

  const lines = text.split(/\r?\n/).map((l) => l.replace(/\s+$/, ""));

  /** @type {string[][]} */
  const blocks = [];
  /** @type {string[]} */
  let current = [];

  for (const line of lines) {
    if (!cleanString(line)) {
      if (current.length) blocks.push(current);
      current = [];
      continue;
    }
    current.push(line.trim());
  }
  if (current.length) blocks.push(current);

  if (!blocks.length) {
    return { title: "Your itinerary", summary: text, sections: [] };
  }

  const firstBlock = blocks.shift() || [];
  const title = cleanString(firstBlock[0]) || "Your itinerary";
  const introLines = firstBlock.slice(1);

  let pendingHeading = "";
  let summary = introLines.length ? introLines.join(" ") : "";

  /** @type {{ heading: string, lines: string[] }[]} */
  const sections = [];

  for (const block of blocks) {
    if (!block.length) continue;

    if (block.length === 1 && isHeadingLine(block[0])) {
      pendingHeading = normalizeHeading(block[0]);
      continue;
    }

    let heading = "";
    let contentLines = block;

    if (isHeadingLine(block[0]) && block.length > 1) {
      heading = normalizeHeading(block[0]);
      contentLines = block.slice(1);
    } else if (pendingHeading) {
      heading = pendingHeading;
      pendingHeading = "";
    }

    if (!summary && /^summary$/i.test(heading)) {
      summary = contentLines.join(" ");
      continue;
    }

    sections.push({ heading, lines: contentLines });
  }

  return { title, summary, sections };
}

function renderTextLines(lines) {
  /** @type {React.ReactNode[]} */
  const nodes = [];
  /** @type {string[]} */
  let bulletBuffer = [];
  /** @type {string[]} */
  let paraBuffer = [];
  let keyCounter = 0;

  function flushPara() {
    if (!paraBuffer.length) return;
    nodes.push(
      <p
        key={`p-${keyCounter++}`}
        className="text-base leading-relaxed text-slate-700"
      >
        {paraBuffer.join(" ")}
      </p>,
    );
    paraBuffer = [];
  }

  function flushBullets() {
    if (!bulletBuffer.length) return;
    nodes.push(
      <ul
        key={`ul-${keyCounter++}`}
        className="list-disc space-y-1.5 pl-5 text-base leading-relaxed text-slate-700"
      >
        {bulletBuffer.map((b) => (
          <li key={b}>{b}</li>
        ))}
      </ul>,
    );
    bulletBuffer = [];
  }

  for (const rawLine of lines) {
    const line = cleanString(rawLine);
    if (!line) {
      flushBullets();
      flushPara();
      continue;
    }

    const bulletMatch = line.match(/^[-*•]\s+(.*)$/);
    if (bulletMatch) {
      flushPara();
      bulletBuffer.push(cleanString(bulletMatch[1]));
      continue;
    }

    const dayHeading = line.match(/^day\s*\d+\b/i);
    if (dayHeading && /:$/.test(line)) {
      flushBullets();
      flushPara();
      nodes.push(
        <p
          key={`h-${keyCounter++}`}
          className="text-base font-semibold text-slate-900"
        >
          {line.replace(/:$/, "")}
        </p>,
      );
      continue;
    }

    flushBullets();
    paraBuffer.push(line);
  }

  flushBullets();
  flushPara();
  return nodes;
}

export default function TripPlannerPage() {
  const [destination, setDestination] = useState("");
  const [from, setFrom] = useState("");
  const [startDate, setStartDate] = useState("");
  const [days, setDays] = useState("2");
  const [travelers, setTravelers] = useState("1");
  const [budget, setBudget] = useState("");
  const [pace, setPace] = useState("balanced");
  const [interests, setInterests] = useState("nature, temples, local food");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [result, setResult] = useState(null);

  const plan = useMemo(() => {
    if (!result || typeof result !== "object") return null;
    if (!("plan" in result)) return null;
    return result.plan;
  }, [result]);

  async function onSubmit(e) {
    e.preventDefault();
    if (isSubmitting) return;

    const payload = {
      destination: cleanString(destination),
      from: cleanString(from),
      startDate,
      days: cleanString(days),
      travelers: cleanString(travelers),
      budget: cleanString(budget),
      pace,
      interests: cleanString(interests),
      notes: cleanString(notes),
    };

    if (!payload.destination) {
      toast.error("Destination is required");
      return;
    }

    if (!payload.days) {
      toast.error("Trip length (days) is required");
      return;
    }

    try {
      setIsSubmitting(true);
      setResult(null);

      const data = await generateTripPlan(payload);
      setResult(data);

      toast.success("Trip plan generated");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to generate plan",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  const daysList = plan && typeof plan === "object" ? plan.days : null;
  const hasStructuredDays = Array.isArray(daysList);

  const parsedTextPlan = typeof plan === "string" ? parsePlanText(plan) : null;

  const packingList =
    plan && typeof plan === "object" ? plan.packingList : null;
  const safetyNotes =
    plan && typeof plan === "object" ? plan.safetyNotes : null;
  const bookingChecklist =
    plan && typeof plan === "object" ? plan.bookingChecklist : null;

  return (
    <div className="min-h-dvh bg-white text-slate-900">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <Link to="/" className="font-semibold tracking-tight">
            Discover Pauri
          </Link>
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
          >
            Back
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          AI Trip Planner
        </h1>
        <p className="mt-2 text-base leading-relaxed text-slate-600">
          Tell us your destination and preferences—we’ll generate a day-by-day
          plan using Gemini.
        </p>

        <form
          onSubmit={onSubmit}
          className="mt-6 rounded-2xl border border-slate-200 bg-white p-6"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="text-sm font-medium" htmlFor="destination">
                Destination
              </label>
              <input
                id="destination"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="e.g., Pauri Garhwal"
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base"
              />
            </div>

            <div>
              <label className="text-sm font-medium" htmlFor="from">
                Starting from (optional)
              </label>
              <input
                id="from"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                placeholder="e.g., Dehradun"
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base"
              />
            </div>

            <div>
              <label className="text-sm font-medium" htmlFor="startDate">
                Start date (optional)
              </label>
              <input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base"
              />
            </div>

            <div>
              <label className="text-sm font-medium" htmlFor="days">
                Trip length (days)
              </label>
              <input
                id="days"
                inputMode="numeric"
                value={days}
                onChange={(e) => setDays(toPositiveIntOrEmpty(e.target.value))}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base"
              />
            </div>

            <div>
              <label className="text-sm font-medium" htmlFor="travelers">
                Travelers
              </label>
              <input
                id="travelers"
                inputMode="numeric"
                value={travelers}
                onChange={(e) =>
                  setTravelers(toPositiveIntOrEmpty(e.target.value))
                }
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-sm font-medium" htmlFor="budget">
                Budget (optional)
              </label>
              <input
                id="budget"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="e.g., INR 15,000 (mid-range)"
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base"
              />
            </div>

            <div>
              <label className="text-sm font-medium" htmlFor="pace">
                Pace
              </label>
              <select
                id="pace"
                value={pace}
                onChange={(e) => setPace(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base"
              >
                <option value="relaxed">Relaxed</option>
                <option value="balanced">Balanced</option>
                <option value="packed">Packed</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium" htmlFor="interests">
                Interests
              </label>
              <input
                id="interests"
                value={interests}
                onChange={(e) => setInterests(e.target.value)}
                placeholder="comma-separated"
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-sm font-medium" htmlFor="notes">
                Notes (optional)
              </label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any constraints (kids, senior-friendly, must-see places, etc.)"
                rows={4}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base"
              />
            </div>
          </div>

          <div className="mt-6 flex items-center justify-end gap-2">
            <Link
              to="/"
              className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-900 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
            >
              {isSubmitting ? "Planning…" : "Generate plan"}
            </button>
          </div>
        </form>

        {plan ? (
          <section className="mt-8">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <h2 className="text-xl font-semibold">
                  {typeof plan === "object" && plan && "title" in plan
                    ? String(plan.title || "Your itinerary")
                    : parsedTextPlan
                      ? parsedTextPlan.title
                      : "Your itinerary"}
                </h2>
                {typeof plan === "string" ? (
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(plan);
                        toast.success("Copied itinerary");
                      } catch {
                        toast.error("Could not copy");
                      }
                    }}
                    className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/40 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50"
                  >
                    Copy
                  </button>
                ) : null}
              </div>
              {typeof plan === "object" && plan && "summary" in plan ? (
                <p className="mt-2 text-base leading-relaxed text-slate-700">
                  {String(plan.summary || "")}
                </p>
              ) : parsedTextPlan && parsedTextPlan.summary ? (
                <p className="mt-2 text-base leading-relaxed text-slate-700">
                  {parsedTextPlan.summary}
                </p>
              ) : null}
            </div>

            {hasStructuredDays ? (
              <div className="mt-4 grid gap-4">
                {daysList.map((d, idx) => {
                  const dayNum =
                    d && typeof d === "object" && "day" in d
                      ? String(d.day)
                      : String(idx + 1);
                  const date =
                    d && typeof d === "object" && "date" in d
                      ? cleanString(d.date)
                      : "";

                  const morning =
                    d && typeof d === "object"
                      ? asArrayOfStrings(d.morning)
                      : [];
                  const afternoon =
                    d && typeof d === "object"
                      ? asArrayOfStrings(d.afternoon)
                      : [];
                  const evening =
                    d && typeof d === "object"
                      ? asArrayOfStrings(d.evening)
                      : [];
                  const tips =
                    d && typeof d === "object"
                      ? asArrayOfStrings(d.localTips)
                      : [];

                  return (
                    <div
                      key={`${dayNum}-${date || idx}`}
                      className="rounded-2xl border border-slate-200 bg-white p-5"
                    >
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <h3 className="text-base font-semibold">
                          Day {dayNum}
                        </h3>
                        {date ? (
                          <p className="text-xs text-slate-500">{date}</p>
                        ) : null}
                      </div>

                      <div className="mt-3 grid gap-3 text-sm text-slate-700">
                        {morning.length ? (
                          <div>
                            <p className="font-medium text-slate-900">
                              Morning
                            </p>
                            <ul className="mt-1 list-disc pl-5">
                              {morning.map((x) => (
                                <li key={x}>{x}</li>
                              ))}
                            </ul>
                          </div>
                        ) : null}

                        {afternoon.length ? (
                          <div>
                            <p className="font-medium text-slate-900">
                              Afternoon
                            </p>
                            <ul className="mt-1 list-disc pl-5">
                              {afternoon.map((x) => (
                                <li key={x}>{x}</li>
                              ))}
                            </ul>
                          </div>
                        ) : null}

                        {evening.length ? (
                          <div>
                            <p className="font-medium text-slate-900">
                              Evening
                            </p>
                            <ul className="mt-1 list-disc pl-5">
                              {evening.map((x) => (
                                <li key={x}>{x}</li>
                              ))}
                            </ul>
                          </div>
                        ) : null}

                        {tips.length ? (
                          <div>
                            <p className="font-medium text-slate-900">
                              Local tips
                            </p>
                            <ul className="mt-1 list-disc pl-5">
                              {tips.map((x) => (
                                <li key={x}>{x}</li>
                              ))}
                            </ul>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : typeof plan === "string" && parsedTextPlan ? (
              <div className="mt-4 grid gap-4">
                {parsedTextPlan.sections.length ? (
                  parsedTextPlan.sections.map((section, idx) => (
                    <details
                      key={`${section.heading || "section"}-${idx}`}
                      open={
                        idx === 0 ||
                        /day\s*-?by\s*-?day|itinerary/i.test(section.heading)
                      }
                      className="group rounded-2xl border border-slate-200 bg-white p-5"
                    >
                      <summary className="cursor-pointer list-none select-none rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white">
                        <div className="flex items-center justify-between gap-3">
                          <h3 className="text-lg font-semibold text-slate-900">
                            {section.heading || "Details"}
                          </h3>
                          <span className="text-sm font-medium text-slate-500 group-open:hidden">
                            Expand
                          </span>
                          <span className="text-sm font-medium text-slate-500 hidden group-open:inline">
                            Collapse
                          </span>
                        </div>
                      </summary>
                      <div className="mt-3 space-y-3">
                        {renderTextLines(section.lines)}
                      </div>
                    </details>
                  ))
                ) : (
                  <div className="rounded-2xl border border-slate-200 bg-white p-5">
                    <pre className="whitespace-pre-wrap text-sm text-slate-800">
                      {plan}
                    </pre>
                  </div>
                )}
              </div>
            ) : (
              <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-5">
                <pre className="whitespace-pre-wrap text-sm text-slate-800">
                  {JSON.stringify(plan, null, 2)}
                </pre>
              </div>
            )}

            {asArrayOfStrings(packingList).length ? (
              <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
                <h3 className="text-base font-semibold">Packing list</h3>
                <ul className="mt-2 list-disc pl-5 text-sm text-slate-700">
                  {asArrayOfStrings(packingList).map((x) => (
                    <li key={x}>{x}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            {asArrayOfStrings(safetyNotes).length ? (
              <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-5">
                <h3 className="text-base font-semibold">Safety notes</h3>
                <ul className="mt-2 list-disc pl-5 text-sm text-slate-700">
                  {asArrayOfStrings(safetyNotes).map((x) => (
                    <li key={x}>{x}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            {asArrayOfStrings(bookingChecklist).length ? (
              <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-5">
                <h3 className="text-base font-semibold">Booking checklist</h3>
                <ul className="mt-2 list-disc pl-5 text-sm text-slate-700">
                  {asArrayOfStrings(bookingChecklist).map((x) => (
                    <li key={x}>{x}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </section>
        ) : isSubmitting ? (
          <section className="mt-8">
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <h2 className="text-xl font-semibold">Generating…</h2>
              <p className="mt-2 text-base leading-relaxed text-slate-700">
                Planning your itinerary…
              </p>
            </div>
          </section>
        ) : null}
      </main>
    </div>
  );
}
