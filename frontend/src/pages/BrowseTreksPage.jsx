import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";
import { logout } from "../api/auth";
import { getApiBaseUrl } from "../api/client";

function formatDifficulty(value) {
  const normalized = String(value || "").toLowerCase();
  if (!normalized) return "—";
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

function formatNumber(value) {
  if (value == null || Number.isNaN(Number(value))) return null;
  return new Intl.NumberFormat().format(Number(value));
}

const BrowseTreksPage = () => {
  const navigate = useNavigate();
  const apiBase = getApiBaseUrl();

  const [treks, setTreks] = useState([]);
  const [status, setStatus] = useState("idle"); // idle | loading | success | error
  const [errorMessage, setErrorMessage] = useState("");
  const [token, setToken] = useState(() => localStorage.getItem("dp_token"));
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const [query, setQuery] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState("all");
  const [durationFilter, setDurationFilter] = useState("all");

  const treksEndpoint = useMemo(() => {
    const trimmedBase = String(apiBase).replace(/\/$/, "");
    return `${trimmedBase}/api/treks`;
  }, [apiBase]);

  const skeletonItems = useMemo(() => Array.from({ length: 6 }), []);

  const filteredTreks = useMemo(() => {
    const q = String(query || "")
      .trim()
      .toLowerCase();

    return (Array.isArray(treks) ? treks : []).filter((trek) => {
      if (difficultyFilter !== "all") {
        const diff = String(trek?.difficulty || "").toLowerCase();
        if (diff !== difficultyFilter) return false;
      }

      if (durationFilter !== "all") {
        const d = Number(trek?.durationDays);
        if (!Number.isFinite(d)) return false;

        if (durationFilter === "1-2" && !(d >= 1 && d <= 2)) return false;
        if (durationFilter === "3-5" && !(d >= 3 && d <= 5)) return false;
      }

      if (q) {
        const haystack = `${trek?.title || ""} ${trek?.summary || ""}`
          .toLowerCase()
          .trim();
        if (!haystack.includes(q)) return false;
      }

      return true;
    });
  }, [treks, query, difficultyFilter, durationFilter]);

  async function loadTreks() {
    try {
      setStatus("loading");
      setErrorMessage("");

      const res = await fetch(treksEndpoint);
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || `Request failed (${res.status})`);
      }

      const data = await res.json();
      setTreks(Array.isArray(data) ? data : []);
      setStatus("success");
    } catch (err) {
      setStatus("error");
      setTreks([]);
      setErrorMessage(
        err instanceof Error ? err.message : "Failed to load treks",
      );
    }
  }

  useEffect(() => {
    void loadTreks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [treksEndpoint]);

  async function onLogout() {
    if (isLoggingOut) return;

    try {
      setIsLoggingOut(true);

      if (token) {
        await logout(token);
      }

      toast.success("Logged out");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Logout failed");
    } finally {
      localStorage.removeItem("dp_token");
      setToken(null);
      setIsLoggingOut(false);
      navigate("/");
    }
  }

  return (
    <div className="min-h-dvh bg-white text-slate-900">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link to="/" className="font-semibold tracking-tight">
            Discover Pauri
          </Link>

          <div className="flex items-center gap-2">
            {token ? (
              <button
                type="button"
                onClick={onLogout}
                disabled={isLoggingOut}
                className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
              >
                {isLoggingOut ? "Logging out…" : "Logout"}
              </button>
            ) : (
              <>
                <Link
                  to="/login"
                  className="inline-flex rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                >
                  Log in
                </Link>
                <Link
                  to="/signup"
                  className="hidden items-center justify-center rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white sm:inline-flex"
                >
                  Sign up
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Browse treks
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={loadTreks}
              className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
            >
              Refresh
            </button>
            <Link
              to="/"
              className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
            >
              Back to Home
            </Link>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label className="text-sm font-medium" htmlFor="trek-search">
                Search
              </label>
              <input
                id="trek-search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search treks…"
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
              />
            </div>

            <div className="sm:w-56">
              <label className="text-sm font-medium" htmlFor="trek-difficulty">
                Difficulty
              </label>
              <select
                id="trek-difficulty"
                value={difficultyFilter}
                onChange={(e) => setDifficultyFilter(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
              >
                <option value="all">All</option>
                <option value="easy">Easy</option>
                <option value="moderate">Moderate</option>
                <option value="hard">Hard</option>
              </select>
            </div>

            <div className="sm:w-56">
              <label className="text-sm font-medium" htmlFor="trek-duration">
                Duration
              </label>
              <select
                id="trek-duration"
                value={durationFilter}
                onChange={(e) => setDurationFilter(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
              >
                <option value="all">All</option>
                <option value="1-2">1–2 days</option>
                <option value="3-5">3–5 days</option>
              </select>
            </div>
          </div>
        </div>

        {status === "loading" ? (
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {skeletonItems.map((_, idx) => (
              <div
                key={idx}
                className="overflow-hidden rounded-xl border border-slate-200 bg-white"
              >
                <div className="aspect-video bg-slate-100">
                  <div className="h-full w-full animate-pulse bg-slate-100" />
                </div>
                <div className="space-y-3 p-5">
                  <div className="h-4 w-2/3 animate-pulse rounded bg-slate-100" />
                  <div className="h-3 w-full animate-pulse rounded bg-slate-100" />
                  <div className="h-3 w-5/6 animate-pulse rounded bg-slate-100" />
                </div>
              </div>
            ))}
          </div>
        ) : null}

        {status === "error" && (
          <div className="mt-10 rounded-2xl border border-red-200 bg-red-50 p-6">
            <p className="text-sm font-medium text-red-900">
              Couldn’t load treks
            </p>
            <p className="mt-2 wrap-break-word text-sm text-red-800">
              {errorMessage}
            </p>
            <p className="mt-3 text-xs text-red-700">
              Make sure the backend is running and reachable at:{" "}
              <span className="font-mono">{treksEndpoint}</span>
            </p>
          </div>
        )}

        {status === "success" && treks.length === 0 && (
          <div className="mt-10 rounded-2xl border border-slate-200 bg-slate-50 p-6">
            <p className="text-sm font-medium">No treks found</p>
            <p className="mt-2 text-sm text-slate-600">
              Add treks in your database to see them here.
            </p>
          </div>
        )}

        {status === "success" &&
        treks.length > 0 &&
        filteredTreks.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-slate-200 bg-slate-50 p-6">
            <p className="text-sm font-medium">No treks match</p>
            <p className="mt-2 text-sm text-slate-600">
              Try adjusting your search or filters.
            </p>
          </div>
        ) : null}

        {status === "success" && filteredTreks.length > 0 && (
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredTreks.map((trek) => (
              <Link
                key={trek._id || trek.slug || trek.title}
                to={trek.slug ? `/trek/${trek.slug}` : "/treks"}
                aria-label={
                  trek.slug
                    ? `View details for ${trek.title || "trek"}`
                    : "Trek details unavailable"
                }
                className="flex min-h-80 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white transition duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-sm"
              >
                <div className="relative aspect-video bg-slate-100">
                  {trek.heroImageUrl ||
                  (Array.isArray(trek.imageUrls) ? trek.imageUrls[0] : null) ? (
                    <img
                      src={
                        trek.heroImageUrl ||
                        (Array.isArray(trek.imageUrls) ? trek.imageUrls[0] : "")
                      }
                      alt={trek.title ? `${trek.title} cover` : "Trek cover"}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-xs font-medium text-slate-500">
                      No image
                    </div>
                  )}
                </div>

                <div className="flex flex-1 flex-col p-5">
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="text-base font-semibold leading-snug">
                      {trek.title || "Untitled trek"}
                    </h2>
                    {trek.isFeatured ? (
                      <span className="shrink-0 rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-medium text-slate-700">
                        Featured
                      </span>
                    ) : null}
                  </div>

                  {trek.summary ? (
                    <p className="mt-2 line-clamp-3 text-sm text-slate-600">
                      {trek.summary}
                    </p>
                  ) : (
                    <p className="mt-2 line-clamp-3 text-sm text-slate-600">
                      A scenic trek in the Pauri region.
                    </p>
                  )}

                  <div className="mt-auto flex flex-wrap gap-2 pt-4 text-xs text-slate-600">
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1">
                      {formatDifficulty(trek.difficulty)}
                    </span>
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1">
                      {trek.durationDays
                        ? `${trek.durationDays} day(s)`
                        : "Duration —"}
                    </span>
                    {formatNumber(trek.distanceKm) ? (
                      <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1">
                        {formatNumber(trek.distanceKm)} km
                      </span>
                    ) : null}
                    {formatNumber(trek.maxAltitudeM) ? (
                      <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1">
                        {formatNumber(trek.maxAltitudeM)} m
                      </span>
                    ) : null}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default BrowseTreksPage;
