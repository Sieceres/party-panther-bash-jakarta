import { useRef, useState, useCallback } from "react";
import html2canvas from "html2canvas";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Loader2, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { PostContent, BackgroundStyle, FontFamily } from "@/types/instagram-post";
import partyPantherLogo from "@/assets/party-panther-logo.png";

interface PostPreviewProps {
  content: PostContent;
}

// Background style configurations
const getBackgroundConfig = (style: BackgroundStyle) => {
  switch (style) {
    case "hero-style":
      return {
        mainGradient: "linear-gradient(135deg, #0d1b3e 0%, #1a1a2e 50%, #0d1b3e 100%)",
        overlay: "linear-gradient(180deg, rgba(0,0,0,0.4) 0%, transparent 30%, transparent 70%, rgba(0,0,0,0.6) 100%)",
        glows: [
          { top: "5%", left: "5%", size: 350, color: "rgba(0, 207, 255, 0.25)" },
          { top: "60%", right: "5%", size: 300, color: "rgba(79, 142, 255, 0.2)" },
          { bottom: "10%", left: "20%", size: 250, color: "rgba(139, 92, 246, 0.15)" },
          { top: "30%", right: "20%", size: 200, color: "rgba(0, 207, 255, 0.1)" },
        ],
        hasFloatingElements: true,
      };
    case "neon-accent":
      return {
        mainGradient: "linear-gradient(180deg, #0a0a0f 0%, #1a1a2e 50%, #0a0a0f 100%)",
        overlay: "linear-gradient(180deg, rgba(0,0,0,0.2) 0%, transparent 50%, rgba(0,0,0,0.3) 100%)",
        glows: [
          { top: "10%", left: "50%", size: 600, color: "rgba(236, 72, 153, 0.15)" },
          { bottom: "10%", left: "50%", size: 500, color: "rgba(34, 211, 238, 0.12)" },
        ],
        hasFloatingElements: false,
      };
    case "dark-gradient":
    default:
      return {
        mainGradient: "linear-gradient(180deg, #1a1a2e 0%, #0d1b3e 50%, #1a1a2e 100%)",
        overlay: "linear-gradient(180deg, rgba(0,0,0,0.3) 0%, transparent 30%, transparent 70%, rgba(0,0,0,0.4) 100%)",
        glows: [
          { top: "15%", left: "10%", size: 300, color: "rgba(0, 207, 255, 0.15)" },
          { bottom: "20%", right: "15%", size: 400, color: "rgba(139, 92, 246, 0.15)" },
        ],
        hasFloatingElements: false,
      };
  }
};

