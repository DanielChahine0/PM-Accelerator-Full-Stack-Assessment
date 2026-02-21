/**
 * Tests for the ExportButtons component.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

// Mock the api module
vi.mock("../services/api", () => ({
  exportRecords: vi.fn(),
}));

// Mock react-hot-toast
vi.mock("react-hot-toast", () => ({
  default: {
    loading: vi.fn(() => "toast-1"),
    success: vi.fn(),
    error: vi.fn(),
  },
}));

import ExportButtons from "../components/ExportButtons";
import { exportRecords } from "../services/api";
import toast from "react-hot-toast";

describe("ExportButtons", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock URL APIs needed for blob download
    global.URL.createObjectURL = vi.fn(() => "blob:http://localhost/fake");
    global.URL.revokeObjectURL = vi.fn();
  });

  it("should render all 5 format buttons", () => {
    render(<ExportButtons />);
    expect(screen.getByText("JSON")).toBeInTheDocument();
    expect(screen.getByText("CSV")).toBeInTheDocument();
    expect(screen.getByText("XML")).toBeInTheDocument();
    expect(screen.getByText("PDF")).toBeInTheDocument();
    expect(screen.getByText("Markdown")).toBeInTheDocument();
  });

  it("should show Export label", () => {
    render(<ExportButtons />);
    expect(screen.getByText("Export:")).toBeInTheDocument();
  });

  it("should call exportRecords on button click", async () => {
    const mockBlob = new Blob(["test data"], { type: "application/json" });
    exportRecords.mockResolvedValueOnce({ data: mockBlob });

    render(<ExportButtons />);
    fireEvent.click(screen.getByText("JSON"));

    await waitFor(() => {
      expect(exportRecords).toHaveBeenCalledWith("json", null);
    });

    await waitFor(() => {
      expect(toast.loading).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalled();
    });
  });

  it("should show error toast on export failure", async () => {
    exportRecords.mockRejectedValueOnce(new Error("Network error"));

    render(<ExportButtons />);
    fireEvent.click(screen.getByText("CSV"));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Export failed. Try again.", {
        id: "toast-1",
      });
    });
  });

  it("should pass recordIds to exportRecords when provided", async () => {
    const mockBlob = new Blob([""], { type: "text/csv" });
    exportRecords.mockResolvedValueOnce({ data: mockBlob });

    render(<ExportButtons recordIds={[1, 2, 3]} />);
    fireEvent.click(screen.getByText("CSV"));

    await waitFor(() => {
      expect(exportRecords).toHaveBeenCalledWith("csv", [1, 2, 3]);
    });
  });
});
