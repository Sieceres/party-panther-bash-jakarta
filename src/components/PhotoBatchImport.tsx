import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Upload,
  Loader2,
  Check,
  X,
  SkipForward,
  ImageIcon,
  Sparkles,
  Clipboard,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Trash2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { uploadImage } from "@/lib/supabase-storage";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { normalizePromoType, PROMO_TYPES as PROMO_TYPE_OPTIONS } from "@/lib/promo-types";

type ItemKind = "promo" | "event";
type Status = "pending" | "extracting" | "ready" | "accepted" | "skipped" | "error" | "saving" | "saved";

interface PhotoItem {
  id: string;
  file: File;
  previewUrl: string;
  status: Status;
  kind: ItemKind;
  errorMessage?: string;
  // common
  title: string;
  description: string;
  venue_name: string;
  venue_address: string;
  // promo
  discount_text: string;
  promo_type: string;
  area: string;
  // event
  date: string;
  time: string;
  organizer_name: string;
}

const newItem = (file: File, defaultKind: ItemKind): PhotoItem => ({
  id: `${file.name}-${file.size}-${Math.random().toString(36).slice(2, 8)}`,
  file,
  previewUrl: URL.createObjectURL(file),
  status: "pending",
  kind: defaultKind,
  title: "",
  description: "",
  venue_name: "",
  venue_address: "",
  discount_text: "",
  promo_type: "",
  area: "",
  date: "",
  time: "",
  organizer_name: "",
});

const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = (e) => resolve(e.target?.result as string);
    r.onerror = reject;
    r.readAsDataURL(file);
  });

interface Props {
  defaultKind?: ItemKind;
}

