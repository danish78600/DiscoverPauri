import StarRating from "./StarRating";

function cleanString(value) {
  return String(value ?? "").trim();
}

function formatReviewDate(value) {
  const d = value ? new Date(value) : null;
  if (!d || Number.isNaN(d.getTime())) return "";

  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function initials(name) {
  const text = cleanString(name);
  if (!text) return "U";

  const parts = text.split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] || "U";
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0] : "";
  return (first + last).toUpperCase();
}

export default function ReviewCard({ review }) {
  const name = cleanString(review?.user?.name) || "User";
  const date = formatReviewDate(review?.createdAt);
  const rating =
    typeof review?.rating === "number" ? review.rating : Number(review?.rating);
  const text = cleanString(review?.text);

  return (
    <article className="group rounded-2xl border border-slate-200/70 bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md sm:p-5">
      <div className="flex items-start gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-700">
          {initials(name)}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="truncate text-sm font-semibold text-slate-900">
              {name}
            </p>
            {date ? (
              <p className="text-xs font-medium text-slate-500">{date}</p>
            ) : null}
          </div>

          <div className="mt-1 flex flex-wrap items-center gap-2">
            <StarRating value={rating} />
            {Number.isFinite(Number(rating)) ? (
              <p className="text-xs font-medium text-slate-600">
                {Number(rating).toFixed(1)}
              </p>
            ) : null}
          </div>
        </div>
      </div>

      {text ? (
        <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-slate-700">
          {text}
        </p>
      ) : null}
    </article>
  );
}
