import { Copy, Save } from "lucide-react";
import toast from "react-hot-toast";
import { useMemo } from "react";

function cleanString(value) {
  return String(value ?? "").trim();
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

function TimelineItem({ title, meta, children }) {
  return (
    <div className="relative flex gap-4">
      <div className="relative">
        <div className="mt-1 h-3.5 w-3.5 rounded-full bg-gradient-to-r from-indigo-600 to-cyan-500 shadow-sm" />
        <div className="absolute left-1/2 top-5 h-[calc(100%+16px)] w-px -translate-x-1/2 bg-slate-200" />
      </div>

      <div className="min-w-0 flex-1 pb-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="text-sm font-semibold text-slate-900">{title}</p>
          {meta ? (
            <p className="text-xs font-medium text-slate-500">{meta}</p>
          ) : null}
        </div>
        <div className="mt-2 text-sm text-slate-700">{children}</div>
      </div>
    </div>
  );
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
      <p key={`p-${keyCounter++}`} className="leading-relaxed">
        {paraBuffer.join(" ")}
      </p>,
    );
    paraBuffer = [];
  }

  function flushBullets() {
    if (!bulletBuffer.length) return;
    nodes.push(
      <ul key={`ul-${keyCounter++}`} className="list-disc space-y-1 pl-5">
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
        <p key={`h-${keyCounter++}`} className="font-semibold text-slate-900">
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

export default function PlanTimeline({
  plan,
  isSaving,
  savedTripId,
  onSave,
  showCopy,
}) {
  const textPlan = useMemo(() => {
    if (typeof plan !== "string") return null;
    return parsePlanText(plan);
  }, [plan]);

  const daysList = plan && typeof plan === "object" ? plan.days : null;
  const hasStructuredDays = Array.isArray(daysList);

  const packingList =
    plan && typeof plan === "object" ? plan.packingList : null;
  const safetyNotes =
    plan && typeof plan === "object" ? plan.safetyNotes : null;
  const bookingChecklist =
    plan && typeof plan === "object" ? plan.bookingChecklist : null;

  const title =
    typeof plan === "object" && plan && "title" in plan
      ? String(plan.title || "Your itinerary")
      : textPlan
        ? textPlan.title
        : "Your itinerary";

  const summary =
    typeof plan === "object" && plan && "summary" in plan
      ? cleanString(plan.summary)
      : textPlan
        ? cleanString(textPlan.summary)
        : "";

  return (
    <section className="rounded-3xl border border-white/50 bg-white/70 p-5 shadow-sm backdrop-blur-xl supports-backdrop-filter:bg-white/60 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-xl font-semibold tracking-tight text-slate-900">
            {title}
          </h2>
          {summary ? (
            <p className="mt-1 text-sm leading-relaxed text-slate-600">
              {summary}
            </p>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2">
          <button
            type="button"
            onClick={onSave}
            disabled={isSaving || Boolean(savedTripId)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-70"
          >
            <Save className="h-4 w-4" aria-hidden="true" />
            {savedTripId ? "Saved" : isSaving ? "Saving…" : "Save"}
          </button>

          {showCopy && typeof plan === "string" ? (
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
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              <Copy className="h-4 w-4" aria-hidden="true" />
              Copy
            </button>
          ) : null}
        </div>
      </div>

      <div className="mt-6">
        {hasStructuredDays ? (
          <div>
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
                d && typeof d === "object" ? asArrayOfStrings(d.morning) : [];
              const afternoon =
                d && typeof d === "object" ? asArrayOfStrings(d.afternoon) : [];
              const evening =
                d && typeof d === "object" ? asArrayOfStrings(d.evening) : [];
              const tips =
                d && typeof d === "object" ? asArrayOfStrings(d.localTips) : [];

              return (
                <TimelineItem
                  key={`${dayNum}-${date || idx}`}
                  title={`Day ${dayNum}`}
                  meta={date}
                >
                  <div className="space-y-3">
                    {morning.length ? (
                      <div>
                        <p className="font-medium text-slate-900">Morning</p>
                        <ul className="mt-1 list-disc space-y-1 pl-5">
                          {morning.map((x) => (
                            <li key={x}>{x}</li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                    {afternoon.length ? (
                      <div>
                        <p className="font-medium text-slate-900">Afternoon</p>
                        <ul className="mt-1 list-disc space-y-1 pl-5">
                          {afternoon.map((x) => (
                            <li key={x}>{x}</li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                    {evening.length ? (
                      <div>
                        <p className="font-medium text-slate-900">Evening</p>
                        <ul className="mt-1 list-disc space-y-1 pl-5">
                          {evening.map((x) => (
                            <li key={x}>{x}</li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                    {tips.length ? (
                      <div>
                        <p className="font-medium text-slate-900">Local tips</p>
                        <ul className="mt-1 list-disc space-y-1 pl-5">
                          {tips.map((x) => (
                            <li key={x}>{x}</li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                  </div>
                </TimelineItem>
              );
            })}
            <div className="h-2" />
          </div>
        ) : typeof plan === "string" && textPlan ? (
          <div>
            {textPlan.sections.length ? (
              <div>
                {textPlan.sections.map((s, idx) => (
                  <TimelineItem
                    key={`${s.heading || "section"}-${idx}`}
                    title={s.heading || "Details"}
                  >
                    <div className="space-y-2">{renderTextLines(s.lines)}</div>
                  </TimelineItem>
                ))}
                <div className="h-2" />
              </div>
            ) : (
              <pre className="whitespace-pre-wrap text-sm text-slate-800">
                {plan}
              </pre>
            )}
          </div>
        ) : (
          <pre className="whitespace-pre-wrap text-sm text-slate-800">
            {JSON.stringify(plan, null, 2)}
          </pre>
        )}
      </div>

      {asArrayOfStrings(packingList).length ? (
        <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-semibold text-slate-900">Packing list</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
            {asArrayOfStrings(packingList).map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {asArrayOfStrings(safetyNotes).length ? (
        <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-semibold text-slate-900">Safety notes</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
            {asArrayOfStrings(safetyNotes).map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {asArrayOfStrings(bookingChecklist).length ? (
        <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-semibold text-slate-900">
            Booking checklist
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
            {asArrayOfStrings(bookingChecklist).map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
