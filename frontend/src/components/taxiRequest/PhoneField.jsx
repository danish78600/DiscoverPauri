import { useState } from "react";
import { Phone } from "lucide-react";

import BookingField from "./BookingField";
import BookingSelect from "./BookingSelect";

function cleanString(value) {
  return String(value ?? "").trim();
}

function splitPhone(value) {
  const raw = cleanString(value);
  if (!raw) return { code: "+91", number: "" };

  const match = raw.match(/^(\+\d{1,4})(?:\s*(.*))?$/);
  if (match) {
    return { code: match[1], number: cleanString(match[2]) };
  }

  return { code: "+91", number: raw };
}

export default function PhoneField({
  value,
  onChange,
  label = "Contact number",
  helperText,
  errorText,
  disabled = false,
  required = false,
  className = "",
}) {
  const [code, setCode] = useState(() => splitPhone(value).code);
  const [number, setNumber] = useState(() => splitPhone(value).number);

  function emit(nextCode, nextNumber) {
    const c = cleanString(nextCode);
    const n = cleanString(nextNumber);
    const combined = n ? `${c} ${n}` : "";
    onChange?.(combined);
  }

  return (
    <div className={`w-full ${className}`.trim()}>
      <div className="grid gap-3 sm:grid-cols-[140px,1fr]">
        <BookingSelect
          label="Code"
          value={code}
          onChange={(e) => {
            const next = e.target.value;
            setCode(next);
            emit(next, number);
          }}
          disabled={disabled}
          required={required}
          options={[
            { value: "+91", label: "+91 (IN)" },
            { value: "+1", label: "+1 (US)" },
            { value: "+44", label: "+44 (UK)" },
            { value: "+971", label: "+971 (UAE)" },
          ]}
        />

        <BookingField
          label={label}
          value={number}
          onChange={(e) => {
            const next = e.target.value;
            setNumber(next);
            emit(code, next);
          }}
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="Phone / WhatsApp"
          icon={(props) => <Phone {...props} />}
          disabled={disabled}
          required={required}
          helperText={helperText}
          errorText={errorText}
        />
      </div>
    </div>
  );
}
