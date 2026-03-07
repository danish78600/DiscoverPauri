import uttrakhandImg from "../assets/uttrakhand.jpg";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";
import { logout } from "../api/auth";
import { getPublicTaxiRequest } from "../api/taxiRequests";

function decodeJwtPayload(token) {
  const parts = String(token || "").split(".");
  if (parts.length < 2) return null;

  try {
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
    const json = atob(padded);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function getTaxiTokenStorageKey(jwtToken) {
  const payload = decodeJwtPayload(jwtToken);
  const userId = payload && typeof payload === "object" ? payload.id : null;
  if (userId) return `dp_taxi_public_token_${String(userId)}`;
  return "dp_taxi_public_token_guest";
}

const LandingPage = () => {
  const navigate = useNavigate();
  const [token, setToken] = useState(() => localStorage.getItem("dp_token"));
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const [taxiRequest, setTaxiRequest] = useState(null);

  const taxiPublicToken = useMemo(() => {
    const key = getTaxiTokenStorageKey(token);
    const legacy = String(
      localStorage.getItem("dp_taxi_public_token") || "",
    ).trim();
    const current = String(localStorage.getItem(key) || "").trim();

    // One-time migration: legacy key -> guest key only.
    if (!token && legacy && !current) {
      localStorage.setItem("dp_taxi_public_token_guest", legacy);
    }
    if (legacy) {
      localStorage.removeItem("dp_taxi_public_token");
    }

    return String(localStorage.getItem(key) || "").trim();
  }, [token]);

  useEffect(() => {
    let cancelled = false;

    let intervalId = null;

    async function loadAssignedTrip() {
      if (!taxiPublicToken) return;

      try {
        const data = await getPublicTaxiRequest(taxiPublicToken);
        if (cancelled) return;

        const status =
          data && typeof data === "object" ? String(data.status || "") : "";
        const driverName =
          data && typeof data === "object"
            ? String(data?.assignedDriver?.name || "")
            : "";
        const driverContact =
          data && typeof data === "object"
            ? String(data?.assignedDriver?.contact || "")
            : "";

        const isAssigned = status === "assigned" || status === "completed";
        setTaxiRequest(data && typeof data === "object" ? data : null);

        if (isAssigned && (driverName || driverContact)) {
          if (intervalId) {
            clearInterval(intervalId);
            intervalId = null;
          }
        }
      } catch {
        if (!cancelled) setTaxiRequest(null);
      }
    }

    void loadAssignedTrip();

    // Poll until assigned so the banner updates without refresh.
    if (taxiPublicToken) {
      intervalId = setInterval(() => {
        void loadAssignedTrip();
      }, 20000);
    }

    return () => {
      cancelled = true;

      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [taxiPublicToken]);

  useEffect(() => {
    function onScroll() {
      setIsScrolled(window.scrollY > 8);
    }

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
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
  }, []);

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
      setTaxiRequest(null);
      setIsLoggingOut(false);
      navigate("/");
    }
  }

  function closeMenu() {
    setIsMenuOpen(false);
  }

  return (
    <div className="min-h-dvh bg-slate-50 text-slate-900 antialiased">
      <a
        href="#top"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-xl focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-slate-900 focus:shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-400/40"
      >
        Skip to content
      </a>

      <header
        className={
          "sticky top-0 z-20 transition " +
          (isScrolled
            ? "border-b border-slate-200/70 bg-white/75 backdrop-blur"
            : "border-b border-transparent bg-transparent")
        }
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <a
            href="#top"
            className="font-semibold tracking-tight text-slate-900"
          >
            Discover Pauri
          </a>
          <nav
            aria-label="Homepage"
            className="hidden items-center gap-1 text-sm text-slate-600 sm:flex"
          >
            <a
              href="#highlights"
              className="rounded-md px-3 py-2 transition-colors hover:bg-slate-100 hover:text-slate-900"
            >
              Highlights
            </a>
            <a
              href="#treks"
              className="rounded-md px-3 py-2 transition-colors hover:bg-slate-100 hover:text-slate-900"
            >
              Treks
            </a>
            <a
              href="#contact"
              className="rounded-md px-3 py-2 transition-colors hover:bg-slate-100 hover:text-slate-900"
            >
              Contact
            </a>
          </nav>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsMenuOpen((v) => !v)}
              aria-expanded={isMenuOpen}
              aria-controls="dp-mobile-nav"
              className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white/70 px-3 py-2 text-sm font-medium text-slate-900 shadow-sm backdrop-blur transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/40 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50 sm:hidden"
            >
              <span className="sr-only">Menu</span>
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path
                  d="M4 7H20M4 12H20M4 17H20"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>
            {token ? (
              <button
                type="button"
                onClick={onLogout}
                disabled={isLoggingOut}
                className="hidden items-center justify-center rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/40 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50 sm:inline-flex"
              >
                {isLoggingOut ? "Logging out…" : "Logout"}
              </button>
            ) : (
              <>
                <Link
                  to="/login"
                  className="hidden rounded-xl px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/40 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50 sm:inline-flex"
                >
                  Log in
                </Link>
                <Link
                  to="/signup"
                  className="hidden items-center justify-center rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/40 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50 sm:inline-flex"
                >
                  Sign up
                </Link>
              </>
            )}
            {token ? (
              <Link
                to="/my-trips"
                className="hidden items-center justify-center rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/40 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50 sm:inline-flex"
              >
                My Trips
              </Link>
            ) : null}
            <Link
              to="/trip-planner"
              className="hidden items-center justify-center rounded-xl bg-slate-900 px-3 py-2 text-sm font-medium text-white shadow-sm ring-1 ring-slate-900/10 transition hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-md active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/40 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50 sm:inline-flex"
            >
              Plan a Trip
            </Link>
          </div>
        </div>

        <div
          id="dp-mobile-nav"
          className={
            "sm:hidden " +
            (isMenuOpen
              ? "border-t border-slate-200/70 bg-white/80 backdrop-blur"
              : "hidden")
          }
        >
          <div className="mx-auto max-w-6xl px-4 py-3">
            <div className="grid gap-2 text-sm">
              <a
                href="#highlights"
                onClick={closeMenu}
                className="rounded-xl px-3 py-2 font-medium text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-900"
              >
                Highlights
              </a>
              <a
                href="#treks"
                onClick={closeMenu}
                className="rounded-xl px-3 py-2 font-medium text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-900"
              >
                Treks
              </a>
              <a
                href="#contact"
                onClick={closeMenu}
                className="rounded-xl px-3 py-2 font-medium text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-900"
              >
                Contact
              </a>

              <div className="mt-2 grid gap-2">
                {token ? (
                  <>
                    <Link
                      to="/my-trips"
                      onClick={closeMenu}
                      className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900 transition-colors hover:bg-slate-50"
                    >
                      My Trips
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        closeMenu();
                        void onLogout();
                      }}
                      disabled={isLoggingOut}
                      className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {isLoggingOut ? "Logging out…" : "Logout"}
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      to="/login"
                      onClick={closeMenu}
                      className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900 transition-colors hover:bg-slate-50"
                    >
                      Log in
                    </Link>
                    <Link
                      to="/signup"
                      onClick={closeMenu}
                      className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900 transition-colors hover:bg-slate-50"
                    >
                      Sign up
                    </Link>
                  </>
                )}

                <Link
                  to="/trip-planner"
                  onClick={closeMenu}
                  className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800"
                >
                  Plan a Trip
                </Link>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main id="top" className="relative">
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute left-1/2 -top-72 h-96 w-96 -translate-x-1/2 rounded-full bg-slate-200/60 blur-3xl" />
          <div className="absolute -right-64 top-48 h-80 w-80 rounded-full bg-slate-100 blur-3xl" />
          <div className="absolute -left-72 top-96 h-80 w-80 rounded-full bg-slate-100 blur-3xl" />
        </div>

        {taxiRequest &&
        (taxiRequest.status === "assigned" ||
          taxiRequest.status === "completed") &&
        (taxiRequest?.assignedDriver?.name ||
          taxiRequest?.assignedDriver?.contact) ? (
          <section className="mx-auto max-w-6xl px-4 pt-6">
            <div className="rounded-2xl border border-slate-200 bg-white/90 px-5 py-4 shadow-sm backdrop-blur">
              <p className="text-sm font-semibold text-slate-900">
                Driver assigned to your trip
              </p>
              <p className="mt-1 text-sm text-slate-700">
                <span className="font-medium">
                  {taxiRequest?.assignedDriver?.name || "Driver"}
                </span>
                {taxiRequest?.assignedDriver?.contact ? (
                  <>
                    {" "}
                    (
                    <a
                      href={`tel:${taxiRequest.assignedDriver.contact}`}
                      className="font-medium text-slate-900 underline decoration-slate-300 underline-offset-2 hover:decoration-slate-500"
                    >
                      {taxiRequest.assignedDriver.contact}
                    </a>
                    )
                  </>
                ) : null}{" "}
                is assigned to you for trip starting at{" "}
                <span className="font-medium text-slate-900">
                  {taxiRequest?.dateTime
                    ? new Date(taxiRequest.dateTime).toLocaleString()
                    : "(time not set)"}
                </span>
                .
              </p>
            </div>
          </section>
        ) : null}

        <section className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
          <div
            className="dp-reveal relative overflow-hidden rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm backdrop-blur sm:p-10"
            data-dp-reveal
          >
            <div className="pointer-events-none absolute inset-0 bg-linear-to-b from-white via-white to-slate-50" />
            <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-slate-100 blur-2xl" />
            <div className="relative grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
              <div>
                <p className="dp-fade-up text-sm font-medium text-slate-600">
                  Uttarakhand • Himalayas • Local guides
                </p>
                <h1 className="mt-3 text-4xl font-semibold leading-[1.05] tracking-tight sm:text-6xl">
                  Explore Pauri, simply.
                </h1>
                <p className="mt-4 max-w-xl text-base leading-relaxed text-slate-600 sm:text-lg">
                  Discover scenic treks, viewpoints, and peaceful stays around
                  Pauri Garhwal—curated for quick planning and a relaxed
                  experience.
                </p>

                <div className="mt-7 flex flex-wrap gap-3">
                  <Link
                    to="/treks"
                    className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm ring-1 ring-slate-900/10 transition hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-md active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/40 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50"
                  >
                    Browse Treks
                  </Link>
                  <Link
                    to="/destinations"
                    className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-900 shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-50 active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/40 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50"
                  >
                    Browse Destinations
                  </Link>
                  <a
                    href="#highlights"
                    className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-900 shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-50 active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/40 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50"
                  >
                    See Highlights
                  </a>
                </div>

                <div className="mt-6 flex flex-wrap gap-2 text-xs text-slate-600">
                  <span className="rounded-full border border-slate-200 bg-white/70 px-3 py-1 shadow-sm backdrop-blur">
                    Local recommendations
                  </span>
                  <span className="rounded-full border border-slate-200 bg-white/70 px-3 py-1 shadow-sm backdrop-blur">
                    Easy itineraries
                  </span>
                  <span className="rounded-full border border-slate-200 bg-white/70 px-3 py-1 shadow-sm backdrop-blur">
                    Responsible travel
                  </span>
                </div>

                <dl className="mt-9 grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-slate-200 bg-white/70 p-4 shadow-sm backdrop-blur">
                    <div className="flex items-start gap-3">
                      <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white shadow-sm">
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                          aria-hidden="true"
                          className="text-slate-700"
                        >
                          <path
                            d="M7 3V6M17 3V6M4 9H20"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                          />
                          <path
                            d="M6 5H18C19.1046 5 20 5.89543 20 7V19C20 20.1046 19.1046 21 18 21H6C4.89543 21 4 20.1046 4 19V7C4 5.89543 4.89543 5 6 5Z"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </span>
                      <div>
                        <dt className="text-xs font-medium text-slate-600">
                          Best season
                        </dt>
                        <dd className="mt-1 text-sm font-semibold text-slate-900">
                          Mar–Jun
                        </dd>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white/70 p-4 shadow-sm backdrop-blur">
                    <div className="flex items-start gap-3">
                      <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white shadow-sm">
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                          aria-hidden="true"
                          className="text-slate-700"
                        >
                          <path
                            d="M4 17H20"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                          />
                          <path
                            d="M7 17V11.5C7 10.1193 8.11929 9 9.5 9H14.5C15.8807 9 17 10.1193 17 11.5V17"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M9 7L12 4L15 7"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </span>
                      <div>
                        <dt className="text-xs font-medium text-slate-600">
                          Trip style
                        </dt>
                        <dd className="mt-1 text-sm font-semibold text-slate-900">
                          Easy–Moderate
                        </dd>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white/70 p-4 shadow-sm backdrop-blur">
                    <div className="flex items-start gap-3">
                      <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white shadow-sm">
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                          aria-hidden="true"
                          className="text-slate-700"
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
                      </span>
                      <div>
                        <dt className="text-xs font-medium text-slate-600">
                          Start from
                        </dt>
                        <dd className="mt-1 text-sm font-semibold text-slate-900">
                          Pauri Town
                        </dd>
                      </div>
                    </div>
                  </div>
                </dl>
              </div>

              <div className="relative">
                <div className="dp-float relative aspect-4/3 w-full overflow-hidden rounded-3xl border border-slate-200 bg-slate-100 shadow-sm">
                  <img
                    src={uttrakhandImg}
                    alt="Uttarakhand landscape"
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                  <div className="pointer-events-none absolute inset-0 bg-linear-to-tr from-slate-900/50 via-slate-900/10 to-transparent" />
                  <div className="absolute bottom-3 left-3 inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/80 px-3 py-1 text-xs font-medium text-slate-900 shadow-sm backdrop-blur">
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-slate-900" />
                    Pauri, Uttarakhand
                  </div>

                  <div className="absolute right-3 top-3 flex flex-col gap-2">
                    <div className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/80 px-3 py-1 text-xs font-medium text-slate-900 shadow-sm backdrop-blur">
                      <span className="inline-block h-1.5 w-1.5 rounded-full bg-orange-500" />
                      Golden hour views
                    </div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/80 px-3 py-1 text-xs font-medium text-slate-900 shadow-sm backdrop-blur">
                      <span className="inline-block h-1.5 w-1.5 rounded-full bg-sky-500" />
                      Calm, uncrowded routes
                    </div>
                  </div>
                </div>
                <div className="pointer-events-none absolute -bottom-6 -left-6 hidden rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm backdrop-blur lg:block">
                  <p className="text-xs font-medium text-slate-600">
                    Quick tip
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">
                    Start early for clearer mountain views.
                  </p>
                  <p className="mt-1 text-xs text-slate-600">
                    Pack a light layer—weather changes fast.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section
          id="highlights"
          className="scroll-mt-24 border-t border-slate-200 bg-slate-50"
        >
          <div
            className="dp-reveal mx-auto max-w-6xl px-4 py-14"
            data-dp-reveal
          >
            <h2 className="text-3xl font-semibold tracking-tight">
              Highlights
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
              A simple shortlist of what most travelers look for: views, walks,
              calm stays, and easy itineraries.
            </p>

            <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  title: "Viewpoints",
                  desc: "Sunrise and sunset spots with wide valley views.",
                },
                {
                  title: "Short Treks",
                  desc: "Half-day and day hikes suitable for most travelers.",
                },
                {
                  title: "Local Stays",
                  desc: "Homestays and quiet escapes away from crowds.",
                },
                {
                  title: "Temples & Culture",
                  desc: "Stops that fit naturally into your route.",
                },
                {
                  title: "Simple Planning",
                  desc: "Clear options—pick a plan and go.",
                },
                {
                  title: "Responsible Travel",
                  desc: "Leave no trace, support local communities.",
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
                >
                  <h3 className="text-base font-semibold">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">
                    {item.desc}
                  </p>
                  <div className="mt-4 h-px w-10 bg-slate-200 transition-colors group-hover:bg-slate-300" />
                </div>
              ))}
            </div>
          </div>
        </section>

        <section
          id="treks"
          className="scroll-mt-24 border-t border-slate-200 bg-white"
        >
          <div
            className="dp-reveal mx-auto max-w-6xl px-4 py-14"
            data-dp-reveal
          >
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
              <div>
                <h2 className="text-3xl font-semibold tracking-tight">
                  Popular treks
                </h2>
                <p className="mt-2 max-w-2xl text-sm text-slate-600">
                  A few easy-to-plan routes around Pauri—ideal for weekends and
                  slow travel.
                </p>
              </div>
              <a
                href="#contact"
                className="text-sm font-medium text-slate-900 hover:underline"
              >
                Want a custom itinerary?
              </a>
            </div>

            <div className="mt-9 grid gap-4 md:grid-cols-3">
              {[
                {
                  name: "Forest Loop Walk",
                  time: "2–3 hours",
                  level: "Easy",
                },
                {
                  name: "Ridge View Hike",
                  time: "Half day",
                  level: "Easy–Moderate",
                },
                {
                  name: "Sunrise Point Trail",
                  time: "1–2 hours",
                  level: "Easy",
                },
              ].map((trek) => (
                <article
                  key={trek.name}
                  className="rounded-2xl border border-slate-200 bg-slate-50/40 p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
                >
                  <h3 className="text-base font-semibold">{trek.name}</h3>
                  <div className="mt-3 flex items-center gap-2 text-xs text-slate-600">
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1">
                      {trek.time}
                    </span>
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1">
                      {trek.level}
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-slate-600">
                    A short, scenic route ideal for a relaxed day.
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section
          id="contact"
          className="scroll-mt-24 border-t border-slate-200 bg-slate-50"
        >
          <div className="mx-auto max-w-6xl px-4 py-14">
            <div
              className="dp-reveal grid gap-8 rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm backdrop-blur lg:grid-cols-2 lg:items-center lg:p-10"
              data-dp-reveal
            >
              <div>
                <h2 className="text-3xl font-semibold tracking-tight">
                  Plan your Pauri trip
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  Tell us your dates and travel style. We’ll suggest a simple
                  plan you can follow.
                </p>
                <ul className="mt-5 list-disc space-y-2 pl-5 text-sm text-slate-700">
                  <li>Best for: weekends, slow travel, quick getaways</li>
                  <li>Includes: trek ideas, viewpoints, stay areas</li>
                  <li>Form submission is UI-only for now</li>
                </ul>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <form className="space-y-3">
                  <div>
                    <label className="text-sm font-medium" htmlFor="name">
                      Name
                    </label>
                    <input
                      id="name"
                      type="text"
                      placeholder="Your name"
                      className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 transition focus-visible:border-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium" htmlFor="dates">
                      Dates
                    </label>
                    <input
                      id="dates"
                      type="text"
                      placeholder="e.g., 10–12 April"
                      className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 transition focus-visible:border-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium" htmlFor="note">
                      Note
                    </label>
                    <textarea
                      id="note"
                      rows={3}
                      placeholder="What kind of trip are you planning?"
                      className="mt-1 w-full resize-none rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 transition focus-visible:border-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                    />
                  </div>
                  <button
                    type="button"
                    className="inline-flex w-full items-center justify-center rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                  >
                    Send (demo)
                  </button>
                  <p className="text-xs text-slate-500">
                    This form is UI-only for now.
                  </p>
                </form>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-8 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} Discover Pauri • Curated travel ideas
            for Pauri, Uttarakhand.
          </p>
          <div className="flex gap-4">
            <a className="hover:text-slate-900" href="#top">
              Back to top
            </a>
            <a className="hover:text-slate-900" href="#contact">
              Contact
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
