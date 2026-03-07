import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";
import { logout } from "../api/auth";
import { getAllDestinations } from "../api/destinations";

function clampNumber(value, min, max) {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return Math.min(max, Math.max(min, n));
}

function formatRating(value) {
  const n = clampNumber(value, 0, 5);
  if (n == null) return null;
  return n.toFixed(1);
}

function PageHeader({ token, onLogout, isLoggingOut }) {
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200/70 bg-white/75 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <Link to="/" className="font-semibold tracking-tight text-slate-900">
          Discover Pauri
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-1 sm:flex">
          <Link
            to="/treks"
            className="rounded-xl px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50"
          >
            Treks
          </Link>
          <Link
            to="/destinations"
            className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-medium text-white shadow-sm ring-1 ring-slate-900/10 transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50"
            aria-current="page"
          >
            Destinations
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          {token ? (
            <button
              type="button"
              onClick={onLogout}
              disabled={isLoggingOut}
              className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50"
            >
              {isLoggingOut ? "Logging out…" : "Logout"}
            </button>
          ) : (
            <Link
              to="/login"
              className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900 shadow-sm transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50"
            >
              Log in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

function SearchInput({ value, onChange }) {
  return (
    <div className="relative flex-1">
      <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            d="M21 21L16.65 16.65"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M10.5 18C14.6421 18 18 14.6421 18 10.5C18 6.35786 14.6421 3 10.5 3C6.35786 3 3 6.35786 3 10.5C3 14.6421 6.35786 18 10.5 18Z"
            stroke="currentColor"
            strokeWidth="2"
          />
        </svg>
      </div>
      <label className="sr-only" htmlFor="dest-search">
        Search destinations
      </label>
      <input
        id="dest-search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search places, viewpoints, stays…"
        className="w-full rounded-2xl border border-slate-200 bg-white/80 py-3 pl-10 pr-3 text-sm text-slate-900 shadow-sm backdrop-blur transition placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50"
      />
    </div>
  );
}

function Toggle({ label, checked, onChange }) {
  return (
    <label className="inline-flex items-center gap-3 rounded-2xl border border-slate-200 bg-white/80 px-3 py-2 text-sm shadow-sm backdrop-blur">
      <span className="font-medium text-slate-700">{label}</span>
      <span className="relative inline-flex items-center">
        <input
          type="checkbox"
          className="peer sr-only"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span className="h-6 w-11 rounded-full bg-slate-200 transition-colors peer-checked:bg-green-500/90" />
        <span className="absolute left-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-5" />
      </span>
    </label>
  );
}

function CategoryChips({ options, value, onChange }) {
  if (!options.length) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={() => onChange("all")}
        className={
          "rounded-full border px-3 py-1.5 text-xs font-medium shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50 " +
          (value === "all"
            ? "border-blue-600 bg-blue-600 text-white"
            : "border-slate-200 bg-white/80 text-slate-700 hover:bg-white")
        }
        aria-pressed={value === "all"}
      >
        All
      </button>
      {options.map((opt) => (
        <button
          key={opt.id}
          type="button"
          onClick={() => onChange(opt.id)}
          className={
            "rounded-full border px-3 py-1.5 text-xs font-medium shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50 " +
            (value === opt.id
              ? "border-blue-600 bg-blue-600 text-white"
              : "border-slate-200 bg-white/80 text-slate-700 hover:bg-white")
          }
          aria-pressed={value === opt.id}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function FilterToolbar({
  query,
  setQuery,
  featuredOnly,
  setFeaturedOnly,
  categoryOptions,
  categoryFilter,
  setCategoryFilter,
  onRefresh,
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white/70 p-4 shadow-sm backdrop-blur sm:p-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <SearchInput value={query} onChange={setQuery} />

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between lg:justify-end">
          <Toggle
            label="Featured"
            checked={featuredOnly}
            onChange={setFeaturedOnly}
          />

          <button
            type="button"
            onClick={onRefresh}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm font-medium text-slate-900 shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:bg-white hover:shadow-md active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                d="M21 12A9 9 0 1 1 7.5 4.5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path
                d="M21 3V9H15"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Refresh
          </button>
        </div>
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-medium text-slate-600">Categories</p>

          {categoryOptions.length ? (
            <div className="sm:hidden">
              <label className="sr-only" htmlFor="dest-category">
                Category
              </label>
              <select
                id="dest-category"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-44 rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-sm shadow-sm backdrop-blur focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50"
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

        <div className="mt-2 hidden sm:block">
          <CategoryChips
            options={categoryOptions}
            value={categoryFilter}
            onChange={setCategoryFilter}
          />
        </div>
      </div>
    </div>
  );
}

function DestinationCard({ dest, onBookTaxi }) {
  const cover =
    Array.isArray(dest?.images) && dest.images.length ? dest.images[0] : null;

  const ratingText =
    dest?.totalReviews > 0 ? formatRating(dest?.averageRating) : null;

  return (
    <article className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-md">
      <div className="relative aspect-video bg-slate-100">
        {cover ? (
          <img
            src={cover}
            alt={dest?.name ? `${dest.name} cover` : "Destination"}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            loading="lazy"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-xs font-medium text-slate-500">
            No image
          </div>
        )}
        <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-slate-950/50 via-slate-950/10 to-transparent" />

        <div className="absolute left-3 top-3 flex items-center gap-2">
          {dest?.isFeatured ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-green-500 px-2.5 py-1 text-[11px] font-semibold text-white shadow-sm">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-white/90" />
              Featured
            </span>
          ) : null}

          {ratingText ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-white/30 bg-white/85 px-2.5 py-1 text-[11px] font-semibold text-slate-900 shadow-sm backdrop-blur">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path
                  d="M12 17.3L6.18 20.6L7.64 14.02L2.5 9.4L9.24 8.8L12 2.6L14.76 8.8L21.5 9.4L16.36 14.02L17.82 20.6L12 17.3Z"
                  fill="currentColor"
                  className="text-orange-500"
                />
              </svg>
              {ratingText}
              <span className="font-medium text-slate-700">
                ({dest.totalReviews})
              </span>
            </span>
          ) : null}
        </div>
      </div>

      <div className="flex min-h-44 flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-base font-semibold leading-snug text-slate-900">
            {dest?.name || "Untitled destination"}
          </h2>
        </div>

        <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-slate-600">
          {dest?.shortDescription || "Explore details, photos, and tips."}
        </p>

        <div className="mt-auto flex flex-col gap-2 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <Link
            to={dest?.slug ? `/destination/${dest.slug}` : "/destinations"}
            className="inline-flex items-center justify-center rounded-2xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm ring-1 ring-blue-600/20 transition hover:-translate-y-0.5 hover:bg-blue-500 hover:shadow-md active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
          >
            View
          </Link>

          <button
            type="button"
            onClick={() => onBookTaxi(dest)}
            className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow-md active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
          >
            Book taxi
          </button>
        </div>
      </div>
    </article>
  );
}

function DestinationsSkeleton() {
  return (
    <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, idx) => (
        <div
          key={idx}
          className="overflow-hidden rounded-3xl border border-slate-200 bg-white"
        >
          <div className="aspect-video bg-slate-100">
            <div className="h-full w-full animate-pulse bg-slate-100" />
          </div>
          <div className="space-y-3 p-5">
            <div className="h-4 w-2/3 animate-pulse rounded bg-slate-100" />
            <div className="h-3 w-full animate-pulse rounded bg-slate-100" />
            <div className="h-3 w-5/6 animate-pulse rounded bg-slate-100" />
            <div className="pt-2">
              <div className="h-9 w-28 animate-pulse rounded-2xl bg-slate-100" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ title, message, onClear }) {
  return (
    <div className="mt-10 overflow-hidden rounded-3xl border border-slate-200 bg-white/70 p-7 shadow-sm backdrop-blur">
      <div className="flex items-start gap-4">
        <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-sm">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              d="M12 21C15.5 17.5 18 14.6863 18 11C18 7.68629 15.3137 5 12 5C8.68629 5 6 7.68629 6 11C6 14.6863 8.5 17.5 12 21Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinejoin="round"
            />
            <path
              d="M12 13C13.1046 13 14 12.1046 14 11C14 9.89543 13.1046 9 12 9C10.8954 9 10 9.89543 10 11C10 12.1046 10.8954 13 12 13Z"
              stroke="currentColor"
              strokeWidth="2"
            />
          </svg>
        </div>

        <div className="flex-1">
          <p className="text-sm font-semibold text-slate-900">{title}</p>
          <p className="mt-1 text-sm leading-relaxed text-slate-600">
            {message}
          </p>
          {onClear ? (
            <button
              type="button"
              onClick={onClear}
              className="mt-4 inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 shadow-sm transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50"
            >
              Clear filters
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

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

  useEffect(() => {
    const targets = Array.from(document.querySelectorAll("[data-dp-reveal]"));
    if (!targets.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add("dp-reveal--visible");
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.12 },
    );

    for (const t of targets) observer.observe(t);
    return () => observer.disconnect();
  }, [status, filteredDestinations.length]);

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
    <div className="min-h-dvh bg-slate-50 text-slate-900">
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute left-1/2 -top-72 h-96 w-96 -translate-x-1/2 rounded-full bg-blue-200/40 blur-3xl" />
        <div className="absolute -right-64 top-48 h-80 w-80 rounded-full bg-slate-200/50 blur-3xl" />
        <div className="absolute -left-72 top-96 h-80 w-80 rounded-full bg-green-200/40 blur-3xl" />
      </div>

      <PageHeader
        token={token}
        onLogout={onLogout}
        isLoggingOut={isLoggingOut}
      />

      <main className="mx-auto max-w-7xl px-4 py-10 sm:py-14">
        <section className="dp-reveal" data-dp-reveal>
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-3 py-1 text-xs font-medium text-slate-700 shadow-sm backdrop-blur">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-blue-600" />
                Curated places around Pauri
              </div>
              <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
                Browse destinations
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">
                Viewpoints, stays, and quiet escapes—pick a place and plan your
                route in minutes.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Link
                to="/trip-planner"
                className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-sm ring-1 ring-slate-900/10 transition hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-md active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50"
              >
                Plan a trip
              </Link>
            </div>
          </div>

          <div className="mt-8">
            <FilterToolbar
              query={query}
              setQuery={setQuery}
              featuredOnly={featuredOnly}
              setFeaturedOnly={setFeaturedOnly}
              categoryOptions={categoryOptions}
              categoryFilter={categoryFilter}
              setCategoryFilter={setCategoryFilter}
              onRefresh={loadDestinations}
            />
          </div>
        </section>

        {status === "loading" ? <DestinationsSkeleton /> : null}

        {status === "error" ? (
          <div className="mt-10 overflow-hidden rounded-3xl border border-red-200 bg-red-50 p-7">
            <p className="text-sm font-semibold text-red-900">
              Couldn’t load destinations
            </p>
            <p className="mt-2 text-sm leading-relaxed text-red-800">
              {errorMessage}
            </p>
            <button
              type="button"
              onClick={loadDestinations}
              className="mt-4 inline-flex items-center justify-center rounded-2xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-red-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/40 focus-visible:ring-offset-2 focus-visible:ring-offset-red-50"
            >
              Try again
            </button>
          </div>
        ) : null}

        {status === "success" && sortedDestinations.length === 0 ? (
          <EmptyState
            title="No destinations yet"
            message="Add destinations in Admin to see them here."
          />
        ) : null}

        {status === "success" &&
        sortedDestinations.length > 0 &&
        filteredDestinations.length === 0 ? (
          <EmptyState
            title="No matches"
            message="Try adjusting your search or filters."
            onClear={() => {
              setQuery("");
              setFeaturedOnly(false);
              setCategoryFilter("all");
            }}
          />
        ) : null}

        {status === "success" && filteredDestinations.length > 0 ? (
          <section className="mt-10">
            <div
              className="dp-reveal grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
              data-dp-reveal
            >
              {filteredDestinations.map((dest) => (
                <DestinationCard
                  key={dest._id || dest.slug || dest.name}
                  dest={dest}
                  onBookTaxi={(d) => {
                    navigate("/taxi-request", {
                      state: {
                        destinationId: d?._id || null,
                        destinationName: d?.name || "",
                        dropLocation: d?.name || "",
                      },
                    });
                  }}
                />
              ))}
            </div>
          </section>
        ) : null}
      </main>
    </div>
  );
}
