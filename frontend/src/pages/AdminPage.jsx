import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";
import { logout } from "../api/auth";
import {
  createDestination,
  deleteDestination,
  getAllDestinations,
  updateDestination,
} from "../api/destinations";
import { uploadImage } from "../api/uploads";
import { createTrek, deleteTrek, getAllTreks, updateTrek } from "../api/treks";

function cleanString(value) {
  const v = String(value ?? "").trim();
  return v;
}

function toNumberOrNull(value) {
  if (value == null) return null;
  const text = String(value).trim();
  if (!text) return null;
  const n = Number(text);
  if (Number.isNaN(n)) return null;
  return n;
}

const emptyDestination = {
  name: "",
  slug: "",
  shortDescription: "",
  description: "",
  isFeatured: false,
  images: [],
};

const emptyTrek = {
  title: "",
  slug: "",
  summary: "",
  description: "",
  difficulty: "moderate",
  durationDays: "",
  distanceKm: "",
  maxAltitudeM: "",
  isFeatured: false,
  heroImageUrl: "",
  imageUrls: [],
};

export default function AdminPage() {
  const navigate = useNavigate();

  const [token, setToken] = useState(() => localStorage.getItem("dp_token"));
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const [destinations, setDestinations] = useState([]);
  const [treks, setTreks] = useState([]);
  const [status, setStatus] = useState("idle"); // idle | loading | success | error
  const [errorMessage, setErrorMessage] = useState("");

  const [destinationForm, setDestinationForm] = useState(emptyDestination);
  const [editingDestinationId, setEditingDestinationId] = useState(null);
  const [isSavingDestination, setIsSavingDestination] = useState(false);
  const [isUploadingDestinationImage, setIsUploadingDestinationImage] =
    useState(false);

  const [trekForm, setTrekForm] = useState(emptyTrek);
  const [editingTrekId, setEditingTrekId] = useState(null);
  const [isSavingTrek, setIsSavingTrek] = useState(false);
  const [isUploadingTrekImage, setIsUploadingTrekImage] = useState(false);

  const isEditingDestination = Boolean(editingDestinationId);
  const isEditingTrek = Boolean(editingTrekId);

  const sortedDestinations = useMemo(() => {
    return [...(Array.isArray(destinations) ? destinations : [])].sort((a, b) =>
      String(a?.name || "").localeCompare(String(b?.name || "")),
    );
  }, [destinations]);

  const sortedTreks = useMemo(() => {
    return [...(Array.isArray(treks) ? treks : [])].sort((a, b) =>
      String(a?.title || "").localeCompare(String(b?.title || "")),
    );
  }, [treks]);

  async function loadAll() {
    try {
      setStatus("loading");
      setErrorMessage("");

      const [destData, trekData] = await Promise.all([
        getAllDestinations(),
        getAllTreks(),
      ]);

      setDestinations(Array.isArray(destData) ? destData : []);
      setTreks(Array.isArray(trekData) ? trekData : []);
      setStatus("success");
    } catch (err) {
      setStatus("error");
      setErrorMessage(
        err instanceof Error ? err.message : "Failed to load admin data",
      );
    }
  }

  useEffect(() => {
    void loadAll();
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
      setIsLoggingOut(false);
      navigate("/");
    }
  }

  function startEditDestination(dest) {
    setEditingDestinationId(dest?._id || null);
    setDestinationForm({
      name: cleanString(dest?.name),
      slug: cleanString(dest?.slug),
      shortDescription: cleanString(dest?.shortDescription),
      description: cleanString(dest?.description),
      isFeatured: Boolean(dest?.isFeatured),
      images: Array.isArray(dest?.images)
        ? dest.images.filter(Boolean)
        : emptyDestination.images,
    });
  }

  function resetDestinationForm() {
    setEditingDestinationId(null);
    setDestinationForm(emptyDestination);
  }

  async function saveDestination(e) {
    e.preventDefault();
    if (isSavingDestination) return;

    const name = cleanString(destinationForm.name);
    if (!name) {
      toast.error("Destination name is required");
      return;
    }

    if (!token) {
      toast.error("Missing auth token");
      return;
    }

    const payload = {
      name,
      shortDescription: cleanString(destinationForm.shortDescription),
      description: cleanString(destinationForm.description),
      isFeatured: Boolean(destinationForm.isFeatured),
      images: Array.isArray(destinationForm.images)
        ? destinationForm.images.filter(Boolean)
        : [],
    };

    const slug = cleanString(destinationForm.slug);
    if (slug) payload.slug = slug;

    try {
      setIsSavingDestination(true);

      if (isEditingDestination) {
        await updateDestination(editingDestinationId, payload, token);
        toast.success("Destination updated");
      } else {
        await createDestination(payload, token);
        toast.success("Destination created");
      }

      resetDestinationForm();
      await loadAll();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setIsSavingDestination(false);
    }
  }

  async function onDeleteDestination(dest) {
    if (!token) {
      toast.error("Missing auth token");
      return;
    }

    const ok = window.confirm(
      `Delete destination “${dest?.name || "this destination"}”?`,
    );
    if (!ok) return;

    try {
      await deleteDestination(dest?._id, token);
      toast.success("Destination deleted");
      if (editingDestinationId === dest?._id) resetDestinationForm();
      await loadAll();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    }
  }

  async function onUploadDestinationImage(file) {
    if (!file) return;
    if (!token) {
      toast.error("Missing auth token");
      return;
    }

    try {
      setIsUploadingDestinationImage(true);
      const result = await uploadImage(file, token);
      setDestinationForm((prev) => ({
        ...prev,
        images: [
          ...(Array.isArray(prev.images) ? prev.images : []),
          result.url,
        ],
      }));
      toast.success("Image uploaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setIsUploadingDestinationImage(false);
    }
  }

  function removeDestinationImage(url) {
    setDestinationForm((prev) => ({
      ...prev,
      images: (Array.isArray(prev.images) ? prev.images : []).filter(
        (u) => u !== url,
      ),
    }));
  }

  function startEditTrek(trek) {
    setEditingTrekId(trek?._id || null);
    setTrekForm({
      title: cleanString(trek?.title),
      slug: cleanString(trek?.slug),
      summary: cleanString(trek?.summary),
      description: cleanString(trek?.description),
      difficulty: cleanString(trek?.difficulty) || "moderate",
      durationDays: trek?.durationDays != null ? String(trek.durationDays) : "",
      distanceKm: trek?.distanceKm != null ? String(trek.distanceKm) : "",
      maxAltitudeM: trek?.maxAltitudeM != null ? String(trek.maxAltitudeM) : "",
      isFeatured: Boolean(trek?.isFeatured),
      heroImageUrl: cleanString(trek?.heroImageUrl),
      imageUrls: Array.isArray(trek?.imageUrls)
        ? trek.imageUrls.filter(Boolean)
        : emptyTrek.imageUrls,
    });
  }

  function resetTrekForm() {
    setEditingTrekId(null);
    setTrekForm(emptyTrek);
  }

  async function saveTrek(e) {
    e.preventDefault();
    if (isSavingTrek) return;

    const title = cleanString(trekForm.title);
    if (!title) {
      toast.error("Trek title is required");
      return;
    }

    const durationDays = toNumberOrNull(trekForm.durationDays);
    if (!durationDays || durationDays < 1) {
      toast.error("Duration (days) is required");
      return;
    }

    if (!token) {
      toast.error("Missing auth token");
      return;
    }

    const payload = {
      title,
      summary: cleanString(trekForm.summary),
      description: cleanString(trekForm.description),
      difficulty: cleanString(trekForm.difficulty) || "moderate",
      durationDays,
      distanceKm: toNumberOrNull(trekForm.distanceKm),
      maxAltitudeM: toNumberOrNull(trekForm.maxAltitudeM),
      isFeatured: Boolean(trekForm.isFeatured),
      heroImageUrl: cleanString(trekForm.heroImageUrl) || null,
      imageUrls: Array.isArray(trekForm.imageUrls)
        ? trekForm.imageUrls.filter(Boolean)
        : [],
    };

    const slug = cleanString(trekForm.slug);
    if (slug) payload.slug = slug;

    try {
      setIsSavingTrek(true);

      if (isEditingTrek) {
        await updateTrek(editingTrekId, payload, token);
        toast.success("Trek updated");
      } else {
        await createTrek(payload, token);
        toast.success("Trek created");
      }

      resetTrekForm();
      await loadAll();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setIsSavingTrek(false);
    }
  }

  async function onDeleteTrek(trek) {
    if (!token) {
      toast.error("Missing auth token");
      return;
    }

    const ok = window.confirm(`Delete trek “${trek?.title || "this trek"}”?`);
    if (!ok) return;

    try {
      await deleteTrek(trek?._id, token);
      toast.success("Trek deleted");
      if (editingTrekId === trek?._id) resetTrekForm();
      await loadAll();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    }
  }

  async function onUploadTrekImage(file, mode) {
    if (!file) return;
    if (!token) {
      toast.error("Missing auth token");
      return;
    }

    try {
      setIsUploadingTrekImage(true);
      const result = await uploadImage(file, token);

      if (mode === "hero") {
        setTrekForm((prev) => ({ ...prev, heroImageUrl: result.url }));
      } else {
        setTrekForm((prev) => ({
          ...prev,
          imageUrls: [
            ...(Array.isArray(prev.imageUrls) ? prev.imageUrls : []),
            result.url,
          ],
        }));
      }

      toast.success("Image uploaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setIsUploadingTrekImage(false);
    }
  }

  function removeTrekImage(url) {
    setTrekForm((prev) => ({
      ...prev,
      imageUrls: (Array.isArray(prev.imageUrls) ? prev.imageUrls : []).filter(
        (u) => u !== url,
      ),
    }));
  }

  return (
    <div className="min-h-dvh bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-10 border-b border-slate-200/70 bg-white/75 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link to="/" className="font-semibold tracking-tight">
            Discover Pauri
          </Link>
          <div className="flex items-center gap-2">
            <Link
              to="/treks"
              className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
            >
              Treks
            </Link>
            {token ? (
              <button
                type="button"
                onClick={onLogout}
                disabled={isLoggingOut}
                className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
              >
                {isLoggingOut ? "Logging out…" : "Logout"}
              </button>
            ) : null}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Admin
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
              Manage destinations, treks, and upload images.
            </p>
          </div>
          <button
            type="button"
            onClick={loadAll}
            className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
          >
            Refresh
          </button>
        </div>

        {status === "error" ? (
          <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-6">
            <p className="text-sm font-medium text-red-900">Couldn’t load</p>
            <p className="mt-2 text-sm text-red-800">{errorMessage}</p>
          </div>
        ) : null}

        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border border-slate-200 bg-white p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">Destinations</h2>
                <p className="mt-1 text-sm text-slate-600">
                  Add, edit, delete destinations.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  to="/admin/destinations/new"
                  className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                >
                  Add
                </Link>
                <button
                  type="button"
                  onClick={resetDestinationForm}
                  className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                >
                  Quick edit
                </button>
              </div>
            </div>

            <div className="mt-6 grid gap-4">
              <div className="max-h-72 overflow-auto rounded-xl border border-slate-200">
                {sortedDestinations.length ? (
                  <ul className="divide-y divide-slate-200 text-sm">
                    {sortedDestinations.map((dest) => (
                      <li
                        key={dest._id || dest.slug || dest.name}
                        className="flex items-center justify-between gap-3 px-4 py-3"
                      >
                        <div className="min-w-0">
                          <p className="truncate font-medium">
                            {dest.name || "Untitled"}
                          </p>
                          <p className="truncate text-xs text-slate-500">
                            {dest.slug ? `/${dest.slug}` : "No slug"}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          {dest.isFeatured ? (
                            <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-medium text-slate-700">
                              Featured
                            </span>
                          ) : null}
                          <button
                            type="button"
                            onClick={() => startEditDestination(dest)}
                            className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium hover:bg-slate-50"
                          >
                            Edit
                          </button>
                          {dest.slug ? (
                            <Link
                              to={`/admin/destinations/${dest.slug}/edit`}
                              className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium hover:bg-slate-50"
                            >
                              Full edit
                            </Link>
                          ) : null}
                          <button
                            type="button"
                            onClick={() => onDeleteDestination(dest)}
                            className="rounded-lg border border-red-200 bg-white px-2.5 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50"
                          >
                            Delete
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="p-4 text-sm text-slate-600">
                    {status === "loading"
                      ? "Loading destinations…"
                      : "No destinations yet."}
                  </div>
                )}
              </div>

              <form onSubmit={saveDestination} className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium" htmlFor="d-name">
                      Name
                    </label>
                    <input
                      id="d-name"
                      value={destinationForm.name}
                      onChange={(e) =>
                        setDestinationForm((p) => ({
                          ...p,
                          name: e.target.value,
                        }))
                      }
                      className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                      placeholder="e.g., Khirsu"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium" htmlFor="d-slug">
                      Slug (optional)
                    </label>
                    <input
                      id="d-slug"
                      value={destinationForm.slug}
                      onChange={(e) =>
                        setDestinationForm((p) => ({
                          ...p,
                          slug: e.target.value,
                        }))
                      }
                      className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                      placeholder="khirsu"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium" htmlFor="d-short">
                    Short description
                  </label>
                  <input
                    id="d-short"
                    value={destinationForm.shortDescription}
                    onChange={(e) =>
                      setDestinationForm((p) => ({
                        ...p,
                        shortDescription: e.target.value,
                      }))
                    }
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                    placeholder="1–2 lines"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium" htmlFor="d-desc">
                    Description
                  </label>
                  <textarea
                    id="d-desc"
                    value={destinationForm.description}
                    onChange={(e) =>
                      setDestinationForm((p) => ({
                        ...p,
                        description: e.target.value,
                      }))
                    }
                    className="mt-1 min-h-28 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                    placeholder="Details…"
                  />
                </div>

                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={destinationForm.isFeatured}
                    onChange={(e) =>
                      setDestinationForm((p) => ({
                        ...p,
                        isFeatured: e.target.checked,
                      }))
                    }
                    className="h-4 w-4 rounded border-slate-300"
                  />
                  Featured
                </label>

                <div>
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium">Images</p>
                    <label className="text-xs font-medium text-slate-600">
                      <input
                        type="file"
                        accept="image/*"
                        disabled={isUploadingDestinationImage}
                        onChange={(e) => {
                          const file = e.target.files?.[0] || null;
                          e.target.value = "";
                          void onUploadDestinationImage(file);
                        }}
                        className="hidden"
                      />
                      <span className="inline-flex cursor-pointer items-center justify-center rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-900 hover:bg-slate-50">
                        {isUploadingDestinationImage ? "Uploading…" : "Upload"}
                      </span>
                    </label>
                  </div>

                  {destinationForm.images?.length ? (
                    <div className="mt-3 grid gap-2">
                      {destinationForm.images.map((url) => (
                        <div
                          key={url}
                          className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2"
                        >
                          <a
                            href={url}
                            target="_blank"
                            rel="noreferrer"
                            className="min-w-0 truncate text-xs text-slate-700 hover:underline"
                          >
                            {url}
                          </a>
                          <button
                            type="button"
                            onClick={() => removeDestinationImage(url)}
                            className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium hover:bg-slate-50"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-2 text-xs text-slate-500">
                      No images yet.
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="submit"
                    disabled={isSavingDestination}
                    className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {isSavingDestination
                      ? "Saving…"
                      : isEditingDestination
                        ? "Save changes"
                        : "Create destination"}
                  </button>
                  {isEditingDestination ? (
                    <button
                      type="button"
                      onClick={resetDestinationForm}
                      className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-900 transition-colors hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                  ) : null}
                </div>
              </form>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">Treks</h2>
                <p className="mt-1 text-sm text-slate-600">
                  Add, edit, delete treks.
                </p>
              </div>
              <button
                type="button"
                onClick={resetTrekForm}
                className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
              >
                New
              </button>
            </div>

            <div className="mt-6 grid gap-4">
              <div className="max-h-72 overflow-auto rounded-xl border border-slate-200">
                {sortedTreks.length ? (
                  <ul className="divide-y divide-slate-200 text-sm">
                    {sortedTreks.map((trek) => (
                      <li
                        key={trek._id || trek.slug || trek.title}
                        className="flex items-center justify-between gap-3 px-4 py-3"
                      >
                        <div className="min-w-0">
                          <p className="truncate font-medium">
                            {trek.title || "Untitled"}
                          </p>
                          <p className="truncate text-xs text-slate-500">
                            {trek.slug ? `/${trek.slug}` : "No slug"}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          {trek.isFeatured ? (
                            <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-medium text-slate-700">
                              Featured
                            </span>
                          ) : null}
                          <button
                            type="button"
                            onClick={() => startEditTrek(trek)}
                            className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium hover:bg-slate-50"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteTrek(trek)}
                            className="rounded-lg border border-red-200 bg-white px-2.5 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50"
                          >
                            Delete
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="p-4 text-sm text-slate-600">
                    {status === "loading" ? "Loading treks…" : "No treks yet."}
                  </div>
                )}
              </div>

              <form onSubmit={saveTrek} className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium" htmlFor="t-title">
                      Title
                    </label>
                    <input
                      id="t-title"
                      value={trekForm.title}
                      onChange={(e) =>
                        setTrekForm((p) => ({ ...p, title: e.target.value }))
                      }
                      className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                      placeholder="e.g., Chandrashila"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium" htmlFor="t-slug">
                      Slug (optional)
                    </label>
                    <input
                      id="t-slug"
                      value={trekForm.slug}
                      onChange={(e) =>
                        setTrekForm((p) => ({ ...p, slug: e.target.value }))
                      }
                      className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                      placeholder="chandrashila"
                    />
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label
                      className="text-sm font-medium"
                      htmlFor="t-difficulty"
                    >
                      Difficulty
                    </label>
                    <select
                      id="t-difficulty"
                      value={trekForm.difficulty}
                      onChange={(e) =>
                        setTrekForm((p) => ({
                          ...p,
                          difficulty: e.target.value,
                        }))
                      }
                      className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                    >
                      <option value="easy">Easy</option>
                      <option value="moderate">Moderate</option>
                      <option value="hard">Hard</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium" htmlFor="t-duration">
                      Duration (days)
                    </label>
                    <input
                      id="t-duration"
                      type="number"
                      min={1}
                      value={trekForm.durationDays}
                      onChange={(e) =>
                        setTrekForm((p) => ({
                          ...p,
                          durationDays: e.target.value,
                        }))
                      }
                      className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                      placeholder="2"
                    />
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium" htmlFor="t-distance">
                      Distance (km)
                    </label>
                    <input
                      id="t-distance"
                      type="number"
                      value={trekForm.distanceKm}
                      onChange={(e) =>
                        setTrekForm((p) => ({
                          ...p,
                          distanceKm: e.target.value,
                        }))
                      }
                      className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                      placeholder="10"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium" htmlFor="t-alt">
                      Max altitude (m)
                    </label>
                    <input
                      id="t-alt"
                      type="number"
                      value={trekForm.maxAltitudeM}
                      onChange={(e) =>
                        setTrekForm((p) => ({
                          ...p,
                          maxAltitudeM: e.target.value,
                        }))
                      }
                      className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                      placeholder="2500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium" htmlFor="t-summary">
                    Summary
                  </label>
                  <input
                    id="t-summary"
                    value={trekForm.summary}
                    onChange={(e) =>
                      setTrekForm((p) => ({ ...p, summary: e.target.value }))
                    }
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                    placeholder="1–2 lines"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium" htmlFor="t-desc">
                    Description
                  </label>
                  <textarea
                    id="t-desc"
                    value={trekForm.description}
                    onChange={(e) =>
                      setTrekForm((p) => ({
                        ...p,
                        description: e.target.value,
                      }))
                    }
                    className="mt-1 min-h-28 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                    placeholder="Details…"
                  />
                </div>

                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={trekForm.isFeatured}
                    onChange={(e) =>
                      setTrekForm((p) => ({
                        ...p,
                        isFeatured: e.target.checked,
                      }))
                    }
                    className="h-4 w-4 rounded border-slate-300"
                  />
                  Featured
                </label>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-sm font-medium">Images</p>
                    <div className="flex items-center gap-2">
                      <label className="text-xs font-medium text-slate-600">
                        <input
                          type="file"
                          accept="image/*"
                          disabled={isUploadingTrekImage}
                          onChange={(e) => {
                            const file = e.target.files?.[0] || null;
                            e.target.value = "";
                            void onUploadTrekImage(file, "hero");
                          }}
                          className="hidden"
                        />
                        <span className="inline-flex cursor-pointer items-center justify-center rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-900 hover:bg-slate-50">
                          {isUploadingTrekImage ? "Uploading…" : "Upload hero"}
                        </span>
                      </label>
                      <label className="text-xs font-medium text-slate-600">
                        <input
                          type="file"
                          accept="image/*"
                          disabled={isUploadingTrekImage}
                          onChange={(e) => {
                            const file = e.target.files?.[0] || null;
                            e.target.value = "";
                            void onUploadTrekImage(file, "gallery");
                          }}
                          className="hidden"
                        />
                        <span className="inline-flex cursor-pointer items-center justify-center rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-900 hover:bg-slate-50">
                          {isUploadingTrekImage
                            ? "Uploading…"
                            : "Upload gallery"}
                        </span>
                      </label>
                    </div>
                  </div>

                  <div className="mt-3 grid gap-3">
                    <div>
                      <label
                        className="text-xs font-medium text-slate-600"
                        htmlFor="t-hero"
                      >
                        Hero image URL
                      </label>
                      <input
                        id="t-hero"
                        value={trekForm.heroImageUrl}
                        onChange={(e) =>
                          setTrekForm((p) => ({
                            ...p,
                            heroImageUrl: e.target.value,
                          }))
                        }
                        className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                        placeholder="https://…"
                      />
                    </div>

                    {trekForm.imageUrls?.length ? (
                      <div className="grid gap-2">
                        {trekForm.imageUrls.map((url) => (
                          <div
                            key={url}
                            className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2"
                          >
                            <a
                              href={url}
                              target="_blank"
                              rel="noreferrer"
                              className="min-w-0 truncate text-xs text-slate-700 hover:underline"
                            >
                              {url}
                            </a>
                            <button
                              type="button"
                              onClick={() => removeTrekImage(url)}
                              className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium hover:bg-slate-50"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500">
                        No gallery images yet.
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="submit"
                    disabled={isSavingTrek}
                    className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {isSavingTrek
                      ? "Saving…"
                      : isEditingTrek
                        ? "Save changes"
                        : "Create trek"}
                  </button>
                  {isEditingTrek ? (
                    <button
                      type="button"
                      onClick={resetTrekForm}
                      className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-900 transition-colors hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                  ) : null}
                </div>
              </form>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
