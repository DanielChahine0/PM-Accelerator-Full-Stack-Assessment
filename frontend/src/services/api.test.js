/**
 * Tests for the API service layer.
 * Mocks axios to verify correct endpoint calls and params.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock axios and axios-retry before importing api module
vi.mock("axios", () => {
  const mockAxios = {
    create: vi.fn(() => mockAxios),
    get: vi.fn(() => Promise.resolve({ data: {} })),
    post: vi.fn(() => Promise.resolve({ data: {} })),
    patch: vi.fn(() => Promise.resolve({ data: {} })),
    delete: vi.fn(() => Promise.resolve({ data: {} })),
    defaults: { headers: { common: {} } },
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  };
  return { default: mockAxios };
});
vi.mock("axios-retry", () => ({ default: vi.fn() }));

// Now import — the module will use our mocked axios
const api = await import("../services/api");
const axios = (await import("axios")).default;

describe("API service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset the internal cache by calling cache clearing if exposed,
    // otherwise just clear mocks
  });

  // ── CRUD ────────────────────────────────────────────────────────────────

  describe("createRecord", () => {
    it("should POST to /weather/records", async () => {
      const payload = {
        location_query: "NYC",
        date_from: "2025-01-01",
        date_to: "2025-01-05",
      };
      axios.post.mockResolvedValueOnce({ data: { id: 1, ...payload } });
      const result = await api.createRecord(payload);
      expect(axios.post).toHaveBeenCalledWith("/weather/records", payload);
      expect(result).toEqual({ id: 1, ...payload });
    });
  });

  describe("listRecords", () => {
    it("should GET /weather/records with params", async () => {
      const params = { skip: 0, limit: 10 };
      axios.get.mockResolvedValueOnce({ data: [{ id: 1 }] });
      const result = await api.listRecords(params);
      expect(axios.get).toHaveBeenCalledWith("/weather/records", { params });
      expect(result).toEqual([{ id: 1 }]);
    });
  });

  describe("getRecord", () => {
    it("should GET /weather/records/:id", async () => {
      axios.get.mockResolvedValueOnce({ data: { id: 42 } });
      const result = await api.getRecord(42);
      expect(axios.get).toHaveBeenCalledWith("/weather/records/42");
      expect(result).toEqual({ id: 42 });
    });
  });

  describe("updateRecord", () => {
    it("should PATCH /weather/records/:id", async () => {
      const payload = { notes: "Updated" };
      axios.patch.mockResolvedValueOnce({ data: { id: 1, notes: "Updated" } });
      const result = await api.updateRecord(1, payload);
      expect(axios.patch).toHaveBeenCalledWith("/weather/records/1", payload);
      expect(result).toEqual({ id: 1, notes: "Updated" });
    });
  });

  describe("deleteRecord", () => {
    it("should DELETE /weather/records/:id", async () => {
      axios.delete.mockResolvedValueOnce({});
      await api.deleteRecord(5);
      expect(axios.delete).toHaveBeenCalledWith("/weather/records/5");
    });
  });

  // ── Export ──────────────────────────────────────────────────────────────

  describe("exportRecords", () => {
    it("should GET /export/records with format param", async () => {
      axios.get.mockResolvedValueOnce({ data: new Blob(["test"]) });
      await api.exportRecords("csv");
      expect(axios.get).toHaveBeenCalledWith("/export/records", {
        params: { format: "csv" },
        responseType: "blob",
      });
    });

    it("should include record_ids when provided", async () => {
      axios.get.mockResolvedValueOnce({ data: new Blob([""]) });
      await api.exportRecords("json", [1, 2, 3]);
      expect(axios.get).toHaveBeenCalledWith("/export/records", {
        params: { format: "json", record_ids: "1,2,3" },
        responseType: "blob",
      });
    });
  });
});
