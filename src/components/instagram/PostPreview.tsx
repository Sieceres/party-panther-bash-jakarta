import { useRef, useState } from "react";
import html2canvas from "html2canvas";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import partyPantherLogo from "@/assets/party-panther-logo.png";
import type { PostContent } from "@/types/instagram-post";

interface PostPreviewProps {
  content: PostContent;
}

const getBackgroundStyle = (style: PostContent["backgroundStyle"]) => {
  switch (style) {
    case "dark-gradient":
      return "linear-gradient(180deg, hsl(220 60% 15%) 0%, hsl(220 70% 8%) 50%, hsl(220 80% 4%) 100%)";
    case "neon-accent":
      return "linear-gradient(135deg, hsl(220 60% 12%) 0%, hsl(200 100% 8%) 50%, hsl(220 70% 6%) 100%)";
    case "party-vibe":
      return "linear-gradient(135deg, hsl(280 60% 15%) 0%, hsl(200 80% 12%) 50%, hsl(260 70% 8%) 100%)";
    default:
      return "linear-gradient(180deg, hsl(220 60% 15%) 0%, hsl(220 80% 4%) 100%)";
  }
};

const getNeonOverlay = (style: PostContent["backgroundStyle"]) => {
  switch (style) {
    case "neon-accent":
      return (
        <>
          <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-[radial-gradient(ellipse_at_top_right,hsl(190_100%_50%/0.15),transparent_70%)]" />
          <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-[radial-gradient(ellipse_at_bottom_left,hsl(220_100%_60%/0.1),transparent_70%)]" />
        </>
      );
    case "party-vibe":
      return (
        <>
          <div className="absolute top-0 left-1/4 w-1/2 h-1/2 bg-[radial-gradient(ellipse_at_top,hsl(280_100%_60%/0.2),transparent_60%)]" />
          <div className="absolute bottom-0 right-1/4 w-1/2 h-1/2 bg-[radial-gradient(ellipse_at_bottom,hsl(190_100%_50%/0.15),transparent_60%)]" />
        </>
      );
    default:
      return null;
  }
};

export const PostPreview = ({ content }: PostPreviewProps) => {
  const previewRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);
  const { toast } = useToast();

  const isSquare = content.format === "square";
  const dimensions = isSquare ? { width: 1080, height: 1080 } : { width: 1080, height: 1920 };
  const previewScale = isSquare ? 0.4 : 0.25;

  const handleExport = async () => {
    if (!previewRef.current) return;

    setExporting(true);
    try {
      const canvas = await html2canvas(previewRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: null,
        width: dimensions.width,
        height: dimensions.height,
      });

      const link = document.createElement("a");
      link.download = `party-panther-${content.format}-${Date.now()}.png`;
      link.href = canvas.toDataURL("image/png", 1.0);
      link.click();

      toast({
        title: "Success",
        description: "Image downloaded successfully!",
      });
    } catch (error) {
      console.error("Export error:", error);
      toast({
        title: "Error",
        description: "Failed to export image",
        variant: "destructive",
      });
    } finally {
      setExporting(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Preview</CardTitle>
        <Button onClick={handleExport} disabled={exporting}>
          {exporting ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Download className="w-4 h-4 mr-2" />
          )}
          Download PNG
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
            {/* Actual render target */}
            <div
              ref={previewRef}
              style={{
                width: dimensions.width,
                height: dimensions.height,
                background: getBackgroundStyle(content.backgroundStyle),
                fontFamily: "'Poppins', sans-serif",
              }}
              className="relative flex flex-col items-center justify-center p-16 text-center overflow-hidden"
            >
              {/* Neon overlays */}
              {getNeonOverlay(content.backgroundStyle)}

              {/* Logo & Brand */}
              {content.showLogo && (
                <div className="absolute top-12 left-12 flex items-center gap-4">
                  <img
                    src={partyPantherLogo}
                    alt="Party Panther"
                    className="w-20 h-20 rounded-full"
                    crossOrigin="anonymous"
                  />
                  <span
                    className="text-4xl font-bold"
                    style={{
                      background: "linear-gradient(135deg, hsl(190 100% 50%) 0%, hsl(220 100% 60%) 50%, hsl(280 100% 60%) 100%)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                    }}
                  >
                    Party Panther
                  </span>
                </div>
              )}

              {/* Content */}
              <div className="relative z-10 flex flex-col items-center gap-6 max-w-[900px]">
                {/* Headline */}
                {content.headline && (
                  <h1
                    className="text-7xl font-bold leading-tight"
                    style={{
                      background: "linear-gradient(135deg, hsl(190 100% 50%) 0%, hsl(220 100% 60%) 50%, hsl(280 100% 60%) 100%)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                    }}
                  >
                    {content.headline}
                  </h1>
                )}

                {/* Content Sections */}
                {content.sections.map((section, index) => (
                  <div key={index} className="flex flex-col items-center gap-3">
                    {/* Sub-headline */}
                    {section.subheadline && (
                      <h2
                        className="text-5xl font-semibold"
                        style={{ color: "hsl(190 100% 50%)" }}
                      >
                        {section.subheadline}
                      </h2>
                    )}

                    {/* Body */}
                    {section.body && (
                      <p
                        className="text-3xl leading-relaxed"
                        style={{ color: "hsl(0 0% 90%)" }}
                      >
                        {section.body}
                      </p>
                    )}
                  </div>
                ))}
              </div>
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
