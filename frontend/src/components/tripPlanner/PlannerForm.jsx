import {
  CalendarDays,
  Gauge,
  MapPin,
  MessageSquareText,
  Navigation,
  Timer,
  Users,
  Wallet,
} from "lucide-react";

import FormInput from "./FormInput";
import FormSelect from "./FormSelect";
import GenerateButton from "./GenerateButton";

function cleanString(value) {
  return String(value ?? "").trim();
}

export default function PlannerForm({
  values,
  onChange,
  onSubmit,
  isSubmitting,
  interestsPresets,
}) {
  const interestsPresetValues = Array.isArray(interestsPresets)
    ? interestsPresets.map((x) => x.value)
    : [];

  const interestsSelectValue = interestsPresetValues.includes(values.interests)
    ? values.interests
    : "__custom__";

  const showCustomInterests = interestsSelectValue === "__custom__";

  return (
    <form onSubmit={onSubmit} className="space-y-7">
      <div>
        <p className="text-sm font-semibold tracking-tight text-slate-900">
          Trip Basics
        </p>
        <p className="mt-1 text-sm leading-relaxed text-slate-600">
          Where you’re going and when you start.
        </p>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <FormInput
              id="tp-destination"
              label="Destination"
              value={values.destination}
              onChange={(e) => onChange("destination", e.target.value)}
              icon={MapPin}
              required
              helperText="Example: Pauri Garhwal"
              autoComplete="off"
            />
          </div>

          <FormInput
            id="tp-from"
            label="Starting from"
            value={values.from}
            onChange={(e) => onChange("from", e.target.value)}
            icon={Navigation}
            helperText="Optional — helps AI optimize travel time"
            autoComplete="off"
          />

          <FormInput
            id="tp-start"
            label="Start date"
            type="date"
            value={values.startDate}
            onChange={(e) => onChange("startDate", e.target.value)}
            icon={CalendarDays}
            helperText="Optional — leave empty for a flexible plan"
          />
        </div>
      </div>

      <div>
        <p className="text-sm font-semibold tracking-tight text-slate-900">
          Travel Details
        </p>
        <p className="mt-1 text-sm leading-relaxed text-slate-600">
          Duration, group size, and budget.
        </p>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <FormInput
            id="tp-days"
            label="Trip length (days)"
            value={values.days}
            onChange={(e) => onChange("days", e.target.value)}
            icon={Timer}
            inputMode="numeric"
            required
            helperText="Minimum 1 day"
          />

          <FormInput
            id="tp-travelers"
            label="Travelers"
            value={values.travelers}
            onChange={(e) => onChange("travelers", e.target.value)}
            icon={Users}
            inputMode="numeric"
            helperText="Adults + kids (total count)"
          />

          <div className="sm:col-span-2">
            <FormInput
              id="tp-budget"
              label="Budget"
              value={values.budget}
              onChange={(e) => onChange("budget", e.target.value)}
              icon={Wallet}
              helperText="Optional — e.g., INR 15,000 (mid-range)"
              autoComplete="off"
            />
          </div>
        </div>
      </div>

      <div>
        <p className="text-sm font-semibold tracking-tight text-slate-900">
          Preferences
        </p>
        <p className="mt-1 text-sm leading-relaxed text-slate-600">
          Travel style and what you enjoy.
        </p>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <FormSelect
            id="tp-pace"
            label="Pace"
            value={values.pace}
            onChange={(e) => onChange("pace", e.target.value)}
            icon={Gauge}
            required
            options={[
              { value: "relaxed", label: "Relaxed" },
              { value: "balanced", label: "Balanced" },
              { value: "packed", label: "Packed" },
            ]}
            placeholder="Choose pace"
            helperText="Relaxed = fewer stops, more downtime"
          />

          <FormSelect
            id="tp-interests"
            label="Interests"
            value={interestsSelectValue}
            onChange={(e) => {
              const next = e.target.value;
              if (next === "__custom__") return;
              onChange("interests", next);
            }}
            icon={() => (
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="h-5 w-5 text-slate-500 transition-colors group-focus-within:text-indigo-600"
                aria-hidden="true"
              >
                <path
                  d="M12 21s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12Z"
                  className="stroke-current"
                  strokeWidth="1.8"
                />
                <path
                  d="M9.5 10.2a2.5 2.5 0 0 1 5 0c0 2.2-2.5 3.3-2.5 3.3s-2.5-1.1-2.5-3.3Z"
                  className="stroke-current"
                  strokeWidth="1.8"
                />
              </svg>
            )}
            options={[
              ...(Array.isArray(interestsPresets) ? interestsPresets : []),
              { value: "__custom__", label: "Custom" },
            ]}
            placeholder="Pick interests"
            helperText="Choose a preset or select Custom"
          />

          {showCustomInterests ? (
            <div className="sm:col-span-2">
              <FormInput
                id="tp-interests-custom"
                label="Custom interests"
                value={values.interests}
                onChange={(e) => onChange("interests", e.target.value)}
                icon={MapPin}
                helperText="Comma-separated — e.g., nature, temples, local food"
                autoComplete="off"
              />
            </div>
          ) : null}

          <div className="sm:col-span-2">
            <FormInput
              id="tp-notes"
              label="Notes"
              value={values.notes}
              onChange={(e) => onChange("notes", e.target.value)}
              icon={MessageSquareText}
              multiline
              rows={4}
              helperText="Optional — constraints like senior-friendly, must-see places, etc."
              autoComplete="off"
            />
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <GenerateButton
          isLoading={isSubmitting}
          disabled={
            !cleanString(values.destination) || !cleanString(values.days)
          }
        />
        <p className="text-xs leading-relaxed text-slate-500">
          We’ll generate a plan using Gemini. You can edit details and
          regenerate anytime.
        </p>
      </div>
    </form>
  );
}
