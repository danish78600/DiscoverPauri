import { useId, useMemo, useState } from "react";
import { Eye, EyeOff } from "lucide-react";

function cleanString(value) {
  return String(value ?? "").trim();
}

export default function AuthField({
  id,
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  helperText,
  errorText,
  icon,
  required = false,
  disabled = false,
  autoComplete,
  inputMode,
  allowReveal = false,
  className = "",
}) {
  const autoId = useId();
  const inputId = id || autoId;
  const hasValue = cleanString(value) !== "";

  const [revealed, setRevealed] = useState(false);
  const canReveal = allowReveal && type === "password";
  const actualType = canReveal ? (revealed ? "text" : "password") : type;

  const iconNode = useMemo(() => {
    if (typeof icon !== "function") return null;
    return icon({
      className:
        "h-5 w-5 text-slate-500 transition-colors group-focus-within:text-indigo-600",
      "aria-hidden": true,
    });
  }, [icon]);

  const hasError = Boolean(errorText);

  return (
    <div className={`w-full ${className}`.trim()}>
      <div
        className={
          "group relative rounded-2xl bg-gradient-to-r p-[1px] transition-all " +
          (hasError
            ? "from-rose-300 to-rose-300 hover:from-rose-400 hover:to-rose-400 focus-within:from-rose-500 focus-within:to-rose-400"
            : "from-slate-200 to-slate-200 hover:from-slate-300 hover:to-slate-300 focus-within:from-indigo-500 focus-within:to-violet-400")
        }
      >
        <div className="relative rounded-2xl bg-white/70 px-3 py-2.5 shadow-sm backdrop-blur-xl supports-backdrop-filter:bg-white/60">
          <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
            {iconNode}
          </div>

          <input
            id={inputId}
            value={value}
            onChange={onChange}
            type={actualType}
            placeholder={placeholder || " "}
            required={required}
            disabled={disabled}
            autoComplete={autoComplete}
            inputMode={inputMode}
            aria-invalid={hasError ? "true" : undefined}
            className={
              "peer block h-11 w-full appearance-none bg-transparent pl-9 pr-10 text-sm text-slate-900 outline-none placeholder:text-transparent disabled:cursor-not-allowed disabled:opacity-60"
            }
          />

          <label
            htmlFor={inputId}
            className={
              "pointer-events-none absolute left-12 top-1/2 -translate-y-1/2 text-slate-500 transition-all duration-200 " +
              "peer-focus:top-3 peer-focus:translate-y-0 peer-focus:text-xs peer-focus:font-medium " +
              (hasError
                ? "peer-focus:text-rose-700"
                : "peer-focus:text-slate-700") +
              (hasValue
                ? " top-3 translate-y-0 text-xs font-medium " +
                  (hasError ? "text-rose-700" : "text-slate-700")
                : " peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-sm")
            }
          >
            {label}
            {required ? " *" : ""}
          </label>

          {canReveal ? (
            <button
              type="button"
              onClick={() => setRevealed((v) => !v)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-xl p-2 text-slate-500 transition hover:bg-slate-900/5 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/30"
              aria-label={revealed ? "Hide password" : "Show password"}
            >
              {revealed ? (
                <EyeOff className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Eye className="h-4 w-4" aria-hidden="true" />
              )}
            </button>
          ) : null}
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
