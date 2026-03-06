import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import { getMyTrips } from "../api/trips";

function formatDate(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString();
}

export default function MyTripsPage() {
  const token = useMemo(() => localStorage.getItem("dp_token"), []);
  const [trips, setTrips] = useState([]);
  const [openId, setOpenId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setIsLoading(true);
        const data = await getMyTrips(token);
        if (cancelled) return;
        setTrips(Array.isArray(data) ? data : []);
      } catch (err) {
        if (cancelled) return;
        toast.error(
          err instanceof Error ? err.message : "Failed to load trips",
        );
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <div className="min-h-dvh bg-white text-slate-900">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <Link to="/" className="font-semibold tracking-tight">
            Discover Pauri
          </Link>
          <div className="flex items-center gap-2">
            <Link
              to="/trip-planner"
              className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
            >
              Trip Planner
            </Link>
            <Link
              to="/"
              className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
            >
              Back
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          My Trips
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          Saved AI trip plans for your account.
        </p>

        {isLoading ? (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
            <p className="text-sm text-slate-700">Loading…</p>
          </div>
        ) : trips.length ? (
          <div className="mt-6 grid gap-4">
            {trips.map((t) => {
              const id = String(t?._id || "");
              const isOpen = id && openId === id;
              const title = String(t?.title || "Saved trip plan");
              const destination = String(t?.destination || "");
              const createdAt = formatDate(t?.createdAt);
              const planText = String(t?.planText || "");

              return (
                <button
                  key={id || title}
                  type="button"
                  onClick={() => setOpenId(isOpen ? null : id)}
                  className="w-full rounded-2xl border border-slate-200 bg-white p-5 text-left transition-colors hover:bg-slate-50"
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h2 className="text-base font-semibold text-slate-900">
                      {title}
                    </h2>
                    {createdAt ? (
                      <p className="text-xs text-slate-500">{createdAt}</p>
                    ) : null}
                  </div>
                  {destination ? (
                    <p className="mt-1 text-sm text-slate-700">
                      Destination: {destination}
                    </p>
                  ) : null}

                  {isOpen ? (
                    <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <pre className="whitespace-pre-wrap text-xs text-slate-800">
                        {planText || "(No plan text)"}
                      </pre>
                    </div>
                  ) : (
                    <p className="mt-3 text-xs text-slate-500">Click to view</p>
                  )}
                </button>
              );
            })}
          </div>
        ) : (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
            <p className="text-sm text-slate-700">
              No saved trips yet. Generate a plan and save it.
            </p>
            <Link
              to="/trip-planner"
              className="mt-4 inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
            >
              Go to Trip Planner
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
