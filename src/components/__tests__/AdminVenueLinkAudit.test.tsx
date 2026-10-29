import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AdminVenueLinkAudit } from "../AdminVenueLinkAudit";

const { rpc } = vi.hoisted(() => ({ rpc: vi.fn() }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: {
  rpc,
  from: () => ({ select: () => ({ order: () => ({ range: async () => ({ data: [], error: null }) }) }) }),
} }));
afterEach(() => { cleanup(); vi.resetAllMocks(); });

const matches = [
  { promo_id: "p1", promo_title: "Blue Grass Happy Hour", current_venue_name: "Blue Grass", matched_venue_id: "v1", matched_venue_name: "Bluegrass" },
  { promo_id: "p2", promo_title: "Other promo", current_venue_name: "Other", matched_venue_id: "v2", matched_venue_name: "Other" },
];

describe("admin promo repairs", () => {
  it("does not apply on preview or cancel, and only submits selected previewed pairs after confirmation", async () => {
    rpc.mockImplementation((name: string) => name === "preview_promo_venue_repairs"
      ? { range: async () => ({ data: matches, error: null }) }
      : Promise.resolve({ data: 1, error: null }));
    render(<MemoryRouter><AdminVenueLinkAudit /></MemoryRouter>);
    fireEvent.click(screen.getByRole("button", { name: "Preview promo repairs" }));
    await screen.findByRole("checkbox", { name: "Select Other promo" });
    expect(rpc).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole("checkbox", { name: "Select Other promo" }));
    fireEvent.click(screen.getByRole("button", { name: "Link 1 promos" }));
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(rpc).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole("button", { name: "Link 1 promos" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirm links" }));
    await waitFor(() => expect(rpc).toHaveBeenCalledWith("apply_promo_venue_repairs", {
      _matches: [{ promo_id: "p1", matched_venue_id: "v1" }],
    }));
  });
  it("does not offer repairs when no unique matches exist", async () => {
    rpc.mockReturnValue({ range: async () => ({ data: [], error: null }) });
    render(<MemoryRouter><AdminVenueLinkAudit /></MemoryRouter>);
    fireEvent.click(screen.getByRole("button", { name: "Preview promo repairs" }));
    await waitFor(() => expect(rpc).toHaveBeenCalledTimes(1));
    expect(screen.queryByRole("button", { name: /^Link \d+ promos$/ })).not.toBeInTheDocument();
  });
});