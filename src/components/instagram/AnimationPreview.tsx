import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Play, Pause, RotateCcw, Download, Video, Loader2 } from "lucide-react";
import type { PostContent } from "@/types/instagram-post";
import { InstagramPostScene, getDimensions } from "./InstagramPostScene";
import html2canvas from "html2canvas";
import React from "react";

type AnimationType = "fade" | "slide-up" | "slide-left" | "scale" | "typewriter" | "blur-in" | "flip";

interface AnimationPreviewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  content: PostContent;
}

// Timeline-driven animation model
interface TimelineEntry {
  key: string;       // "logo" | "headline" | "section-0" etc.
  startMs: number;   // when this element starts appearing
  durationMs: number; // how long the enter animation lasts
}

function buildTimeline(content: PostContent, speed: number): { entries: TimelineEntry[]; totalMs: number } {
  const baseDur = 800 / speed;
  const pauseMs = 600 / speed;
  const entries: TimelineEntry[] = [];
  let t = 0;

  // Logo appears first
  if ((content.showLogo ?? true) || (content.showBrandName ?? true)) {
    entries.push({ key: "logo", startMs: t, durationMs: baseDur });
  }

  // Headline
  if (content.headline) {
    t += baseDur * 0.3; // slight overlap
    entries.push({ key: "headline", startMs: t, durationMs: baseDur });
    t += baseDur;
  }

  // Sections — each group enters separately with a pause
  content.sections.forEach((_, idx) => {
    t += pauseMs;
    entries.push({ key: `section-${idx}`, startMs: t, durationMs: baseDur });
    t += baseDur;
  });

  // QR code
  if (content.qrCode?.enabled && content.qrCode.url) {
    t += pauseMs * 0.5;
    entries.push({ key: "qrcode", startMs: t, durationMs: baseDur });
    t += baseDur;
  }

  return { entries, totalMs: t + 500 }; // 500ms hold at end
}

function getAnimStyleForEntry(
  entry: TimelineEntry,
  currentMs: number,
  animType: AnimationType,
): React.CSSProperties {
  if (currentMs < entry.startMs) {
    return { opacity: 0, visibility: "hidden" as const };
  }

  const progress = Math.min(1, (currentMs - entry.startMs) / entry.durationMs);

  if (progress >= 1) {
    return { opacity: 1 };
  }

  // Ease-out cubic
  const eased = 1 - Math.pow(1 - progress, 3);

  switch (animType) {
    case "fade":
      return { opacity: eased };
    case "slide-up":
      return { opacity: eased, transform: `translateY(${60 * (1 - eased)}px)` };
    case "slide-left":
      return { opacity: eased, transform: `translateX(${-80 * (1 - eased)}px)` };
    case "scale": {
      const scaleVal = 0.3 + 0.7 * eased;
      return { opacity: eased, transform: `scale(${scaleVal})` };
    }
    case "typewriter":
      return { opacity: eased, clipPath: `inset(0 ${100 * (1 - eased)}% 0 0)` };
    case "blur-in": {
      const blur = 20 * (1 - eased);
      const sc = 1.1 - 0.1 * eased;
      return { opacity: eased, filter: `blur(${blur}px)`, transform: `scale(${sc})` };
    }
    case "flip":
      return { opacity: eased, transform: `perspective(400px) rotateX(${-90 * (1 - eased)}deg)` };
    default:
      return { opacity: eased };
  }
}

