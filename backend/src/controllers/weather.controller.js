import axios from "axios";

function cleanString(value) {
  return String(value ?? "").trim();
}

function toNumberOrNull(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export async function getWeatherByCity(req, res) {
  try {
    const apiKey = cleanString(process.env.WEATHER_API_KEY);
    if (!apiKey) {
      return res
        .status(500)
        .json({ message: "WEATHER_API_KEY is not configured on the server" });
    }

    const requestedCity = cleanString(req.params?.city);
    if (!requestedCity) {
      return res.status(400).json({ message: "city is required" });
    }

    const fallbackCity =
      cleanString(process.env.WEATHER_FALLBACK_CITY) || "pauri";

    const url = "https://api.openweathermap.org/data/2.5/weather";

    async function fetchCity(cityName) {
      return axios.get(url, {
        params: {
          q: cityName,
          appid: apiKey,
          units: "metric",
        },
        timeout: 10000,
      });
    }

    let response;
    let resolvedCity = requestedCity;
    try {
      response = await fetchCity(requestedCity);
    } catch (firstErr) {
      if (firstErr?.response?.status === 404) {
        resolvedCity = fallbackCity;
        response = await fetchCity(fallbackCity);
      } else {
        throw firstErr;
      }
    }

    const data = response?.data || {};
    const weather0 = Array.isArray(data.weather) ? data.weather[0] : null;

    return res.status(200).json({
      city: cleanString(data?.name) || resolvedCity,
      temp: toNumberOrNull(data?.main?.temp),
      weather: cleanString(weather0?.main),
      description: cleanString(weather0?.description),
      humidity: toNumberOrNull(data?.main?.humidity),
      windSpeed: toNumberOrNull(data?.wind?.speed),
      icon: cleanString(weather0?.icon),
    });
  } catch (err) {
    const status = err?.response?.status;
    const providerMessage =
      cleanString(err?.response?.data?.message) ||
      cleanString(err?.response?.data?.error) ||
      cleanString(err?.message);

    if (status === 404) {
      return res.status(404).json({ message: "City not found" });
    }

    if (status === 401) {
      // Typically: invalid or missing OpenWeather API key.
      return res
        .status(500)
        .json({ message: "Invalid OpenWeather API key (WEATHER_API_KEY)" });
    }

    if (status === 429) {
      return res
        .status(503)
        .json({ message: "Weather provider rate limit exceeded" });
    }

    if (status) {
      return res.status(502).json({
        message: providerMessage
          ? `Weather provider error: ${providerMessage}`
          : "Weather provider error",
      });
    }

    console.error("Weather fetch failed:", providerMessage || err);
    return res.status(502).json({
      message: providerMessage
        ? `Weather provider unavailable: ${providerMessage}`
        : "Weather provider unavailable",
    });
  }
}
