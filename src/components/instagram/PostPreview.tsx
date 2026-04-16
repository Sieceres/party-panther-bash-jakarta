import { useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ExternalLink, Move, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import html2canvas from "html2canvas";
import type { PostContent, ElementPosition } from "@/types/instagram-post";
import { InstagramPostScene } from "./InstagramPostScene";

interface PostPreviewProps {
  content: PostContent;
  onHeadlinePositionChange?: (position: ElementPosition) => void;
  onSectionPositionChange?: (index: number, position: ElementPosition) => void;
  onLogoPositionChange?: (position: ElementPosition) => void;
}

export const PostPreview = ({ content, onHeadlinePositionChange, onSectionPositionChange, onLogoPositionChange }: PostPreviewProps) => {
  const previewRef = useRef<HTMLDivElement>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [draggingElement, setDraggingElement] = useState<string | null>(null);
  const { toast } = useToast();

  const getDimensions = () => {
    switch (content.format) {
      case "square":
        return { width: 1080, height: 1080 };
      case "portrait":
        return { width: 1080, height: 1350 };
      case "story":
        return { width: 1080, height: 1920 };
      default:
        return { width: 1080, height: 1080 };
    }
  };

  const dimensions = getDimensions();
  const previewScale = content.format === "story" ? 0.25 : content.format === "portrait" ? 0.35 : 0.4;
  const scaledWidth = dimensions.width * previewScale;

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
      } else if (elementId === "logo" && onLogoPositionChange) {
        onLogoPositionChange({ x, y });
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

  const prepareCloneForExport = (clone: HTMLElement) => {
    const brandContainer = clone.querySelector("[data-brand-container]") as HTMLElement | null;
    const brandLogo = clone.querySelector("[data-brand-logo]") as HTMLImageElement | null;
    const brandText = clone.querySelector("[data-brand-text]") as HTMLElement | null;

    if (brandContainer) {
      brandContainer.style.display = "flex";
      brandContainer.style.flexDirection = "row";
      brandContainer.style.alignItems = "center";
      brandContainer.style.gap = "8px";
    }

    if (brandLogo) {
      brandLogo.style.filter = "none";
      brandLogo.style.display = "block";
      brandLogo.style.transform = "none";
    }

    clone.querySelectorAll("[data-drag-label]").forEach((el) => {
      (el as HTMLElement).style.display = "none";
    });

    if (brandText) {
      brandText.style.background = "none";
      (brandText.style as any).webkitBackgroundClip = "unset";
      brandText.style.backgroundClip = "unset";
      (brandText.style as any).webkitTextFillColor = "#00CFFF";
      brandText.style.color = "#00CFFF";
      brandText.style.textShadow = "0 0 20px rgba(0, 207, 255, 0.6)";
      brandText.style.filter = "none";
      brandText.style.display = "flex";
      (brandText.style as any).alignItems = "center";
      brandText.style.height = "56px";
      brandText.style.lineHeight = "1";
      brandText.style.transform = "translateY(0px)";
    }
  };

  const handleOpenLivePreview = async () => {
    if (!previewRef.current) return;

    setPreviewLoading(true);
    try {
      await document.fonts.ready;

      const popup = window.open("", "_blank");
      if (!popup) {
        toast({
          title: "Popup blocked",
          description: "Please allow popups to open the 100% preview.",
          variant: "destructive",
        });
        return;
      }

      popup.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            <title>Preview (100%)</title>
            <link rel="preconnect" href="https://fonts.googleapis.com">
            <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
            <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@400;600;700;800&family=Montserrat:wght@400;600;700;800&family=Oswald:wght@400;600;700&family=Playfair+Display:wght@400;600;700;800&family=Poppins:wght@400;500;600;700;800&display=swap" rel="stylesheet">
            <style>
              body {
                margin: 0;
                padding: 24px;
                background: #0b0b10;
                font-family: system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif;
              }
              .wrap {
                display: grid;
                place-items: start center;
              }
              .frame {
                width: ${dimensions.width}px;
                height: ${dimensions.height}px;
                box-shadow: 0 18px 60px rgba(0,0,0,0.55);
                border-radius: 12px;
                overflow: hidden;
              }
              .hint {
                margin-top: 12px;
                color: rgba(255,255,255,0.6);
                font-size: 12px;
              }
            </style>
          </head>
          <body>
            <div class="wrap">
              <div id="mount" class="frame"></div>
              <div class="hint">${dimensions.width} × ${dimensions.height}px • Live DOM preview at 100%</div>
            </div>
          </body>
        </html>
      `);
      popup.document.close();

      const clone = previewRef.current.cloneNode(true) as HTMLElement;
      clone.style.transform = "none";
      clone.style.width = `${dimensions.width}px`;
      clone.style.height = `${dimensions.height}px`;
      prepareCloneForExport(clone);

      const mount = popup.document.getElementById("mount");
      mount?.appendChild(clone);

      toast({
        title: "100% Preview Opened",
        description: "Opened a live 1:1 preview in a new window",
        duration: 2500,
      });
    } catch (error) {
      console.error("Open live preview error:", error);
      toast({
        title: "Error",
        description: "Failed to open the 100% preview",
        variant: "destructive",
      });
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleOpenFullScale = async () => {
    if (!previewRef.current) return;

    setPreviewLoading(true);
    try {
      await document.fonts.ready;

      const clone = previewRef.current.cloneNode(true) as HTMLElement;
      clone.style.position = "fixed";
      clone.style.left = "-9999px";
      clone.style.top = "0";
      clone.style.transform = "none";
      clone.style.width = `${dimensions.width}px`;
      clone.style.height = `${dimensions.height}px`;
      document.body.appendChild(clone);

      prepareCloneForExport(clone);

      const images = Array.from(clone.querySelectorAll("img")) as HTMLImageElement[];
      await Promise.race([
        Promise.all(
          images.map((img) =>
            img.complete
              ? Promise.resolve()
              : new Promise<void>((resolve) => {
                  const done = () => resolve();
                  img.addEventListener("load", done, { once: true });
                  img.addEventListener("error", done, { once: true });
                }),
          ),
        ),
        new Promise((resolve) => setTimeout(resolve, 1500)),
      ]);

      const canvas = await html2canvas(clone, {
        width: dimensions.width,
        height: dimensions.height,
        scale: 1,
        useCORS: true,
        allowTaint: true,
        backgroundColor: null,
        logging: false,
      });

      document.body.removeChild(clone);

      const dataUrl = canvas.toDataURL("image/png");
      const popup = window.open("", "_blank", `width=500,height=700`);
      if (popup) {
        popup.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Download Instagram Post</title>
              <style>
                body {
                  margin: 0;
                  padding: 20px;
                  background: #1a1a2e;
                  display: flex;
                  flex-direction: column;
                  align-items: center;
                  font-family: system-ui, sans-serif;
                }
                img {
                  max-width: 100%;
                  height: auto;
                  border-radius: 8px;
                  box-shadow: 0 8px 32px rgba(0,0,0,0.4);
                }
                .actions {
                  margin-top: 16px;
                  display: flex;
                  gap: 12px;
                }
                a {
                  display: inline-flex;
                  align-items: center;
                  gap: 8px;
                  padding: 12px 24px;
                  background: #6366f1;
                  color: white;
                  text-decoration: none;
                  border-radius: 8px;
                  font-weight: 600;
                  transition: background 0.2s;
                }
                a:hover { background: #4f46e5; }
                .info {
                  color: #888;
                  font-size: 14px;
                  margin-top: 12px;
                }
              </style>
            </head>
            <body>
              <img src="${dataUrl}" alt="Instagram Post" />
              <div class="actions">
                <a href="${dataUrl}" download="party-panther-${content.format}-${Date.now()}.png">
                  ⬇️ Download PNG
                </a>
              </div>
              <p class="info">${dimensions.width} × ${dimensions.height}px</p>
            </body>
          </html>
        `);
        popup.document.close();
      }

      toast({
        title: "Preview Ready",
        description: "Download window opened",
        duration: 3000,
      });
    } catch (error) {
      console.error("Preview error:", error);
      toast({
        title: "Error",
        description: "Failed to generate preview",
        variant: "destructive",
      });
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleDirectDownload = async () => {
    if (!previewRef.current) return;

    setPreviewLoading(true);
    try {
      await document.fonts.ready;

      const clone = previewRef.current.cloneNode(true) as HTMLElement;
      clone.style.position = "fixed";
      clone.style.left = "-9999px";
      clone.style.top = "0";
      clone.style.transform = "none";
      clone.style.width = `${dimensions.width}px`;
      clone.style.height = `${dimensions.height}px`;
      document.body.appendChild(clone);

      prepareCloneForExport(clone);

      const images = Array.from(clone.querySelectorAll("img")) as HTMLImageElement[];
      await Promise.race([
        Promise.all(
          images.map((img) =>
            img.complete
              ? Promise.resolve()
              : new Promise<void>((resolve) => {
                  const done = () => resolve();
                  img.addEventListener("load", done, { once: true });
                  img.addEventListener("error", done, { once: true });
                }),
          ),
        ),
        new Promise((resolve) => setTimeout(resolve, 1500)),
      ]);

      const canvas = await html2canvas(clone, {
        width: dimensions.width,
        height: dimensions.height,
        scale: 1,
        useCORS: true,
        allowTaint: true,
        backgroundColor: null,
        logging: false,
      });

      document.body.removeChild(clone);

      const dataUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `party-panther-${content.format}-${Date.now()}.png`;
      link.click();

      toast({
        title: "Downloaded",
        description: "Image saved successfully",
        duration: 3000,
      });
    } catch (error) {
      console.error("Download error:", error);
      toast({
        title: "Error",
        description: "Failed to download",
        variant: "destructive",
      });
    } finally {
      setPreviewLoading(false);
    }
  };

  const logoScale = content.logoSettings?.scale ?? 1;
  const logoX = content.logoSettings?.position?.x ?? 10;
  const logoY = content.logoSettings?.position?.y ?? 5;
  const scaledLogoSize = 56 * logoScale;
  const scaledFontSize = 28 * logoScale;
  const contentWidth = dimensions.width - 128;
  const headlinePos = content.positions?.headline || { x: 50, y: 30 };

  const countLines = (value: string) => (value?.split("\n").length || 1);
  const headlineOverlayHeight = Math.max(96, (content.fontSizes?.headline || 72) * 1.2 * countLines(content.headline || "") + 32);
  const getSectionOverlayHeight = (index: number) => {
    const section = content.sections[index];
    const subheadlineHeight = section?.subheadline ? (content.fontSizes?.subheadline || 48) * 1.3 * countLines(section.subheadline) : 0;
    const bodyHeight = section?.body ? (content.fontSizes?.body || 32) * 1.5 * countLines(section.body) : 0;
    const dividerHeight = content.showDividers ? (content.dividerThickness ?? 3) + 28 + Math.abs(content.dividerOffsetY ?? 0) : 0;
    const boxPadding = content.sectionBoxes ? (content.sectionBoxPadding ?? 24) * 2 : 0;
    return Math.max(140, subheadlineHeight + bodyHeight + dividerHeight + boxPadding + 32);
  };

  return (
    <Card style={{ width: scaledWidth + 48, maxWidth: "100%" }}>
      <CardHeader className="flex flex-row items-center justify-between gap-2 flex-wrap p-3">
        <CardTitle className="text-base">Preview</CardTitle>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={handleOpenLivePreview} disabled={previewLoading}>
            <ExternalLink className="w-4 h-4 mr-2" />
            Open 100%
          </Button>
          <Button size="sm" variant="outline" onClick={handleOpenFullScale} disabled={previewLoading}>
            <ExternalLink className="w-4 h-4 mr-2" />
            Open Window
          </Button>
          <Button size="sm" onClick={handleDirectDownload} disabled={previewLoading}>
            {previewLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
            Download
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-3">
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
              style={{
                position: "relative",
                width: dimensions.width,
                height: dimensions.height,
              }}
            >
              <InstagramPostScene
                ref={previewRef}
                content={content}
                width={dimensions.width}
                height={dimensions.height}
              />

              {((content.showLogo ?? true) || (content.showBrandName ?? true)) && onLogoPositionChange && (
                <div
                  style={{
                    position: "absolute",
                    left: `${logoX}%`,
                    top: `${logoY}%`,
                    width: (content.showBrandName ?? true) ? Math.min(dimensions.width * 0.62, 460 * logoScale) : scaledLogoSize,
                    height: scaledLogoSize + 28,
                    cursor: draggingElement === "logo" ? "grabbing" : "grab",
                    userSelect: "none",
                  }}
                  onMouseDown={(e) => handleDrag("logo", e)}
                >
                  <div
                    style={{
                      position: "absolute",
                      top: -24,
                      left: 0,
                      background: "rgba(0,0,0,0.6)",
                      padding: "2px 8px",
                      borderRadius: 4,
                      fontSize: 12,
                      color: "#fff",
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      opacity: draggingElement === "logo" ? 1 : 0.5,
                    }}
                    data-drag-label
                  >
                    <Move size={10} /> Logo
                  </div>
                </div>
              )}

              {content.headline && onHeadlinePositionChange && (
                <div
                  style={{
                    position: "absolute",
                    top: `${headlinePos.y}%`,
                    left: `${headlinePos.x}%`,
                    transform: "translate(-50%, -50%)",
                    width: contentWidth,
                    height: headlineOverlayHeight,
                    cursor: draggingElement === "headline" ? "grabbing" : "grab",
                    userSelect: "none",
                  }}
                  onMouseDown={(e) => handleDrag("headline", e)}
                >
                  <div
                    style={{
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
                    }}
                    data-drag-label
                  >
                    <Move size={10} /> Headline
                  </div>
                </div>
              )}

              {content.sections.map((_, index) => {
                const position = content.positions?.sections?.[index] || { x: 50, y: 50 + index * 15 };
                return onSectionPositionChange ? (
                  <div
                    key={index}
                    style={{
                      position: "absolute",
                      top: `${position.y}%`,
                      left: `${position.x}%`,
                      transform: "translate(-50%, -50%)",
                      width: contentWidth,
                      height: getSectionOverlayHeight(index),
                      cursor: draggingElement === `section-${index}` ? "grabbing" : "grab",
                      userSelect: "none",
                    }}
                    onMouseDown={(e) => handleDrag(`section-${index}`, e)}
                  >
                    <div
                      style={{
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
                      }}
                      data-drag-label
                    >
                      <Move size={10} /> Section {index + 1}
                    </div>
                  </div>
                ) : null;
              })}
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