export const PhotoBatchImport = ({ defaultKind = "promo" }: Props) => {
  const [items, setItems] = useState<PhotoItem[]>([]);
  const [batchKind, setBatchKind] = useState<ItemKind>(defaultKind);
  const [stage, setStage] = useState<"upload" | "review" | "done">("upload");
  const [extractProgress, setExtractProgress] = useState({ done: 0, total: 0 });
  const [activeIdx, setActiveIdx] = useState(0);
  const [savedCount, setSavedCount] = useState({ promos: 0, events: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      items.forEach((i) => URL.revokeObjectURL(i.previewUrl));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addFiles = useCallback(
    (files: File[]) => {
      const imgs = files.filter((f) => f.type.startsWith("image/"));
      if (imgs.length === 0) return;
      setItems((prev) => [...prev, ...imgs.map((f) => newItem(f, batchKind))]);
    },
    [batchKind],
  );

  // Global paste support while on upload stage
  useEffect(() => {
    if (stage !== "upload") return;
    const onPaste = (e: ClipboardEvent) => {
      const clipItems = e.clipboardData?.items;
      if (!clipItems) return;
      const files: File[] = [];
      for (const it of Array.from(clipItems)) {
        if (it.type.startsWith("image/")) {
          const f = it.getAsFile();
          if (f) files.push(f);
        }
      }
      if (files.length) {
        e.preventDefault();
        addFiles(files);
      }
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [stage, addFiles]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    addFiles(Array.from(e.dataTransfer.files || []));
  };

  const removeStaged = (id: string) => {
    setItems((prev) => {
      const next = prev.filter((p) => p.id !== id);
      const removed = prev.find((p) => p.id === id);
      if (removed) URL.revokeObjectURL(removed.previewUrl);
      return next;
    });
  };

  const updateItem = (id: string, patch: Partial<PhotoItem>) => {
    setItems((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  };

  // Extract one photo
  const extractOne = async (item: PhotoItem) => {
    try {
      const base64 = await fileToBase64(item.file);
      const { data, error } = await supabase.functions.invoke("extract-from-image", {
        body: { image: base64, type: item.kind },
      });
      if (error) throw error;
      const first = data?.items?.[0];
      if (!first) {
        updateItem(item.id, { status: "error", errorMessage: "Nothing extracted from this photo" });
        return;
      }
      const patch: Partial<PhotoItem> = {
        status: "ready",
        title: first.title || "",
        description: first.description || "",
        venue_name: first.venue_name || "",
        venue_address: first.venue_address || "",
      };
      if (item.kind === "promo") {
        patch.discount_text = first.discount_text || "";
        patch.promo_type = normalizePromoType(first.promo_type) || "";
        patch.area = first.area || "";
      } else {
        patch.date = first.date || "";
        patch.time = first.time || "";
        patch.organizer_name = first.organizer_name || "";
      }
      updateItem(item.id, patch);
    } catch (err) {
      console.error("extract error", err);
      updateItem(item.id, {
        status: "error",
        errorMessage: err instanceof Error ? err.message : "Extraction failed",
      });
    }
  };

  // Extract all queued items sequentially
  const startExtraction = async () => {
    if (items.length === 0) return;
    setStage("review");
    setExtractProgress({ done: 0, total: items.length });

    // Mark all as extracting up-front so we render placeholders
    setItems((prev) => prev.map((p) => ({ ...p, status: "extracting" as Status })));

    // Process sequentially to avoid rate-limits
    for (let i = 0; i < items.length; i++) {
      // We re-read from state via functional update inside extractOne
      // but we have a stable reference here; simpler to call directly:
      await extractOne(items[i]);
      setExtractProgress((p) => ({ ...p, done: p.done + 1 }));
    }
  };

  const reextract = async (item: PhotoItem) => {
    updateItem(item.id, { status: "extracting" });
    await extractOne(item);
  };

  // Visible items in the swipe stack: ready, extracting, error
  const stackItems = items.filter(
    (i) => i.status === "ready" || i.status === "extracting" || i.status === "error",
  );
  const current = stackItems[activeIdx];

  // Keep activeIdx in range
  useEffect(() => {
    if (stage !== "review") return;
    if (activeIdx >= stackItems.length && stackItems.length > 0) {
      setActiveIdx(stackItems.length - 1);
    }
  }, [stackItems.length, activeIdx, stage]);

  const acceptCurrent = async () => {
    if (!current || current.status !== "ready") return;
    if (!current.title.trim()) {
      toast({ title: "Add a title before accepting", variant: "destructive" });
      return;
    }
    updateItem(current.id, { status: "saving" });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Upload the photo to storage so it becomes the entity's image_url
      const folder = current.kind === "promo" ? "promos" : "events";
      const imageUrl = await uploadImage(current.file, folder, user.id);

      if (current.kind === "promo") {
        const { error } = await supabase.from("promos").insert({
          title: current.title.trim(),
          description: current.description || current.discount_text || current.title,
          discount_text: current.discount_text || current.title,
          venue_name: current.venue_name || "Unknown",
          venue_address: current.venue_address || null,
          promo_type: current.promo_type || null,
          area: current.area || null,
          image_url: imageUrl,
          price_currency: "IDR",
          created_by: user.id,
        });
        if (error) throw error;
        setSavedCount((c) => ({ ...c, promos: c.promos + 1 }));
      } else {
        const { error } = await supabase.from("events").insert({
          title: current.title.trim(),
          description: current.description || null,
          date: current.date || new Date().toISOString().split("T")[0],
          time: current.time || "00:00",
          venue_name: current.venue_name || null,
          venue_address: current.venue_address || null,
          organizer_name: current.organizer_name || null,
          image_url: imageUrl,
          price_currency: "IDR",
          created_by: user.id,
        });
        if (error) throw error;
        setSavedCount((c) => ({ ...c, events: c.events + 1 }));
      }
      updateItem(current.id, { status: "saved" });
      toast({ title: `${current.kind === "promo" ? "Promo" : "Event"} saved`, description: current.title });
      // Advance: stackItems will shrink because saved is filtered out
    } catch (err) {
      console.error(err);
      updateItem(current.id, { status: "ready" });
      toast({
        title: "Failed to save",
        description: err instanceof Error ? err.message : "Try again",
        variant: "destructive",
      });
    }
  };

  const skipCurrent = () => {
    if (!current) return;
    updateItem(current.id, { status: "skipped" });
  };

  const goPrev = () => setActiveIdx((i) => Math.max(0, i - 1));
  const goNext = () => setActiveIdx((i) => Math.min(stackItems.length - 1, i + 1));

  // Keyboard shortcuts on review
  useEffect(() => {
    if (stage !== "review") return;
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) return;
      if (e.key === "ArrowLeft") goPrev();
      else if (e.key === "ArrowRight") goNext();
      else if (e.key.toLowerCase() === "a") acceptCurrent();
      else if (e.key.toLowerCase() === "s") skipCurrent();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, current, stackItems.length]);

  const finishReview = () => setStage("done");

  const resetAll = () => {
    items.forEach((i) => URL.revokeObjectURL(i.previewUrl));
    setItems([]);
    setActiveIdx(0);
    setSavedCount({ promos: 0, events: 0 });
    setExtractProgress({ done: 0, total: 0 });
    setStage("upload");
  };

  // ---- RENDER ----

  if (stage === "done") {
    return (
      <Card>
        <CardContent className="py-12 text-center space-y-4">
          <CheckCircle2 className="w-16 h-16 mx-auto text-primary" />
          <h2 className="text-2xl font-bold">All done!</h2>
          <p className="text-muted-foreground">
            Saved {savedCount.promos} promo{savedCount.promos === 1 ? "" : "s"} and {savedCount.events} event
            {savedCount.events === 1 ? "" : "s"}.
          </p>
          <div className="flex justify-center gap-3 pt-4">
            <Button variant="outline" onClick={resetAll}>Import more photos</Button>
            <Button onClick={() => navigate("/promos")}>View promos</Button>
            <Button variant="outline" onClick={() => navigate("/events")}>View events</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (stage === "review") {
    const remaining = stackItems.length;
    const accepted = items.filter((i) => i.status === "saved").length;
    const skipped = items.filter((i) => i.status === "skipped").length;

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <Button variant="ghost" size="sm" onClick={resetAll}>
            <ArrowLeft className="w-4 h-4 mr-1" /> Start over
          </Button>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Badge variant="secondary">Accepted {accepted}</Badge>
            <Badge variant="secondary">Skipped {skipped}</Badge>
            <Badge variant="secondary">Remaining {remaining}</Badge>
          </div>
          <Button size="sm" onClick={finishReview}>Finish</Button>
        </div>

        {extractProgress.done < extractProgress.total && (
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Sparkles className="w-3.5 h-3.5 animate-pulse text-primary" />
              AI extracting {extractProgress.done} / {extractProgress.total}…
            </div>
            <Progress value={(extractProgress.done / Math.max(1, extractProgress.total)) * 100} className="h-1.5" />
          </div>
        )}

        {!current && (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground space-y-3">
              <CheckCircle2 className="w-10 h-10 mx-auto text-primary" />
              <p>Nothing left to review. Hit Finish above to wrap up.</p>
            </CardContent>
          </Card>
        )}

        {current && (
          <Card className="overflow-hidden">
            <div className="grid md:grid-cols-2 gap-0">
              {/* Image side */}
              <div className="relative bg-muted/50 flex items-center justify-center min-h-[280px]">
                <img
                  src={current.previewUrl}
                  alt={current.title || "Photo to review"}
                  className="max-h-[480px] w-full object-contain"
                />
                <div className="absolute top-2 left-2 flex gap-1">
                  <Badge variant="secondary">
                    {activeIdx + 1} / {stackItems.length}
                  </Badge>
                </div>
              </div>

              {/* Form side */}
              <CardContent className="p-4 space-y-3">
                {current.status === "extracting" && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" /> AI reading this photo…
                  </div>
                )}
                {current.status === "error" && (
                  <div className="rounded-md bg-destructive/10 text-destructive p-3 text-sm space-y-2">
                    <div>{current.errorMessage || "Extraction failed"}</div>
                    <Button size="sm" variant="outline" onClick={() => reextract(current)}>
                      Retry extraction
                    </Button>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <Tabs
                    value={current.kind}
                    onValueChange={(v) => {
                      const next = v as ItemKind;
                      updateItem(current.id, { kind: next, status: "extracting" });
                      reextract({ ...current, kind: next });
                    }}
                  >
                    <TabsList>
                      <TabsTrigger value="promo">Promo</TabsTrigger>
                      <TabsTrigger value="event">Event</TabsTrigger>
                    </TabsList>
                  </Tabs>
                  <span className="text-xs text-muted-foreground">
                    Shortcuts: <kbd className="px-1 rounded bg-muted">A</kbd> accept ·{" "}
                    <kbd className="px-1 rounded bg-muted">S</kbd> skip ·{" "}
                    <kbd className="px-1 rounded bg-muted">←</kbd>/<kbd className="px-1 rounded bg-muted">→</kbd> nav
                  </span>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={current.title}
                    onChange={(e) => updateItem(current.id, { title: e.target.value })}
                    placeholder="Title"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2 col-span-2">
                    <Label>Venue name</Label>
                    <Input
                      value={current.venue_name}
                      onChange={(e) => updateItem(current.id, { venue_name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label>Venue address</Label>
                    <Input
                      value={current.venue_address}
                      onChange={(e) => updateItem(current.id, { venue_address: e.target.value })}
                    />
                  </div>

                  {current.kind === "promo" ? (
                    <>
                      <div className="space-y-2 col-span-2">
                        <Label>Discount / deal</Label>
                        <Input
                          value={current.discount_text}
                          onChange={(e) => updateItem(current.id, { discount_text: e.target.value })}
                          placeholder="e.g. Buy 1 Get 1 cocktails"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Promo type</Label>
                        <Select
                          value={current.promo_type}
                          onValueChange={(v) => updateItem(current.id, { promo_type: v })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            {PROMO_TYPE_OPTIONS.map((t) => (
                              <SelectItem key={t} value={t}>
                                {t}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Area</Label>
                        <Input
                          value={current.area}
                          onChange={(e) => updateItem(current.id, { area: e.target.value })}
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="space-y-2">
                        <Label>Date</Label>
                        <Input
                          type="date"
                          value={current.date}
                          onChange={(e) => updateItem(current.id, { date: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Time</Label>
                        <Input
                          type="time"
                          value={current.time}
                          onChange={(e) => updateItem(current.id, { time: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2 col-span-2">
                        <Label>Organizer</Label>
                        <Input
                          value={current.organizer_name}
                          onChange={(e) => updateItem(current.id, { organizer_name: e.target.value })}
                        />
                      </div>
                    </>
                  )}

                  <div className="space-y-2 col-span-2">
                    <Label>Description</Label>
                    <Textarea
                      value={current.description}
                      onChange={(e) => updateItem(current.id, { description: e.target.value })}
                      rows={3}
                    />
                  </div>
                </div>

                {/* Action bar */}
                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={goPrev} disabled={activeIdx === 0}>
                      <ArrowLeft className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={goNext}
                      disabled={activeIdx >= stackItems.length - 1}
                    >
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={skipCurrent}>
                      <SkipForward className="w-4 h-4 mr-1" /> Skip
                    </Button>
                    <Button
                      size="sm"
                      onClick={acceptCurrent}
                      disabled={current.status !== "ready" || !current.title.trim()}
                    >
                      {current.status === "saving" ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-1 animate-spin" /> Saving…
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4 mr-1" /> Accept &amp; save
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </div>
          </Card>
        )}
      </div>
    );
  }

  // stage === "upload"
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <Label className="text-sm">Default type for new photos:</Label>
        <Select value={batchKind} onValueChange={(v) => setBatchKind(v as ItemKind)}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="promo">Promo</SelectItem>
            <SelectItem value="event">Event</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground">
          You can change the type per photo during review.
        </span>
      </div>

      <div
        className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => addFiles(Array.from(e.target.files || []))}
        />
        <ImageIcon className="w-10 h-10 mx-auto text-muted-foreground" />
        <p className="mt-2 font-medium">Drop multiple photos here, or click to pick files</p>
        <p className="text-sm text-muted-foreground">JPG, PNG, WebP — pick as many as you want</p>
        <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground/70 mt-1">
          <Clipboard className="w-3.5 h-3.5" />
          <span>You can also paste images from your clipboard (Ctrl+V / ⌘V)</span>
        </div>
      </div>

      {items.length > 0 && (
        <Card>
          <CardContent className="p-3 space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium">
                {items.length} photo{items.length === 1 ? "" : "s"} queued
              </div>
              <Button size="sm" variant="ghost" onClick={resetAll}>
                Clear all
              </Button>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
              {items.map((it) => (
                <div key={it.id} className="relative group">
                  <img
                    src={it.previewUrl}
                    alt="queued"
                    className="w-full aspect-square object-cover rounded-md border"
                  />
                  <button
                    type="button"
                    onClick={() => removeStaged(it.id)}
                    className="absolute -top-1.5 -right-1.5 bg-background border rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition"
                    aria-label="Remove"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-destructive" />
                  </button>
                </div>
              ))}
            </div>
            <Button className="w-full" onClick={startExtraction} disabled={items.length === 0}>
              <Sparkles className="w-4 h-4 mr-2" />
              Extract &amp; review {items.length} photo{items.length === 1 ? "" : "s"}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PhotoBatchImport;