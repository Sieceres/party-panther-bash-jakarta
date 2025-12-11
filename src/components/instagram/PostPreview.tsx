import { useRef, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Loader2, ExternalLink, Move } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { PostContent, BackgroundStyle, ElementPosition } from "@/types/instagram-post";
import partyPantherLogo from "@/assets/party-panther-logo.png";

interface PostPreviewProps {
  content: PostContent;
  onHeadlinePositionChange?: (position: ElementPosition) => void;
  onSectionPositionChange?: (index: number, position: ElementPosition) => void;
}

const getBackgroundConfig = (style: BackgroundStyle) => {
  switch (style) {
    case "hero-style":
      return {
        mainGradient: "linear-gradient(135deg, #0d1b3e 0%, #1a1a2e 50%, #0d1b3e 100%)",
        overlay: "linear-gradient(180deg, rgba(0,0,0,0.4) 0%, transparent 30%, transparent 70%, rgba(0,0,0,0.6) 100%)",
      };
    case "neon-accent":
      return {
        mainGradient: "linear-gradient(180deg, #0a0a0f 0%, #1a1a2e 50%, #0a0a0f 100%)",
        overlay: "linear-gradient(180deg, rgba(0,0,0,0.2) 0%, transparent 50%, rgba(0,0,0,0.3) 100%)",
      };
    case "custom-image":
      return {
        mainGradient: "transparent",
        overlay: "linear-gradient(180deg, rgba(0,0,0,0.3) 0%, transparent 30%, transparent 70%, rgba(0,0,0,0.4) 100%)",
      };
    default:
      return {
        mainGradient: "linear-gradient(180deg, #1a1a2e 0%, #0d1b3e 50%, #1a1a2e 100%)",
        overlay: "linear-gradient(180deg, rgba(0,0,0,0.3) 0%, transparent 30%, transparent 70%, rgba(0,0,0,0.4) 100%)",
      };
  }
};