export const AnimationPreview = ({ open, onOpenChange, content }: AnimationPreviewProps) => {
  const [animation, setAnimation] = useState<AnimationType>("fade");
  const [speed, setSpeed] = useState(1);
  const [playing, setPlaying] = useState(false);
  const [currentTimeMs, setCurrentTimeMs] = useState(0);
  const [recording, setRecording] = useState(false);
  const [recordingFormat, setRecordingFormat] = useState<"webm" | "gif" | "mp4" | null>(null);
  const [capturedFrames, setCapturedFrames] = useState(0);
  const [exportProgress, setExportProgress] = useState("");

  // Ref to the off-screen full-size scene for export
  const exportSceneRef = useRef<HTMLDivElement>(null);
  // For tracking animation frame
  const rafRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);

  const { entries, totalMs } = useMemo(() => buildTimeline(content, speed), [content, speed]);
  const dimensions = getDimensions(content.format);

  // Compute element styles based on currentTimeMs
  const elementStyles = useMemo(() => {
    const styles: Record<string, React.CSSProperties> = {};
    entries.forEach((entry) => {
      styles[entry.key] = getAnimStyleForEntry(entry, currentTimeMs, animation);
    });
    return styles;
  }, [entries, currentTimeMs, animation]);

  // Visibility: all elements are always mounted (the scene handles it), but opacity=0 hides them
  const elementVisibility = useMemo(() => {
    const vis: Record<string, boolean> = {};
    // Always show all elements; the style will handle opacity
    entries.forEach((e) => { vis[e.key] = true; });
    return vis;
  }, [entries]);

  // Playback via requestAnimationFrame
  const playAnimation = useCallback(() => {
    setPlaying(true);
    setCurrentTimeMs(0);
    startTimeRef.current = performance.now();

    const tick = () => {
      const elapsed = performance.now() - startTimeRef.current;
      setCurrentTimeMs(elapsed);
      if (elapsed < totalMs) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        setCurrentTimeMs(totalMs);
        setPlaying(false);
      }
    };
    rafRef.current = requestAnimationFrame(tick);
  }, [totalMs]);

  const resetAnimation = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    setPlaying(false);
    setCurrentTimeMs(0);
  }, []);

  useEffect(() => {
    if (open) {
      setTimeout(playAnimation, 300);
    }
    return () => cancelAnimationFrame(rafRef.current);
  }, [open]);

  // Prepare clone for html2canvas export
  const prepareCloneForExport = (clone: HTMLElement) => {
    const brandText = clone.querySelector("[data-brand-text]") as HTMLElement | null;
    if (brandText) {
      brandText.style.background = "none";
      (brandText.style as any).webkitBackgroundClip = "unset";
      brandText.style.backgroundClip = "unset";
      (brandText.style as any).webkitTextFillColor = "#00CFFF";
      brandText.style.color = "#00CFFF";
      brandText.style.textShadow = "0 0 20px rgba(0, 207, 255, 0.6)";
      brandText.style.filter = "none";
    }
    const brandLogo = clone.querySelector("[data-brand-logo]") as HTMLImageElement | null;
    if (brandLogo) {
      brandLogo.style.filter = "none";
    }
  };

  // Capture a single frame at a given timeMs from the off-screen scene
  const captureFrameAtTime = useCallback(async (timeMs: number): Promise<HTMLCanvasElement | null> => {
    // Update state to reflect this time
    // We need to render the scene at this time, so we set the currentTimeMs
    // BUT we can't rely on React re-rendering synchronously.
    // Instead, we'll directly manipulate the off-screen scene's element styles.
    // Actually, since the off-screen scene is driven by props which are from state,
    // we need a different approach: we'll use a dedicated render function.

    // For the export, we mount an off-screen scene and update it frame-by-frame.
    // The trick: we'll use a dedicated state variable for export time.
    // But that would be async. Instead, let's clone the export scene and manually set styles.

    const el = exportSceneRef.current;
    if (!el) return null;

    try {
      const canvas = await html2canvas(el, {
        width: dimensions.width,
        height: dimensions.height,
        scale: 1,
        useCORS: true,
        allowTaint: true,
        backgroundColor: null,
        logging: false,
      });
      return canvas;
    } catch (err) {
      console.error("Frame capture error:", err);
      return null;
    }
  }, [dimensions]);

  // Export: render frames by stepping through the timeline
  const doExport = useCallback(async (format: "webm" | "gif" | "mp4") => {
    setRecording(true);
    setRecordingFormat(format);
    setCapturedFrames(0);
    setExportProgress("Preparing...");

    const fps = format === "gif" ? 10 : 15;
    const frameInterval = 1000 / fps;
    const totalFrames = Math.ceil(totalMs / frameInterval);
    const frames: HTMLCanvasElement[] = [];

    // Wait for fonts
    await document.fonts.ready;
    
    // Step through the timeline, updating state for each frame and capturing
    for (let i = 0; i <= totalFrames; i++) {
      const timeMs = Math.min(i * frameInterval, totalMs);
      // Update the animation time (this triggers a React re-render of the off-screen scene)
      setCurrentTimeMs(timeMs);
      // Wait for React to render
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => resolve());
        });
      });

      const el = exportSceneRef.current;
      if (!el) continue;

      // Clone for clean capture
      const clone = el.cloneNode(true) as HTMLElement;
      clone.style.position = "fixed";
      clone.style.left = "-9999px";
      clone.style.top = "0";
      document.body.appendChild(clone);
      prepareCloneForExport(clone);

      try {
        const canvas = await html2canvas(clone, {
          width: dimensions.width,
          height: dimensions.height,
          scale: 1,
          useCORS: true,
          allowTaint: true,
          backgroundColor: null,
          logging: false,
        });
        frames.push(canvas);
        setCapturedFrames(frames.length);
        setExportProgress(`Capturing frame ${frames.length}/${totalFrames + 1}`);
      } catch (err) {
        console.error("Frame capture error:", err);
      } finally {
        document.body.removeChild(clone);
      }
    }

    if (frames.length === 0) {
      setRecording(false);
      setRecordingFormat(null);
      setExportProgress("");
      return;
    }

    // Encode
    if (format === "gif") {
      setExportProgress("Assembling GIF...");
      const GIF = (await import("gif.js")).default;
      const gif = new GIF({
        workers: 2,
        quality: 10,
        width: dimensions.width,
        height: dimensions.height,
        workerScript: "/gif.worker.js",
      });

      frames.forEach((frame) => {
        gif.addFrame(frame, { delay: frameInterval, copy: true });
      });

      gif.on("finished", (blob: Blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `animation-${Date.now()}.gif`;
        a.click();
        URL.revokeObjectURL(url);
        setRecording(false);
        setRecordingFormat(null);
        setCapturedFrames(0);
        setExportProgress("");
      });

      gif.render();
    } else {
      // WebM or MP4
      setExportProgress("Encoding video...");
      const w = dimensions.width;
      const h = dimensions.height;
      const streamCanvas = document.createElement("canvas");
      streamCanvas.width = w;
      streamCanvas.height = h;
      const ctx = streamCanvas.getContext("2d")!;

      let mimeType: string;
      let ext: string;
      if (format === "mp4" && MediaRecorder.isTypeSupported("video/mp4")) {
        mimeType = "video/mp4";
        ext = "mp4";
      } else if (MediaRecorder.isTypeSupported("video/webm;codecs=vp9")) {
        mimeType = "video/webm;codecs=vp9";
        ext = "webm";
      } else if (MediaRecorder.isTypeSupported("video/webm;codecs=vp8")) {
        mimeType = "video/webm;codecs=vp8";
        ext = "webm";
      } else {
        mimeType = "video/webm";
        ext = "webm";
      }

      const stream = streamCanvas.captureStream(0);
      const recorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: 8_000_000,
      });
      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };

      const downloadPromise = new Promise<void>((resolve) => {
        recorder.onstop = () => {
          const blob = new Blob(chunks, { type: mimeType });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `animation-${Date.now()}.${ext}`;
          a.click();
          URL.revokeObjectURL(url);
          resolve();
        };
      });

      recorder.start();
      const track = stream.getVideoTracks()[0] as any;

      // Push each pre-captured frame into the video
      for (let i = 0; i < frames.length; i++) {
        ctx.clearRect(0, 0, w, h);
        ctx.drawImage(frames[i], 0, 0, w, h);
        if (track?.requestFrame) track.requestFrame();
        // Hold each frame for the frame interval duration
        await new Promise((r) => setTimeout(r, frameInterval));
      }

      // Hold last frame a bit
      await new Promise((r) => setTimeout(r, 300));
      if (track?.requestFrame) track.requestFrame();

      recorder.stop();
      await downloadPromise;

      setRecording(false);
      setRecordingFormat(null);
      setCapturedFrames(0);
      setExportProgress("");
    }
  }, [totalMs, dimensions]);

  // Preview scale for in-dialog viewing
  const previewScale = 0.35;
  const previewWidth = dimensions.width * previewScale;
  const previewHeight = dimensions.height * previewScale;

  // Check if MP4 is natively supported
  const mp4Supported = useMemo(() => {
    try {
      return MediaRecorder.isTypeSupported("video/mp4");
    } catch {
      return false;
    }
  }, []);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto z-[1200] [&~*]:z-[1200]">
        <DialogHeader>
          <DialogTitle>Animation Preview</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Controls */}
          <div className="flex gap-2 items-end flex-wrap">
            <div className="flex-1 min-w-[120px] space-y-1">
              <Label className="text-xs">Animation Type</Label>
              <Select value={animation} onValueChange={(v) => setAnimation(v as AnimationType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="z-[1300]">
                  <SelectItem value="fade">Fade In</SelectItem>
                  <SelectItem value="slide-up">Slide Up</SelectItem>
                  <SelectItem value="slide-left">Slide Left</SelectItem>
                  <SelectItem value="scale">Scale Bounce</SelectItem>
                  <SelectItem value="typewriter">Typewriter</SelectItem>
                  <SelectItem value="blur-in">Blur In</SelectItem>
                  <SelectItem value="flip">Flip In</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button size="sm" onClick={playAnimation} disabled={playing || recording}>
              {playing ? <Pause className="w-4 h-4 mr-1" /> : <Play className="w-4 h-4 mr-1" />}
              {playing ? "Playing" : "Play"}
            </Button>
            <Button size="sm" variant="outline" onClick={resetAnimation} disabled={recording}>
              <RotateCcw className="w-4 h-4" />
            </Button>

            {/* Record dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="secondary" disabled={recording}>
                  {recording ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                      Exporting…
                    </>
                  ) : (
                    <>
                      <Video className="w-4 h-4 mr-1" />
                      Export
                    </>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="z-[1300]">
                {mp4Supported && (
                  <DropdownMenuItem onClick={() => doExport("mp4")}>
                    <Download className="w-4 h-4 mr-2" />
                    Download as MP4
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => doExport("webm")}>
                  <Download className="w-4 h-4 mr-2" />
                  Download as WebM
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => doExport("gif")}>
                  <Download className="w-4 h-4 mr-2" />
                  Download as GIF
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Recording indicator */}
          {recording && (
            <div className="flex items-center gap-2 text-sm text-red-400">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              {exportProgress || `${capturedFrames} frames captured`}
            </div>
          )}

          {/* Speed control */}
          <div className="space-y-1">
            <Label className="text-xs">Speed: {speed}x</Label>
            <Slider
              value={[speed]}
              onValueChange={([v]) => setSpeed(v)}
              min={0.3}
              max={3}
              step={0.1}
            />
          </div>

          {/* Scaled preview — uses the shared scene with timeline-driven styles */}
          <div className="flex justify-center overflow-auto">
            <div
              style={{
                width: previewWidth,
                height: previewHeight,
                overflow: "hidden",
                borderRadius: 8,
              }}
            >
              <div
                style={{
                  transform: `scale(${previewScale})`,
                  transformOrigin: "top center",
                  width: dimensions.width,
                  height: dimensions.height,
                  marginBottom: -(dimensions.height * (1 - previewScale)),
                }}
              >
                <InstagramPostScene
                  content={content}
                  width={dimensions.width}
                  height={dimensions.height}
                  elementVisibility={elementVisibility}
                  elementStyles={elementStyles}
                  hideDragLabels
                />
              </div>
            </div>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            Preview how your post would look as an animated story
          </p>
        </div>
      </DialogContent>

      {/* Off-screen full-size scene for export — always mounted when dialog is open */}
      {open && (
        <div
          style={{
            position: "fixed",
            left: "-99999px",
            top: 0,
            pointerEvents: "none",
          }}
        >
          <InstagramPostScene
            ref={exportSceneRef}
            content={content}
            width={dimensions.width}
            height={dimensions.height}
            elementVisibility={elementVisibility}
            elementStyles={elementStyles}
            hideDragLabels
          />
        </div>
      )}
    </Dialog>
  );
};
