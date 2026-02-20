import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
});

// ─── Weather (live) ────────────────────────────────────────────────────────

export const getCurrentWeather = (location) =>
  api.get("/weather/current", { params: { location } }).then((r) => r.data);

export const getForecast = (location) =>
  api.get("/weather/forecast", { params: { location } }).then((r) => r.data);

export const geocodeLocation = (location) =>
  api.get("/weather/geocode", { params: { location } }).then((r) => r.data);

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
  api.get("/integrations/youtube", { params: { location } }).then((r) => r.data);

export const getMapData = (location) =>
  api.get("/integrations/map", { params: { location } }).then((r) => r.data);

export const getAirQuality = (location) =>
  api.get("/integrations/air-quality", { params: { location } }).then((r) => r.data);

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
