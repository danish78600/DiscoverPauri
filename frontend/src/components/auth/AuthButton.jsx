import { Loader2 } from "lucide-react";

export default function AuthButton({
  children,
  isLoading,
  disabled,
  type = "submit",
}) {
  const isDisabled = Boolean(disabled) || Boolean(isLoading);

  return (
    <button
      type={type}
      disabled={isDisabled}
      className="group inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 via-blue-600 to-violet-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
      ) : null}
      <span>{children}</span>
    </button>
  );
}