export const PostPreview = ({ content }: PostPreviewProps) => {
  const previewRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const { toast } = useToast();

  const isSquare = content.format === "square";
  const dimensions = isSquare ? { width: 1080, height: 1080 } : { width: 1080, height: 1920 };
  const previewScale = isSquare ? 0.4 : 0.25;
  const bgConfig = getBackgroundConfig(content.backgroundStyle);

  // Load fonts for canvas rendering
  const loadFonts = async (fonts: PostContent["fonts"]) => {
    const uniqueFonts = [...new Set([fonts.headline, fonts.subheadline, fonts.body])];
    for (const font of uniqueFonts) {
      await document.fonts.load(`700 72px ${font}`);
      await document.fonts.load(`600 48px ${font}`);
      await document.fonts.load(`400 32px ${font}`);
    }
  };

  // Render post to canvas using Canvas API
  const renderToCanvas = useCallback(async (): Promise<HTMLCanvasElement> => {
    const canvas = document.createElement("canvas");
    canvas.width = dimensions.width;
    canvas.height = dimensions.height;
    const ctx = canvas.getContext("2d")!;

    // Load fonts
    await loadFonts(content.fonts);

    // Draw background based on style
    const bgConfig = getBackgroundConfig(content.backgroundStyle);
    
    // Main gradient
    const bgGradient = ctx.createLinearGradient(0, 0, dimensions.width, dimensions.height);
    if (content.backgroundStyle === "hero-style") {
      bgGradient.addColorStop(0, "#0d1b3e");
      bgGradient.addColorStop(0.5, "#1a1a2e");
      bgGradient.addColorStop(1, "#0d1b3e");
    } else if (content.backgroundStyle === "neon-accent") {
      bgGradient.addColorStop(0, "#0a0a0f");
      bgGradient.addColorStop(0.5, "#1a1a2e");
      bgGradient.addColorStop(1, "#0a0a0f");
    } else {
      bgGradient.addColorStop(0, "#1a1a2e");
      bgGradient.addColorStop(0.5, "#0d1b3e");
      bgGradient.addColorStop(1, "#1a1a2e");
    }
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

    // Draw glows based on style
    if (content.backgroundStyle === "hero-style") {
      // Multiple glows for hero style
      const glows = [
        { x: dimensions.width * 0.1, y: dimensions.height * 0.1, r: 175, color: "rgba(0, 207, 255, 0.25)" },
        { x: dimensions.width * 0.85, y: dimensions.height * 0.65, r: 150, color: "rgba(79, 142, 255, 0.2)" },
        { x: dimensions.width * 0.3, y: dimensions.height * 0.85, r: 125, color: "rgba(139, 92, 246, 0.15)" },
        { x: dimensions.width * 0.75, y: dimensions.height * 0.35, r: 100, color: "rgba(0, 207, 255, 0.1)" },
      ];
      glows.forEach(glow => {
        const gradient = ctx.createRadialGradient(glow.x, glow.y, 0, glow.x, glow.y, glow.r);
        gradient.addColorStop(0, glow.color);
        gradient.addColorStop(1, "transparent");
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, dimensions.width, dimensions.height);
      });
    } else if (content.backgroundStyle === "neon-accent") {
      // Pink and cyan glows for neon
      const pinkGlow = ctx.createRadialGradient(
        dimensions.width / 2, dimensions.height * 0.15, 0,
        dimensions.width / 2, dimensions.height * 0.15, 300
      );
      pinkGlow.addColorStop(0, "rgba(236, 72, 153, 0.15)");
      pinkGlow.addColorStop(1, "transparent");
      ctx.fillStyle = pinkGlow;
      ctx.fillRect(0, 0, dimensions.width, dimensions.height);

      const cyanGlow = ctx.createRadialGradient(
        dimensions.width / 2, dimensions.height * 0.85, 0,
        dimensions.width / 2, dimensions.height * 0.85, 250
      );
      cyanGlow.addColorStop(0, "rgba(34, 211, 238, 0.12)");
      cyanGlow.addColorStop(1, "transparent");
      ctx.fillStyle = cyanGlow;
      ctx.fillRect(0, 0, dimensions.width, dimensions.height);
    } else {
      // Default glows
      const cyanGlow = ctx.createRadialGradient(
        dimensions.width * 0.15, dimensions.height * 0.2, 0,
        dimensions.width * 0.15, dimensions.height * 0.2, 150
      );
      cyanGlow.addColorStop(0, "rgba(0, 207, 255, 0.15)");
      cyanGlow.addColorStop(1, "transparent");
      ctx.fillStyle = cyanGlow;
      ctx.fillRect(0, 0, dimensions.width, dimensions.height);

      const purpleGlow = ctx.createRadialGradient(
        dimensions.width * 0.85, dimensions.height * 0.8, 0,
        dimensions.width * 0.85, dimensions.height * 0.8, 200
      );
      purpleGlow.addColorStop(0, "rgba(139, 92, 246, 0.15)");
      purpleGlow.addColorStop(1, "transparent");
      ctx.fillStyle = purpleGlow;
      ctx.fillRect(0, 0, dimensions.width, dimensions.height);
    }

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

    // Get font sizes from content
    const headlineFontSize = content.fontSizes?.headline || 72;
    const subheadlineFontSize = content.fontSizes?.subheadline || 48;
    const bodyFontSize = content.fontSizes?.body || 32;

    // Measure total content height to center it
    let totalHeight = 0;
    if (content.headline) totalHeight += (headlineFontSize * 1.2) + 32;
    content.sections.forEach(section => {
      if (section.subheadline) totalHeight += (subheadlineFontSize * 1.3) + 12;
      if (section.body) totalHeight += (bodyFontSize * 1.5);
      totalHeight += 24;
    });
    currentY = (dimensions.height - totalHeight) / 2;

    // Draw headline
    if (content.headline) {
      ctx.font = `700 ${headlineFontSize}px ${content.fonts.headline}`;
      ctx.fillStyle = "#00d4ff";
      ctx.shadowColor = "rgba(0, 212, 255, 0.4)";
      ctx.shadowBlur = 30;
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      
      const lines = wrapText(ctx, content.headline, contentWidth);
      lines.forEach(line => {
        ctx.fillText(line, dimensions.width / 2, currentY);
        currentY += headlineFontSize * 1.2;
      });
      currentY += 32;
      ctx.shadowBlur = 0;
    }

    // Draw sections
    content.sections.forEach(section => {
      if (section.subheadline) {
        ctx.font = `600 ${subheadlineFontSize}px ${content.fonts.subheadline}`;
        ctx.fillStyle = "#6366f1";
        ctx.shadowColor = "rgba(99, 102, 241, 0.4)";
        ctx.shadowBlur = 20;
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        
        const lines = wrapText(ctx, section.subheadline, contentWidth);
        lines.forEach(line => {
          ctx.fillText(line, dimensions.width / 2, currentY);
          currentY += subheadlineFontSize * 1.3;
        });
        currentY += 12;
        ctx.shadowBlur = 0;
      }

      if (section.body) {
        ctx.font = `400 ${bodyFontSize}px ${content.fonts.body}`;
        ctx.fillStyle = "#e6e6e6";
        ctx.shadowColor = "rgba(0,0,0,0.5)";
        ctx.shadowBlur = 4;
        ctx.shadowOffsetY = 2;
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        
        const lines = wrapText(ctx, section.body, contentWidth);
        lines.forEach(line => {
          ctx.fillText(line, dimensions.width / 2, currentY);
          currentY += bodyFontSize * 1.5;
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

  // Render floating elements for hero style
  const renderFloatingElements = () => {
    if (content.backgroundStyle !== "hero-style") return null;
    
    return (
      <>
        {/* Large cyan glow top-left */}
        <div
          style={{
            position: "absolute",
            top: "5%",
            left: "5%",
            width: 350,
            height: 350,
            background: "radial-gradient(circle, rgba(0, 207, 255, 0.25) 0%, transparent 70%)",
            borderRadius: "50%",
            filter: "blur(40px)",
          }}
        />
        {/* Blue glow bottom-right */}
        <div
          style={{
            position: "absolute",
            top: "60%",
            right: "5%",
            width: 300,
            height: 300,
            background: "radial-gradient(circle, rgba(79, 142, 255, 0.2) 0%, transparent 70%)",
            borderRadius: "50%",
            filter: "blur(30px)",
          }}
        />
        {/* Purple glow bottom-left */}
        <div
          style={{
            position: "absolute",
            bottom: "10%",
            left: "20%",
            width: 250,
            height: 250,
            background: "radial-gradient(circle, rgba(139, 92, 246, 0.15) 0%, transparent 70%)",
            borderRadius: "50%",
            filter: "blur(35px)",
          }}
        />
        {/* Small cyan accent */}
        <div
          style={{
            position: "absolute",
            top: "30%",
            right: "20%",
            width: 200,
            height: 200,
            background: "radial-gradient(circle, rgba(0, 207, 255, 0.1) 0%, transparent 70%)",
            borderRadius: "50%",
            filter: "blur(25px)",
          }}
        />
      </>
    );
  };

  // Render neon accent glows
  const renderNeonGlows = () => {
    if (content.backgroundStyle !== "neon-accent") return null;
    
    return (
      <>
        {/* Pink glow top center */}
        <div
          style={{
            position: "absolute",
            top: "10%",
            left: "50%",
            transform: "translateX(-50%)",
            width: 600,
            height: 300,
            background: "radial-gradient(ellipse, rgba(236, 72, 153, 0.15) 0%, transparent 70%)",
            filter: "blur(50px)",
          }}
        />
        {/* Cyan glow bottom center */}
        <div
          style={{
            position: "absolute",
            bottom: "10%",
            left: "50%",
            transform: "translateX(-50%)",
            width: 500,
            height: 250,
            background: "radial-gradient(ellipse, rgba(34, 211, 238, 0.12) 0%, transparent 70%)",
            filter: "blur(40px)",
          }}
        />
      </>
    );
  };

  // Render default glows
  const renderDefaultGlows = () => {
    if (content.backgroundStyle !== "dark-gradient") return null;
    
    return (
      <>
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
      </>
    );
  };

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
            {/* Actual render target */}
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
              {/* Background gradient */}
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  background: bgConfig.mainGradient,
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
                  background: bgConfig.overlay,
                }}
              />
              
              {/* Style-specific glows */}
              {renderFloatingElements()}
              {renderNeonGlows()}
              {renderDefaultGlows()}

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

              {/* Content */}
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
                      fontSize: content.fontSizes?.headline || 72,
                      fontWeight: 700,
                      fontFamily: `'${content.fonts.headline}', sans-serif`,
                      lineHeight: `${(content.fontSizes?.headline || 72) * 1.2}px`,
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
                          fontSize: content.fontSizes?.subheadline || 48,
                          fontWeight: 600,
                          fontFamily: `'${content.fonts.subheadline}', sans-serif`,
                          color: "#6366f1",
                          lineHeight: `${(content.fontSizes?.subheadline || 48) * 1.3}px`,
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
                          fontSize: content.fontSizes?.body || 32,
                          fontFamily: `'${content.fonts.body}', sans-serif`,
                          lineHeight: `${(content.fontSizes?.body || 32) * 1.5}px`,
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
          <span className="text-xs">Tip: Use "Preview & Download" for best quality</span>
        </p>
      </CardContent>
    </Card>
  );
};

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
