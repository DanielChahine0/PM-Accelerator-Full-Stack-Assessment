/**
 * Tests for App component — routing.
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

// Mock heavy page components to keep tests fast and focused on routing
vi.mock("./pages/Home", () => ({
  default: () => <div data-testid="home-page">Home</div>,
}));
vi.mock("./pages/History", () => ({
  default: () => <div data-testid="history-page">History</div>,
}));
vi.mock("./pages/About", () => ({
  default: () => <div data-testid="about-page">About</div>,
}));
vi.mock("./components/Navbar", () => ({
  default: () => <nav data-testid="navbar">Navbar</nav>,
}));

// We import App but wrap it ourselves in MemoryRouter for testing,
// so we need a version without BrowserRouter. Instead, test via App directly.
import App from "./App";

// Since App uses BrowserRouter internally, we test by rendering App directly
// and verifying the default route renders Home.
describe("App", () => {
  it("should render navbar", () => {
    render(<App />);
    expect(screen.getByTestId("navbar")).toBeInTheDocument();
  });

  it("should render Home page on / route", () => {
    render(<App />);
    expect(screen.getByTestId("home-page")).toBeInTheDocument();
  });
});
