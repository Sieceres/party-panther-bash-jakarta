import { useRef, useState } from "react";
import html2canvas from "html2canvas";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Loader2, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { PostContent } from "@/types/instagram-post";

interface PostPreviewProps {
  content: PostContent;
}

// Simple solid background colors for reliable export
const getBackgroundColor = (style: PostContent["backgroundStyle"]) => {
  switch (style) {
    case "dark-gradient":
      return "#0a1628";
    case "neon-accent":
      return "#0c1a2e";
    case "party-vibe":
      return "#1a0f2e";
    default:
      return "#0a1628";
  }
};

// Accent color based on style
const getAccentColor = (style: PostContent["backgroundStyle"]) => {
  switch (style) {
    case "neon-accent":
      return "rgba(0, 200, 255, 0.1)";
    case "party-vibe":
      return "rgba(180, 100, 255, 0.1)";
    default:
      return "transparent";
  }
};

export const PostPreview = ({ content }: PostPreviewProps) => {
  const previewRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);
  const { toast } = useToast();

  const isSquare = content.format === "square";
  const dimensions = isSquare ? { width: 1080, height: 1080 } : { width: 1080, height: 1920 };
  const previewScale = isSquare ? 0.4 : 0.25;

  // Generate the HTML content for the post
  const generatePostHTML = () => {
    const bgColor = getBackgroundColor(content.backgroundStyle);
    const accentColor = getAccentColor(content.backgroundStyle);
    
    // Use publicly accessible logo URL from public folder
    const logoUrl = `${window.location.origin}/logo-partypanyther.jpeg`;
    
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Party Panther Instagram Post</title>
          <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap" rel="stylesheet">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: 'Poppins', sans-serif;
              background: ${bgColor};
              width: ${dimensions.width}px;
              height: ${dimensions.height}px;
              overflow: hidden;
            }
            .container {
              width: 100%;
              height: 100%;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              padding: 64px;
              position: relative;
              text-align: center;
            }
            .accent-overlay {
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              background: ${accentColor};
              pointer-events: none;
            }
            .logo-section {
              position: absolute;
              top: 48px;
              left: 48px;
              display: flex;
              align-items: center;
              gap: 16px;
            }
            .logo-img {
              width: 80px;
              height: 80px;
              border-radius: 50%;
            }
            .logo-text {
              font-size: 32px;
              font-weight: 700;
              color: #00d4ff;
            }
            .content {
              position: relative;
              z-index: 10;
              display: flex;
              flex-direction: column;
              align-items: center;
              gap: 24px;
              max-width: 900px;
            }
            .headline {
              font-size: 72px;
              font-weight: 700;
              line-height: 1.1;
              color: #b366ff;
            }
            .subheadline {
              font-size: 48px;
              font-weight: 600;
              color: #00d4ff;
            }
            .body-text {
              font-size: 32px;
              line-height: 1.5;
              color: #e6e6e6;
            }
            .section {
              display: flex;
              flex-direction: column;
              align-items: center;
              gap: 12px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="accent-overlay"></div>
            ${content.showLogo ? `
              <div class="logo-section">
                <img src="${logoUrl}" alt="Party Panther" class="logo-img" crossorigin="anonymous">
                <span class="logo-text">Party Panther</span>
              </div>
            ` : ''}
            <div class="content">
              ${content.headline ? `<h1 class="headline">${escapeHtml(content.headline)}</h1>` : ''}
              ${content.sections.map(section => `
                <div class="section">
                  ${section.subheadline ? `<h2 class="subheadline">${escapeHtml(section.subheadline)}</h2>` : ''}
                  ${section.body ? `<p class="body-text">${escapeHtml(section.body)}</p>` : ''}
                </div>
              `).join('')}
            </div>
          </div>
        </body>
      </html>
    `;
  };

  // Open full scale preview in new window
  const handleOpenFullScale = () => {
    const newWindow = window.open('', '_blank', `width=${dimensions.width},height=${dimensions.height},scrollbars=no,resizable=yes`);
    if (newWindow) {
      newWindow.document.write(generatePostHTML());
      newWindow.document.close();
      
      toast({
        title: "Full Scale Preview Opened",
        description: "Take a screenshot of the new window (Cmd/Ctrl + Shift + S or use your screenshot tool)",
      });
    } else {
      toast({
        title: "Popup Blocked",
        description: "Please allow popups for this site and try again",
        variant: "destructive",
      });
    }
  };

  const handleExport = async () => {
    if (!previewRef.current) return;

    setExporting(true);
    try {
      const canvas = await html2canvas(previewRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: getBackgroundColor(content.backgroundStyle),
        width: dimensions.width,
        height: dimensions.height,
        foreignObjectRendering: false,
        windowWidth: dimensions.width,
        windowHeight: dimensions.height,
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
        title: "Export Failed",
        description: "Try using the 'Full Scale Preview' button and take a screenshot instead",
        variant: "destructive",
      });
    } finally {
      setExporting(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 flex-wrap">
        <CardTitle>Preview</CardTitle>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleOpenFullScale}>
            <ExternalLink className="w-4 h-4 mr-2" />
            Full Scale Preview
          </Button>
          <Button onClick={handleExport} disabled={exporting}>
            {exporting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Download className="w-4 h-4 mr-2" />
            )}
            Download PNG
          </Button>
        </div>
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
            {/* Actual render target - simplified for reliable export */}
            <div
              ref={previewRef}
              style={{
                width: dimensions.width,
                height: dimensions.height,
                backgroundColor: getBackgroundColor(content.backgroundStyle),
                fontFamily: "'Poppins', sans-serif",
              }}
              className="relative flex flex-col items-center justify-center p-16 text-center overflow-hidden"
            >
              {/* Simple accent overlay */}
              <div 
                className="absolute inset-0 pointer-events-none"
                style={{ backgroundColor: getAccentColor(content.backgroundStyle) }}
              />

              {/* Logo & Brand */}
              {content.showLogo && (
                <div className="absolute top-12 left-12 flex items-center gap-4">
                  <img
                    src="/logo-partypanyther.jpeg"
                    alt="Party Panther"
                    className="w-20 h-20 rounded-full"
                    crossOrigin="anonymous"
                  />
                  <span
                    className="text-4xl font-bold"
                    style={{ color: "#00d4ff" }}
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
                    className="text-7xl font-bold leading-tight text-center"
                    style={{ color: "#b366ff" }}
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
                        className="text-5xl font-semibold text-center"
                        style={{ color: "#00d4ff" }}
                      >
                        {section.subheadline}
                      </h2>
                    )}

                    {/* Body */}
                    {section.body && (
                      <p
                        className="text-3xl leading-relaxed text-center"
                        style={{ color: "#e6e6e6" }}
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
          <br />
          <span className="text-xs">Tip: Use "Full Scale Preview" for best screenshot quality</span>
        </p>
      </CardContent>
    </Card>
  );
};

// Helper to escape HTML for safe rendering
function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
