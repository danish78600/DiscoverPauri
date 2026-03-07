import { useId, useMemo } from "react";

function cleanString(value) {
  return String(value ?? "").trim();
}

export default function BookingSelect({
  id,
  label,
  value,
  onChange,
  options,
  helperText,
  errorText,
  icon,
  required = false,
  disabled = false,
  className = "",
}) {
  const autoId = useId();
  const selectId = id || autoId;
  const hasValue = cleanString(value) !== "";
  const hasError = Boolean(errorText);

  const iconNode = useMemo(() => {
    if (typeof icon !== "function") return null;
    return icon({
      className:
        "h-5 w-5 text-slate-500 transition-colors group-focus-within:text-indigo-600",
      "aria-hidden": true,
    });
  }, [icon]);

  return (
    <div className={`w-full ${className}`.trim()}>
      <div
        className={
          "group relative rounded-2xl bg-gradient-to-r p-[1px] transition-all duration-200 " +
          (hasError
            ? "from-rose-300 to-rose-300 hover:from-rose-400 hover:to-rose-400 focus-within:from-rose-500 focus-within:to-rose-400"
            : "from-slate-200 to-slate-200 hover:from-slate-300 hover:to-slate-300 focus-within:from-indigo-500 focus-within:to-violet-400")
        }
      >
        <div className="relative rounded-2xl bg-white/70 px-3 py-2.5 shadow-sm backdrop-blur-xl supports-backdrop-filter:bg-white/60">
          <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
            {iconNode}
          </div>

          <select
            id={selectId}
            value={value}
            onChange={onChange}
            required={required}
            disabled={disabled}
            aria-invalid={hasError ? "true" : undefined}
            className="peer block h-11 w-full appearance-none bg-transparent pl-9 pr-9 text-sm text-slate-900 outline-none disabled:cursor-not-allowed disabled:opacity-60"
          >
            {(Array.isArray(options) ? options : []).map((opt) => (
              <option key={String(opt.value)} value={String(opt.value)}>
                {opt.label}
              </option>
            ))}
          </select>

          <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">
            <svg viewBox="0 0 20 20" className="h-4 w-4" aria-hidden="true">
              <path
                d="M5 7l5 6 5-6"
                className="stroke-current"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          <label
            htmlFor={selectId}
            className={
              "pointer-events-none absolute left-12 top-3 text-xs font-medium transition-all duration-200 " +
              (hasError ? "text-rose-700" : "text-slate-700") +
              (hasValue ? "" : " opacity-90 group-focus-within:opacity-100")
            }
          >
            {label}
            {required ? " *" : ""}
          </label>
        </div>
      </div>

      {errorText ? (
        <p className="mt-1.5 text-xs leading-relaxed text-rose-700">
          {errorText}
        </p>
      ) : helperText ? (
        <p className="mt-1.5 text-xs leading-relaxed text-slate-500">
          {helperText}
        </p>
      ) : null}
    </div>
  );
}
