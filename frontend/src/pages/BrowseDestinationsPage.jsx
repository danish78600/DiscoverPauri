import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";
import { logout } from "../api/auth";
import { getAllDestinations } from "../api/destinations";

export default function BrowseDestinationsPage() {
  const navigate = useNavigate();

  const [destinations, setDestinations] = useState([]);
  const [status, setStatus] = useState("idle"); // idle | loading | success | error
  const [errorMessage, setErrorMessage] = useState("");

  const [token, setToken] = useState(() => localStorage.getItem("dp_token"));
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const [query, setQuery] = useState("");
  const [featuredOnly, setFeaturedOnly] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState("all");

  const sortedDestinations = useMemo(() => {
    return [...(Array.isArray(destinations) ? destinations : [])].sort((a, b) =>
      String(a?.name || "").localeCompare(String(b?.name || "")),
    );
  }, [destinations]);

  const categoryOptions = useMemo(() => {
    const map = new Map();

    for (const dest of Array.isArray(sortedDestinations)
      ? sortedDestinations
      : []) {
      const cat = dest?.category;
      if (!cat) continue;

      const id =
        typeof cat === "object" && cat
          ? String(cat._id || cat.id || "")
          : String(cat);

      if (!id) continue;

      const label =
        typeof cat === "object" && cat
          ? String(cat.name || cat.title || id)
          : id;

      map.set(id, label);
    }

    return [...map.entries()]
      .map(([id, label]) => ({ id, label }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [sortedDestinations]);

  const filteredDestinations = useMemo(() => {
    const q = String(query || "")
      .trim()
      .toLowerCase();

    return (Array.isArray(sortedDestinations) ? sortedDestinations : []).filter(
      (dest) => {
        if (featuredOnly && !dest?.isFeatured) return false;

        if (categoryFilter !== "all") {
          const cat = dest?.category;
          const catId =
            typeof cat === "object" && cat
              ? String(cat._id || cat.id || "")
              : String(cat || "");
          if (catId !== categoryFilter) return false;
        }

        if (q) {
          const haystack = `${dest?.name || ""} ${dest?.shortDescription || ""}`
            .toLowerCase()
            .trim();
          if (!haystack.includes(q)) return false;
        }

        return true;
      },
    );
  }, [sortedDestinations, query, featuredOnly, categoryFilter]);

  async function loadDestinations() {
    try {
      setStatus("loading");
      setErrorMessage("");

      const data = await getAllDestinations();
      setDestinations(Array.isArray(data) ? data : []);
      setStatus("success");
    } catch (err) {
      setStatus("error");
      setDestinations([]);
      setErrorMessage(
        err instanceof Error ? err.message : "Failed to load destinations",
      );
    }
  }

  useEffect(() => {
    void loadDestinations();
  }, []);

  const skeletonItems = useMemo(() => Array.from({ length: 6 }), []);

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
            <Link
              to="/treks"
              className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
            >
              Treks
            </Link>
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
              <Link
                to="/login"
                className="inline-flex rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
              >
                Log in
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Browse destinations
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
              Viewpoints, stays, and places around Pauri.
            </p>
          </div>
          <button
            type="button"
            onClick={loadDestinations}
            className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
          >
            Refresh
          </button>
        </div>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label className="text-sm font-medium" htmlFor="dest-search">
                Search
              </label>
              <input
                id="dest-search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search destinations…"
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
              />
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={featuredOnly}
                onChange={(e) => setFeaturedOnly(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300"
              />
              Featured only
            </label>

            {categoryOptions.length ? (
              <div className="sm:w-56">
                <label className="text-sm font-medium" htmlFor="dest-category">
                  Category
                </label>
                <select
                  id="dest-category"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                >
                  <option value="all">All</option>
                  {categoryOptions.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}
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

        {status === "error" ? (
          <div className="mt-10 rounded-2xl border border-red-200 bg-red-50 p-6">
            <p className="text-sm font-medium text-red-900">
              Couldn’t load destinations
            </p>
            <p className="mt-2 text-sm text-red-800">{errorMessage}</p>
          </div>
        ) : null}

        {status === "success" && sortedDestinations.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-slate-200 bg-slate-50 p-6">
            <p className="text-sm font-medium">No destinations found</p>
            <p className="mt-2 text-sm text-slate-600">
              Add destinations in Admin to see them here.
            </p>
          </div>
        ) : null}

        {status === "success" &&
        sortedDestinations.length > 0 &&
        filteredDestinations.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-slate-200 bg-slate-50 p-6">
            <p className="text-sm font-medium">No destinations match</p>
            <p className="mt-2 text-sm text-slate-600">
              Try adjusting your search or filters.
            </p>
          </div>
        ) : null}

        {status === "success" && filteredDestinations.length > 0 ? (
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredDestinations.map((dest) => {
              const cover =
                Array.isArray(dest?.images) && dest.images.length
                  ? dest.images[0]
                  : null;

              return (
                <Link
                  key={dest._id || dest.slug || dest.name}
                  to={dest.slug ? `/destination/${dest.slug}` : "/destinations"}
                  className="group flex min-h-80 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white transition duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-sm"
                >
                  <div className="relative aspect-video bg-slate-100">
                    {cover ? (
                      <img
                        src={cover}
                        alt={dest.name ? `${dest.name} cover` : "Destination"}
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
                        {dest.name || "Untitled destination"}
                      </h2>
                      {dest.isFeatured ? (
                        <span className="shrink-0 rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-medium text-slate-700">
                          Featured
                        </span>
                      ) : null}
                    </div>

                    {dest.shortDescription ? (
                      <p className="mt-2 line-clamp-3 text-sm text-slate-600">
                        {dest.shortDescription}
                      </p>
                    ) : (
                      <p className="mt-2 line-clamp-3 text-sm text-slate-600">
                        Tap to view details.
                      </p>
                    )}

                    {dest.slug ? (
                      <p className="mt-auto pt-4 text-xs font-medium text-slate-500 group-hover:text-slate-700">
                        View →
                      </p>
                    ) : null}
                  </div>
                </Link>
              );
            })}
          </div>
        ) : null}
      </main>
    </div>
  );
}
