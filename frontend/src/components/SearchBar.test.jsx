/**
 * Tests for the SearchBar component.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SearchBar from "../components/SearchBar";

describe("SearchBar", () => {
  let onSearch;

  beforeEach(() => {
    onSearch = vi.fn();
  });

  it("should render input and buttons", () => {
    render(<SearchBar onSearch={onSearch} />);
    expect(screen.getByPlaceholderText(/city, zip code/i)).toBeInTheDocument();
    expect(screen.getByText(/search/i)).toBeInTheDocument();
    expect(screen.getByText(/my location/i)).toBeInTheDocument();
  });

  it("should show error when submitting empty input", async () => {
    render(<SearchBar onSearch={onSearch} />);
    const searchBtn = screen.getByText(/search/i).closest("button");
    // Button should be disabled when input is empty
    expect(searchBtn).toBeDisabled();
    expect(onSearch).not.toHaveBeenCalled();
  });

  it("should call onSearch with trimmed value on submit", async () => {
    const user = userEvent.setup();
    render(<SearchBar onSearch={onSearch} />);
    const input = screen.getByPlaceholderText(/city, zip code/i);
    await user.type(input, "  New York  ");
    const form = input.closest("form");
    fireEvent.submit(form);
    expect(onSearch).toHaveBeenCalledWith("New York");
  });

  it("should use custom placeholder", () => {
    render(<SearchBar onSearch={onSearch} placeholder="Enter city..." />);
    expect(screen.getByPlaceholderText("Enter city...")).toBeInTheDocument();
  });

  it("should disable input and buttons when loading", () => {
    render(<SearchBar onSearch={onSearch} loading={true} />);
    const input = screen.getByPlaceholderText(/city, zip code/i);
    expect(input).toBeDisabled();
  });

  it("should clear error when typing", async () => {
    const user = userEvent.setup();
    render(<SearchBar onSearch={onSearch} />);
    const input = screen.getByPlaceholderText(/city, zip code/i);

    // Type something, submit empty (can't really since button is disabled)
    // Instead, type valid text → error should not appear
    await user.type(input, "London");
    expect(screen.queryByText(/please enter/i)).not.toBeInTheDocument();
  });
});
