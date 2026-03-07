import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";

export default function AuthShell({
  token,
  headerRight,
  title,
  subtitle,
  children,
  footer,
}) {
  const prefersReducedMotion = useReducedMotion();

  const MotionDiv = motion.div;

  return (
    <div className="relative min-h-dvh overflow-hidden bg-gradient-to-b from-slate-50 via-white to-slate-50 text-slate-900">
      <MotionDiv
        className="pointer-events-none absolute -left-28 -top-28 h-72 w-72 rounded-full bg-indigo-300/20 blur-3xl"
        animate={
          prefersReducedMotion
            ? undefined
            : { x: [0, 18, 0], y: [0, -12, 0], opacity: [0.08, 0.14, 0.08] }
        }
        transition={
          prefersReducedMotion
            ? undefined
            : { duration: 12, repeat: Infinity, ease: "easeInOut" }
        }
      />
      <MotionDiv
        className="pointer-events-none absolute -bottom-28 -right-28 h-80 w-80 rounded-full bg-violet-300/20 blur-3xl"
        animate={
          prefersReducedMotion
            ? undefined
            : { x: [0, -16, 0], y: [0, 14, 0], opacity: [0.08, 0.14, 0.08] }
        }
        transition={
          prefersReducedMotion
            ? undefined
            : { duration: 14, repeat: Infinity, ease: "easeInOut" }
        }
      />

      <header className="relative z-10">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5">
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white/70 px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm backdrop-blur-xl transition hover:bg-white"
          >
            <span
              className="h-2 w-2 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600"
              aria-hidden="true"
            />
            Discover Pauri
          </Link>

          <div className="flex items-center gap-2">
            {typeof headerRight === "function" ? headerRight({ token }) : null}
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto grid max-w-6xl px-4 pb-14 pt-6 sm:pt-10">
        <div className="mx-auto w-full max-w-md">
          <MotionDiv
            initial={prefersReducedMotion ? false : { opacity: 0, y: 14 }}
            animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
            transition={
              prefersReducedMotion
                ? undefined
                : { duration: 0.55, ease: [0.21, 0.8, 0.28, 1] }
            }
            className="rounded-3xl border border-white/25 bg-white/15 p-1 shadow-sm backdrop-blur-xl"
          >
            <div className="rounded-[22px] border border-white/20 bg-white/70 p-6 shadow-sm backdrop-blur-xl supports-backdrop-filter:bg-white/60 sm:p-7">
              <div className="text-center">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Discover Pauri
                </p>
                <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
                  {title}
                </h1>
                {subtitle ? (
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">
                    {subtitle}
                  </p>
                ) : null}
              </div>

              <div className="mt-6">{children}</div>

              {footer ? <div className="mt-6">{footer}</div> : null}
            </div>
          </MotionDiv>

          <p className="mt-6 text-center text-xs text-slate-500">
            Travel smarter. Explore deeper. Save time.
          </p>
        </div>
      </main>
    </div>
  );
}
