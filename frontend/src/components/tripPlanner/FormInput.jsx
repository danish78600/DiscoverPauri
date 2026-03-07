import { useId, useMemo } from "react";

function cleanString(value) {
  return String(value ?? "").trim();
}

export default function FormInput({
  id,
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  helperText,
  icon,
  required = false,
  disabled = false,
  inputMode,
  multiline = false,
  rows = 4,
  className = "",
  ...rest
}) {
  const autoId = useId();
  const inputId = id || autoId;
  const hasValue = cleanString(value) !== "";

  const iconNode = useMemo(() => {
    if (typeof icon !== "function") return null;
    return icon({
      className:
        "h-5 w-5 text-slate-500 transition-colors group-focus-within:text-indigo-600",
      "aria-hidden": true,
    });
  }, [icon]);

  const ShellTag = multiline ? "textarea" : "input";

  return (
    <div className={`w-full ${className}`.trim()}>
      <div className="group relative rounded-2xl bg-gradient-to-r from-slate-200 to-slate-200 p-[1px] transition-all hover:from-slate-300 hover:to-slate-300 focus-within:from-indigo-500 focus-within:to-cyan-400">
        <div className="relative rounded-2xl bg-white/70 px-3 py-2.5 shadow-sm backdrop-blur supports-backdrop-filter:bg-white/60">
          <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
            {iconNode}
          </div>

          <ShellTag
            id={inputId}
            value={value}
            onChange={onChange}
            type={multiline ? undefined : type}
            placeholder={placeholder || " "}
            required={required}
            disabled={disabled}
            inputMode={inputMode}
            rows={multiline ? rows : undefined}
            className={
              "peer block w-full appearance-none bg-transparent pl-9 pr-2 text-sm text-slate-900 outline-none placeholder:text-transparent disabled:cursor-not-allowed disabled:opacity-60" +
              (multiline ? " min-h-28 resize-y pt-5" : " h-11")
            }
            {...rest}
          />

          <label
            htmlFor={inputId}
            className={
              "pointer-events-none absolute left-12 text-slate-500 transition-all duration-200 " +
              (multiline ? "top-3" : "top-1/2 -translate-y-1/2") +
              " peer-focus:top-3 peer-focus:translate-y-0 peer-focus:text-xs peer-focus:font-medium peer-focus:text-slate-700 " +
              (hasValue
                ? " top-3 translate-y-0 text-xs font-medium text-slate-700"
                : " peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-sm")
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
