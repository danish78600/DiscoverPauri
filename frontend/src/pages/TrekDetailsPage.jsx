import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Link, useNavigate, useParams } from "react-router-dom";
import { logout } from "../api/auth";
import { getApprovedReviews, submitReview } from "../api/reviews";
import { getTrekBySlug } from "../api/treks";

function formatDifficulty(value) {
  const normalized = String(value || "").toLowerCase();
  if (!normalized) return "—";
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

function formatNumber(value) {
  if (value == null || Number.isNaN(Number(value))) return null;
  return new Intl.NumberFormat().format(Number(value));
}

function formatPriceInr(value) {
  if (value == null || Number.isNaN(Number(value))) return null;

  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(Number(value));
  } catch {
    return `₹${formatNumber(value)}`;
  }
}

export default function TrekDetailsPage() {
  const { slug } = useParams();
  const navigate = useNavigate();

  const [status, setStatus] = useState("idle"); // idle | loading | success | error
  const [errorMessage, setErrorMessage] = useState("");
  const [trek, setTrek] = useState(null);

  const [reviewsStatus, setReviewsStatus] = useState("idle");
  const [reviewsErrorMessage, setReviewsErrorMessage] = useState("");
  const [reviews, setReviews] = useState([]);

  const [reviewRating, setReviewRating] = useState("5");
  const [reviewText, setReviewText] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const [token, setToken] = useState(() => localStorage.getItem("dp_token"));
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const safeSlug = useMemo(() => String(slug || "").trim(), [slug]);

  async function loadTrek() {
    if (!safeSlug) {
      setStatus("error");
      setErrorMessage("Missing trek slug");
      setTrek(null);
      return;
    }

    try {
      setStatus("loading");
      setErrorMessage("");

      const data = await getTrekBySlug(safeSlug);
      setTrek(data);
      setStatus("success");
    } catch (err) {
      setStatus("error");
      setTrek(null);
      setErrorMessage(
        err instanceof Error ? err.message : "Failed to load trek",
      );
    }
  }

  useEffect(() => {
    void loadTrek();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [safeSlug]);

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

  const heroImageUrl =
    trek?.heroImageUrl ||
    (Array.isArray(trek?.imageUrls) ? trek.imageUrls[0] : null) ||
    null;

  const bestSeasonText = Array.isArray(trek?.bestSeason)
    ? trek.bestSeason.filter(Boolean).join(", ")
    : "";

  async function loadReviews() {
    const id = trek?._id;
    if (!id) return;

    try {
      setReviewsStatus("loading");
      setReviewsErrorMessage("");
      const data = await getApprovedReviews({
        targetType: "trek",
        targetId: id,
      });
      setReviews(Array.isArray(data) ? data : []);
      setReviewsStatus("success");
    } catch (err) {
      setReviewsStatus("error");
      setReviewsErrorMessage(
        err instanceof Error ? err.message : "Failed to load reviews",
      );
      setReviews([]);
    }
  }

  useEffect(() => {
    if (status === "success" && trek?._id) {
      void loadReviews();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, trek?._id]);

  async function onSubmitReview(e) {
    e.preventDefault();

    if (isSubmittingReview) return;

    const id = trek?._id;
    if (!id) return;

    if (!token) {
      toast.error("Please log in to submit a review");
      return;
    }

    const rating = Number(reviewRating);
    if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
      toast.error("Rating must be between 1 and 5");
      return;
    }

    const text = String(reviewText || "").trim();
    if (!text) {
      toast.error("Review text is required");
      return;
    }

    try {
      setIsSubmittingReview(true);
      await submitReview(
        {
          targetType: "trek",
          targetId: id,
          rating,
          text,
        },
        token,
      );
      setReviewText("");
      setReviewRating("5");
      toast.success("Review submitted for admin approval");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to submit");
    } finally {
      setIsSubmittingReview(false);
    }
  }

  function formatStars(value) {
    const n = Number(value);
    const safe = Number.isFinite(n) ? Math.max(0, Math.min(5, n)) : 0;
    const full = "★".repeat(Math.round(safe));
    const empty = "☆".repeat(5 - Math.round(safe));
    return `${full}${empty}`;
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
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Link
              to="/treks"
              className="text-sm font-medium text-slate-600 hover:text-slate-900"
            >
              ← Back to Treks
            </Link>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              {trek?.title || (status === "loading" ? "Loading…" : "Trek")}
            </h1>
          </div>

          {status === "success" && trek ? (
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
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
              {bestSeasonText ? (
                <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1">
                  Best season: {bestSeasonText}
                </span>
              ) : null}
            </div>
          ) : null}
        </div>

        {status === "loading" && (
          <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">
            Loading trek details…
          </div>
        )}

        {status === "error" && (
          <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-6">
            <p className="text-sm font-medium text-red-900">
              Couldn’t load trek
            </p>
            <p className="mt-2 text-sm text-red-800">{errorMessage}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={loadTrek}
                className="inline-flex items-center justify-center rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-900 transition-colors hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300/50 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
              >
                Retry
              </button>
              <Link
                to="/treks"
                className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
              >
                Back to Treks
              </Link>
            </div>
          </div>
        )}

        {status === "success" && trek ? (
          <div className="mt-8 grid gap-6 lg:grid-cols-5">
            <section className="lg:col-span-3">
              {heroImageUrl ? (
                <div className="aspect-video overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
                  <img
                    src={heroImageUrl}
                    alt={trek.title ? `${trek.title} hero` : "Trek hero"}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                </div>
              ) : (
                <div className="aspect-video overflow-hidden rounded-2xl border border-slate-200 bg-slate-100" />
              )}

              <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
                <h2 className="text-base font-semibold">Description</h2>
                <p className="mt-3 text-sm leading-relaxed text-slate-600 whitespace-pre-line">
                  {trek.description ||
                    trek.summary ||
                    "No description provided."}
                </p>
              </div>

              <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-base font-semibold">Reviews</h2>
                    <p className="mt-1 text-sm text-slate-600">
                      Reviews are visible after admin approval.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={loadReviews}
                    className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900 transition-colors hover:bg-slate-50"
                  >
                    Refresh
                  </button>
                </div>

                <div className="mt-4">
                  {reviewsStatus === "loading" ? (
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                      Loading reviews…
                    </div>
                  ) : null}

                  {reviewsStatus === "error" ? (
                    <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                      <p className="text-sm font-medium text-red-900">
                        Couldn’t load reviews
                      </p>
                      <p className="mt-1 text-sm text-red-800">
                        {reviewsErrorMessage}
                      </p>
                    </div>
                  ) : null}

                  {reviewsStatus !== "loading" && reviews.length ? (
                    <ul className="divide-y divide-slate-200 rounded-xl border border-slate-200">
                      {reviews.map((r) => (
                        <li key={r?._id} className="px-4 py-4">
                          <p className="text-sm font-medium text-slate-900">
                            {r?.user?.name || "User"}
                          </p>
                          <p className="mt-1 text-xs text-slate-600">
                            <span className="font-medium text-slate-700">
                              {formatStars(r?.rating)}
                            </span>
                            {r?.createdAt
                              ? ` · ${new Date(r.createdAt).toLocaleDateString()}`
                              : ""}
                          </p>
                          <p className="mt-3 text-sm leading-relaxed text-slate-700 whitespace-pre-line">
                            {r?.text || ""}
                          </p>
                        </li>
                      ))}
                    </ul>
                  ) : reviewsStatus !== "loading" ? (
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                      No approved reviews yet.
                    </div>
                  ) : null}
                </div>

                <div className="mt-6 border-t border-slate-200 pt-6">
                  <h3 className="text-sm font-semibold">Write a review</h3>
                  <form onSubmit={onSubmitReview} className="mt-3 space-y-3">
                    <div className="grid gap-3 sm:grid-cols-3">
                      <div className="sm:col-span-1">
                        <label
                          className="text-sm font-medium"
                          htmlFor="trek-review-rating"
                        >
                          Rating
                        </label>
                        <select
                          id="trek-review-rating"
                          value={reviewRating}
                          onChange={(e) => setReviewRating(e.target.value)}
                          className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                        >
                          <option value="5">5</option>
                          <option value="4">4</option>
                          <option value="3">3</option>
                          <option value="2">2</option>
                          <option value="1">1</option>
                        </select>
                      </div>
                      <div className="sm:col-span-2">
                        <label
                          className="text-sm font-medium"
                          htmlFor="trek-review-text"
                        >
                          Review
                        </label>
                        <textarea
                          id="trek-review-text"
                          value={reviewText}
                          onChange={(e) => setReviewText(e.target.value)}
                          className="mt-1 min-h-24 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                          placeholder="Share your experience…"
                          maxLength={2000}
                        />
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="submit"
                        disabled={isSubmittingReview}
                        className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        {isSubmittingReview ? "Submitting…" : "Submit"}
                      </button>
                      <p className="self-center text-xs text-slate-500">
                        Submission is admin-moderated.
                      </p>
                    </div>
                  </form>
                </div>
              </div>
            </section>

            <aside className="lg:col-span-2">
              <div className="rounded-2xl border border-slate-200 bg-white p-6">
                <h2 className="text-base font-semibold">Trek details</h2>

                <dl className="mt-4 grid gap-3 text-sm">
                  <div className="flex items-center justify-between gap-6">
                    <dt className="text-slate-600">Difficulty</dt>
                    <dd className="font-medium">
                      {formatDifficulty(trek.difficulty)}
                    </dd>
                  </div>

                  <div className="flex items-center justify-between gap-6">
                    <dt className="text-slate-600">Duration</dt>
                    <dd className="font-medium">
                      {trek.durationDays ? `${trek.durationDays} day(s)` : "—"}
                    </dd>
                  </div>

                  <div className="flex items-center justify-between gap-6">
                    <dt className="text-slate-600">Distance</dt>
                    <dd className="font-medium">
                      {formatNumber(trek.distanceKm)
                        ? `${formatNumber(trek.distanceKm)} km`
                        : "—"}
                    </dd>
                  </div>

                  <div className="flex items-center justify-between gap-6">
                    <dt className="text-slate-600">Best season</dt>
                    <dd className="font-medium">{bestSeasonText || "—"}</dd>
                  </div>

                  <div className="flex items-center justify-between gap-6">
                    <dt className="text-slate-600">Price</dt>
                    <dd className="font-medium">
                      {formatPriceInr(trek.price) || "—"}
                    </dd>
                  </div>

                  {typeof trek.ratingAverage === "number" ? (
                    <div className="flex items-center justify-between gap-6">
                      <dt className="text-slate-600">Rating</dt>
                      <dd className="font-medium">
                        {trek.ratingCount
                          ? `${trek.ratingAverage.toFixed(1)} (${trek.ratingCount})`
                          : "—"}
                      </dd>
                    </div>
                  ) : null}
                </dl>

                <div className="mt-6 flex flex-wrap gap-2">
                  <Link
                    to="/treks"
                    className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                  >
                    Browse more
                  </Link>
                </div>
              </div>
            </aside>
          </div>
        ) : null}
      </main>
    </div>
  );
}
