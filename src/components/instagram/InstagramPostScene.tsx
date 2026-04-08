import type { PostContent, BackgroundStyle, ElementPosition } from "@/types/instagram-post";
import partyPantherLogo from "@/assets/party-panther-logo.png";
import React from "react";

/** Shared visual renderer used by PostPreview (interactive) and AnimationPreview (export). */

export const getBackgroundConfig = (style: BackgroundStyle) => {
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

export const getDimensions = (format: string) => {
  switch (format) {
    case "square": return { width: 1080, height: 1080 };
    case "portrait": return { width: 1080, height: 1350 };
    case "story": return { width: 1080, height: 1920 };
    default: return { width: 1080, height: 1080 };
  }
};

export const getTextStyle = (
  type: "headline" | "subheadline" | "body",
  content: PostContent,
): React.CSSProperties => {
  const shadow = content.textStyles?.shadows?.[type];
  const stroke = content.textStyles?.strokes?.[type];
  let style: React.CSSProperties = {};
  if (shadow?.enabled) {
    style.textShadow = `${shadow.offsetX}px ${shadow.offsetY}px ${shadow.blur}px ${shadow.color}`;
  }
  if (stroke?.enabled) {
    style.WebkitTextStroke = `${stroke.width}px ${stroke.color}`;
  }
  return style;
};

export const hexToRgba = (hex: string, alpha: number) => {
  const r = parseInt(hex.slice(1, 3), 16) || 255;
  const g = parseInt(hex.slice(3, 5), 16) || 255;
  const b = parseInt(hex.slice(5, 7), 16) || 255;
  return `rgba(${r},${g},${b},${alpha})`;
};

const getBackgroundImageStyle = (content: PostContent): React.CSSProperties => {
  const bgCoverage = content.background?.coverage || "full";
  const bgCoveragePercent = content.background?.coveragePercent || 50;
  if (bgCoverage === "full") return { inset: 0 };
  const percent = `${bgCoveragePercent}%`;
  switch (bgCoverage) {
    case "top": return { top: 0, left: 0, right: 0, height: percent };
    case "bottom": return { bottom: 0, left: 0, right: 0, height: percent };
    case "left": return { top: 0, bottom: 0, left: 0, width: percent };
    case "right": return { top: 0, bottom: 0, right: 0, width: percent };
    case "middle": {
      const gap = (100 - bgCoveragePercent) / 2;
      return { top: `${gap}%`, left: 0, right: 0, height: percent };
    }
    default: return { inset: 0 };
  }
};

interface InstagramPostSceneProps {
  content: PostContent;
  width: number;
  height: number;
  /** If provided, elements with visibility[key]=false will be hidden (for animation). */
  elementVisibility?: Record<string, boolean>;
  /** Optional style overrides per animated element (for animation effects). */
  elementStyles?: Record<string, React.CSSProperties>;
  /** Hide drag labels (for export). Default true. */
  hideDragLabels?: boolean;
}

/**
 * Pure presentational renderer for an Instagram post.
 * No drag interaction, no export logic — just the visual scene.
 */
export const InstagramPostScene = React.forwardRef<HTMLDivElement, InstagramPostSceneProps>(
  ({ content, width, height, elementVisibility, elementStyles, hideDragLabels = true }, ref) => {
    const bgStyle = content.background?.style || content.backgroundStyle || "dark-gradient";
    const bgConfig = getBackgroundConfig(bgStyle);
    const bgImage = content.background?.image || content.backgroundImage;
    const bgOpacity = content.background?.opacity ?? 30;
    const colors = content.textStyles?.colors || { headline: "#00d4ff", subheadline: "#6366f1", body: "#e6e6e6" };
    const alignments = content.textStyles?.alignments || { headline: "center", subheadline: "center", body: "center" };
    const rotations = content.textStyles?.rotations || { headline: 0, sections: [0] };

    const isVisible = (key: string) => !elementVisibility || elementVisibility[key] !== false;
    const getElStyle = (key: string): React.CSSProperties => elementStyles?.[key] || {};

    return (
      <div
        ref={ref}
        style={{
          width,
          height,
          position: "relative",
          overflow: "hidden",
          fontFamily: "'Poppins', sans-serif",
        }}
      >
        {/* Background gradient */}
        {bgStyle === "custom-image" && bgImage && content.background?.coverage === "middle" && (
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, #0d1b3e 0%, #1a1a2e 50%, #0d1b3e 100%)" }} />
        )}

        {bgStyle === "custom-image" && bgImage && (
          <>
            <div
              style={{
                position: "absolute",
                ...getBackgroundImageStyle(content),
                backgroundImage: `url(${bgImage})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            />
            {bgOpacity > 0 && (
              <div
                style={{
                  position: "absolute",
                  ...getBackgroundImageStyle(content),
                  backgroundColor: `rgba(0,0,0,${bgOpacity / 100})`,
                }}
              />
            )}
          </>
        )}

        {bgStyle !== "custom-image" && (
          <div style={{ position: "absolute", inset: 0, background: bgConfig.mainGradient }} />
        )}
        {bgStyle !== "custom-image" && (
          <div style={{ position: "absolute", inset: 0, background: bgConfig.overlay }} />
        )}

        {/* Logo & Brand */}
        {isVisible("logo") && ((content.showLogo ?? true) || (content.showBrandName ?? true)) && (() => {
          const logoScale = content.logoSettings?.scale ?? 1;
          const logoX = content.logoSettings?.position?.x ?? 10;
          const logoY = content.logoSettings?.position?.y ?? 5;
          const baseLogoSize = 56;
          const scaledLogoSize = baseLogoSize * logoScale;
          const scaledFontSize = 28 * logoScale;
          return (
            <div
              data-brand-container
              style={{
                position: "absolute",
                left: `${logoX}%`,
                top: `${logoY}%`,
                zIndex: 10,
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                gap: 8 * logoScale,
                ...getElStyle("logo"),
              }}
            >
              {(content.showLogo ?? true) && (
                <img
                  data-brand-logo
                  src={partyPantherLogo}
                  alt="Party Panther logo"
                  width={scaledLogoSize}
                  height={scaledLogoSize}
                  crossOrigin="anonymous"
                  loading="eager"
                  decoding="async"
                  style={{
                    width: scaledLogoSize,
                    height: scaledLogoSize,
                    minWidth: scaledLogoSize,
                    minHeight: scaledLogoSize,
                    objectFit: "contain",
                    filter: "drop-shadow(0 0 12px rgba(0, 207, 255, 0.4))",
                    display: "block",
                    flexShrink: 0,
                  }}
                />
              )}
              {(content.showBrandName ?? true) && (
                <span
                  data-brand-text
                  style={{
                    fontSize: scaledFontSize,
                    fontWeight: 800,
                    background: "linear-gradient(to right, #00CFFF, #4F8EFF)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                    whiteSpace: "nowrap",
                    filter: "drop-shadow(0 0 12px rgba(0, 207, 255, 0.4))",
                    display: "flex",
                    alignItems: "center",
                    height: scaledLogoSize,
                    lineHeight: 1,
                  }}
                >
                  Party Panther
                </span>
              )}
            </div>
          );
        })()}

        {/* Headline */}
        {isVisible("headline") && content.headline && (
          <div
            style={{
              position: "absolute",
              top: `${content.positions?.headline?.y || 30}%`,
              left: `${content.positions?.headline?.x || 50}%`,
              transform: `translate(-50%, -50%) rotate(${rotations.headline}deg)`,
              width: width - 128,
              textAlign: alignments.headline as any,
              zIndex: content.zIndex?.headline || 5,
              ...getElStyle("headline"),
            }}
          >
            <div
              style={{
                fontSize: content.fontSizes?.headline || 72,
                fontWeight: 700,
                fontFamily: `'${content.fonts?.headline || "Poppins"}', sans-serif`,
                lineHeight: 1.2,
                color: colors.headline,
                whiteSpace: "pre-line",
                ...getTextStyle("headline", content),
              }}
            >
              {content.headline}
            </div>
          </div>
        )}

        {/* Sections */}
        {content.sections.map((section, index) => {
          if (!isVisible(`section-${index}`)) return null;
          const dColor = content.dividerColor || "#ffffff";
          const dWidth = `${content.dividerWidth ?? 60}%`;
          const dThickness = content.dividerThickness ?? 2;
          const dStyle = content.dividerStyle || "line";
          const dGlow = content.dividerGlow ?? false;
          const dGlowIntensity = content.dividerGlowIntensity ?? 8;

          const boxEnabled = content.sectionBoxes ?? false;
          const boxColor = content.sectionBoxColor || "#ffffff";
          const boxOpacity = (content.sectionBoxOpacity ?? 15) / 100;
          const boxRadius = content.sectionBoxRadius ?? 12;
          const boxPadding = content.sectionBoxPadding ?? 24;
          const boxStyleVal = content.sectionBoxStyle || "border-only";
          const borderWidth = content.sectionBoxBorderWidth ?? 2;
          const showGlow = content.sectionBoxGlow ?? false;
          const glowIntensity = content.sectionBoxGlowIntensity ?? 10;

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
          } : {};

          return (
            <div
              key={index}
              style={{
                position: "absolute",
                top: `${content.positions?.sections?.[index]?.y || 50 + index * 15}%`,
                left: `${content.positions?.sections?.[index]?.x || 50}%`,
                transform: `translate(-50%, -50%) rotate(${rotations.sections?.[index] || 0}deg)`,
                width: width - 128,
                textAlign: alignments.subheadline as any,
                zIndex: content.zIndex?.sections?.[index] || 3,
                ...getElStyle(`section-${index}`),
              }}
            >
              {/* Divider */}
              {content.showDividers && (() => {
                if (dStyle === "dashed" || dStyle === "dotted" || dStyle === "double") {
                  return (
                    <div
                      style={{
                        width: dWidth,
                        borderTop: `${dThickness}px ${dStyle === "double" ? "double" : dStyle} ${dColor}80`,
                        margin: "0 auto",
                        marginBottom: 20,
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
                      background: `linear-gradient(90deg, transparent 0%, ${dColor}80 20%, ${dColor} 50%, ${dColor}80 80%, transparent 100%)`,
                      margin: "0 auto",
                      marginBottom: 20,
                      ...(dGlow ? { boxShadow: `0 0 ${dGlowIntensity}px ${dColor}60, 0 0 ${dGlowIntensity * 2}px ${dColor}30` } : {}),
                    }}
                  />
                );
              })()}
              {/* Section box */}
              <div style={wrapperStyle}>
                {section.subheadline && (
                  <div
                    style={{
                      fontSize: content.fontSizes?.subheadline || 48,
                      fontWeight: 600,
                      fontFamily: `'${content.fonts?.subheadline || "Poppins"}', sans-serif`,
                      color: colors.subheadline,
                      lineHeight: 1.3,
                      marginBottom: 12,
                      whiteSpace: "pre-line",
                      ...getTextStyle("subheadline", content),
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
                      textAlign: alignments.body as any,
                      whiteSpace: "pre-line",
                      ...getTextStyle("body", content),
                    }}
                  >
                    {section.body}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* QR Code */}
        {content.qrCode?.enabled && content.qrCode.url && isVisible("qrcode") && (
          <div
            style={{
              position: "absolute",
              left: `${content.qrCode.position?.x || 90}%`,
              top: `${content.qrCode.position?.y || 90}%`,
              transform: "translate(-50%, -50%)",
              zIndex: 10,
              ...getElStyle("qrcode"),
            }}
          >
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=${content.qrCode.size}x${content.qrCode.size}&data=${encodeURIComponent(content.qrCode.url)}&bgcolor=000000&color=ffffff`}
              alt="QR Code"
              width={content.qrCode.size}
              height={content.qrCode.size}
              crossOrigin="anonymous"
            />
          </div>
        )}
      </div>
    );
  },
);

InstagramPostScene.displayName = "InstagramPostScene";
