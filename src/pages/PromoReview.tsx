import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { SpinningPaws } from "@/components/ui/spinning-paws";
import { Header } from "@/components/Header";
import { ArrowLeft, Undo2, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { usePageTitle } from "@/hooks/usePageTitle";
import { checkUserAdminStatus } from "@/lib/auth-helpers";
import { PROMO_TYPES, type PromoType } from "@/lib/promo-types";
import { cn } from "@/lib/utils";
import Linkify from "linkify-react";

interface PromoData {
  id: string;
  title: string;
  description: string;
  discount_text: string;
  venue_name: string;
  venue_address: string | null;
  promo_type: string | null;
  area: string | null;
  day_of_week: string[] | null;
  valid_until: string | null;
  drink_type: string[] | null;
  image_url: string | null;
}

interface UndoEntry {
  promoId: string;
  previousType: string | null;
}

const SHORTCUT_MAP: Record<string, PromoType> = {
  h: "Happy Hour",
  s: "Ladies Night",
  f: "Free Flow",
  b: "Bottle Promo",
  d: "Beer Deal",
  t: "Other",
};

const KEY_LABELS: Record<string, string> = {
  h: "H", s: "S", f: "F", b: "B", d: "D", t: "T",
};

const PromoReview = () => {
  usePageTitle("Promo Category Review");
  const navigate = useNavigate();
  const { toast } = useToast();

  const [promos, setPromos] = useState<PromoData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [updating, setUpdating] = useState(false);
  const undoStackRef = useRef<UndoEntry[]>([]);
  const [undoCount, setUndoCount] = useState(0);
  const listItemRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

  const selectedPromo = promos[selectedIndex] ?? null;

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

  // Fetch promos
  useEffect(() => {
    if (!isAdmin) return;
    const fetch = async () => {
      const { data, error } = await supabase
        .from("promos")
        .select("id, title, description, discount_text, venue_name, venue_address, promo_type, area, day_of_week, valid_until, drink_type, image_url")
        .order("created_at", { ascending: false });
      if (error) {
        toast({ title: "Failed to load promos", description: error.message, variant: "destructive" });
      } else {
        setPromos(data || []);
      }
      setLoading(false);
    };
    fetch();
  }, [isAdmin, toast]);

  const scrollListItem = useCallback((id: string) => {
    listItemRefs.current.get(id)?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, []);

  const selectByIndex = useCallback((idx: number) => {
    if (idx < 0 || idx >= promos.length) return;
    setSelectedIndex(idx);
    scrollListItem(promos[idx].id);
  }, [promos, scrollListItem]);

  const selectPrev = useCallback(() => {
    selectByIndex(selectedIndex <= 0 ? promos.length - 1 : selectedIndex - 1);
  }, [selectedIndex, promos.length, selectByIndex]);

  const selectNext = useCallback(() => {
    selectByIndex(selectedIndex >= promos.length - 1 ? 0 : selectedIndex + 1);
  }, [selectedIndex, promos.length, selectByIndex]);

  const updateCategory = useCallback(async (newType: PromoType) => {
    if (!selectedPromo || updating) return;
    const previousType = selectedPromo.promo_type;
    setUpdating(true);
    try {
      const { error } = await supabase
        .from("promos")
        .update({ promo_type: newType })
        .eq("id", selectedPromo.id);
      if (error) throw error;
      undoStackRef.current.push({ promoId: selectedPromo.id, previousType });
      setUndoCount(undoStackRef.current.length);
      setPromos(prev => prev.map(p => p.id === selectedPromo.id ? { ...p, promo_type: newType } : p));
      toast({ title: `Set to ${newType}`, description: selectedPromo.title });
      selectNext();
    } catch (err: any) {
      toast({ title: "Update failed", description: err.message, variant: "destructive" });
    } finally {
      setUpdating(false);
    }
  }, [selectedPromo, updating, toast, selectNext]);

  const handleUndo = useCallback(async () => {
    const entry = undoStackRef.current.pop();
    if (!entry) return;
    setUndoCount(undoStackRef.current.length);
    try {
      const { error } = await supabase
        .from("promos")
        .update({ promo_type: entry.previousType })
        .eq("id", entry.promoId);
      if (error) throw error;
      setPromos(prev => prev.map(p => p.id === entry.promoId ? { ...p, promo_type: entry.previousType } : p));
      const idx = promos.findIndex(p => p.id === entry.promoId);
      if (idx >= 0) {
        setSelectedIndex(idx);
        scrollListItem(entry.promoId);
      }
      toast({ title: "Undone", description: `Reverted to ${entry.previousType || "None"}` });
    } catch (err: any) {
      toast({ title: "Undo failed", description: err.message, variant: "destructive" });
    }
  }, [promos, toast, scrollListItem]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      const key = e.key.toLowerCase();
      if (e.ctrlKey && key === "z") { e.preventDefault(); handleUndo(); return; }
      if (key === "q") { e.preventDefault(); selectPrev(); }
      else if (key === "a") { e.preventDefault(); selectNext(); }
      else if (SHORTCUT_MAP[key]) { e.preventDefault(); updateCategory(SHORTCUT_MAP[key]); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [selectPrev, selectNext, updateCategory, handleUndo]);

  if (loading) {
    return (
      <>
        <Header activeSection="promos" />
        <div className="min-h-screen bg-background pt-20 flex items-center justify-center">
          <SpinningPaws size="lg" />
        </div>
      </>
    );
  }

  return (
    <>
      <Header activeSection="promos" />
      <div className="min-h-screen bg-background pt-20">
        <div className="container mx-auto px-4 py-6">
          {/* Top Bar */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => navigate("/promos")}>
                <ArrowLeft className="w-4 h-4 mr-2" /> Back
              </Button>
              <h1 className="text-xl font-bold text-foreground">
                Category Review
                <span className="text-sm font-normal text-muted-foreground ml-2">
                  {selectedIndex + 1}/{promos.length}
                </span>
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={handleUndo} disabled={undoCount === 0}>
                <Undo2 className="w-4 h-4 mr-1" /> Undo
              </Button>
            </div>
          </div>

          {/* Shortcuts bar */}
          <div className="flex flex-wrap items-center gap-2 mb-6 p-3 rounded-lg bg-muted/50 border border-border">
            <span className="text-xs text-muted-foreground mr-1">Nav:</span>
            <kbd className="px-1.5 py-0.5 bg-background border border-border rounded text-xs font-mono">Q</kbd>
            <span className="text-xs text-muted-foreground">Prev</span>
            <kbd className="px-1.5 py-0.5 bg-background border border-border rounded text-xs font-mono ml-1">A</kbd>
            <span className="text-xs text-muted-foreground">Next</span>
            <Separator orientation="vertical" className="h-4 mx-2" />
            <span className="text-xs text-muted-foreground mr-1">Set:</span>
            {Object.entries(SHORTCUT_MAP).map(([key, type]) => (
              <button
                key={key}
                onClick={() => updateCategory(type)}
                disabled={updating || !selectedPromo}
                className={cn(
                  "flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors",
                  "hover:bg-primary/10 disabled:opacity-50",
                  selectedPromo?.promo_type === type && "bg-primary/20 text-primary font-medium"
                )}
              >
                <kbd className="px-1 py-0.5 bg-background border border-border rounded text-[10px] font-mono">
                  {KEY_LABELS[key]}
                </kbd>
                <span>{type}</span>
              </button>
            ))}
            <Separator orientation="vertical" className="h-4 mx-2" />
            <kbd className="px-1.5 py-0.5 bg-background border border-border rounded text-xs font-mono">⌃Z</kbd>
            <span className="text-xs text-muted-foreground">Undo</span>
          </div>

          {/* Main content: list + detail */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" style={{ height: "calc(100vh - 280px)" }}>
            {/* Left: Promo List */}
            <ScrollArea className="lg:col-span-1 border border-border rounded-lg">
              <div className="p-2 space-y-0.5">
                {promos.map((promo, idx) => (
                  <button
                    key={promo.id}
                    ref={(el) => { if (el) listItemRefs.current.set(promo.id, el); }}
                    onClick={() => setSelectedIndex(idx)}
                    className={cn(
                      "w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors flex items-center gap-2",
                      idx === selectedIndex
                        ? "bg-primary/20 text-primary ring-1 ring-primary/30"
                        : "hover:bg-muted/50 text-foreground"
                    )}
                  >
                    <span className="text-muted-foreground w-6 text-right shrink-0 text-xs">{idx + 1}</span>
                    <div className="flex-1 min-w-0">
                      <span className="block truncate font-medium text-xs">{promo.title}</span>
                      <span className="block truncate text-muted-foreground text-[11px]">{promo.venue_name}</span>
                    </div>
                    {promo.promo_type ? (
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0 shrink-0">
                        {promo.promo_type}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-[10px] shrink-0">—</span>
                    )}
                  </button>
                ))}
              </div>
            </ScrollArea>

            {/* Right: Promo Detail */}
            <div className="lg:col-span-2 overflow-y-auto">
              {selectedPromo ? (
                <div className="space-y-6">

                  {/* Title + current type */}
                  <div className="space-y-2">
                    <h2 className="text-2xl font-bold text-foreground">{selectedPromo.title}</h2>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="secondary" className="font-bold px-3 py-1.5">
                        {selectedPromo.discount_text}
                      </Badge>
                      {selectedPromo.promo_type && (
                        <Badge variant="outline" className="bg-primary/10 text-primary border-primary">
                          {selectedPromo.promo_type}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* About This Promo */}
                  <Card>
                    <CardHeader>
                      <CardTitle>About This Promo</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="text-muted-foreground leading-relaxed whitespace-pre-wrap break-words text-sm">
                        <Linkify options={{ target: "_blank", rel: "noopener noreferrer", className: "text-primary hover:underline" }}>
                          {selectedPromo.description}
                        </Linkify>
                      </div>

                      <Separator />

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <h4 className="font-semibold text-sm">Venue</h4>
                          <div className="flex items-start space-x-2">
                            <MapPin className="w-4 h-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                            <div className="min-w-0">
                              <p className="font-medium text-sm break-words">{selectedPromo.venue_name}</p>
                              {selectedPromo.venue_address && (
                                <p className="text-muted-foreground text-xs break-words">{selectedPromo.venue_address}</p>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <h4 className="font-semibold text-sm">Validity</h4>
                          <div className="space-y-1 text-xs">
                            {selectedPromo.day_of_week && selectedPromo.day_of_week.length > 0 && (
                              <p>Every {selectedPromo.day_of_week.join(", ")}</p>
                            )}
                            {selectedPromo.valid_until && (
                              <p>Valid until {selectedPromo.valid_until}</p>
                            )}
                          </div>
                        </div>

                        {selectedPromo.area && (
                          <div className="space-y-2">
                            <h4 className="font-semibold text-sm">Area</h4>
                            <Badge variant="outline">{selectedPromo.area}</Badge>
                          </div>
                        )}

                        {selectedPromo.drink_type && selectedPromo.drink_type.length > 0 && (
                          <div className="space-y-2">
                            <h4 className="font-semibold text-sm">Drink Type</h4>
                            <div className="flex flex-wrap gap-1">
                              {selectedPromo.drink_type.map(d => (
                                <Badge key={d} variant="outline">{d}</Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  Select a promo from the list
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default PromoReview;
