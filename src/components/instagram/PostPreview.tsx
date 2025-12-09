import { useRef, useState, useCallback } from "react";
import html2canvas from "html2canvas";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Loader2, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { PostContent } from "@/types/instagram-post";
import partyPantherLogo from "@/assets/party-panther-logo.png";

interface PostPreviewProps {
  content: PostContent;
}

export const PostPreview = ({ content }: PostPreviewProps) => {
  const previewRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const { toast } = useToast();

  const isSquare = content.format === "square";
  const dimensions = isSquare ? { width: 1080, height: 1080 } : { width: 1080, height: 1920 };
  const previewScale = isSquare ? 0.4 : 0.25;

  // Render post to canvas using Canvas API
  const renderToCanvas = useCallback(async (): Promise<HTMLCanvasElement> => {
    const canvas = document.createElement("canvas");
    canvas.width = dimensions.width;
    canvas.height = dimensions.height;
    const ctx = canvas.getContext("2d")!;

    // Load font first
    await document.fonts.load("700 72px Poppins");
    await document.fonts.load("600 48px Poppins");
    await document.fonts.load("400 32px Poppins");

    // Draw background gradient
    const bgGradient = ctx.createLinearGradient(0, 0, dimensions.width, dimensions.height);
    bgGradient.addColorStop(0, "#0d1b3e");
    bgGradient.addColorStop(0.5, "#1a1a2e");
    bgGradient.addColorStop(1, "#0d1b3e");
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, dimensions.width, dimensions.height);

    // Draw overlay gradient
    const overlayGradient = ctx.createLinearGradient(0, 0, 0, dimensions.height);
    overlayGradient.addColorStop(0, "rgba(0,0,0,0.3)");
    overlayGradient.addColorStop(0.3, "rgba(0,0,0,0)");
    overlayGradient.addColorStop(0.7, "rgba(0,0,0,0)");
    overlayGradient.addColorStop(1, "rgba(0,0,0,0.4)");
    ctx.fillStyle = overlayGradient;
    ctx.fillRect(0, 0, dimensions.width, dimensions.height);

    // Draw cyan glow
    const cyanGlow = ctx.createRadialGradient(
      dimensions.width * 0.1 + 150, dimensions.height * 0.15 + 150, 0,
      dimensions.width * 0.1 + 150, dimensions.height * 0.15 + 150, 150
    );
    cyanGlow.addColorStop(0, "rgba(0, 207, 255, 0.15)");
    cyanGlow.addColorStop(1, "rgba(0, 207, 255, 0)");
    ctx.fillStyle = cyanGlow;
    ctx.fillRect(0, 0, dimensions.width, dimensions.height);

    // Draw purple glow
    const purpleGlow = ctx.createRadialGradient(
      dimensions.width * 0.85, dimensions.height * 0.8, 0,
      dimensions.width * 0.85, dimensions.height * 0.8, 200
    );
    purpleGlow.addColorStop(0, "rgba(139, 92, 246, 0.15)");
    purpleGlow.addColorStop(1, "rgba(139, 92, 246, 0)");
    ctx.fillStyle = purpleGlow;
    ctx.fillRect(0, 0, dimensions.width, dimensions.height);

    // Draw logo if enabled
    if (content.showLogo) {
      const logoImg = new Image();
      logoImg.crossOrigin = "anonymous";
      await new Promise<void>((resolve, reject) => {
        logoImg.onload = () => resolve();
        logoImg.onerror = reject;
        logoImg.src = partyPantherLogo;
      });

      // Draw circular logo
      ctx.save();
      ctx.beginPath();
      ctx.arc(48 + 40, 48 + 40, 40, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(logoImg, 48, 48, 80, 80);
      ctx.restore();

      // Draw "Party Panther" text
      ctx.font = "700 32px Poppins";
      ctx.fillStyle = "#00d4ff";
      ctx.shadowColor = "rgba(0, 207, 255, 0.5)";
      ctx.shadowBlur = 20;
      ctx.textBaseline = "middle";
      ctx.fillText("Party Panther", 48 + 96, 48 + 40);
      ctx.shadowBlur = 0;
    }

    // Calculate content positioning
    let currentY = dimensions.height / 2;
    const contentWidth = dimensions.width - 128;

    // Measure total content height to center it
    let totalHeight = 0;
    if (content.headline) totalHeight += 86 + 32; // headline + margin
    content.sections.forEach(section => {
      if (section.subheadline) totalHeight += 62 + 12;
      if (section.body) totalHeight += 48;
      totalHeight += 24; // section margin
    });
    currentY = (dimensions.height - totalHeight) / 2;

    // Draw headline
    if (content.headline) {
      ctx.font = "700 72px Poppins";
      ctx.fillStyle = "#00d4ff";
      ctx.shadowColor = "rgba(0, 212, 255, 0.4)";
      ctx.shadowBlur = 30;
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      
      // Wrap text if needed
      const lines = wrapText(ctx, content.headline, contentWidth);
      lines.forEach(line => {
        ctx.fillText(line, dimensions.width / 2, currentY);
        currentY += 86;
      });
      currentY += 32;
      ctx.shadowBlur = 0;
    }

    // Draw sections
    content.sections.forEach(section => {
      if (section.subheadline) {
        ctx.font = "600 48px Poppins";
        ctx.fillStyle = "#6366f1";
        ctx.shadowColor = "rgba(99, 102, 241, 0.4)";
        ctx.shadowBlur = 20;
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        
        const lines = wrapText(ctx, section.subheadline, contentWidth);
        lines.forEach(line => {
          ctx.fillText(line, dimensions.width / 2, currentY);
          currentY += 62;
        });
        currentY += 12;
        ctx.shadowBlur = 0;
      }

      if (section.body) {
        ctx.font = "400 32px Poppins";
        ctx.fillStyle = "#e6e6e6";
        ctx.shadowColor = "rgba(0,0,0,0.5)";
        ctx.shadowBlur = 4;
        ctx.shadowOffsetY = 2;
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        
        const lines = wrapText(ctx, section.body, contentWidth);
        lines.forEach(line => {
          ctx.fillText(line, dimensions.width / 2, currentY);
          currentY += 48;
        });
        ctx.shadowBlur = 0;
        ctx.shadowOffsetY = 0;
      }

      currentY += 24;
    });

    return canvas;
  }, [content, dimensions]);

  // Open full scale preview as image in new window
  const handleOpenFullScale = async () => {
    setPreviewLoading(true);
    try {
      const canvas = await renderToCanvas();
      const dataUrl = canvas.toDataURL("image/png", 1.0);
      
      const newWindow = window.open("", "_blank");
      if (newWindow) {
        const filename = `party-panther-${content.format}-${Date.now()}.png`;
        newWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Party Panther Instagram Post</title>
              <style>
                body { margin: 0; padding: 20px; background: #1a1a2e; display: flex; flex-direction: column; align-items: center; min-height: 100vh; gap: 20px; }
                .download-btn { 
                  background: #6366f1; 
                  color: white; 
                  border: none; 
                  padding: 12px 24px; 
                  font-size: 16px; 
                  font-weight: 600; 
                  border-radius: 8px; 
                  cursor: pointer; 
                  display: flex; 
                  align-items: center; 
                  gap: 8px;
                  transition: background 0.2s;
                }
                .download-btn:hover { background: #4f46e5; }
                img { max-width: 100%; height: auto; box-shadow: 0 10px 40px rgba(0,0,0,0.5); }
              </style>
            </head>
            <body>
              <button class="download-btn" onclick="downloadImage()">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                Download PNG
              </button>
              <img src="${dataUrl}" alt="Instagram Post" />
              <script>
                function downloadImage() {
                  const link = document.createElement('a');
                  link.download = '${filename}';
                  link.href = '${dataUrl}';
                  link.click();
                }
              </script>
            </body>
          </html>
        `);
        newWindow.document.close();
        
        toast({
          title: "Preview Opened",
          description: "Click Download or right-click the image to save",
        });
      }
    } catch (error) {
      console.error("Preview error:", error);
      toast({
        title: "Preview Failed",
        description: "Could not generate preview image",
        variant: "destructive",
      });
    } finally {
      setPreviewLoading(false);
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
        backgroundColor: "#0d1b3e",
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
            {/* Actual render target - using inline styles for html2canvas compatibility */}
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
              {/* Hero-like gradient background */}
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  background: "linear-gradient(135deg, #0d1b3e 0%, #1a1a2e 50%, #0d1b3e 100%)",
                }}
              />
              
              {/* Overlay for depth */}
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  background: "linear-gradient(180deg, rgba(0,0,0,0.3) 0%, transparent 30%, transparent 70%, rgba(0,0,0,0.4) 100%)",
                }}
              />
              
              {/* Cyan glow */}
              <div
                style={{
                  position: "absolute",
                  top: "15%",
                  left: "10%",
                  width: 300,
                  height: 300,
                  background: "radial-gradient(circle, rgba(0, 207, 255, 0.15) 0%, transparent 70%)",
                  borderRadius: "50%",
                }}
              />
              
              {/* Purple glow */}
              <div
                style={{
                  position: "absolute",
                  bottom: "20%",
                  right: "15%",
                  width: 400,
                  height: 400,
                  background: "radial-gradient(circle, rgba(139, 92, 246, 0.15) 0%, transparent 70%)",
                  borderRadius: "50%",
                }}
              />

              {/* Logo & Brand */}
              {content.showLogo && (
                <div
                  style={{
                    position: "absolute",
                    top: 48,
                    left: 48,
                    zIndex: 10,
                    height: 80,
                  }}
                >
                  <img
                    src={partyPantherLogo}
                    alt="Party Panther"
                    style={{
                      width: 80,
                      height: 80,
                      borderRadius: "50%",
                      position: "absolute",
                      top: 0,
                      left: 0,
                      objectFit: "cover",
                      display: "block",
                    }}
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

              {/* Content - using absolute positioning for html2canvas compatibility */}
              <div
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  width: dimensions.width - 128,
                  textAlign: "center",
                  zIndex: 5,
                }}
              >
                {/* Headline */}
                {content.headline && (
                  <div
                    style={{
                      fontSize: 72,
                      fontWeight: 700,
                      lineHeight: "86px",
                      color: "#00d4ff",
                      marginBottom: 32,
                      textShadow: "0 0 30px rgba(0, 212, 255, 0.4)",
                    }}
                  >
                    {content.headline}
                  </div>
                )}

                {/* Content Sections */}
                {content.sections.map((section, index) => (
                  <div key={index} style={{ marginBottom: 24 }}>
                    {/* Sub-headline */}
                    {section.subheadline && (
                      <div
                        style={{
                          fontSize: 48,
                          fontWeight: 600,
                          color: "#6366f1",
                          lineHeight: "62px",
                          marginBottom: 12,
                          textShadow: "0 0 20px rgba(99, 102, 241, 0.4)",
                        }}
                      >
                        {section.subheadline}
                      </div>
                    )}

                    {/* Body */}
                    {section.body && (
                      <div
                        style={{
                          fontSize: 32,
                          lineHeight: "48px",
                          color: "#e6e6e6",
                          textShadow: "0 2px 4px rgba(0,0,0,0.5)",
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

// Helper to wrap text for canvas rendering
function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const metrics = ctx.measureText(testLine);
    
    if (metrics.width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  
  if (currentLine) {
    lines.push(currentLine);
  }
  
  return lines;
}
