import { useId, useMemo } from "react";

function cleanString(value) {
  return String(value ?? "").trim();
}

export default function FormSelect({
  id,
  label,
  value,
  onChange,
  options,
  placeholder = "Select…",
  helperText,
  icon,
  required = false,
  disabled = false,
  className = "",
}) {
  const autoId = useId();
  const selectId = id || autoId;
  const hasValue = cleanString(value) !== "";

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
      <div className="group relative rounded-2xl bg-gradient-to-r from-slate-200 to-slate-200 p-[1px] transition-all hover:from-slate-300 hover:to-slate-300 focus-within:from-indigo-500 focus-within:to-cyan-400">
        <div className="relative rounded-2xl bg-white/70 px-3 py-2.5 shadow-sm backdrop-blur supports-backdrop-filter:bg-white/60">
          <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
            {iconNode}
          </div>

          <select
            id={selectId}
            value={value}
            onChange={onChange}
            required={required}
            disabled={disabled}
            className="peer block h-11 w-full appearance-none bg-transparent pl-9 pr-8 text-sm text-slate-900 outline-none disabled:cursor-not-allowed disabled:opacity-60"
          >
            <option value="" disabled>
              {placeholder}
            </option>
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
              "pointer-events-none absolute left-12 top-3 text-xs font-medium text-slate-700 transition-all duration-200 " +
              (hasValue ? "" : "opacity-90 group-focus-within:opacity-100")
            }
          >
            {label}
            {required ? " *" : ""}
          </label>
        </div>
      </div>

      {helperText ? (
        <p className="mt-1.5 text-xs leading-relaxed text-slate-500">
          {helperText}
        </p>
      ) : null}
    </div>
  );
}
