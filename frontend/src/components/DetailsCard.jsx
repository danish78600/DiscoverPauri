import StarRating from "./StarRating";

function cleanString(value) {
  return String(value ?? "").trim();
}

function InfoRow({ icon: Icon, label, value }) {
  const text = cleanString(value);
  if (!text) return null;

  const iconNode =
    typeof Icon === "function" ? Icon({ className: "h-4 w-4" }) : null;

  return (
    <div className="group flex items-start gap-3 rounded-xl px-3 py-2 transition-colors hover:bg-white/60">
      <div className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-white/40 bg-white/50 text-slate-700 shadow-sm">
        {iconNode}
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
          {label}
        </p>
        <p className="mt-0.5 text-sm font-medium text-slate-900">{text}</p>
      </div>
    </div>
  );
}

function IconLocation(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M12 21s7-6.16 7-12a7 7 0 1 0-14 0c0 5.84 7 12 7 12Z"
        className="stroke-current"
        strokeWidth="1.8"
      />
      <path
        d="M12 12.2a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"
        className="stroke-current"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function IconCalendar(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M7 3v3M17 3v3M4.5 8.5h15"
        className="stroke-current"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M6.5 5.5h11a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-11a2 2 0 0 1-2-2v-12a2 2 0 0 1 2-2Z"
        className="stroke-current"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function IconTicket(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M4.5 9.5a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v1a2 2 0 0 0 0 4v1a2 2 0 0 1-2 2h-11a2 2 0 0 1-2-2v-1a2 2 0 1 0 0-4v-1Z"
        className="stroke-current"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M12 8.5v10"
        className="stroke-current"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeDasharray="2.2 2.2"
      />
    </svg>
  );
}

function IconClock(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z"
        className="stroke-current"
        strokeWidth="1.8"
      />
      <path
        d="M12 7v5l3 2"
        className="stroke-current"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconStar(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M12 3l2.7 5.47 6.03.88-4.36 4.25 1.03 6.01L12 16.78l-5.4 2.83 1.03-6.01-4.36-4.25 6.03-.88L12 3Z"
        className="stroke-current"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function DetailsCard({
  destination,
  locationText,
  bestTimeText,
}) {
  const entryFee = cleanString(destination?.entryFee);
  const timing = cleanString(destination?.timing);
  const howToReach = cleanString(destination?.howToReach);

  const avg =
    typeof destination?.averageRating === "number"
      ? destination.averageRating
      : null;
  const totalReviews =
    typeof destination?.totalReviews === "number"
      ? destination.totalReviews
      : null;

  return (
    <section className="rounded-3xl border border-white/40 bg-white/60 p-5 shadow-sm backdrop-blur supports-backdrop-filter:bg-white/50 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold tracking-tight text-slate-900">
            Details
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Quick facts for planning
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-1">
        <InfoRow icon={IconLocation} label="Location" value={locationText} />
        <InfoRow icon={IconCalendar} label="Best time" value={bestTimeText} />
        <InfoRow icon={IconTicket} label="Entry fee" value={entryFee} />
        <InfoRow icon={IconClock} label="Timing" value={timing} />

        {avg != null ? (
          <div className="group flex items-start gap-3 rounded-xl px-3 py-2 transition-colors hover:bg-white/60">
            <div className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-white/40 bg-white/50 text-slate-700 shadow-sm">
              <IconStar className="h-4 w-4" />
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Rating
              </p>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <StarRating value={avg} />
                <p className="text-sm font-medium text-slate-900">
                  {avg.toFixed(1)}
                  {totalReviews ? (
                    <span className="text-slate-500"> ({totalReviews})</span>
                  ) : null}
                </p>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {howToReach ? (
        <div className="mt-5 rounded-2xl border border-white/40 bg-white/40 p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900">How to reach</h3>
          <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-700">
            {howToReach}
          </p>
        </div>
      ) : null}
    </section>
  );
}
