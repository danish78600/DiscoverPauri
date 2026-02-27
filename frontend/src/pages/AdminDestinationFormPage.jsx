import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Link, useNavigate, useParams } from "react-router-dom";
import { logout } from "../api/auth";
import {
  createDestination,
  getDestinationBySlug,
  updateDestination,
} from "../api/destinations";
import { uploadImage } from "../api/uploads";

const DEFAULT_DISTRICT = "Pauri Garhwal";
const DEFAULT_STATE = "Uttarakhand";

function cleanString(value) {
  return String(value ?? "").trim();
}

function splitList(value) {
  const text = cleanString(value);
  if (!text) return [];
  return text
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

function joinList(value) {
  if (!Array.isArray(value)) return "";
  return value
    .map((v) => String(v).trim())
    .filter(Boolean)
    .join(", ");
}

export default function AdminDestinationFormPage() {
  const { slug } = useParams();
  const navigate = useNavigate();

  const token = useMemo(() => localStorage.getItem("dp_token"), []);

  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const [status, setStatus] = useState("idle"); // idle | loading | ready | error
  const [errorMessage, setErrorMessage] = useState("");

  const [destinationId, setDestinationId] = useState(null);

  const [name, setName] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [description, setDescription] = useState("");

  const [categoryId, setCategoryId] = useState("");

  const [district, setDistrict] = useState(DEFAULT_DISTRICT);
  const [stateName, setStateName] = useState(DEFAULT_STATE);

  const [bestTimeToVisitText, setBestTimeToVisitText] = useState("");
  const [entryFee, setEntryFee] = useState("");
  const [timing, setTiming] = useState("");
  const [howToReach, setHowToReach] = useState("");
  const [thingsToCarryText, setThingsToCarryText] = useState("");

  const [isFeatured, setIsFeatured] = useState(false);

  const [images, setImages] = useState([]);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const isEditMode = Boolean(slug);
  const safeSlug = useMemo(() => cleanString(slug), [slug]);

  async function loadForEdit() {
    if (!isEditMode) {
      setStatus("ready");
      return;
    }

    if (!safeSlug) {
      setStatus("error");
      setErrorMessage("Missing destination slug");
      return;
    }

    try {
      setStatus("loading");
      setErrorMessage("");

      const data = await getDestinationBySlug(safeSlug);
      setDestinationId(data?._id || null);

      setName(cleanString(data?.name));
      setShortDescription(cleanString(data?.shortDescription));
      setDescription(cleanString(data?.description));

      setCategoryId(data?.category ? String(data.category) : "");

      setDistrict(cleanString(data?.location?.district) || DEFAULT_DISTRICT);
      setStateName(cleanString(data?.location?.state) || DEFAULT_STATE);

      setBestTimeToVisitText(joinList(data?.bestTimeToVisit));
      setEntryFee(cleanString(data?.entryFee));
      setTiming(cleanString(data?.timing));
      setHowToReach(cleanString(data?.howToReach));
      setThingsToCarryText(joinList(data?.thingsToCarry));

      setIsFeatured(Boolean(data?.isFeatured));

      setImages(Array.isArray(data?.images) ? data.images.filter(Boolean) : []);

      setStatus("ready");
    } catch (err) {
      setStatus("error");
      setErrorMessage(
        err instanceof Error ? err.message : "Failed to load destination",
      );
    }
  }

  useEffect(() => {
    void loadForEdit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [safeSlug, isEditMode]);

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
      setIsLoggingOut(false);
      navigate("/");
    }
  }

  function removeImage(url) {
    setImages((prev) => prev.filter((u) => u !== url));
  }

  async function onUploadFiles(fileList) {
    if (!fileList?.length) return;
    if (!token) {
      toast.error("Missing auth token");
      return;
    }

    try {
      setIsUploadingImages(true);

      for (const file of Array.from(fileList)) {
        const result = await uploadImage(file, token);
        setImages((prev) => [...prev, result.url]);
      }

      toast.success("Images uploaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setIsUploadingImages(false);
    }
  }

  async function onSubmit(e) {
    e.preventDefault();
    if (isSaving) return;

    const trimmedName = cleanString(name);
    if (!trimmedName) {
      toast.error("Name is required");
      return;
    }

    if (!token) {
      toast.error("Missing auth token");
      return;
    }

    const payload = {
      name: trimmedName,
      shortDescription: cleanString(shortDescription),
      description: cleanString(description),

      category: categoryId ? categoryId : null,

      location: {
        district: cleanString(district) || DEFAULT_DISTRICT,
        state: cleanString(stateName) || DEFAULT_STATE,
      },

      bestTimeToVisit: splitList(bestTimeToVisitText),
      entryFee: cleanString(entryFee),
      timing: cleanString(timing),
      howToReach: cleanString(howToReach),
      thingsToCarry: splitList(thingsToCarryText),

      isFeatured: Boolean(isFeatured),
      images: Array.isArray(images) ? images.filter(Boolean) : [],
    };

    try {
      setIsSaving(true);

      if (isEditMode) {
        if (!destinationId) {
          throw new Error("Missing destination id");
        }

        await updateDestination(destinationId, payload, token);
        toast.success("Destination updated");
      } else {
        await createDestination(payload, token);
        toast.success("Destination created");
      }

      navigate("/admin", { replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setIsSaving(false);
    }
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
              to="/admin"
              className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
            >
              Admin
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

      <main className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              {isEditMode ? "Edit destination" : "Add destination"}
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              {isEditMode
                ? "Update destination details."
                : "Create a new destination."}
            </p>
          </div>
          <Link
            to="/admin"
            className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900 transition-colors hover:bg-slate-50"
          >
            Back
          </Link>
        </div>

        {status === "loading" ? (
          <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
            Loading…
          </div>
        ) : null}

        {status === "error" ? (
          <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-6">
            <p className="text-sm font-medium text-red-900">Couldn’t load</p>
            <p className="mt-2 text-sm text-red-800">{errorMessage}</p>
          </div>
        ) : null}

        {status === "ready" ? (
          <form
            onSubmit={onSubmit}
            className="mt-8 space-y-4 rounded-2xl border border-slate-200 bg-white p-6"
          >
            <div>
              <label className="text-sm font-medium" htmlFor="name">
                Name
              </label>
              <input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="text-sm font-medium" htmlFor="short">
                Short description
              </label>
              <input
                id="short"
                value={shortDescription}
                onChange={(e) => setShortDescription(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="text-sm font-medium" htmlFor="desc">
                Description
              </label>
              <textarea
                id="desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-1 min-h-28 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="text-sm font-medium" htmlFor="category">
                Category
              </label>
              <select
                id="category"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
              >
                <option value="">None</option>
              </select>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium" htmlFor="district">
                  District
                </label>
                <input
                  id="district"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-sm font-medium" htmlFor="state">
                  State
                </label>
                <input
                  id="state"
                  value={stateName}
                  onChange={(e) => setStateName(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium" htmlFor="bestTime">
                Best time to visit
              </label>
              <input
                id="bestTime"
                value={bestTimeToVisitText}
                onChange={(e) => setBestTimeToVisitText(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                placeholder="e.g., Mar–Jun, Sep–Nov"
              />
              <p className="mt-2 text-xs text-slate-500">Comma-separated.</p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium" htmlFor="entryFee">
                  Entry fee
                </label>
                <input
                  id="entryFee"
                  value={entryFee}
                  onChange={(e) => setEntryFee(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-sm font-medium" htmlFor="timing">
                  Timing
                </label>
                <input
                  id="timing"
                  value={timing}
                  onChange={(e) => setTiming(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium" htmlFor="how">
                How to reach
              </label>
              <textarea
                id="how"
                value={howToReach}
                onChange={(e) => setHowToReach(e.target.value)}
                className="mt-1 min-h-24 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="text-sm font-medium" htmlFor="carry">
                Things to carry
              </label>
              <input
                id="carry"
                value={thingsToCarryText}
                onChange={(e) => setThingsToCarryText(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                placeholder="e.g., Water, Jacket"
              />
              <p className="mt-2 text-xs text-slate-500">Comma-separated.</p>
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300"
              />
              Featured
            </label>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm font-medium">Images</p>
                <label className="text-xs font-medium text-slate-600">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    disabled={isUploadingImages}
                    onChange={(e) => {
                      const files = e.target.files;
                      e.target.value = "";
                      void onUploadFiles(files);
                    }}
                    className="hidden"
                  />
                  <span className="inline-flex cursor-pointer items-center justify-center rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-900 hover:bg-slate-50">
                    {isUploadingImages ? "Uploading…" : "Upload images"}
                  </span>
                </label>
              </div>

              {images.length ? (
                <div className="mt-3 grid gap-2">
                  {images.map((url) => (
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
                        onClick={() => removeImage(url)}
                        className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium hover:bg-slate-50"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-2 text-xs text-slate-500">No images yet.</p>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSaving ? "Saving…" : isEditMode ? "Save changes" : "Create"}
              </button>
              <Link
                to="/admin"
                className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-900 transition-colors hover:bg-slate-50"
              >
                Cancel
              </Link>
            </div>
          </form>
        ) : null}
      </main>
    </div>
  );
}
