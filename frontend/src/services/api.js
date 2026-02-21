import axios from "axios";
import axiosRetry from "axios-retry";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 45000, // 45s — accommodates Render free-tier cold starts
});

// Retry up to 3 times with exponential backoff on timeouts / 5xx / network errors
axiosRetry(api, {
  retries: 3,
  retryDelay: (retryCount) => retryCount * 1500, // 1.5s, 3s, 4.5s
  retryCondition: (error) =>
    axiosRetry.isNetworkOrIdempotentRequestError(error) ||
    error.code === "ECONNABORTED" || // timeout
    (error.response && error.response.status >= 500),
});

// ─── Wake-up ping ──────────────────────────────────────────────────────────
// Fire a lightweight /health request on import to wake the Render backend
// from its cold-start sleep.  We don't await it — it runs in the background.
api.get("/health").catch(() => {});

// ─── Simple in-memory response cache ───────────────────────────────────────
const _cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function cachedGet(url, params) {
  const key = url + "|" + JSON.stringify(params);
  const entry = _cache.get(key);
  if (entry && Date.now() - entry.ts < CACHE_TTL) {
    return Promise.resolve(entry.data);
  }
  return api.get(url, { params }).then((r) => {
    _cache.set(key, { ts: Date.now(), data: r.data });
    return r.data;
  });
}

// ─── Weather (live) ────────────────────────────────────────────────────────

export const getCurrentWeather = (location) =>
  cachedGet("/weather/current", { location });

export const getForecast = (location) =>
  cachedGet("/weather/forecast", { location });

export const geocodeLocation = (location) =>
  cachedGet("/weather/geocode", { location });

// ─── Weather Records (CRUD) ────────────────────────────────────────────────

export const createRecord = (payload) =>
  api.post("/weather/records", payload).then((r) => r.data);

export const listRecords = (params = {}) =>
  api.get("/weather/records", { params }).then((r) => r.data);

export const getRecord = (id) =>
  api.get(`/weather/records/${id}`).then((r) => r.data);

export const updateRecord = (id, payload) =>
  api.patch(`/weather/records/${id}`, payload).then((r) => r.data);

export const deleteRecord = (id) =>
  api.delete(`/weather/records/${id}`);

// ─── Integrations ─────────────────────────────────────────────────────────

export const getYouTubeVideos = (location) =>
  cachedGet("/integrations/youtube", { location });

export const getMapData = (location) =>
  cachedGet("/integrations/map", { location });

export const getAirQuality = (location) =>
  cachedGet("/integrations/air-quality", { location });

// ─── Export ───────────────────────────────────────────────────────────────

export const exportRecords = (format, recordIds = null) => {
  const params = { format };
  if (recordIds && recordIds.length > 0) {
    params.record_ids = recordIds.join(",");
  }
  return api.get("/export/records", {
    params,
    responseType: "blob",
  });
};
