import { useId } from "react";

function clamp(value, min, max) {
  const n = Number(value);
  if (!Number.isFinite(n)) return min;
  return Math.min(max, Math.max(min, n));
}

export default function StarRating({
  value,
  className = "",
  size = "sm", // sm | md
  title,
}) {
  const safe = clamp(value, 0, 5);
  const rounded = Math.round(safe * 2) / 2;

  const starSize = size === "md" ? "h-5 w-5" : "h-4 w-4";
  const id = useId();

  return (
    <div
      className={`inline-flex items-center gap-0.5 ${className}`.trim()}
      aria-label={
        title ||
        (Number.isFinite(Number(value))
          ? `${safe.toFixed(1)} out of 5`
          : "Rating")
      }
      title={title}
    >
      {Array.from({ length: 5 }).map((_, i) => {
        const fillState =
          rounded >= i + 1 ? "full" : rounded >= i + 0.5 ? "half" : "empty";
        const clipId = `${id}-clip-${i}`;

        return (
          <svg
            key={i}
            viewBox="0 0 20 20"
            className={`${starSize} shrink-0`}
            role="img"
            aria-hidden="true"
          >
            <defs>
              <clipPath id={clipId}>
                <rect x="0" y="0" width="10" height="20" />
              </clipPath>
            </defs>

            <path
              d="M10 1.5l2.6 5.27 5.82.85-4.21 4.11.99 5.8L10 14.77l-5.2 2.73.99-5.8-4.21-4.11 5.82-.85L10 1.5z"
              className="fill-slate-200"
            />

            {fillState === "full" ? (
              <path
                d="M10 1.5l2.6 5.27 5.82.85-4.21 4.11.99 5.8L10 14.77l-5.2 2.73.99-5.8-4.21-4.11 5.82-.85L10 1.5z"
                className="fill-amber-400"
              />
            ) : null}

            {fillState === "half" ? (
              <path
                d="M10 1.5l2.6 5.27 5.82.85-4.21 4.11.99 5.8L10 14.77l-5.2 2.73.99-5.8-4.21-4.11 5.82-.85L10 1.5z"
                className="fill-amber-400"
                clipPath={`url(#${clipId})`}
              />
            ) : null}

            <path
              d="M10 1.5l2.6 5.27 5.82.85-4.21 4.11.99 5.8L10 14.77l-5.2 2.73.99-5.8-4.21-4.11 5.82-.85L10 1.5z"
              className="fill-transparent stroke-slate-300"
              strokeWidth="0.7"
            />
          </svg>
        );
      })}
    </div>
  );
}
