import { useState, useEffect, useRef, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Play, Pause, RotateCcw, Download, Video, Loader2 } from "lucide-react";
import type { PostContent } from "@/types/instagram-post";
import partyPantherLogo from "@/assets/party-panther-logo.png";
import html2canvas from "html2canvas";

type AnimationType = "fade" | "slide-up" | "slide-left" | "scale" | "typewriter" | "blur-in" | "flip";

interface AnimationPreviewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  content: PostContent;
}

export const AnimationPreview = ({ open, onOpenChange, content }: AnimationPreviewProps) => {
  const [animation, setAnimation] = useState<AnimationType>("fade");
  const [speed, setSpeed] = useState(1);
  const [playing, setPlaying] = useState(false);
  const [key, setKey] = useState(0);
  const [recording, setRecording] = useState(false);
  const [recordingFormat, setRecordingFormat] = useState<"webm" | "gif" | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  const baseDuration = 0.8;
  const duration = baseDuration / speed;
  // Headline appears first, then each section group (subheadline+body+divider) with a pause
  const sectionPause = 0.6 / speed; // pause between section groups
  const sectionGroupDelay = (idx: number) => duration + idx * (duration + sectionPause);
  const totalTime = (sectionGroupDelay(content.sections.length) + duration) * 1000 + 500;

  const playAnimation = useCallback(() => {
    setPlaying(true);
    setKey((k) => k + 1);
    setTimeout(() => setPlaying(false), totalTime);
  }, [totalTime]);

  const resetAnimation = () => {
    setPlaying(false);
    setKey((k) => k + 1);
  };

  useEffect(() => {
    if (open) {
      setTimeout(playAnimation, 300);
    }
  }, [open]);

  const recordWebM = useCallback(async () => {
    if (!previewRef.current) return;
    setRecording(true);
    setRecordingFormat("webm");

    // Create a canvas to draw frames onto
    const el = previewRef.current;
    const rect = el.getBoundingClientRect();
    const scale = 2;
    const canvas = document.createElement("canvas");
    canvas.width = rect.width * scale;
    canvas.height = rect.height * scale;
    const ctx = canvas.getContext("2d")!;

    const stream = canvas.captureStream(30);
    const recorder = new MediaRecorder(stream, {
      mimeType: "video/webm;codecs=vp9",
      videoBitsPerSecond: 5_000_000,
    });
    const chunks: Blob[] = [];
    recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: "video/webm" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "animation.webm";
      a.click();
      URL.revokeObjectURL(url);
      setRecording(false);
      setRecordingFormat(null);
    };

    // Start animation
    setPlaying(true);
    setKey((k) => k + 1);
    recorder.start();

    // Capture frames
    const fps = 30;
    const interval = 1000 / fps;
    const captureInterval = setInterval(async () => {
      try {
        const frameCanvas = await html2canvas(el, {
          scale,
          useCORS: true,
          backgroundColor: null,
          logging: false,
        });
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(frameCanvas, 0, 0, canvas.width, canvas.height);
      } catch { /* skip frame */ }
    }, interval);

    setTimeout(() => {
      clearInterval(captureInterval);
      recorder.stop();
      setPlaying(false);
    }, totalTime + 200);
  }, [totalTime]);

  const recordGIF = useCallback(async () => {
    if (!previewRef.current) return;
    setRecording(true);
    setRecordingFormat("gif");

    const el = previewRef.current;
    const rect = el.getBoundingClientRect();
    const scale = 1.5;
    const width = Math.round(rect.width * scale);
    const height = Math.round(rect.height * scale);

    // Dynamic import gif.js
    const GIF = (await import("gif.js")).default;
    const gif = new GIF({
      workers: 2,
      quality: 10,
      width,
      height,
      workerScript: "/gif.worker.js",
    });

    // Start animation
    setPlaying(true);
    setKey((k) => k + 1);

    const fps = 15;
    const interval = 1000 / fps;
    const frames: HTMLCanvasElement[] = [];

    const captureInterval = setInterval(async () => {
      try {
        const frameCanvas = await html2canvas(el, {
          scale,
          useCORS: true,
          backgroundColor: null,
          logging: false,
        });
        frames.push(frameCanvas);
      } catch { /* skip */ }
    }, interval);

    setTimeout(() => {
      clearInterval(captureInterval);
      setPlaying(false);

      // Add all frames to GIF
      frames.forEach((frame) => {
        gif.addFrame(frame, { delay: interval, copy: true });
      });

      gif.on("finished", (blob: Blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "animation.gif";
        a.click();
        URL.revokeObjectURL(url);
        setRecording(false);
        setRecordingFormat(null);
      });

      gif.render();
    }, totalTime + 200);
  }, [totalTime]);

  const getAnimationStyle = (delay: number = 0): React.CSSProperties => {
    if (!playing) return { opacity: 1 };

    const baseDelay = delay * 0.3 / speed;
    const animName = `anim-${animation}`;

    return {
      animation: `${animName} ${duration}s ease-out ${baseDelay}s both`,
    };
  };

  const colors = content.textStyles?.colors || {
    headline: "#00d4ff",
    subheadline: "#6366f1",
    body: "#e6e6e6",
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg z-[1200] [&~*]:z-[1200]">
          <DialogHeader>
            <DialogTitle>Animation Preview</DialogTitle>
          </DialogHeader>

          <style>{`
            @keyframes anim-fade {
              from { opacity: 0; }
              to { opacity: 1; }
            }
            @keyframes anim-slide-up {
              from { opacity: 0; transform: translateY(60px); }
              to { opacity: 1; transform: translateY(0); }
            }
            @keyframes anim-slide-left {
              from { opacity: 0; transform: translateX(-80px); }
              to { opacity: 1; transform: translateX(0); }
            }
            @keyframes anim-scale {
              0% { opacity: 0; transform: scale(0.3); }
              70% { opacity: 1; transform: scale(1.05); }
              100% { opacity: 1; transform: scale(1); }
            }
            @keyframes anim-typewriter {
              0% { opacity: 0; clip-path: inset(0 100% 0 0); }
              30% { opacity: 1; }
              100% { opacity: 1; clip-path: inset(0 0% 0 0); }
            }
            @keyframes anim-blur-in {
              from { opacity: 0; filter: blur(20px); transform: scale(1.1); }
              to { opacity: 1; filter: blur(0px); transform: scale(1); }
            }
            @keyframes anim-flip {
              from { opacity: 0; transform: perspective(400px) rotateX(-90deg); }
              to { opacity: 1; transform: perspective(400px) rotateX(0deg); }
            }
          `}</style>

          <div className="space-y-4">
            {/* Controls */}
            <div className="flex gap-2 items-end flex-wrap">
              <div className="flex-1 min-w-[120px] space-y-1">
                <Label className="text-xs">Animation Type</Label>
                <Select value={animation} onValueChange={(v) => setAnimation(v as AnimationType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
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
                        {recordingFormat === "gif" ? "Making GIF…" : "Recording…"}
                      </>
                    ) : (
                      <>
                        <Video className="w-4 h-4 mr-1" />
                        Record
                      </>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="z-[1300]">
                  <DropdownMenuItem onClick={recordWebM}>
                    <Download className="w-4 h-4 mr-2" />
                    Download as WebM (video)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={recordGIF}>
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
                Recording — animation will auto-download when done
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

            {/* Preview area */}
            <div
              ref={previewRef}
              key={key}
              className="relative aspect-square rounded-lg overflow-hidden"
              style={{
                background:
                  content.background?.style === "hero-style"
                    ? "linear-gradient(135deg, #0d1b3e 0%, #1a1a2e 50%, #0d1b3e 100%)"
                    : content.background?.style === "neon-accent"
                    ? "linear-gradient(180deg, #0a0a0f 0%, #1a1a2e 50%, #0a0a0f 100%)"
                    : "linear-gradient(180deg, #1a1a2e 0%, #0d1b3e 50%, #1a1a2e 100%)",
              }}
            >
              {/* Background image */}
              {content.background?.image && (
                <div
                  style={{
                    ...getAnimationStyle(0),
                    position: "absolute",
                    inset: 0,
                  }}
                >
                  <img
                    src={content.background.image}
                    alt=""
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      opacity: 1 - (content.background.opacity || 30) / 100,
                    }}
                  />
                </div>
              )}

              {/* Logo */}
              {content.showLogo && (
                <div
                  style={{
                    ...getAnimationStyle(0),
                    position: "absolute",
                    top: "5%",
                    left: "5%",
                    zIndex: 10,
                  }}
                >
                  <img
                    src={partyPantherLogo}
                    alt="Logo"
                    style={{
                      width: 40 * (content.logoSettings?.scale || 1),
                      height: "auto",
                    }}
                  />
                </div>
              )}

              <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
                {/* Headline */}
                {content.headline && (
                  <div
                    style={{
                      ...getAnimationStyle(0),
                      color: colors.headline,
                      fontSize: 24,
                      fontWeight: 700,
                      marginBottom: 16,
                      textShadow: "0 0 20px currentColor",
                      whiteSpace: "pre-line",
                    }}
                  >
                    {content.headline}
                  </div>
                )}

                {/* Sections */}
                {content.sections.map((section, idx) => (
                  <div key={idx} style={{ marginBottom: 12 }}>
                    {section.subheadline && (
                      <div
                        style={{
                          ...getAnimationStyle(idx + 1),
                          color: colors.subheadline,
                          fontSize: 16,
                          fontWeight: 600,
                          marginBottom: 8,
                          whiteSpace: "pre-line",
                        }}
                      >
                        {section.subheadline}
                      </div>
                    )}
                    {section.body && (
                      <div
                        style={{
                          ...getAnimationStyle(idx + 2),
                          color: colors.body,
                          fontSize: 14,
                          whiteSpace: "pre-line",
                        }}
                      >
                        {section.body}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <p className="text-xs text-muted-foreground text-center">
              Preview how your post would look as an animated story
            </p>
          </div>
        </DialogContent>
    </Dialog>
  );
};
