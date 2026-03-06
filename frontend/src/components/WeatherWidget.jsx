import { useEffect, useMemo, useState } from "react";
import { getWeather } from "../api/weather";

function cleanString(value) {
  return String(value ?? "").trim();
}

function formatTemp(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "—";
  return `${Math.round(n)}°C`;
}

function formatWind(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "—";
  return `${n.toFixed(1)} m/s`;
}

export default function WeatherWidget({ city }) {
  const safeCity = useMemo(() => cleanString(city), [city]);
  const [status, setStatus] = useState("idle"); // idle | loading | success | error
  const [data, setData] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!safeCity) {
        setStatus("idle");
        setData(null);
        setErrorMessage("");
        return;
      }

      try {
        setStatus("loading");
        setErrorMessage("");
        const res = await getWeather(safeCity);
        if (cancelled) return;
        setData(res);
        setStatus("success");
      } catch (err) {
        if (cancelled) return;
        setStatus("error");
        setData(null);
        setErrorMessage(
          err instanceof Error ? err.message : "Failed to load weather",
        );
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [safeCity]);

  const icon = cleanString(data?.icon);
  const iconUrl = icon
    ? `https://openweathermap.org/img/wn/${icon}@2x.png`
    : "";

  const displayCity = cleanString(data?.city) || safeCity;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-900">Weather</p>
          <p className="mt-1 text-sm text-slate-600">
            {displayCity ? `Now in ${displayCity}` : "Pick a destination"}
          </p>
        </div>

        {iconUrl ? (
          <img
            src={iconUrl}
            alt={cleanString(data?.description) || "Weather icon"}
            className="h-12 w-12"
            loading="lazy"
          />
        ) : (
          <div className="h-12 w-12 rounded-xl bg-slate-100" />
        )}
      </div>

      {status === "loading" ? (
        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm text-slate-600">Loading weather…</p>
        </div>
      ) : null}

      {status === "error" ? (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4">
          <p className="text-sm font-medium text-red-900">Couldn’t load</p>
          <p className="mt-1 text-sm text-red-800">{errorMessage}</p>
        </div>
      ) : null}

      {status === "success" && data ? (
        <div className="mt-4 grid gap-4">
          <div className="flex items-end justify-between gap-4">
            <p className="text-4xl font-semibold tracking-tight text-slate-900">
              {formatTemp(data?.temp)}
            </p>
            <p className="text-sm font-medium text-slate-700">
              {cleanString(data?.weather) || ""}
            </p>
          </div>

          {cleanString(data?.description) ? (
            <p className="text-sm text-slate-600">
              {cleanString(data.description)}
            </p>
          ) : null}

          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <dt className="text-slate-600">Humidity</dt>
              <dd className="mt-1 font-semibold text-slate-900">
                {Number.isFinite(Number(data?.humidity))
                  ? `${Number(data.humidity)}%`
                  : "—"}
              </dd>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <dt className="text-slate-600">Wind</dt>
              <dd className="mt-1 font-semibold text-slate-900">
                {formatWind(data?.windSpeed)}
              </dd>
            </div>
          </dl>
        </div>
      ) : null}

      {status === "idle" && safeCity ? null : null}
    </div>
  );
}
