import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  ArrowLeft, Upload, Download, Loader2, Trash2, Play, FileCode, Pencil,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { checkUserAdminStatus } from "@/lib/auth-helpers";
import { useToast } from "@/hooks/use-toast";
import { SpinningPaws } from "@/components/ui/spinning-paws";
import { usePageTitle } from "@/hooks/usePageTitle";
import { encodeFrames, downloadBlob, type ExportFormat } from "@/lib/video-encoder";
import html2canvas from "html2canvas";

const BUCKET = "Party Panther Bucket I";
const REEL_W = 1080;
const REEL_H = 1920;

interface HtmlReel {
  id: string;
  name: string;
  html_url: string;
  thumbnail_url: string | null;
  default_duration: number;
  default_fps: number;
  created_at: string;
}

const HtmlReelToVideo = () => {
  usePageTitle("HTML Reel → Video");
  const navigate = useNavigate();
  const { toast } = useToast();

  const [authLoading, setAuthLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  const [reels, setReels] = useState<HtmlReel[]>([]);
  const [loadingReels, setLoadingReels] = useState(false);
  const [selectedReel, setSelectedReel] = useState<HtmlReel | null>(null);
  const [htmlContent, setHtmlContent] = useState<string>("");

  const [duration, setDuration] = useState(6);
  const [fps, setFps] = useState(30);

  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState("");
  const [progressPct, setProgressPct] = useState(0);
  const [previewKey, setPreviewKey] = useState(0); // force iframe replay

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auth: admin only
  useEffect(() => {
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          toast({ title: "Sign in required", variant: "destructive" });
          navigate("/auth");
          return;
        }
        const status = await checkUserAdminStatus(user.id);
        if (!status.is_admin) {
          toast({ title: "Admins only", variant: "destructive" });
          navigate("/admin");
          return;
        }
        setUserId(user.id);
      } finally {
        setAuthLoading(false);
      }
    })();
  }, [navigate, toast]);

  const loadReels = useCallback(async () => {
    if (!userId) return;
    setLoadingReels(true);
    const { data, error } = await supabase
      .from("html_reels")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      toast({ title: "Failed to load reels", description: error.message, variant: "destructive" });
    } else {
      setReels((data ?? []) as HtmlReel[]);
    }
    setLoadingReels(false);
  }, [userId, toast]);

  useEffect(() => { if (userId) loadReels(); }, [userId, loadReels]);

  // Load HTML content of selected reel
  useEffect(() => {
    if (!selectedReel) { setHtmlContent(""); return; }
    setDuration(selectedReel.default_duration);
    setFps(selectedReel.default_fps);
    (async () => {
      try {
        const res = await fetch(selectedReel.html_url);
        const text = await res.text();
        setHtmlContent(text);
        setPreviewKey((k) => k + 1);
      } catch (e: any) {
        toast({ title: "Could not load HTML", description: e.message, variant: "destructive" });
      }
    })();
  }, [selectedReel, toast]);

  // Upload new HTML file
  const handleUpload = async (file: File) => {
    if (!userId) return;
    if (!file.name.toLowerCase().endsWith(".html") && !file.name.toLowerCase().endsWith(".htm")) {
      toast({ title: "Please upload an .html file", variant: "destructive" });
      return;
    }
    try {
      const id = crypto.randomUUID();
      const path = `html-reels/${userId}/${id}.html`;
      const { error: upErr } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, { contentType: "text/html", upsert: false });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path);

      const { data, error } = await supabase
        .from("html_reels")
        .insert({
          created_by: userId,
          name: file.name.replace(/\.html?$/i, ""),
          html_url: pub.publicUrl,
          default_duration: 6,
          default_fps: 30,
        })
        .select()
        .single();
      if (error) throw error;

      toast({ title: "Reel uploaded" });
      setReels((prev) => [data as HtmlReel, ...prev]);
      setSelectedReel(data as HtmlReel);
    } catch (e: any) {
      toast({ title: "Upload failed", description: e.message, variant: "destructive" });
    }
  };

  const handleRename = async (reel: HtmlReel, newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed || trimmed === reel.name) return;
    const { error } = await supabase
      .from("html_reels")
      .update({ name: trimmed })
      .eq("id", reel.id);
    if (error) {
      toast({ title: "Rename failed", description: error.message, variant: "destructive" });
    } else {
      setReels((prev) => prev.map((r) => (r.id === reel.id ? { ...r, name: trimmed } : r)));
      if (selectedReel?.id === reel.id) setSelectedReel({ ...reel, name: trimmed });
    }
  };

  const handleDelete = async (reel: HtmlReel) => {
    const { error } = await supabase.from("html_reels").delete().eq("id", reel.id);
    if (error) {
      toast({ title: "Delete failed", description: error.message, variant: "destructive" });
      return;
    }
    // Best-effort storage cleanup
    try {
      const url = new URL(reel.html_url);
      const idx = url.pathname.indexOf("/html-reels/");
      if (idx >= 0) {
        const path = url.pathname.slice(idx + 1);
        await supabase.storage.from(BUCKET).remove([path]);
      }
    } catch { /* ignore */ }
    setReels((prev) => prev.filter((r) => r.id !== reel.id));
    if (selectedReel?.id === reel.id) setSelectedReel(null);
    toast({ title: "Reel deleted" });
  };

  const replay = () => setPreviewKey((k) => k + 1);

  const captureFrames = useCallback(async (): Promise<HTMLCanvasElement[]> => {
    const iframe = iframeRef.current;
    if (!iframe || !iframe.contentDocument) {
      throw new Error("Preview not ready");
    }
    const doc = iframe.contentDocument;
    const win = iframe.contentWindow as any;
    // Wait for fonts inside iframe
    try { await (doc as any).fonts?.ready; } catch { /* noop */ }

    const totalFrames = Math.round(duration * fps);
    const frameInterval = 1000 / fps;
    const frames: HTMLCanvasElement[] = [];

    // Deterministic timeline: pause all CSS/Web animations and scrub
    // currentTime per frame. Eliminates the shake caused by html2canvas
    // taking variable time while real-time animations drift.
    const getAnims = (): any[] => {
      try {
        return typeof (doc as any).getAnimations === "function"
          ? (doc as any).getAnimations({ subtree: true })
          : [];
      } catch { return []; }
    };
    const anims = getAnims();
    for (const a of anims) {
      try {
        a.pause();
        // Make sure finite-iteration anims don't auto-fill and freeze early
        if (a.effect && typeof a.effect.updateTiming === "function") {
          // leave timing alone; we'll just set currentTime
        }
      } catch { /* ignore */ }
    }

    for (let i = 0; i < totalFrames; i++) {
      const targetT = i * frameInterval;
      // Scrub every animation (including ones added late) to the exact frame time
      const currentAnims = getAnims();
      for (const a of currentAnims) {
        try {
          if (a.playState !== "paused") a.pause();
          a.currentTime = targetT;
        } catch { /* ignore */ }
      }
      // Let the iframe paint the new state
      await new Promise<void>((r) => {
        if (typeof win?.requestAnimationFrame === "function") {
          win.requestAnimationFrame(() => r());
        } else {
          requestAnimationFrame(() => r());
        }
      });

      const canvas = await html2canvas(doc.documentElement, {
        width: REEL_W,
        height: REEL_H,
        windowWidth: REEL_W,
        windowHeight: REEL_H,
        backgroundColor: null,
        scale: 1,
        useCORS: true,
        logging: false,
        foreignObjectRendering: false,
      });
      // Ensure even dims for H.264
      let out = canvas;
      if (canvas.width % 2 !== 0 || canvas.height % 2 !== 0) {
        const padded = document.createElement("canvas");
        padded.width = canvas.width + (canvas.width % 2);
        padded.height = canvas.height + (canvas.height % 2);
        const pctx = padded.getContext("2d")!;
        pctx.drawImage(canvas, 0, 0);
        out = padded;
      }
      frames.push(out);
      setProgressPct((i + 1) / totalFrames);
      setExportProgress(`Capturing frame ${i + 1}/${totalFrames}…`);
    }
    return frames;
  }, [duration, fps]);

  const doExport = async (format: ExportFormat) => {
    if (!selectedReel || !htmlContent) return;
    setExporting(true);
    setProgressPct(0);
    setExportProgress("Preparing…");
    try {
      // Restart animation, give it a moment to settle
      setPreviewKey((k) => k + 1);
      await new Promise((r) => setTimeout(r, 500));

      const frames = await captureFrames();
      setExportProgress("Encoding…");
      const { blob, ext } = await encodeFrames(frames, format, fps, (msg, p) => {
        setExportProgress(msg);
        if (typeof p === "number") setProgressPct(p);
      });
      const safeName = selectedReel.name.replace(/[^a-z0-9-_]+/gi, "_");
      downloadBlob(blob, `${safeName}-${Date.now()}.${ext}`);
      toast({ title: `Exported ${ext.toUpperCase()}`, description: `${(blob.size / 1024 / 1024).toFixed(1)} MB` });

      // Persist duration/fps as defaults
      await supabase
        .from("html_reels")
        .update({ default_duration: duration, default_fps: fps })
        .eq("id", selectedReel.id);
    } catch (e: any) {
      console.error(e);
      toast({ title: "Export failed", description: e.message, variant: "destructive" });
    } finally {
      setExporting(false);
      setExportProgress("");
      setProgressPct(0);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background pt-20 px-4">
        <div className="container mx-auto text-center space-y-4">
          <SpinningPaws size="lg" />
          <div>Verifying permissions...</div>
        </div>
      </div>
    );
  }

  // Preview scale: fit 1080×1920 into a sensibly sized box
  const previewMaxH = 600;
  const previewScale = previewMaxH / REEL_H;

  return (
    <>
      <Header activeSection="instagram" />
      <div className="min-h-screen bg-background pt-20 px-4 pb-8">
        <div className="container mx-auto space-y-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-3xl font-bold gradient-text mb-1">HTML Reel → Video</h1>
              <p className="text-muted-foreground text-sm">
                Upload an animated HTML file (1080×1920) and export it as MP4, WebM, or GIF.
              </p>
            </div>
            <div className="flex gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".html,.htm,text/html"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleUpload(f);
                  e.target.value = "";
                }}
              />
              <Button onClick={() => fileInputRef.current?.click()}>
                <Upload className="w-4 h-4 mr-2" /> Upload HTML
              </Button>
              <Button variant="outline" onClick={() => navigate("/admin/instagram-generator")}>
                <ArrowLeft className="w-4 h-4 mr-2" /> Back
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6">
            {/* Library */}
            <Card className="p-3 space-y-2 max-h-[80vh] overflow-y-auto">
              <div className="text-sm font-medium px-1">My reels</div>
              {loadingReels && <div className="text-xs text-muted-foreground px-1">Loading…</div>}
              {!loadingReels && reels.length === 0 && (
                <div className="text-xs text-muted-foreground px-1 py-4 text-center">
                  No reels yet. Upload an HTML file to start.
                </div>
              )}
              {reels.map((reel) => (
                <div
                  key={reel.id}
                  className={`group flex items-center gap-2 p-2 rounded-md cursor-pointer hover:bg-accent ${
                    selectedReel?.id === reel.id ? "bg-accent border border-primary/40" : "border border-transparent"
                  }`}
                  onClick={() => setSelectedReel(reel)}
                >
                  <FileCode className="w-4 h-4 shrink-0 text-muted-foreground" />
                  <div className="flex-1 min-w-0 text-sm truncate">{reel.name}</div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 opacity-0 group-hover:opacity-100"
                    onClick={(e) => {
                      e.stopPropagation();
                      const next = window.prompt("Rename reel", reel.name);
                      if (next) handleRename(reel, next);
                    }}
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 opacity-0 group-hover:opacity-100 text-destructive"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete this reel?</AlertDialogTitle>
                        <AlertDialogDescription>
                          "{reel.name}" will be removed from your library. This cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(reel)}>Delete</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              ))}
            </Card>

            {/* Editor / Preview */}
            <div className="space-y-4">
              {!selectedReel ? (
                <Card className="p-12 text-center text-muted-foreground">
                  Select a reel from the left, or upload a new HTML file.
                </Card>
              ) : (
                <>
                  <Card className="p-4 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Duration: {duration}s</Label>
                        <Slider
                          min={1} max={30} step={1}
                          value={[duration]}
                          onValueChange={(v) => setDuration(v[0])}
                          disabled={exporting}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Frame rate</Label>
                        <Select
                          value={String(fps)}
                          onValueChange={(v) => setFps(parseInt(v, 10))}
                          disabled={exporting}
                        >
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="15">15 fps (small file)</SelectItem>
                            <SelectItem value="24">24 fps (cinematic)</SelectItem>
                            <SelectItem value="30">30 fps (smooth)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" onClick={replay} disabled={exporting}>
                        <Play className="w-4 h-4 mr-2" /> Replay preview
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button disabled={exporting}>
                            {exporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
                            {exporting ? "Exporting…" : "Export"}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => doExport("mp4")}>
                            MP4 (WhatsApp / Instagram)
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => doExport("webm")}>
                            WebM (web only)
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => doExport("gif")}>
                            GIF (universal, smaller)
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {exporting && (
                      <div className="space-y-1">
                        <div className="text-xs text-muted-foreground">{exportProgress}</div>
                        <div className="h-1.5 bg-muted rounded overflow-hidden">
                          <div
                            className="h-full bg-primary transition-all"
                            style={{ width: `${Math.round(progressPct * 100)}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </Card>

                  <Card className="p-4">
                    <div className="text-xs text-muted-foreground mb-2">
                      Preview ({REEL_W}×{REEL_H}, scaled {Math.round(previewScale * 100)}%)
                    </div>
                    <div
                      className="mx-auto bg-black rounded-md overflow-hidden"
                      style={{
                        width: REEL_W * previewScale,
                        height: REEL_H * previewScale,
                      }}
                    >
                      <div
                        style={{
                          width: REEL_W,
                          height: REEL_H,
                          transform: `scale(${previewScale})`,
                          transformOrigin: "top left",
                        }}
                      >
                        {htmlContent && (
                          <iframe
                            key={previewKey}
                            ref={iframeRef}
                            title="HTML reel preview"
                            srcDoc={htmlContent}
                            sandbox="allow-same-origin allow-scripts"
                            style={{
                              width: REEL_W,
                              height: REEL_H,
                              border: 0,
                              display: "block",
                            }}
                          />
                        )}
                      </div>
                    </div>
                  </Card>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default HtmlReelToVideo;