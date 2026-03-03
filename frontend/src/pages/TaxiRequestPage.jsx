import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { createTaxiRequest } from "../api/taxiRequests";

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

function getTaxiTokenStorageKey() {
  const jwt = localStorage.getItem("dp_token");
  const payload = decodeJwtPayload(jwt);
  const userId = payload && typeof payload === "object" ? payload.id : null;
  if (userId) return `dp_taxi_public_token_${String(userId)}`;
  return "dp_taxi_public_token_guest";
}

export default function TaxiRequestPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const preset = useMemo(() => {
    const state = location.state;
    if (!state || typeof state !== "object") return {};
    return state;
  }, [location.state]);

  const [pickupLocation, setPickupLocation] = useState("");
  const [dropLocation, setDropLocation] = useState(
    cleanString(preset.dropLocation) || "",
  );
  const [dateTime, setDateTime] = useState("");
  const [passengers, setPassengers] = useState("1");
  const [tripType, setTripType] = useState("local");
  const [contactNumber, setContactNumber] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const destinationName = cleanString(preset.destinationName);
  const destinationId = cleanString(preset.destinationId) || null;

  async function onSubmit(e) {
    e.preventDefault();
    if (isSubmitting) return;

    const payload = {
      destinationId,
      pickupLocation: cleanString(pickupLocation),
      dropLocation: cleanString(dropLocation),
      dateTime,
      passengers: Number(passengers),
      tripType,
      contactNumber: cleanString(contactNumber),
    };

    if (!payload.pickupLocation) {
      toast.error("Pickup location is required");
      return;
    }

    if (!payload.dropLocation) {
      toast.error("Drop location is required");
      return;
    }

    if (!payload.dateTime) {
      toast.error("Date & time is required");
      return;
    }

    if (!Number.isFinite(payload.passengers) || payload.passengers < 1) {
      toast.error("Number of passengers is required");
      return;
    }

    if (!payload.contactNumber) {
      toast.error("Contact number is required");
      return;
    }

    try {
      setIsSubmitting(true);
      const created = await createTaxiRequest(payload);
      if (created && typeof created === "object" && "publicToken" in created) {
        const t = String(created.publicToken || "").trim();
        if (t) {
          const key = getTaxiTokenStorageKey();
          localStorage.setItem(key, t);
          localStorage.removeItem("dp_taxi_public_token");
        }
      }
      toast.success("Taxi request sent to admin");
      navigate("/destinations");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Request failed");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-dvh bg-white text-slate-900">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <Link to="/" className="font-semibold tracking-tight">
            Discover Pauri
          </Link>
          <Link
            to="/destinations"
            className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
          >
            Back
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Taxi request
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          Fill the details and we’ll assign a local taxi/driver.
        </p>

        {destinationName ? (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
            Destination: <span className="font-medium">{destinationName}</span>
          </div>
        ) : null}

        <form
          onSubmit={onSubmit}
          className="mt-6 rounded-2xl border border-slate-200 bg-white p-6"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="text-sm font-medium" htmlFor="pickup">
                Pickup location
              </label>
              <input
                id="pickup"
                value={pickupLocation}
                onChange={(e) => setPickupLocation(e.target.value)}
                placeholder="Enter pickup location"
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-sm font-medium" htmlFor="drop">
                Drop location
              </label>
              <input
                id="drop"
                value={dropLocation}
                onChange={(e) => setDropLocation(e.target.value)}
                placeholder="Enter drop location"
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="text-sm font-medium" htmlFor="datetime">
                Date & time
              </label>
              <input
                id="datetime"
                type="datetime-local"
                value={dateTime}
                onChange={(e) => setDateTime(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="text-sm font-medium" htmlFor="passengers">
                Number of passengers
              </label>
              <input
                id="passengers"
                inputMode="numeric"
                value={passengers}
                onChange={(e) =>
                  setPassengers(toPositiveIntOrEmpty(e.target.value))
                }
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="text-sm font-medium" htmlFor="triptype">
                Trip type
              </label>
              <select
                id="triptype"
                value={tripType}
                onChange={(e) => setTripType(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
              >
                <option value="local">Local</option>
                <option value="outstation">Outstation</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium" htmlFor="contact">
                Contact number
              </label>
              <input
                id="contact"
                type="tel"
                value={contactNumber}
                onChange={(e) => setContactNumber(e.target.value)}
                placeholder="Phone / WhatsApp"
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div className="mt-6 flex items-center justify-end gap-2">
            <Link
              to="/destinations"
              className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-900 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
            >
              {isSubmitting ? "Requesting…" : "Request Taxi"}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
