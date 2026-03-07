export default function StepPill({
  steps,
  currentStep = 1,
  tone = "dark", // dark | light
  className = "",
}) {
  const safeSteps = Array.isArray(steps) ? steps : [];
  const isLight = tone === "light";

  return (
    <div
      className={
        "inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium backdrop-blur-xl " +
        (isLight
          ? "border border-slate-200 bg-white text-slate-700"
          : "border border-white/15 bg-white/10 text-white/85") +
        className
      }
    >
      {safeSteps.map((label, idx) => {
        const stepNumber = idx + 1;
        const active = stepNumber === currentStep;
        const done = stepNumber < currentStep;

        const badgeClassName = isLight
          ? done
            ? "bg-slate-100 text-slate-700"
            : active
              ? "bg-slate-900 text-white"
              : "bg-slate-50 text-slate-500"
          : done
            ? "bg-white/20 text-white"
            : active
              ? "bg-white text-slate-900"
              : "bg-white/10 text-white/70";

        const labelClassName = isLight
          ? active
            ? "text-slate-900"
            : "text-slate-600"
          : active
            ? "text-white"
            : "text-white/70";

        const dividerClassName = isLight ? "bg-slate-200" : "bg-white/15";

        return (
          <div key={label} className="inline-flex items-center gap-2">
            <span
              className={
                "grid h-5 w-5 place-items-center rounded-full text-[11px] font-semibold " +
                badgeClassName
              }
              aria-hidden="true"
            >
              {stepNumber}
            </span>
            <span className={labelClassName}>{label}</span>
            {idx !== safeSteps.length - 1 ? (
              <span
                className={"h-px w-6 " + dividerClassName}
                aria-hidden="true"
              />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
