import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Play, Pause, RotateCcw } from "lucide-react";
import type { PostContent } from "@/types/instagram-post";

type AnimationType = "fade" | "slide-up" | "scale" | "typewriter";

interface AnimationPreviewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  content: PostContent;
}

export const AnimationPreview = ({ open, onOpenChange, content }: AnimationPreviewProps) => {
  const [animation, setAnimation] = useState<AnimationType>("fade");
  const [playing, setPlaying] = useState(false);
  const [key, setKey] = useState(0); // Force re-render for animation restart

  const playAnimation = () => {
    setPlaying(true);
    setKey((k) => k + 1);
    setTimeout(() => setPlaying(false), 2000);
  };

  const resetAnimation = () => {
    setPlaying(false);
    setKey((k) => k + 1);
  };

  useEffect(() => {
    if (open) {
      setTimeout(playAnimation, 300);
    }
  }, [open]);

  const getAnimationStyle = (delay: number = 0): React.CSSProperties => {
    if (!playing) return { opacity: 1 };

    const baseDelay = delay * 0.2;
    
    switch (animation) {
      case "fade":
        return {
          animation: `fadeIn 0.6s ease-out ${baseDelay}s both`,
        };
      case "slide-up":
        return {
          animation: `slideUp 0.6s ease-out ${baseDelay}s both`,
        };
      case "scale":
        return {
          animation: `scaleIn 0.5s ease-out ${baseDelay}s both`,
        };
      case "typewriter":
        return {
          animation: `fadeIn 0.3s ease-out ${baseDelay}s both`,
        };
      default:
        return { opacity: 1 };
    }
  };

  const colors = content.textStyles?.colors || {
    headline: "#00d4ff",
    subheadline: "#6366f1",
    body: "#e6e6e6",
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Animation Preview</DialogTitle>
        </DialogHeader>

        <style>{`
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes slideUp {
            from { opacity: 0; transform: translateY(30px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes scaleIn {
            from { opacity: 0; transform: scale(0.8); }
            to { opacity: 1; transform: scale(1); }
          }
        `}</style>

        <div className="space-y-4">
          {/* Controls */}
          <div className="flex gap-2 items-end">
            <div className="flex-1 space-y-1">
              <Label className="text-xs">Animation Type</Label>
              <Select value={animation} onValueChange={(v) => setAnimation(v as AnimationType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fade">Fade In</SelectItem>
                  <SelectItem value="slide-up">Slide Up</SelectItem>
                  <SelectItem value="scale">Scale</SelectItem>
                  <SelectItem value="typewriter">Typewriter</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={playAnimation} disabled={playing}>
              {playing ? <Pause className="w-4 h-4 mr-1" /> : <Play className="w-4 h-4 mr-1" />}
              {playing ? "Playing" : "Play"}
            </Button>
            <Button variant="outline" onClick={resetAnimation}>
              <RotateCcw className="w-4 h-4" />
            </Button>
          </div>

          {/* Preview area */}
          <div
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