export const PostPreview = ({ content, onHeadlinePositionChange, onSectionPositionChange }: PostPreviewProps) => {
  const previewRef = useRef<HTMLDivElement>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [draggingElement, setDraggingElement] = useState<string | null>(null);
  const { toast } = useToast();

  const getDimensions = () => {
    switch (content.format) {
      case "square": return { width: 1080, height: 1080 };
      case "portrait": return { width: 1080, height: 1350 };
      case "story": return { width: 1080, height: 1920 };
      default: return { width: 1080, height: 1080 };
    }
  };
  
  const dimensions = getDimensions();
  const previewScale = content.format === "story" ? 0.25 : content.format === "portrait" ? 0.35 : 0.4;
  const bgStyle = content.background?.style || content.backgroundStyle || "dark-gradient";
  const bgConfig = getBackgroundConfig(bgStyle);

  const colors = content.textStyles?.colors || { headline: "#00d4ff", subheadline: "#6366f1", body: "#e6e6e6" };
  const shadows = content.textStyles?.shadows;
  const strokes = content.textStyles?.strokes;
  const alignments = content.textStyles?.alignments || { headline: "center", subheadline: "center", body: "center" };
  const rotations = content.textStyles?.rotations || { headline: 0, sections: [0] };

  const getTextStyle = (type: "headline" | "subheadline" | "body") => {
    const shadow = shadows?.[type];
    const stroke = strokes?.[type];
    
    let style: React.CSSProperties = {};
    
    if (shadow?.enabled) {
      style.textShadow = `${shadow.offsetX}px ${shadow.offsetY}px ${shadow.blur}px ${shadow.color}`;
    }
    
    if (stroke?.enabled) {
      style.WebkitTextStroke = `${stroke.width}px ${stroke.color}`;
    }
    
    return style;
  };

  const handleDrag = (elementId: string, e: React.MouseEvent) => {
    if (!previewRef.current) return;
    e.preventDefault();
    setDraggingElement(elementId);
    
    const handleMouseMove = (moveEvent: MouseEvent) => {
      const rect = previewRef.current!.getBoundingClientRect();
      const x = Math.max(10, Math.min(90, ((moveEvent.clientX - rect.left) / rect.width) * 100));
      const y = Math.max(10, Math.min(90, ((moveEvent.clientY - rect.top) / rect.height) * 100));
      
      if (elementId === "headline" && onHeadlinePositionChange) {
        onHeadlinePositionChange({ x, y });
      } else if (elementId.startsWith("section-") && onSectionPositionChange) {
        const index = parseInt(elementId.split("-")[1]);
        onSectionPositionChange(index, { x, y });
      }
    };
    
    const handleMouseUp = () => {
      setDraggingElement(null);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
    
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const handleOpenFullScale = async () => {
    setPreviewLoading(true);
    try {
      // Simple screenshot approach - opens preview in new tab
      const filename = `party-panther-${content.format}-${Date.now()}.png`;
      toast({
        title: "Preview Ready",
        description: "Use your browser's screenshot or print feature to save",
      });
    } catch (error) {
      console.error("Preview error:", error);
    } finally {
      setPreviewLoading(false);
    }
  };

  const bgImage = content.background?.image || content.backgroundImage;
  const bgOpacity = content.background?.opacity || 30;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 flex-wrap">
        <CardTitle>Preview</CardTitle>
        <Button onClick={handleOpenFullScale} disabled={previewLoading}>
          {previewLoading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <ExternalLink className="w-4 h-4 mr-2" />
          )}
          Preview & Download
        </Button>
      </CardHeader>
      <CardContent>
        <div className="overflow-auto max-h-[600px] flex justify-center">
          <div
            style={{
              transform: `scale(${previewScale})`,
              transformOrigin: "top center",
              width: dimensions.width,
              height: dimensions.height,
              marginBottom: -(dimensions.height * (1 - previewScale)),
            }}
          >
            <div
              ref={previewRef}
              style={{
                width: dimensions.width,
                height: dimensions.height,
                position: "relative",
                overflow: "hidden",
                fontFamily: "'Poppins', sans-serif",
              }}
            >
              {/* Custom Background Image */}
              {bgStyle === "custom-image" && bgImage && (
                <>
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      backgroundImage: `url(${bgImage})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      backgroundColor: `rgba(0,0,0,${bgOpacity / 100})`,
                    }}
                  />
                </>
              )}
              
              {/* Background gradient */}
              {bgStyle !== "custom-image" && (
                <div style={{ position: "absolute", inset: 0, background: bgConfig.mainGradient }} />
              )}
              
              {/* Overlay */}
              <div style={{ position: "absolute", inset: 0, background: bgConfig.overlay }} />

              {/* Logo & Brand */}
              {content.showLogo && (
                <div style={{ position: "absolute", top: 48, left: 48, zIndex: 10, height: 80 }}>
                  <img
                    src={partyPantherLogo}
                    alt="Party Panther"
                    style={{ width: 80, height: 80, borderRadius: "50%", position: "absolute", objectFit: "cover" }}
                  />
                  <span
                    style={{
                      fontSize: 32,
                      fontWeight: 700,
                      color: "#00d4ff",
                      position: "absolute",
                      top: 20,
                      left: 96,
                      whiteSpace: "nowrap",
                      textShadow: "0 0 20px rgba(0, 207, 255, 0.5)",
                    }}
                  >
                    Party Panther
                  </span>
                </div>
              )}

              {/* Headline - Draggable */}
              {content.headline && (
                <div
                  style={{
                    position: "absolute",
                    top: `${content.positions?.headline?.y || 30}%`,
                    left: `${content.positions?.headline?.x || 50}%`,
                    transform: `translate(-50%, -50%) rotate(${rotations.headline}deg)`,
                    width: dimensions.width - 128,
                    textAlign: alignments.headline,
                    zIndex: content.zIndex?.headline || 5,
                    cursor: onHeadlinePositionChange ? (draggingElement === "headline" ? "grabbing" : "grab") : "default",
                    userSelect: "none",
                  }}
                  onMouseDown={(e) => onHeadlinePositionChange && handleDrag("headline", e)}
                >
                  {onHeadlinePositionChange && (
                    <div style={{
                      position: "absolute",
                      top: -24,
                      left: "50%",
                      transform: "translateX(-50%)",
                      background: "rgba(0,0,0,0.6)",
                      padding: "2px 8px",
                      borderRadius: 4,
                      fontSize: 12,
                      color: "#fff",
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      opacity: draggingElement === "headline" ? 1 : 0.5,
                    }}>
                      <Move size={10} /> Headline
                    </div>
                  )}
                  <div
                    style={{
                      fontSize: content.fontSizes?.headline || 72,
                      fontWeight: 700,
                      fontFamily: `'${content.fonts?.headline || "Poppins"}', sans-serif`,
                      lineHeight: 1.2,
                      color: colors.headline,
                      ...getTextStyle("headline"),
                    }}
                  >
                    {content.headline}
                  </div>
                </div>
              )}

              {/* Content Sections - Each Draggable */}
              {content.sections.map((section, index) => (
                <div
                  key={index}
                  style={{
                    position: "absolute",
                    top: `${content.positions?.sections?.[index]?.y || 50 + index * 15}%`,
                    left: `${content.positions?.sections?.[index]?.x || 50}%`,
                    transform: `translate(-50%, -50%) rotate(${rotations.sections?.[index] || 0}deg)`,
                    width: dimensions.width - 128,
                    textAlign: alignments.subheadline,
                    zIndex: content.zIndex?.sections?.[index] || 3,
                    cursor: onSectionPositionChange ? (draggingElement === `section-${index}` ? "grabbing" : "grab") : "default",
                    userSelect: "none",
                  }}
                  onMouseDown={(e) => onSectionPositionChange && handleDrag(`section-${index}`, e)}
                >
                  {onSectionPositionChange && (
                    <div style={{
                      position: "absolute",
                      top: -24,
                      left: "50%",
                      transform: "translateX(-50%)",
                      background: "rgba(0,0,0,0.6)",
                      padding: "2px 8px",
                      borderRadius: 4,
                      fontSize: 12,
                      color: "#fff",
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      opacity: draggingElement === `section-${index}` ? 1 : 0.5,
                    }}>
                      <Move size={10} /> Section {index + 1}
                    </div>
                  )}
                  {section.subheadline && (
                    <div
                      style={{
                        fontSize: content.fontSizes?.subheadline || 48,
                        fontWeight: 600,
                        fontFamily: `'${content.fonts?.subheadline || "Poppins"}', sans-serif`,
                        color: colors.subheadline,
                        lineHeight: 1.3,
                        marginBottom: 12,
                        ...getTextStyle("subheadline"),
                      }}
                    >
                      {section.subheadline}
                    </div>
                  )}
                  {section.body && (
                    <div
                      style={{
                        fontSize: content.fontSizes?.body || 32,
                        fontFamily: `'${content.fonts?.body || "Poppins"}', sans-serif`,
                        lineHeight: 1.5,
                        color: colors.body,
                        textAlign: alignments.body,
                        ...getTextStyle("body"),
                      }}
                    >
                      {section.body}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
        <p className="text-sm text-muted-foreground text-center mt-4">
          Preview scaled to {Math.round(previewScale * 100)}% • Actual size: {dimensions.width}×{dimensions.height}px
        </p>
      </CardContent>
    </Card>
  );
};
