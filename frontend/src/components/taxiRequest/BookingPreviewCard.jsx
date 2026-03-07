export default function BookingPreviewCard({
  title,
  subtitle,
  icon,
  children,
  tone = "dark", // dark | light
  className = "",
}) {
  const Icon = icon;
  const isLight = tone === "light";

  return (
    <div
      className={
        "rounded-2xl border p-4 shadow-sm backdrop-blur-xl " +
        (isLight
          ? "border-slate-200 bg-white text-slate-900"
          : "border-white/15 bg-white/10 text-white/90") +
        className
      }
    >
      <div className="flex items-start gap-3">
        {Icon ? (
          <div
            className={
              "mt-0.5 rounded-xl border p-2 " +
              (isLight
                ? "border-slate-200 bg-slate-50"
                : "border-white/15 bg-white/10")
            }
          >
            <Icon
              className={
                "h-5 w-5 " + (isLight ? "text-indigo-600" : "text-white/85")
              }
              aria-hidden="true"
            />
          </div>
        ) : null}

        <div className="min-w-0">
          <p
            className={
              "text-sm font-semibold " +
              (isLight ? "text-slate-900" : "text-white/95")
            }
          >
            {title}
          </p>
          {subtitle ? (
            <p
              className={
                "mt-0.5 text-xs leading-relaxed " +
                (isLight ? "text-slate-600" : "text-white/70")
              }
            >
              {subtitle}
            </p>
          ) : null}
        </div>
      </div>

      {children ? <div className="mt-3">{children}</div> : null}
    </div>
  );
}
