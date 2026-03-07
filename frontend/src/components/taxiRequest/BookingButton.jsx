export default function BookingButton({
  children,
  type = "button",
  onClick,
  disabled,
  loading = false,
  variant = "primary", // primary | secondary
  tone = "dark", // dark | light
  className = "",
}) {
  const isDisabled = Boolean(disabled || loading);
  const isLight = tone === "light";

  if (variant === "secondary") {
    return (
      <button
        type={type}
        onClick={onClick}
        disabled={isDisabled}
        className={
          "inline-flex h-11 items-center justify-center rounded-xl border px-4 text-sm font-semibold backdrop-blur-xl transition focus-visible:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-60 " +
          (isLight
            ? "border-slate-200 bg-white text-slate-900 hover:bg-slate-50 focus-visible:ring-slate-400/30"
            : "border-white/20 bg-white/10 text-white/90 hover:bg-white/15 focus-visible:ring-white/50") +
          className
        }
      >
        {children}
      </button>
    );
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      className={
        "relative inline-flex h-11 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-r from-indigo-500 via-blue-500 to-violet-500 px-4 text-sm font-semibold text-white shadow-lg shadow-indigo-900/20 transition hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 disabled:cursor-not-allowed disabled:opacity-70 " +
        className
      }
    >
      <span className={loading ? "opacity-0" : "opacity-100"}>{children}</span>

      {loading ? (
        <span className="absolute inset-0 grid place-items-center">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
        </span>
      ) : null}
    </button>
  );
}
