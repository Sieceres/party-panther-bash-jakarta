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
import domtoimage from "dom-to-image-more";

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
  const [recordingFormat, setRecordingFormat] = useState<"webm" | "gif" | "mp4" | null>(null);
  const [capturedFrames, setCapturedFrames] = useState(0);
  const previewRef = useRef<HTMLDivElement>(null);

  const baseDuration = 0.8;
  const duration = baseDuration / speed;
  const sectionPause = 0.6 / speed;
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

  // Capture a single frame using dom-to-image-more
  const captureFrame = async (el: HTMLElement): Promise<HTMLCanvasElement | null> => {
    try {
      const dataUrl = await domtoimage.toPng(el, {
        width: el.offsetWidth,
        height: el.offsetHeight,
        style: {},
        cacheBust: true,
      });
      // Convert data URL to canvas
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext("2d")!;
          ctx.drawImage(img, 0, 0);
          resolve(canvas);
        };
        img.onerror = () => resolve(null);
        img.src = dataUrl;
      });
    } catch (err) {
      console.error("Frame capture error:", err);
      return null;
    }
  };

  // Core frame capture loop shared between formats
  const captureFrames = async (
    el: HTMLElement,
    fps: number,
    onFrame: (canvas: HTMLCanvasElement, frameIdx: number) => void,
    onProgress?: (count: number) => void,
  ): Promise<number> => {
    const frameDuration = 1000 / fps;
    const endTime = Date.now() + totalTime;
    let frameCount = 0;

    while (Date.now() < endTime) {
      const frameStart = Date.now();
      const frameCanvas = await captureFrame(el);
      if (frameCanvas) {
        onFrame(frameCanvas, frameCount);
        frameCount++;
        onProgress?.(frameCount);
      }
      const elapsed = Date.now() - frameStart;
      if (elapsed < frameDuration) {
        await new Promise((r) => setTimeout(r, frameDuration - elapsed));
      }
    }
    return frameCount;
  };

  const recordWebM = useCallback(async () => {
    if (!previewRef.current) return;
    setRecording(true);
    setRecordingFormat("webm");
    setCapturedFrames(0);

    const el = previewRef.current;
    const rect = el.getBoundingClientRect();
    const w = Math.round(rect.width);
    const h = Math.round(rect.height);

    // Create an offscreen canvas for the stream
    const streamCanvas = document.createElement("canvas");
    streamCanvas.width = w;
    streamCanvas.height = h;
    const ctx = streamCanvas.getContext("2d")!;
    ctx.fillStyle = "#0d1b3e";
    ctx.fillRect(0, 0, w, h);

    const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
      ? "video/webm;codecs=vp9"
      : MediaRecorder.isTypeSupported("video/webm;codecs=vp8")
      ? "video/webm;codecs=vp8"
      : "video/webm";

    const stream = streamCanvas.captureStream(0); // manual frame push
    const recorder = new MediaRecorder(stream, {
      mimeType,
      videoBitsPerSecond: 5_000_000,
    });
    const chunks: Blob[] = [];
    recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: "video/webm" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `animation-${Date.now()}.webm`;
      a.click();
      URL.revokeObjectURL(url);
      setRecording(false);
      setRecordingFormat(null);
      setCapturedFrames(0);
    };

    // Start animation
    setPlaying(true);
    setKey((k) => k + 1);
    await new Promise((r) => setTimeout(r, 150));

    recorder.start();

    const track = stream.getVideoTracks()[0] as any;

    await captureFrames(el, 12, (frameCanvas) => {
      ctx.clearRect(0, 0, w, h);
      ctx.drawImage(frameCanvas, 0, 0, w, h);
      // Manually request a frame on the stream if supported
      if (track?.requestFrame) track.requestFrame();
    }, setCapturedFrames);

    // Hold last frame for a moment
    await new Promise((r) => setTimeout(r, 300));
    if (track?.requestFrame) track.requestFrame();

    recorder.stop();
    setPlaying(false);
  }, [totalTime]);

  const recordMP4 = useCallback(async () => {
    if (!previewRef.current) return;
    setRecording(true);
    setRecordingFormat("mp4");
    setCapturedFrames(0);

    const el = previewRef.current;
    const rect = el.getBoundingClientRect();
    const w = Math.round(rect.width);
    const h = Math.round(rect.height);

    const streamCanvas = document.createElement("canvas");
    streamCanvas.width = w;
    streamCanvas.height = h;
    const ctx = streamCanvas.getContext("2d")!;
    ctx.fillStyle = "#0d1b3e";
    ctx.fillRect(0, 0, w, h);

    // Try MP4 first, fall back to WebM
    const mp4Supported = MediaRecorder.isTypeSupported("video/mp4");
    const mimeType = mp4Supported
      ? "video/mp4"
      : MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
      ? "video/webm;codecs=vp9"
      : "video/webm";

    const stream = streamCanvas.captureStream(0);
    const recorder = new MediaRecorder(stream, {
      mimeType,
      videoBitsPerSecond: 8_000_000,
    });
    const chunks: Blob[] = [];
    recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
    recorder.onstop = () => {
      const ext = mp4Supported ? "mp4" : "webm";
      const blob = new Blob(chunks, { type: mp4Supported ? "video/mp4" : "video/webm" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `animation-${Date.now()}.${ext}`;
      a.click();
      URL.revokeObjectURL(url);
      setRecording(false);
      setRecordingFormat(null);
      setCapturedFrames(0);
    };

    setPlaying(true);
    setKey((k) => k + 1);
    await new Promise((r) => setTimeout(r, 150));

    recorder.start();
    const track = stream.getVideoTracks()[0] as any;

    await captureFrames(el, 12, (frameCanvas) => {
      ctx.clearRect(0, 0, w, h);
      ctx.drawImage(frameCanvas, 0, 0, w, h);
      if (track?.requestFrame) track.requestFrame();
    }, setCapturedFrames);

    await new Promise((r) => setTimeout(r, 300));
    if (track?.requestFrame) track.requestFrame();

    recorder.stop();
    setPlaying(false);
  }, [totalTime]);

  const recordGIF = useCallback(async () => {
    if (!previewRef.current) return;
    setRecording(true);
    setRecordingFormat("gif");
    setCapturedFrames(0);

    const el = previewRef.current;
    const rect = el.getBoundingClientRect();
    const w = Math.round(rect.width);
    const h = Math.round(rect.height);

    const GIF = (await import("gif.js")).default;
    const gif = new GIF({
      workers: 2,
      quality: 10,
      width: w,
      height: h,
      workerScript: "/gif.worker.js",
    });

    setPlaying(true);
    setKey((k) => k + 1);
    await new Promise((r) => setTimeout(r, 150));

    const fps = 10;
    const frameDuration = 1000 / fps;
    const frames: HTMLCanvasElement[] = [];

    await captureFrames(el, fps, (frameCanvas) => {
      frames.push(frameCanvas);
    }, setCapturedFrames);

    setPlaying(false);

    if (frames.length === 0) {
      console.warn("No frames captured for GIF");
      setRecording(false);
      setRecordingFormat(null);
      return;
    }

    frames.forEach((frame) => {
      gif.addFrame(frame, { delay: frameDuration, copy: true });
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
    });

    gif.render();
  }, [totalTime]);

  const getAnimationStyle = (delaySec: number): React.CSSProperties => {
    if (!playing) return { opacity: 1 };
    const animName = `anim-${animation}`;
    return {
      opacity: 0,
      animation: `${animName} ${duration}s ease-out ${delaySec}s both`,
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
                  <DropdownMenuItem onClick={recordMP4}>
                    <Download className="w-4 h-4 mr-2" />
                    Download as MP4 (video)
                  </DropdownMenuItem>
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
                Recording — {capturedFrames} frames captured
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
                      fontFamily: `'${content.fonts?.headline || "Poppins"}', sans-serif`,
                      marginBottom: 16,
                      textShadow: "0 0 20px currentColor",
                      whiteSpace: "pre-line",
                    }}
                  >
                    {content.headline}
                  </div>
                )}

                {/* Sections with dividers and boxes */}
                {content.sections.map((section, idx) => {
                  const groupDelay = sectionGroupDelay(idx);
                  
                  const showDivider = content.showDividers ?? false;
                  const dColor = content.dividerColor || "#ffffff";
                  const dWidth = `${content.dividerWidth ?? 60}%`;
                  const dThickness = content.dividerThickness ?? 1;
                  const dStyle = content.dividerStyle || "line";
                  const dGlow = content.dividerGlow ?? false;
                  const dGlowIntensity = content.dividerGlowIntensity ?? 8;

                  const boxEnabled = content.sectionBoxes ?? false;
                  const boxColor = content.sectionBoxColor || "#ffffff";
                  const boxOpacity = (content.sectionBoxOpacity ?? 15) / 100;
                  const boxRadius = content.sectionBoxRadius ?? 12;
                  const boxPadding = content.sectionBoxPadding ?? 16;
                  const boxStyleVal = content.sectionBoxStyle || "border-only";
                  const borderWidth = content.sectionBoxBorderWidth ?? 2;
                  const showGlow = content.sectionBoxGlow ?? false;
                  const glowIntensity = content.sectionBoxGlowIntensity ?? 10;

                  const hexToRgba = (hex: string, alpha: number) => {
                    const r = parseInt(hex.slice(1, 3), 16) || 255;
                    const g = parseInt(hex.slice(3, 5), 16) || 255;
                    const b = parseInt(hex.slice(5, 7), 16) || 255;
                    return `rgba(${r},${g},${b},${alpha})`;
                  };

                  const bgMap: Record<string, string> = {
                    "border-only": "transparent",
                    "frosted": "rgba(0,0,0,0.3)",
                    "solid": hexToRgba(boxColor, boxOpacity * 0.5),
                  };
                  const glowShadow = showGlow
                    ? `0 0 ${glowIntensity}px ${hexToRgba(boxColor, 0.6)}, inset 0 0 ${glowIntensity * 0.5}px ${hexToRgba(boxColor, 0.15)}`
                    : "none";
                  const wrapperStyle: React.CSSProperties = boxEnabled ? {
                    background: bgMap[boxStyleVal],
                    border: `${borderWidth}px solid ${hexToRgba(boxColor, boxOpacity)}`,
                    borderRadius: boxRadius,
                    padding: boxPadding,
                    boxShadow: glowShadow,
                    backdropFilter: boxStyleVal === "frosted" ? "blur(4px)" : "none",
                    width: "100%",
                  } : {};

                  return (
                    <div key={idx} style={{ marginBottom: 12, width: "100%", ...getAnimationStyle(groupDelay) }}>
                      {/* Divider */}
                      {showDivider && (() => {
                        if (dStyle === "dashed" || dStyle === "dotted" || dStyle === "double") {
                          return (
                            <div
                              style={{
                                width: dWidth,
                                borderTop: `${dThickness}px ${dStyle === "double" ? "double" : dStyle} ${dColor}80`,
                                margin: "0 auto",
                                marginBottom: 12,
                                ...(dGlow ? { boxShadow: `0 0 ${dGlowIntensity}px ${dColor}60, 0 0 ${dGlowIntensity * 2}px ${dColor}30` } : {}),
                              }}
                            />
                          );
                        }
                        return (
                          <div
                            style={{
                              width: dWidth,
                              height: dThickness,
                              background: `linear-gradient(90deg, transparent 0%, ${dColor}40 20%, ${dColor}80 50%, ${dColor}40 80%, transparent 100%)`,
                              margin: "0 auto",
                              marginBottom: 12,
                              ...(dGlow ? { boxShadow: `0 0 ${dGlowIntensity}px ${dColor}60, 0 0 ${dGlowIntensity * 2}px ${dColor}30` } : {}),
                            }}
                          />
                        );
                      })()}
                      {/* Section content in box */}
                      <div style={wrapperStyle}>
                        {section.subheadline && (
                          <div
                            style={{
                              color: colors.subheadline,
                              fontSize: 16,
                              fontWeight: 600,
                              fontFamily: `'${content.fonts?.subheadline || "Poppins"}', sans-serif`,
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
                              color: colors.body,
                              fontSize: 14,
                              fontFamily: `'${content.fonts?.body || "Poppins"}', sans-serif`,
                              whiteSpace: "pre-line",
                            }}
                          >
                            {section.body}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
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
