import { useMemo, useState } from "react";
import {
  CalendarClock,
  CarTaxiFront,
  MapPinned,
  Navigation,
  Route,
  Users,
} from "lucide-react";
import toast from "react-hot-toast";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { createTaxiRequest } from "../api/taxiRequests";

import BookingButton from "../components/taxiRequest/BookingButton";
import BookingField from "../components/taxiRequest/BookingField";
import BookingPreviewCard from "../components/taxiRequest/BookingPreviewCard";
import BookingSelect from "../components/taxiRequest/BookingSelect";
import PhoneField from "../components/taxiRequest/PhoneField";
import StepPill from "../components/taxiRequest/StepPill";

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
  const [showErrors, setShowErrors] = useState(false);

  const destinationName = cleanString(preset.destinationName);
  const destinationId = cleanString(preset.destinationId) || null;

  const errors = useMemo(() => {
    const pickup = cleanString(pickupLocation);
    const drop = cleanString(dropLocation);
    const contact = cleanString(contactNumber);
    const pax = Number(passengers);

    return {
      pickupLocation: pickup ? "" : "Pickup location is required",
      dropLocation: drop ? "" : "Drop location is required",
      dateTime: dateTime ? "" : "Date & time is required",
      passengers:
        Number.isFinite(pax) && pax >= 1
          ? ""
          : "Number of passengers is required",
      tripType: tripType ? "" : "Trip type is required",
      contactNumber: contact ? "" : "Contact number is required",
    };
  }, [
    pickupLocation,
    dropLocation,
    dateTime,
    passengers,
    tripType,
    contactNumber,
  ]);

  async function onSubmit(e) {
    e.preventDefault();
    if (isSubmitting) return;

    setShowErrors(true);

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
    <div className="min-h-dvh bg-gradient-to-b from-slate-50 via-white to-slate-50 text-slate-900">
      <main className="mx-auto flex max-w-2xl flex-col px-4 py-10 sm:py-14">
        <div className="rounded-3xl border border-slate-200/70 bg-white/70 p-5 shadow-xl shadow-slate-900/5 backdrop-blur-2xl sm:p-7">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <Link
                to="/"
                className="inline-flex items-center gap-2 text-sm font-semibold text-slate-900"
              >
                <span className="grid h-9 w-9 place-items-center rounded-2xl border border-slate-200 bg-white">
                  <CarTaxiFront
                    className="h-5 w-5 text-indigo-600"
                    aria-hidden="true"
                  />
                </span>
                <span className="truncate">Discover Pauri</span>
              </Link>
              <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
                Taxi request
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                Fill the details and we’ll assign a local taxi/driver.
              </p>
            </div>

            <div className="flex flex-col items-end gap-3">
              <StepPill
                steps={["Details", "Confirm", "Send"]}
                currentStep={1}
                tone="light"
              />
              <BookingButton
                variant="secondary"
                tone="light"
                type="button"
                onClick={() => navigate("/destinations")}
              >
                Back
              </BookingButton>
            </div>
          </div>

          {destinationName ? (
            <div className="mt-5 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800">
                <MapPinned
                  className="h-4 w-4 text-indigo-600"
                  aria-hidden="true"
                />
                <span className="max-w-[22rem] truncate">
                  {destinationName}
                </span>
              </span>
              {!destinationId ? (
                <span className="text-xs text-slate-500">
                  (Destination not linked)
                </span>
              ) : null}
            </div>
          ) : null}

          <form onSubmit={onSubmit} className="mt-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <BookingField
                  label="Pickup location"
                  value={pickupLocation}
                  onChange={(e) => setPickupLocation(e.target.value)}
                  placeholder="Enter pickup location"
                  icon={(props) => <Navigation {...props} />}
                  errorText={showErrors ? errors.pickupLocation : ""}
                />
              </div>

              <div className="sm:col-span-2">
                <BookingField
                  label="Drop location"
                  value={dropLocation}
                  onChange={(e) => setDropLocation(e.target.value)}
                  placeholder="Enter drop location"
                  icon={(props) => <MapPinned {...props} />}
                  errorText={showErrors ? errors.dropLocation : ""}
                />
              </div>

              <BookingField
                label="Date & time"
                type="datetime-local"
                value={dateTime}
                onChange={(e) => setDateTime(e.target.value)}
                icon={(props) => <CalendarClock {...props} />}
                errorText={showErrors ? errors.dateTime : ""}
              />

              <BookingField
                label="Passengers"
                value={passengers}
                onChange={(e) =>
                  setPassengers(toPositiveIntOrEmpty(e.target.value))
                }
                inputMode="numeric"
                placeholder="1"
                icon={(props) => <Users {...props} />}
                errorText={showErrors ? errors.passengers : ""}
              />

              <BookingSelect
                label="Trip type"
                value={tripType}
                onChange={(e) => setTripType(e.target.value)}
                icon={(props) => <Route {...props} />}
                options={[
                  { value: "local", label: "Local" },
                  { value: "outstation", label: "Outstation" },
                ]}
              />

              <PhoneField
                value={contactNumber}
                onChange={(combined) => setContactNumber(combined)}
                label="Contact number"
                helperText="Phone/WhatsApp where driver can reach you."
                errorText={showErrors ? errors.contactNumber : ""}
                required={false}
              />
            </div>

            <div className="mt-6">
              <BookingPreviewCard
                title="Estimated fare"
                subtitle="A quick estimate will appear here once confirmed."
                icon={CarTaxiFront}
                tone="light"
              >
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                      Distance
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">
                      —
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                      Time
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">
                      —
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                      Fare
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">
                      —
                    </p>
                  </div>
                </div>
              </BookingPreviewCard>
            </div>

            <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
              <BookingButton
                variant="secondary"
                tone="light"
                type="button"
                className="sm:mr-auto"
                onClick={() => navigate("/destinations")}
              >
                Cancel
              </BookingButton>
              <BookingButton type="submit" loading={isSubmitting}>
                Request Taxi
              </BookingButton>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
