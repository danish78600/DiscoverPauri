import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import { generateTripPlan } from "../api/tripPlanner";
import { saveTripPlan } from "../api/trips";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import travelImage from "../assets/uttrakhand.jpg";

import PlannerForm from "../components/tripPlanner/PlannerForm";
import PlanSkeleton from "../components/tripPlanner/PlanSkeleton";
import PlanTimeline from "../components/tripPlanner/PlanTimeline";

function cleanString(value) {
  return String(value ?? "").trim();
}

function toPositiveIntOrEmpty(value) {
  const text = String(value ?? "").trim();
  if (!text) return "";

  const n = Number(text);
  if (!Number.isFinite(n)) return "";
  const i = Math.max(1, Math.floor(n));
  return String(i);
}

export default function TripPlannerPage() {
  const prefersReducedMotion = useReducedMotion();
  const token = useMemo(() => localStorage.getItem("dp_token"), []);

  const [destination, setDestination] = useState("");
  const [from, setFrom] = useState("");
  const [startDate, setStartDate] = useState("");
  const [days, setDays] = useState("2");
  const [travelers, setTravelers] = useState("1");
  const [budget, setBudget] = useState("");
  const [pace, setPace] = useState("balanced");
  const [interests, setInterests] = useState("nature, temples, local food");
  const [notes, setNotes] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedTripId, setSavedTripId] = useState(null);
  const [result, setResult] = useState(null);
  const [progress, setProgress] = useState(0);

  const MotionSection = motion.section;
  const MotionDiv = motion.div;

  const enterUp = prefersReducedMotion
    ? {}
    : {
        initial: { opacity: 0, y: 14 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.55, ease: [0.21, 0.8, 0.28, 1] },
      };

  const plan = useMemo(() => {
    if (!result || typeof result !== "object") return null;
    if (!("plan" in result)) return null;
    return result.plan;
  }, [result]);

  useEffect(() => {
    if (!isSubmitting) {
      setProgress(0);
      return;
    }

    setProgress(8);
    const id = setInterval(() => {
      setProgress((p) => {
        if (p >= 92) return 92;
        const step = Math.max(1, Math.round((92 - p) / 10));
        return Math.min(92, p + step);
      });
    }, 260);

    return () => clearInterval(id);
  }, [isSubmitting]);

  async function onSubmit(e) {
    e.preventDefault();
    if (isSubmitting) return;

    const payload = {
      destination: cleanString(destination),
      from: cleanString(from),
      startDate,
      days: cleanString(days),
      travelers: cleanString(travelers),
      budget: cleanString(budget),
      pace,
      interests: cleanString(interests),
      notes: cleanString(notes),
    };

    if (!payload.destination) {
      toast.error("Destination is required");
      return;
    }

    if (!payload.days) {
      toast.error("Trip length (days) is required");
      return;
    }

    try {
      setIsSubmitting(true);
      setResult(null);
      setSavedTripId(null);

      const data = await generateTripPlan(payload);
      setResult(data);

      toast.success("Trip plan generated");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to generate plan",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function onSave() {
    if (isSaving) return;

    if (!token) {
      toast.error("Please log in to save trips");
      return;
    }

    if (!plan) {
      toast.error("Generate a plan first");
      return;
    }

    const planText =
      typeof plan === "string" ? plan : JSON.stringify(plan, null, 2);

    const payload = {
      destination: cleanString(destination),
      from: cleanString(from),
      startDate,
      days: cleanString(days),
      travelers: cleanString(travelers),
      budget: cleanString(budget),
      pace,
      interests: cleanString(interests),
      notes: cleanString(notes),
      planText,
      aiProvider: "gemini",
    };

    try {
      setIsSaving(true);
      const created = await saveTripPlan(payload, token);
      const id = created && typeof created === "object" ? created._id : null;
      if (id) setSavedTripId(String(id));
      toast.success("Saved to My Trips");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save trip");
    } finally {
      setIsSaving(false);
    }
  }

  const interestsPresets = useMemo(
    () => [
      {
        value: "nature, temples, local food",
        label: "Nature + temples + local food",
      },
      {
        value: "waterfalls, viewpoints, easy hikes",
        label: "Waterfalls + viewpoints + easy hikes",
      },
      {
        value: "hidden gems, photography, cafes",
        label: "Hidden gems + photography + cafes",
      },
      {
        value: "family-friendly, relaxed, scenic",
        label: "Family-friendly + scenic + relaxed",
      },
    ],
    [],
  );

  function onFieldChange(field, nextValue) {
    if (field === "days") {
      setDays(toPositiveIntOrEmpty(nextValue));
      return;
    }
    if (field === "travelers") {
      setTravelers(toPositiveIntOrEmpty(nextValue));
      return;
    }

    if (field === "destination") return setDestination(nextValue);
    if (field === "from") return setFrom(nextValue);
    if (field === "startDate") return setStartDate(nextValue);
    if (field === "budget") return setBudget(nextValue);
    if (field === "pace") return setPace(nextValue);
    if (field === "interests") return setInterests(nextValue);
    if (field === "notes") return setNotes(nextValue);
  }

  const formValues = {
    destination,
    from,
    startDate,
    days,
    travelers,
    budget,
    pace,
    interests,
    notes,
  };

  return (
    <div className="min-h-dvh bg-gradient-to-b from-slate-50 via-white to-slate-50 text-slate-900">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-[900px] items-center justify-between px-4 py-3">
          <Link to="/" className="font-semibold tracking-tight">
            Discover Pauri
          </Link>
          <div className="flex items-center gap-2">
            <Link
              to="/my-trips"
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              My Trips
            </Link>
            <Link
              to="/"
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              Back
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[900px] px-4 py-10 sm:py-14">
        <MotionSection
          {...enterUp}
          className="relative overflow-hidden rounded-3xl border border-slate-200/60 bg-gradient-to-br from-indigo-600 via-indigo-600 to-cyan-500 px-6 py-7 text-white shadow-sm sm:px-8 sm:py-9"
        >
          <MotionDiv
            className="pointer-events-none absolute -left-10 -top-10 h-44 w-44 rounded-full bg-white/15 blur-2xl"
            animate={
              prefersReducedMotion
                ? undefined
                : { x: [0, 14, 0], y: [0, -10, 0], opacity: [0.12, 0.18, 0.12] }
            }
            transition={
              prefersReducedMotion
                ? undefined
                : { duration: 10, repeat: Infinity, ease: "easeInOut" }
            }
          />
          <MotionDiv
            className="pointer-events-none absolute -bottom-10 -right-10 h-52 w-52 rounded-full bg-white/10 blur-2xl"
            animate={
              prefersReducedMotion
                ? undefined
                : { x: [0, -10, 0], y: [0, 12, 0], opacity: [0.1, 0.16, 0.1] }
            }
            transition={
              prefersReducedMotion
                ? undefined
                : { duration: 12, repeat: Infinity, ease: "easeInOut" }
            }
          />

          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/80">
            AI Trip Planner
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
            Plan your perfect trip with AI
          </h1>
          <p className="mt-2 max-w-[60ch] text-sm leading-relaxed text-white/85 sm:text-base">
            Share your destination, dates, and travel style — we’ll generate a
            premium day-by-day itinerary using Gemini.
          </p>

          {isSubmitting ? (
            <div className="mt-5">
              {(() => {
                const clamped = Math.min(92, Math.max(8, progress));
                const width = `${clamped}%`;
                return (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-medium text-white/90">
                        Generating itinerary…
                      </p>
                      <p className="text-sm font-semibold text-white">
                        {Math.min(99, Math.max(8, Math.round(clamped)))}%
                      </p>
                    </div>

                    <div className="h-2 overflow-hidden rounded-full bg-white/20">
                      {prefersReducedMotion ? (
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-white/90 to-white/70"
                          style={{ width }}
                        />
                      ) : (
                        <MotionDiv
                          className="h-full rounded-full bg-gradient-to-r from-white/90 to-white/70"
                          initial={{ width: "8%" }}
                          animate={{ width }}
                          transition={{ duration: 0.35, ease: "easeOut" }}
                        />
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
          ) : null}
        </MotionSection>

        <MotionSection
          {...enterUp}
          transition={
            prefersReducedMotion
              ? undefined
              : { duration: 0.55, delay: 0.05, ease: [0.21, 0.8, 0.28, 1] }
          }
          className="mt-8 grid items-stretch gap-6 lg:grid-cols-2 lg:gap-8"
        >
          <div className="relative h-64 overflow-hidden rounded-3xl border border-slate-200/70 bg-white shadow-sm sm:h-80 lg:h-full">
            <img
              src={travelImage}
              alt="Travel inspiration"
              className="h-full w-full object-cover"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/45 via-slate-900/10 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6">
              <p className="text-sm font-semibold text-white">
                Smarter itineraries, less planning stress.
              </p>
              <p className="mt-1 text-sm text-white/80">
                Designed for scenic travel, local food, and flexible pacing.
              </p>
            </div>
          </div>

          <div className="group rounded-3xl border border-white/50 bg-white/60 p-5 shadow-sm backdrop-blur-xl transition-all hover:-translate-y-0.5 hover:shadow-md supports-backdrop-filter:bg-white/50 sm:p-6">
            <PlannerForm
              values={formValues}
              onChange={onFieldChange}
              onSubmit={onSubmit}
              isSubmitting={isSubmitting}
              interestsPresets={interestsPresets}
            />
          </div>
        </MotionSection>

        <MotionSection
          {...enterUp}
          transition={
            prefersReducedMotion
              ? undefined
              : { duration: 0.55, delay: 0.1, ease: [0.21, 0.8, 0.28, 1] }
          }
          className="mt-10"
        >
          <AnimatePresence mode="wait">
            {plan ? (
              <MotionDiv
                key="plan"
                initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
                animate={
                  prefersReducedMotion ? undefined : { opacity: 1, y: 0 }
                }
                exit={prefersReducedMotion ? undefined : { opacity: 0, y: 12 }}
                transition={
                  prefersReducedMotion ? undefined : { duration: 0.28 }
                }
              >
                <PlanTimeline
                  plan={plan}
                  isSaving={isSaving}
                  savedTripId={savedTripId}
                  onSave={onSave}
                  showCopy
                />
              </MotionDiv>
            ) : isSubmitting ? (
              <MotionDiv
                key="skeleton"
                initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
                animate={
                  prefersReducedMotion ? undefined : { opacity: 1, y: 0 }
                }
                exit={prefersReducedMotion ? undefined : { opacity: 0, y: 12 }}
                transition={
                  prefersReducedMotion ? undefined : { duration: 0.28 }
                }
              >
                <PlanSkeleton />
              </MotionDiv>
            ) : null}
          </AnimatePresence>
        </MotionSection>
      </main>
    </div>
  );
}
