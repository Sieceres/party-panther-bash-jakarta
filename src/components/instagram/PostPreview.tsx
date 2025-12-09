import { useRef, useState } from "react";
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
  const { toast } = useToast();

  const isSquare = content.format === "square";
  const dimensions = isSquare ? { width: 1080, height: 1080 } : { width: 1080, height: 1920 };
  const previewScale = isSquare ? 0.4 : 0.25;

  // Generate the HTML content for the post
  const generatePostHTML = () => {
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
              width: ${dimensions.width}px;
              height: ${dimensions.height}px;
              overflow: hidden;
              position: relative;
            }
            .background {
              position: absolute;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
              background: linear-gradient(135deg, #0d1b3e 0%, #1a1a2e 50%, #0d1b3e 100%);
            }
            .overlay {
              position: absolute;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
              background: linear-gradient(180deg, rgba(0,0,0,0.3) 0%, transparent 30%, transparent 70%, rgba(0,0,0,0.4) 100%);
            }
            .glow-1 {
              position: absolute;
              top: 15%;
              left: 10%;
              width: 300px;
              height: 300px;
              background: radial-gradient(circle, rgba(0, 207, 255, 0.15) 0%, transparent 70%);
              border-radius: 50%;
            }
            .glow-2 {
              position: absolute;
              bottom: 20%;
              right: 15%;
              width: 400px;
              height: 400px;
              background: radial-gradient(circle, rgba(139, 92, 246, 0.15) 0%, transparent 70%);
              border-radius: 50%;
            }
            .logo-section {
              position: absolute;
              top: 48px;
              left: 48px;
              display: block;
            }
            .logo-row {
              display: block;
            }
            .logo-img {
              width: 80px;
              height: 80px;
              border-radius: 50%;
              display: inline-block;
              vertical-align: middle;
            }
            .logo-text {
              font-size: 32px;
              font-weight: 700;
              color: #00d4ff;
              display: inline-block;
              vertical-align: middle;
              margin-left: 16px;
              text-shadow: 0 0 20px rgba(0, 207, 255, 0.5);
            }
            .content-wrapper {
              position: absolute;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
              display: table;
            }
            .content {
              display: table-cell;
              vertical-align: middle;
              text-align: center;
              padding: 64px;
            }
            .headline {
              font-size: 72px;
              font-weight: 700;
              line-height: 1.2;
              color: #b366ff;
              margin-bottom: 32px;
              text-shadow: 0 0 30px rgba(139, 92, 246, 0.4);
            }
            .section {
              margin-bottom: 24px;
            }
            .subheadline {
              font-size: 48px;
              font-weight: 600;
              color: #00d4ff;
              line-height: 1.3;
              margin-bottom: 12px;
              text-shadow: 0 0 20px rgba(0, 207, 255, 0.4);
            }
            .body-text {
              font-size: 32px;
              line-height: 1.5;
              color: #e6e6e6;
              text-shadow: 0 2px 4px rgba(0,0,0,0.5);
            }
          </style>
        </head>
        <body>
          <div class="background"></div>
          <div class="overlay"></div>
          <div class="glow-1"></div>
          <div class="glow-2"></div>
          ${content.showLogo ? `
            <div class="logo-section">
              <div class="logo-row">
                <img src="${logoUrl}" alt="Party Panther" class="logo-img" crossorigin="anonymous">
                <span class="logo-text">Party Panther</span>
              </div>
            </div>
          ` : ''}
          <div class="content-wrapper">
            <div class="content">
              ${content.headline ? `<div class="headline">${escapeHtml(content.headline)}</div>` : ''}
              ${content.sections.map(section => `
                <div class="section">
                  ${section.subheadline ? `<div class="subheadline">${escapeHtml(section.subheadline)}</div>` : ''}
                  ${section.body ? `<div class="body-text">${escapeHtml(section.body)}</div>` : ''}
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

              {/* Logo & Brand - using table layout for compatibility */}
              {content.showLogo && (
                <div
                  style={{
                    position: "absolute",
                    top: 48,
                    left: 48,
                    zIndex: 10,
                  }}
                >
                  <img
                    src={partyPantherLogo}
                    alt="Party Panther"
                    style={{
                      width: 80,
                      height: 80,
                      borderRadius: "50%",
                      display: "inline-block",
                      verticalAlign: "middle",
                    }}
                    crossOrigin="anonymous"
                  />
                  <span
                    style={{
                      fontSize: 32,
                      fontWeight: 700,
                      color: "#00d4ff",
                      display: "inline-block",
                      verticalAlign: "middle",
                      marginLeft: 16,
                      textShadow: "0 0 20px rgba(0, 207, 255, 0.5)",
                    }}
                  >
                    Party Panther
                  </span>
                </div>
              )}

              {/* Content using table layout for reliable vertical centering */}
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  display: "table",
                  zIndex: 5,
                }}
              >
                <div
                  style={{
                    display: "table-cell",
                    verticalAlign: "middle",
                    textAlign: "center",
                    padding: 64,
                  }}
                >
                  {/* Headline */}
                  {content.headline && (
                    <div
                      style={{
                        fontSize: 72,
                        fontWeight: 700,
                        lineHeight: 1.2,
                        color: "#b366ff",
                        marginBottom: 32,
                        textShadow: "0 0 30px rgba(139, 92, 246, 0.4)",
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
                            color: "#00d4ff",
                            lineHeight: 1.3,
                            marginBottom: 12,
                            textShadow: "0 0 20px rgba(0, 207, 255, 0.4)",
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
                            lineHeight: 1.5,
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
