import { useMemo } from "react";
import { MapContainer, Marker, Popup, TileLayer, Tooltip } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";

function toNumberOrNull(value) {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  if (!text) return null;
  const n = Number(text);
  return Number.isFinite(n) ? n : null;
}

function cleanString(value) {
  return String(value ?? "").trim();
}

function buildGoogleMapsLink(lat, lng, label) {
  const safeLat = toNumberOrNull(lat);
  const safeLng = toNumberOrNull(lng);
  if (safeLat === null || safeLng === null) return "";

  const safeLabel = cleanString(label);
  const query = safeLabel
    ? `${safeLabel} ${safeLat},${safeLng}`
    : `${safeLat},${safeLng}`;

  // Using the Maps URLs API search form tends to resolve to a place card
  // (with photos) more often than a raw lat/lng link.
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    query,
  )}`;
}

export default function DestinationMapCard({
  destinationName,
  locationText,
  coordinates,
  googleMapsUrl,
  nearbyPlaces,
}) {
  const lat = toNumberOrNull(coordinates?.lat);
  const lng = toNumberOrNull(coordinates?.lng);
  const hasCoords =
    lat !== null && lng !== null && !(Number(lat) === 0 && Number(lng) === 0);

  const places = useMemo(() => {
    if (!Array.isArray(nearbyPlaces)) return [];

    return nearbyPlaces
      .map((p) => {
        const pLat = toNumberOrNull(p?.coordinates?.lat);
        const pLng = toNumberOrNull(p?.coordinates?.lng);
        if (pLat === null || pLng === null) return null;
        if (Number(pLat) === 0 && Number(pLng) === 0) return null;

        const name = String(p?.name || "").trim();
        const description = String(p?.description || "").trim();
        const googleMapsUrl = String(p?.googleMapsUrl || "").trim();

        return {
          name: name || "Nearby place",
          description,
          coordinates: { lat: pLat, lng: pLng },
          googleMapsUrl:
            googleMapsUrl || buildGoogleMapsLink(pLat, pLng, name || ""),
        };
      })
      .filter(Boolean);
  }, [nearbyPlaces]);

  const destinationGoogleMapsUrl = useMemo(() => {
    const explicit = cleanString(googleMapsUrl);
    if (explicit) return explicit;
    if (!hasCoords) return "";
    return buildGoogleMapsLink(lat, lng, destinationName);
  }, [googleMapsUrl, hasCoords, lat, lng, destinationName]);

  return (
    <div className="rounded-3xl border border-slate-200/70 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold tracking-tight text-slate-900">
            Map
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Nearby landmarks and location
          </p>
        </div>
      </div>

      {hasCoords ? (
        <>
          <div className="mt-4 h-64 overflow-hidden rounded-2xl border border-slate-200/70 bg-slate-100 sm:h-72">
            <MapContainer
              key={`${lat},${lng}`}
              center={[lat, lng]}
              zoom={13}
              scrollWheelZoom={false}
              attributionControl={false}
              className="h-full w-full"
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://www.esri.com/">Esri</a>'
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                maxZoom={19}
              />
              <TileLayer
                attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Hillshade/MapServer/tile/{z}/{y}/{x}"
                opacity={0.25}
                maxZoom={19}
              />
              <TileLayer
                attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
                url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
                maxZoom={19}
              />

              <Marker position={[lat, lng]}>
                <Tooltip
                  permanent
                  direction="top"
                  offset={[0, -12]}
                  opacity={1}
                >
                  {destinationName || "Destination"}
                </Tooltip>
                <Popup>
                  <div className="space-y-1">
                    <p className="font-semibold">
                      {destinationName || "Destination"}
                    </p>
                    {locationText ? (
                      <p className="text-sm text-slate-700">{locationText}</p>
                    ) : null}
                    {destinationGoogleMapsUrl ? (
                      <a
                        href={destinationGoogleMapsUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm font-medium text-slate-900 hover:underline"
                      >
                        Open in Google Maps
                      </a>
                    ) : null}
                  </div>
                </Popup>
              </Marker>

              {places.length ? (
                <MarkerClusterGroup chunkedLoading>
                  {places.map((p) => (
                    <Marker
                      key={`${p.name}-${p.coordinates.lat}-${p.coordinates.lng}`}
                      position={[p.coordinates.lat, p.coordinates.lng]}
                    >
                      <Popup>
                        <div className="space-y-1">
                          <p className="font-semibold">{p.name}</p>
                          {p.description ? (
                            <p className="text-sm text-slate-700">
                              {p.description}
                            </p>
                          ) : null}
                          {p.googleMapsUrl ? (
                            <a
                              href={p.googleMapsUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-sm font-medium text-slate-900 hover:underline"
                            >
                              Open in Google Maps
                            </a>
                          ) : null}
                        </div>
                      </Popup>
                    </Marker>
                  ))}
                </MarkerClusterGroup>
              ) : null}
            </MapContainer>
          </div>

          <p className="mt-2 text-[11px] leading-snug text-slate-500">
            Map tiles &copy; Esri. Labels &copy; Esri. Data &copy; OpenStreetMap
            contributors.
          </p>
        </>
      ) : (
        <p className="mt-3 text-sm text-slate-600">
          Coordinates not set for this destination.
        </p>
      )}

      {places.length ? (
        <p className="mt-3 text-xs text-slate-500">
          Showing {places.length} nearby place{places.length === 1 ? "" : "s"}.
        </p>
      ) : null}
    </div>
  );
}
