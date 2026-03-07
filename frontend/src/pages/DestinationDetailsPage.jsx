import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Link, useNavigate, useParams } from "react-router-dom";
import { logout } from "../api/auth";
import { getDestinationBySlug } from "../api/destinations";
import { getApprovedReviews, submitReview } from "../api/reviews";
import DestinationMapCard from "../components/DestinationMapCard";
import DetailsCard from "../components/DetailsCard";
import ReviewCard from "../components/ReviewCard";
import StarRating from "../components/StarRating";
import WeatherWidget from "../components/WeatherWidget";

function joinList(value) {
  if (!Array.isArray(value)) return "";
  return value
    .map((v) => String(v).trim())
    .filter(Boolean)
    .join(", ");
}

export default function DestinationDetailsPage() {
  const { slug } = useParams();
  const navigate = useNavigate();

  const [status, setStatus] = useState("idle"); // idle | loading | success | error
  const [errorMessage, setErrorMessage] = useState("");
  const [destination, setDestination] = useState(null);

  const [reviewsStatus, setReviewsStatus] = useState("idle");
  const [reviewsErrorMessage, setReviewsErrorMessage] = useState("");
  const [reviews, setReviews] = useState([]);

  const [reviewRating, setReviewRating] = useState("5");
  const [reviewText, setReviewText] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const [token, setToken] = useState(() => localStorage.getItem("dp_token"));
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const safeSlug = useMemo(() => String(slug || "").trim(), [slug]);

  async function loadDestination() {
    if (!safeSlug) {
      setStatus("error");
      setErrorMessage("Missing destination slug");
      setDestination(null);
      return;
    }

    try {
      setStatus("loading");
      setErrorMessage("");

      const data = await getDestinationBySlug(safeSlug);
      setDestination(data);
      setStatus("success");
    } catch (err) {
      setStatus("error");
      setDestination(null);
      setErrorMessage(
        err instanceof Error ? err.message : "Failed to load destination",
      );
    }
  }

  useEffect(() => {
    void loadDestination();
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

  const images = Array.isArray(destination?.images)
    ? destination.images.filter(Boolean)
    : [];

  const cover = images.length ? images[0] : null;

  const district = destination?.location?.district || "";
  const state = destination?.location?.state || "";
  const locationText = [district, state].filter(Boolean).join(", ");

  const weatherCity = district || destination?.name || "";

  const bestTimeText = joinList(destination?.bestTimeToVisit);

  async function loadReviews() {
    const id = destination?._id;
    if (!id) return;

    try {
      setReviewsStatus("loading");
      setReviewsErrorMessage("");
      const data = await getApprovedReviews({
        targetType: "destination",
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
    if (status === "success" && destination?._id) {
      void loadReviews();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, destination?._id]);

  async function onSubmitReview(e) {
    e.preventDefault();

    if (isSubmittingReview) return;

    const id = destination?._id;
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
          targetType: "destination",
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

  const averageRating =
    typeof destination?.averageRating === "number"
      ? destination.averageRating
      : null;
  const totalReviews =
    typeof destination?.totalReviews === "number"
      ? destination.totalReviews
      : null;

  return (
    <div className="min-h-dvh bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-1000 border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link to="/" className="font-semibold tracking-tight">
            Discover Pauri
          </Link>

          <div className="flex items-center gap-2">
            <Link
              to="/destinations"
              className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
            >
              Destinations
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
        <Link
          to="/destinations"
          className="text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          ← Back to Destinations
        </Link>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              {destination?.name ||
                (status === "loading" ? "Loading…" : "Destination")}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-600">
              {locationText ? (
                <p className="font-medium text-slate-700">{locationText}</p>
              ) : null}

              {averageRating != null ? (
                <div className="flex items-center gap-2">
                  <StarRating value={averageRating} size="md" />
                  <p className="font-medium text-slate-900">
                    {averageRating.toFixed(1)}
                  </p>
                  {totalReviews ? (
                    <p className="text-slate-500">({totalReviews} reviews)</p>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>

          {destination?.googleMapsUrl ? (
            <a
              href={destination.googleMapsUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex w-fit items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/40 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50"
            >
              Open in Maps
            </a>
          ) : null}
        </div>

        {status === "loading" ? (
          <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">
            Loading destination…
          </div>
        ) : null}

        {status === "error" ? (
          <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-6">
            <p className="text-sm font-medium text-red-900">
              Couldn’t load destination
            </p>
            <p className="mt-2 text-sm text-red-800">{errorMessage}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={loadDestination}
                className="inline-flex items-center justify-center rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-900 transition-colors hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300/50 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
              >
                Retry
              </button>
              <Link
                to="/destinations"
                className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
              >
                Back to Destinations
              </Link>
            </div>
          </div>
        ) : null}

        {status === "success" && destination ? (
          <div className="mt-8 grid gap-6 lg:grid-cols-12 lg:items-start lg:gap-8">
            <div className="lg:col-span-8 space-y-6">
              {cover ? (
                <div className="group relative aspect-video overflow-hidden rounded-3xl border border-slate-200/70 bg-slate-100 shadow-sm transition-shadow hover:shadow-md">
                  <img
                    src={cover}
                    alt={
                      destination.name
                        ? `${destination.name} cover`
                        : "Destination cover"
                    }
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                    loading="lazy"
                  />
                </div>
              ) : (
                <div className="aspect-video overflow-hidden rounded-3xl border border-slate-200/70 bg-slate-100 shadow-sm" />
              )}

              <div className="rounded-3xl border border-slate-200/70 bg-white p-5 shadow-sm sm:p-6">
                <h2 className="text-lg font-semibold tracking-tight text-slate-900">
                  About
                </h2>
                {destination.shortDescription ? (
                  <p className="mt-3 text-sm font-medium text-slate-700">
                    {destination.shortDescription}
                  </p>
                ) : null}
                <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-slate-600">
                  {destination.description || "No description provided."}
                </p>
              </div>

              {images.length > 1 ? (
                <div className="rounded-3xl border border-slate-200/70 bg-white p-5 shadow-sm sm:p-6">
                  <h2 className="text-lg font-semibold tracking-tight text-slate-900">
                    Gallery
                  </h2>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {images.slice(1).map((url) => (
                      <a
                        key={url}
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="group block overflow-hidden rounded-2xl border border-slate-200/70 bg-slate-100 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
                      >
                        <img
                          src={url}
                          alt={
                            destination.name
                              ? `${destination.name} image`
                              : "Destination image"
                          }
                          className="h-40 w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                          loading="lazy"
                        />
                      </a>
                    ))}
                  </div>
                </div>
              ) : null}

              <DestinationMapCard
                destinationName={destination?.name || ""}
                locationText={locationText}
                coordinates={destination?.location?.coordinates}
                googleMapsUrl={destination?.googleMapsUrl}
                nearbyPlaces={destination?.nearbyPlaces}
              />

              <div className="rounded-3xl border border-slate-200/70 bg-white p-5 shadow-sm sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold tracking-tight text-slate-900">
                      Reviews
                    </h2>
                    <p className="mt-1 text-sm text-slate-600">
                      Reviews are visible after admin approval.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={loadReviews}
                    className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/40 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50"
                  >
                    Refresh
                  </button>
                </div>

                <div className="mt-5">
                  {reviewsStatus === "loading" ? (
                    <div className="rounded-2xl border border-slate-200/70 bg-slate-50 p-4 text-sm text-slate-600">
                      Loading reviews…
                    </div>
                  ) : null}

                  {reviewsStatus === "error" ? (
                    <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
                      <p className="text-sm font-medium text-red-900">
                        Couldn’t load reviews
                      </p>
                      <p className="mt-1 text-sm text-red-800">
                        {reviewsErrorMessage}
                      </p>
                    </div>
                  ) : null}

                  {reviewsStatus !== "loading" && reviews.length ? (
                    <div className="grid gap-4 sm:grid-cols-2">
                      {reviews.map((r) => (
                        <ReviewCard key={r?._id} review={r} />
                      ))}
                    </div>
                  ) : reviewsStatus !== "loading" ? (
                    <div className="rounded-2xl border border-slate-200/70 bg-slate-50 p-4 text-sm text-slate-600">
                      No approved reviews yet.
                    </div>
                  ) : null}
                </div>

                <div className="mt-8 border-t border-slate-200 pt-6">
                  <h3 className="text-sm font-semibold text-slate-900">
                    Write a review
                  </h3>
                  {!token ? (
                    <p className="mt-2 text-sm text-slate-600">
                      <Link
                        to="/login"
                        className="font-semibold text-slate-900 hover:underline"
                      >
                        Log in
                      </Link>{" "}
                      to submit a review.
                    </p>
                  ) : (
                    <form onSubmit={onSubmitReview} className="mt-4 space-y-3">
                      <div className="grid gap-3 sm:grid-cols-3">
                        <div className="sm:col-span-1">
                          <label
                            className="text-sm font-medium text-slate-900"
                            htmlFor="review-rating"
                          >
                            Rating
                          </label>
                          <select
                            id="review-rating"
                            value={reviewRating}
                            onChange={(e) => setReviewRating(e.target.value)}
                            className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/40"
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
                            className="text-sm font-medium text-slate-900"
                            htmlFor="review-text"
                          >
                            Review
                          </label>
                          <textarea
                            id="review-text"
                            value={reviewText}
                            onChange={(e) => setReviewText(e.target.value)}
                            className="mt-1 min-h-28 w-full resize-y rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/40"
                            placeholder="Share your experience…"
                            maxLength={2000}
                          />
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-3">
                        <button
                          type="submit"
                          disabled={isSubmittingReview}
                          className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-70"
                        >
                          {isSubmittingReview ? "Submitting…" : "Submit"}
                        </button>
                        <p className="text-xs text-slate-500">
                          Submission is admin-moderated.
                        </p>
                      </div>
                    </form>
                  )}
                </div>
              </div>
            </div>

            <aside className="lg:col-span-4">
              <div className="grid gap-6 lg:sticky lg:top-24">
                <WeatherWidget city={weatherCity} />
                <DetailsCard
                  destination={destination}
                  locationText={locationText}
                  bestTimeText={bestTimeText}
                />
              </div>
            </aside>
          </div>
        ) : null}
      </main>
    </div>
  );
}
