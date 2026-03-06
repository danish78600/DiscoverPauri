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

  const [assignedTrip, setAssignedTrip] = useState(null);

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
        if (!isAssigned || (!driverName && !driverContact)) {
          setAssignedTrip(null);
          return;
        }

        setAssignedTrip(data);
      } catch {
        if (!cancelled) setAssignedTrip(null);
      }
    }

    void loadAssignedTrip();
    return () => {
      cancelled = true;
    };
  }, [taxiPublicToken]);

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
      setAssignedTrip(null);
      setIsLoggingOut(false);
      navigate("/");
    }
  }

  return (
    <div className="min-h-dvh bg-slate-50 text-slate-900 antialiased">
      <header className="sticky top-0 z-10 border-b border-slate-200/70 bg-white/75 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <a
            href="#top"
            className="font-semibold tracking-tight text-slate-900"
          >
            Discover Pauri
          </a>
          <nav className="hidden items-center gap-1 text-sm text-slate-600 sm:flex">
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
            <Link
              to="/trip-planner"
              className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
            >
              Plan a Trip
            </Link>
          </div>
        </div>
      </header>

      <main id="top">
        {assignedTrip ? (
          <section className="mx-auto max-w-6xl px-4 pt-6">
            <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
              <p className="text-sm font-semibold text-slate-900">
                Driver assigned to your trip
              </p>
              <p className="mt-1 text-sm text-slate-700">
                <span className="font-medium">
                  {assignedTrip?.assignedDriver?.name || "Driver"}
                </span>
                {assignedTrip?.assignedDriver?.contact ? (
                  <>
                    {" "}
                    (
                    <a
                      href={`tel:${assignedTrip.assignedDriver.contact}`}
                      className="font-medium text-slate-900 underline decoration-slate-300 underline-offset-2 hover:decoration-slate-500"
                    >
                      {assignedTrip.assignedDriver.contact}
                    </a>
                    )
                  </>
                ) : null}{" "}
                is assigned to you for trip starting at{" "}
                <span className="font-medium text-slate-900">
                  {assignedTrip?.dateTime
                    ? new Date(assignedTrip.dateTime).toLocaleString()
                    : "(time not set)"}
                </span>
                .
              </p>
            </div>
          </section>
        ) : null}

        <section className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
          <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
            <div className="pointer-events-none absolute inset-0 bg-linear-to-b from-white via-white to-slate-50" />
            <div className="relative grid items-center gap-10 lg:grid-cols-2">
              <div>
                <p className="text-sm font-medium text-slate-600">
                  Uttarakhand • Himalayas • Local guides
                </p>
                <h1 className="mt-3 text-4xl font-semibold leading-[1.05] tracking-tight sm:text-6xl">
                  Explore Pauri, simply.
                </h1>
                <p className="mt-4 max-w-xl text-base leading-relaxed text-slate-600">
                  Discover scenic treks, viewpoints, and peaceful stays around
                  Pauri Garhwal—curated for quick planning and a relaxed
                  experience.
                </p>

                <div className="mt-7 flex flex-wrap gap-3">
                  <Link
                    to="/treks"
                    className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                  >
                    Browse Treks
                  </Link>
                  <Link
                    to="/destinations"
                    className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-900 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                  >
                    Browse Destinations
                  </Link>
                  <a
                    href="#highlights"
                    className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-900 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                  >
                    See Highlights
                  </a>
                </div>

                <div className="mt-6 flex flex-wrap gap-2 text-xs text-slate-600">
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1">
                    Local recommendations
                  </span>
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1">
                    Easy itineraries
                  </span>
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1">
                    Responsible travel
                  </span>
                </div>

                <dl className="mt-9 grid grid-cols-3 gap-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                  <div>
                    <dt className="text-xs font-medium text-slate-600">
                      Best Season
                    </dt>
                    <dd className="mt-1 text-sm font-semibold">Mar–Jun</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-slate-600">
                      Trip Style
                    </dt>
                    <dd className="mt-1 text-sm font-semibold">
                      Easy–Moderate
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-slate-600">From</dt>
                    <dd className="mt-1 text-sm font-semibold">Pauri Town</dd>
                  </div>
                </dl>
              </div>

              <div className="relative">
                <div className="relative aspect-4/3 w-full overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 shadow-sm">
                  <img
                    src={uttrakhandImg}
                    alt="Uttarakhand landscape"
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                  <div className="pointer-events-none absolute inset-0 bg-linear-to-tr from-slate-900/50 via-slate-900/10 to-transparent" />
                  <div className="absolute bottom-3 left-3 inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/80 px-3 py-1 text-xs font-medium text-slate-900 backdrop-blur">
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-slate-900" />
                    Pauri, Uttarakhand
                  </div>
                </div>
                <div className="pointer-events-none absolute -bottom-5 -left-5 hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:block">
                  <p className="text-xs font-medium text-slate-600">
                    Quick tip
                  </p>
                  <p className="mt-1 text-sm font-semibold">
                    Start early for clearer mountain views.
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
          <div className="mx-auto max-w-6xl px-4 py-14">
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
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-slate-300"
                >
                  <h3 className="text-base font-semibold">{item.title}</h3>
                  <p className="mt-2 text-sm text-slate-600">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section
          id="treks"
          className="scroll-mt-24 border-t border-slate-200 bg-white"
        >
          <div className="mx-auto max-w-6xl px-4 py-14">
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
                  className="rounded-2xl border border-slate-200 bg-slate-50/40 p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-slate-300"
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
            <div className="grid gap-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:grid-cols-2 lg:items-center lg:p-10">
              <div>
                <h2 className="text-3xl font-semibold tracking-tight">
                  Plan your Pauri trip
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  Tell us your dates and travel style. We’ll suggest a simple
                  plan you can follow.
                </p>
                <ul className="mt-5 space-y-2 text-sm text-slate-700">
                  <li>• Best for: weekends, slow travel, quick getaways</li>
                  <li>• Includes: trek ideas, viewpoints, stay areas</li>
                  <li>• You can plug in real forms/API later</li>
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
