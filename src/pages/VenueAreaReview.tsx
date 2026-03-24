import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { SpinningPaws } from "@/components/ui/spinning-paws";
import { Header } from "@/components/Header";
import { ArrowLeft, Undo2, MapPin, Globe, Instagram, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { usePageTitle } from "@/hooks/usePageTitle";
import { checkUserAdminStatus } from "@/lib/auth-helpers";
import { JAKARTA_AREAS, getRegionLabelForArea } from "@/lib/area-config";
import { cn } from "@/lib/utils";

interface VenueData {
  id: string;
  name: string;
  address: string | null;
  area: string | null;
  google_maps_link: string | null;
  instagram: string | null;
  website: string | null;
  slug: string | null;
}

interface UndoEntry {
  venueId: string;
  previousArea: string | null;
}

// Direct neighborhood shortcuts
const NEIGHBORHOOD_SHORTCUTS: Record<string, string> = {
  k: "Kemang",
  s: "Senopati & Gunawarman",
  c: "SCBD",
  m: "Menteng & Cikini",
  p: "PIK",
  g: "Kelapa Gading",
  b: "Blok M & Melawai",
  t: "Sudirman & Thamrin",
  u: "Kuningan & Setiabudi",
  n: "Senayan",
  o: "Kota Tua",
  j: "Ancol",
  w: "Grogol",
  e: "Kebon Jeruk",
  l: "Kelapa Gading Timur",
};

const VenueAreaReview = () => {
  usePageTitle("Venue Area Review");
  const navigate = useNavigate();
  

  const [venues, setVenues] = useState<VenueData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [updating, setUpdating] = useState(false);
  const [showUnassignedOnly, setShowUnassignedOnly] = useState(true);
  const [regionMode, setRegionMode] = useState<string | null>(null);
  const undoStackRef = useRef<UndoEntry[]>([]);
  const [undoCount, setUndoCount] = useState(0);
  const listItemRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

  const filteredVenues = showUnassignedOnly
    ? venues.filter((v) => !v.area)
    : venues;

  const selectedVenue = filteredVenues[selectedIndex] ?? null;

  // Auth check
  useEffect(() => {
    const check = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/"); return; }
      const status = await checkUserAdminStatus(user.id);
      if (!status.is_admin && !status.is_super_admin) { navigate("/"); return; }
      setIsAdmin(true);
    };
    check();
  }, [navigate]);

  // Fetch venues
  useEffect(() => {
    if (!isAdmin) return;
    const fetchVenues = async () => {
      const { data, error } = await supabase
        .from("venues")
        .select("id, name, address, area, google_maps_link, instagram, website, slug")
        .order("name", { ascending: true });
      if (error) {
        toast({ title: "Failed to load venues", description: error.message, variant: "destructive" });
      } else {
        setVenues(data || []);
      }
      setLoading(false);
    };
    fetchVenues();
  }, [isAdmin, toast]);

  const scrollListItem = useCallback((id: string) => {
    listItemRefs.current.get(id)?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, []);

  const selectByIndex = useCallback((idx: number) => {
    if (idx < 0 || idx >= filteredVenues.length) return;
    setSelectedIndex(idx);
    setRegionMode(null);
    scrollListItem(filteredVenues[idx].id);
  }, [filteredVenues, scrollListItem]);

  const selectPrev = useCallback(() => {
    selectByIndex(selectedIndex <= 0 ? filteredVenues.length - 1 : selectedIndex - 1);
  }, [selectedIndex, filteredVenues.length, selectByIndex]);

  const selectNext = useCallback(() => {
    selectByIndex(selectedIndex >= filteredVenues.length - 1 ? 0 : selectedIndex + 1);
  }, [selectedIndex, filteredVenues.length, selectByIndex]);

  const assignArea = useCallback(async (area: string) => {
    if (!selectedVenue || updating) return;
    const previousArea = selectedVenue.area;
    setUpdating(true);
    setRegionMode(null);
    try {
      const { error } = await supabase
        .from("venues")
        .update({ area })
        .eq("id", selectedVenue.id);
      if (error) throw error;
      undoStackRef.current.push({ venueId: selectedVenue.id, previousArea });
      setUndoCount(undoStackRef.current.length);
      setVenues((prev) => prev.map((v) => v.id === selectedVenue.id ? { ...v, area } : v));
      toast({ title: `Set to ${area}`, description: selectedVenue.name });
      // Auto-advance
      if (showUnassignedOnly) {
        // After filtering, the current index stays the same (next unassigned slides in)
        const newFiltered = venues
          .map((v) => v.id === selectedVenue.id ? { ...v, area } : v)
          .filter((v) => !v.area);
        if (selectedIndex >= newFiltered.length) {
          setSelectedIndex(Math.max(0, newFiltered.length - 1));
        }
      } else {
        selectNext();
      }
    } catch (err: any) {
      toast({ title: "Update failed", description: err.message, variant: "destructive" });
    } finally {
      setUpdating(false);
    }
  }, [selectedVenue, updating, toast, selectNext, venues, showUnassignedOnly, selectedIndex]);

  const handleUndo = useCallback(async () => {
    const entry = undoStackRef.current.pop();
    if (!entry) return;
    setUndoCount(undoStackRef.current.length);
    try {
      const { error } = await supabase
        .from("venues")
        .update({ area: entry.previousArea })
        .eq("id", entry.venueId);
      if (error) throw error;
      setVenues((prev) => prev.map((v) => v.id === entry.venueId ? { ...v, area: entry.previousArea } : v));
      // Navigate back to the venue
      const allVenues = venues.map((v) => v.id === entry.venueId ? { ...v, area: entry.previousArea } : v);
      const target = showUnassignedOnly ? allVenues.filter((v) => !v.area) : allVenues;
      const idx = target.findIndex((v) => v.id === entry.venueId);
      if (idx >= 0) {
        setSelectedIndex(idx);
        scrollListItem(entry.venueId);
      }
      toast({ title: "Undone", description: `Reverted to ${entry.previousArea || "None"}` });
    } catch (err: any) {
      toast({ title: "Undo failed", description: err.message, variant: "destructive" });
    }
  }, [venues, toast, scrollListItem, showUnassignedOnly]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      const key = e.key.toLowerCase();

      if (e.ctrlKey && key === "z") { e.preventDefault(); handleUndo(); return; }
      if (key === "escape") { e.preventDefault(); setRegionMode(null); return; }
      if (key === "q") { e.preventDefault(); selectPrev(); return; }
      if (key === "a") { e.preventDefault(); selectNext(); return; }

      // Region mode: if a region is active, number keys select neighborhoods
      if (regionMode) {
        const region = JAKARTA_AREAS.find((r) => r.key === regionMode);
        if (region) {
          const numIdx = parseInt(key) - 1;
          if (numIdx >= 0 && numIdx < region.neighborhoods.length) {
            e.preventDefault();
            assignArea(region.neighborhoods[numIdx]);
            return;
          }
        }
        // Any other key exits region mode
        setRegionMode(null);
      }

      // Number keys enter region mode
      if (key >= "1" && key <= "4") {
        e.preventDefault();
        const regionIdx = parseInt(key) - 1;
        if (regionIdx < JAKARTA_AREAS.length) {
          setRegionMode(JAKARTA_AREAS[regionIdx].key);
        }
        return;
      }

      // Direct neighborhood shortcuts
      if (NEIGHBORHOOD_SHORTCUTS[key]) {
        e.preventDefault();
        assignArea(NEIGHBORHOOD_SHORTCUTS[key]);
        return;
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [selectPrev, selectNext, assignArea, handleUndo, regionMode]);

  const unassignedCount = venues.filter((v) => !v.area).length;

  if (loading) {
    return (
      <>
        <Header activeSection="venues" />
        <div className="min-h-screen bg-background pt-20 flex items-center justify-center">
          <SpinningPaws size="lg" />
        </div>
      </>
    );
  }

  return (
    <>
      <Header activeSection="venues" />
      <div className="min-h-screen bg-background pt-20">
        <div className="container mx-auto px-4 py-6">
          {/* Top Bar */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => navigate("/admin?tab=venues")}>
                <ArrowLeft className="w-4 h-4 mr-2" /> Back
              </Button>
              <h1 className="text-xl font-bold text-foreground">
                Area Review
                <span className="text-sm font-normal text-muted-foreground ml-2">
                  {selectedIndex + 1}/{filteredVenues.length}
                  {showUnassignedOnly && ` (${unassignedCount} unassigned)`}
                </span>
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Switch
                  id="unassigned-only"
                  checked={showUnassignedOnly}
                  onCheckedChange={(v) => { setShowUnassignedOnly(v); setSelectedIndex(0); }}
                />
                <Label htmlFor="unassigned-only" className="text-sm">Unassigned only</Label>
              </div>
              <Button size="sm" variant="outline" onClick={handleUndo} disabled={undoCount === 0}>
                <Undo2 className="w-4 h-4 mr-1" /> Undo
              </Button>
            </div>
          </div>

          {/* Shortcuts bar */}
          <div className="flex flex-wrap items-center gap-2 mb-4 p-3 rounded-lg bg-muted/50 border border-border">
            <span className="text-xs text-muted-foreground mr-1">Nav:</span>
            <kbd className="px-1.5 py-0.5 bg-background border border-border rounded text-xs font-mono">Q</kbd>
            <span className="text-xs text-muted-foreground">Prev</span>
            <kbd className="px-1.5 py-0.5 bg-background border border-border rounded text-xs font-mono ml-1">A</kbd>
            <span className="text-xs text-muted-foreground">Next</span>
            <Separator orientation="vertical" className="h-4 mx-2" />
            <span className="text-xs text-muted-foreground mr-1">Regions:</span>
            {JAKARTA_AREAS.map((region, i) => (
              <button
                key={region.key}
                onClick={() => setRegionMode(regionMode === region.key ? null : region.key)}
                className={cn(
                  "flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors",
                  "hover:bg-primary/10",
                  regionMode === region.key && "bg-primary/20 text-primary font-medium ring-1 ring-primary/30"
                )}
              >
                <kbd className="px-1 py-0.5 bg-background border border-border rounded text-[10px] font-mono">
                  {i + 1}
                </kbd>
                <span>{region.label.replace("Jakarta", "").trim()}</span>
              </button>
            ))}
            <Separator orientation="vertical" className="h-4 mx-2" />
            <span className="text-xs text-muted-foreground mr-1">Quick:</span>
            {Object.entries(NEIGHBORHOOD_SHORTCUTS).slice(0, 8).map(([key, area]) => (
              <button
                key={key}
                onClick={() => assignArea(area)}
                disabled={updating || !selectedVenue}
                className={cn(
                  "flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors",
                  "hover:bg-primary/10 disabled:opacity-50",
                  selectedVenue?.area === area && "bg-primary/20 text-primary font-medium"
                )}
              >
                <kbd className="px-1 py-0.5 bg-background border border-border rounded text-[10px] font-mono uppercase">
                  {key}
                </kbd>
                <span className="hidden sm:inline">{area.length > 12 ? area.slice(0, 12) + "…" : area}</span>
              </button>
            ))}
            <Separator orientation="vertical" className="h-4 mx-2" />
            <kbd className="px-1.5 py-0.5 bg-background border border-border rounded text-xs font-mono">⌃Z</kbd>
            <span className="text-xs text-muted-foreground">Undo</span>
          </div>

          {/* Region sub-mode bar */}
          {regionMode && (
            <div className="flex flex-wrap items-center gap-2 mb-4 p-3 rounded-lg bg-primary/5 border border-primary/20">
              <span className="text-xs text-primary font-medium mr-1">
                {JAKARTA_AREAS.find((r) => r.key === regionMode)?.label}:
              </span>
              {JAKARTA_AREAS.find((r) => r.key === regionMode)?.neighborhoods.map((hood, i) => (
                <button
                  key={hood}
                  onClick={() => assignArea(hood)}
                  disabled={updating || !selectedVenue}
                  className="flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors hover:bg-primary/10 disabled:opacity-50"
                >
                  <kbd className="px-1 py-0.5 bg-background border border-border rounded text-[10px] font-mono">
                    {i + 1}
                  </kbd>
                  <span>{hood}</span>
                </button>
              ))}
              <span className="text-xs text-muted-foreground ml-2">(Esc to cancel)</span>
            </div>
          )}

          {/* Main content: list + detail */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" style={{ height: "calc(100vh - 340px)" }}>
            {/* Left: Venue List */}
            <ScrollArea className="lg:col-span-1 border border-border rounded-lg">
              <div className="p-2 space-y-0.5">
                {filteredVenues.map((venue, idx) => (
                  <button
                    key={venue.id}
                    ref={(el) => { if (el) listItemRefs.current.set(venue.id, el); }}
                    onClick={() => { setSelectedIndex(idx); setRegionMode(null); }}
                    className={cn(
                      "w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors flex items-center gap-2",
                      idx === selectedIndex
                        ? "bg-primary/20 text-primary ring-1 ring-primary/30"
                        : "hover:bg-muted/50 text-foreground"
                    )}
                  >
                    <span className="text-muted-foreground w-6 text-right shrink-0 text-xs">{idx + 1}</span>
                    <div className="flex-1 min-w-0">
                      <span className="block truncate font-medium text-xs">{venue.name}</span>
                      {venue.address && (
                        <span className="block truncate text-muted-foreground text-[11px]">{venue.address}</span>
                      )}
                    </div>
                    {venue.area ? (
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0 shrink-0">
                        {venue.area}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-[10px] shrink-0">—</span>
                    )}
                  </button>
                ))}
                {filteredVenues.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    {showUnassignedOnly ? "All venues have areas assigned! 🎉" : "No venues found"}
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Right: Venue Detail */}
            <div className="lg:col-span-2 overflow-y-auto">
              {selectedVenue ? (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <h2 className="text-2xl font-bold text-foreground">{selectedVenue.name}</h2>
                    <div className="flex items-center gap-2 flex-wrap">
                      {selectedVenue.area ? (
                        <Badge variant="outline" className="bg-primary/10 text-primary border-primary">
                          📍 {selectedVenue.area}
                          {getRegionLabelForArea(selectedVenue.area) && ` · ${getRegionLabelForArea(selectedVenue.area)}`}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground">No area assigned</Badge>
                      )}
                    </div>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle>Venue Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {selectedVenue.address && (
                        <div className="flex items-start gap-2">
                          <MapPin className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" />
                          <div>
                            <p className="text-sm font-medium">Address</p>
                            {selectedVenue.google_maps_link ? (
                              <a
                                href={selectedVenue.google_maps_link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-primary hover:underline flex items-center gap-1"
                              >
                                {selectedVenue.address}
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            ) : (
                              <a
                                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedVenue.address)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-primary hover:underline flex items-center gap-1"
                              >
                                {selectedVenue.address}
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                        </div>
                      )}

                      {selectedVenue.instagram && (
                        <div className="flex items-center gap-2">
                          <Instagram className="w-4 h-4 text-muted-foreground" />
                          <a
                            href={`https://instagram.com/${selectedVenue.instagram.replace("@", "")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-primary hover:underline"
                          >
                            @{selectedVenue.instagram.replace("@", "")}
                          </a>
                        </div>
                      )}

                      {selectedVenue.website && (
                        <div className="flex items-center gap-2">
                          <Globe className="w-4 h-4 text-muted-foreground" />
                          <a
                            href={selectedVenue.website.startsWith("http") ? selectedVenue.website : `https://${selectedVenue.website}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-primary hover:underline"
                          >
                            {selectedVenue.website}
                          </a>
                        </div>
                      )}

                      {selectedVenue.slug && (
                        <div className="pt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(`/venue/${selectedVenue.slug}`, "_blank")}
                          >
                            View Venue Page
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  {filteredVenues.length === 0 ? "No venues to review" : "Select a venue from the list"}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default VenueAreaReview;
