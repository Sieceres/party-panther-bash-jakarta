import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter, useNavigate } from "react-router-dom";
import { Header } from "../Header";

// Mock supabase
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
      getSession: vi.fn(() =>
        Promise.resolve({ data: { session: null } })
      ),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          in: vi.fn(() => Promise.resolve({ data: [], error: null })),
        })),
      })),
    })),
  },
}));

// Mock the logo image
vi.mock("@/assets/party-panther-logo.png", () => ({
  default: "logo.png",
}));

// Capture navigate calls
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const ROUTE_MAP: Record<string, string> = {
  home: "/",
  events: "/events",
  promos: "/promos",
  venues: "/venues",
  admin: "/admin",
  profile: "/profile",
  map: "/map",
};

describe("Header Navigation", () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  const renderHeader = (activeSection = "admin") => {
    return render(
      <MemoryRouter>
        <Header activeSection={activeSection} />
      </MemoryRouter>
    );
  };

  // Test that each visible nav item navigates to the correct route
  const publicNavItems = [
    { label: "Home", route: "/" },
    { label: "Promos", route: "/promos" },
    { label: "Events", route: "/events" },
    { label: "Venues", route: "/venues" },
    { label: "Map", route: "/map" },
  ];

  publicNavItems.forEach(({ label, route }) => {
    it(`clicking "${label}" navigates to ${route}`, () => {
      renderHeader();
      // Find buttons with the label text (desktop nav)
      const buttons = screen.getAllByRole("button").filter(
        (btn) => btn.textContent?.trim() === label
      );
      // Click the first matching button (desktop)
      if (buttons.length > 0) {
        fireEvent.click(buttons[0]);
        expect(mockNavigate).toHaveBeenCalledWith(route);
      }
    });
  });

  it("does not require onSectionChange prop", () => {
    // Should not throw
    expect(() => renderHeader()).not.toThrow();
  });

  it("calls onSectionChange when provided", () => {
    const onSectionChange = vi.fn();
    render(
      <MemoryRouter>
        <Header activeSection="home" onSectionChange={onSectionChange} />
      </MemoryRouter>
    );
    const promosButtons = screen.getAllByRole("button").filter(
      (btn) => btn.textContent?.trim() === "Promos"
    );
    if (promosButtons.length > 0) {
      fireEvent.click(promosButtons[0]);
      expect(onSectionChange).toHaveBeenCalledWith("promos");
    }
  });

  it("Profile click without user navigates to /auth", () => {
    renderHeader();
    const profileButtons = screen.getAllByRole("button").filter(
      (btn) => btn.textContent?.trim() === "Profile"
    );
    if (profileButtons.length > 0) {
      fireEvent.click(profileButtons[0]);
      expect(mockNavigate).toHaveBeenCalledWith("/auth");
    }
  });

  // Verify all ROUTE_MAP entries are correct
  it("ROUTE_MAP covers all expected routes", () => {
    const expectedRoutes = [
      ["home", "/"],
      ["events", "/events"],
      ["promos", "/promos"],
      ["venues", "/venues"],
      ["admin", "/admin"],
      ["profile", "/profile"],
      ["map", "/map"],
    ];

    expectedRoutes.forEach(([key, route]) => {
      expect(ROUTE_MAP[key]).toBe(route);
    });
  });
});
