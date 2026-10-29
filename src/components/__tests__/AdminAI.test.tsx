import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, expect, it, vi } from "vitest";
import { AdminAI } from "../AdminAI";
vi.mock("@/integrations/supabase/client", () => ({ supabase: { auth: { getSession: vi.fn(async () => ({ data: { session: { access_token: "test-session" } } })) } } }));
afterEach(() => vi.unstubAllGlobals());
it("reads a live-style stream, opens results, and permits another question immediately", async () => {
  const fetchMock = vi.fn(async () => new Response(`data: ${JSON.stringify({ type: "result", supported: true, entity: "venues", explanation: "Instagram present; zero linked promos.", total: 1, rows: [{ id: "v1", name: "Test venue", slug: "test-venue", instagram: "@test", promo_count: 0, event_count: 0 }] })}\n\n`, { headers: { "Content-Type": "text/event-stream" } }));
  vi.stubGlobal("fetch", fetchMock);
  render(<MemoryRouter><AdminAI /></MemoryRouter>);
  fireEvent.change(screen.getByRole("textbox"), { target: { value: "Show me venues with Instagram but no promos" } });
  fireEvent.click(screen.getByRole("button", { name: "Send question" }));
  await waitFor(() => expect(screen.getByRole("link", { name: "Test venue" })).toHaveAttribute("href", "/venue/test-venue"));
  fireEvent.change(screen.getByRole("textbox"), { target: { value: "Show all venues" } });
  fireEvent.click(screen.getByRole("button", { name: "Send question" }));
  await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
});
it("shows the safe service error instead of fabricated results", async () => {
  vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ error: "Workspace AI credit limit reached." }), { status: 403 })));
  render(<MemoryRouter><AdminAI /></MemoryRouter>);
  fireEvent.change(screen.getByRole("textbox"), { target: { value: "List venues" } });
  fireEvent.click(screen.getByRole("button", { name: "Send question" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("Workspace AI credit limit reached.");
  expect(screen.getByRole("textbox")).toHaveValue("List venues");
});