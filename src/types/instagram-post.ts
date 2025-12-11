export type PostFormat = "square" | "portrait" | "story";
export type BackgroundStyle = "dark-gradient" | "hero-style" | "neon-accent" | "custom-image";
export type FontFamily = "Poppins" | "Inter" | "Montserrat" | "Playfair Display" | "Bebas Neue" | "Oswald";
export type TextAlignment = "left" | "center" | "right";

export interface ContentSection {
  subheadline: string;
  body: string;
}

export interface FontSettings {
  headline: FontFamily;
  subheadline: FontFamily;
  body: FontFamily;
}

export interface FontSizeSettings {
  headline: number;
  subheadline: number;
  body: number;
}

export interface ElementPosition {
  x: number; // percentage 0-100
  y: number; // percentage 0-100
}

export interface PositionSettings {
  headline: ElementPosition;
  sections: ElementPosition[];
}

export interface ColorSettings {
  headline: string;
  subheadline: string;
  body: string;
}

export interface TextShadowSettings {
  enabled: boolean;
  color: string;
  blur: number;
  offsetX: number;
  offsetY: number;
}

export interface TextStrokeSettings {
  enabled: boolean;
  color: string;
  width: number;
}

export interface TextStyleSettings {
  colors: ColorSettings;
  shadows: {
    headline: TextShadowSettings;
    subheadline: TextShadowSettings;
    body: TextShadowSettings;
  };
  strokes: {
    headline: TextStrokeSettings;
    subheadline: TextStrokeSettings;
    body: TextStrokeSettings;
  };
  alignments: {
    headline: TextAlignment;
    subheadline: TextAlignment;
    body: TextAlignment;
  };
  rotations: {
    headline: number;
    sections: number[];
  };
}

export interface BackgroundSettings {
  style: BackgroundStyle;
  image?: string;
  opacity: number; // 0-100 for overlay darkness
}

export interface QRCodeSettings {
  enabled: boolean;
  url: string;
  size: number;
  position: ElementPosition;
}

// Legacy compatibility - textPosition
export interface TextPosition {
  x: number;
  y: number;
}

export interface PostContent {
  headline: string;
  sections: ContentSection[];
  format: PostFormat;
  background: BackgroundSettings;
  showLogo: boolean;
  fonts: FontSettings;
  fontSizes: FontSizeSettings;
  positions: PositionSettings;
  textStyles: TextStyleSettings;
  zIndex: {
    headline: number;
    sections: number[];
  };
  qrCode?: QRCodeSettings;
  // Legacy compatibility
  backgroundStyle?: BackgroundStyle;
  backgroundImage?: string;
  textPosition?: TextPosition;
}

export interface SavedPost {
  id: string;
  created_by: string;
  title: string;
  status: 'draft' | 'published';
  content_url: string;
  thumbnail_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface PostTemplate {
  id: string;
  created_by: string;
  name: string;
  description?: string;
  thumbnail_url?: string;
  settings_url: string;
  is_public: boolean;
  created_at: string;
}

export interface CarouselPost {
  id: string;
  slides: PostContent[];
  currentSlide: number;
}

// Color presets
export const COLOR_PRESETS = {
  partyPanther: {
    headline: "#00d4ff",
    subheadline: "#6366f1",
    body: "#e6e6e6",
  },
  neonNights: {
    headline: "#ff00ff",
    subheadline: "#00ffff",
    body: "#ffffff",
  },
  elegant: {
    headline: "#d4af37",
    subheadline: "#c0c0c0",
    body: "#f5f5f5",
  },
  bold: {
    headline: "#ff4444",
    subheadline: "#ffaa00",
    body: "#ffffff",
  },
  tropical: {
    headline: "#00ff88",
    subheadline: "#ff6b6b",
    body: "#fffacd",
  },
  midnight: {
    headline: "#9b59b6",
    subheadline: "#3498db",
    body: "#ecf0f1",
  },
};

// Default shadow settings
export const DEFAULT_SHADOW: TextShadowSettings = {
  enabled: false,
  color: "rgba(0, 0, 0, 0.5)",
  blur: 10,
  offsetX: 0,
  offsetY: 4,
};

// Default stroke settings
export const DEFAULT_STROKE: TextStrokeSettings = {
  enabled: false,
  color: "#000000",
  width: 2,
};

// Default QR code settings
export const DEFAULT_QR_CODE: QRCodeSettings = {
  enabled: false,
  url: "",
  size: 120,
  position: { x: 90, y: 90 },
};

export const DEFAULT_POST_CONTENT: PostContent = {
  headline: "",
  sections: [{ subheadline: "", body: "" }],
  format: "square",
  background: {
    style: "dark-gradient",
    opacity: 30,
  },
  showLogo: true,
  fonts: {
    headline: "Poppins",
    subheadline: "Poppins",
    body: "Poppins",
  },
  fontSizes: {
    headline: 72,
    subheadline: 48,
    body: 32,
  },
  positions: {
    headline: { x: 50, y: 30 },
    sections: [{ x: 50, y: 60 }],
  },
  textStyles: {
    colors: {
      headline: "#00d4ff",
      subheadline: "#6366f1",
      body: "#e6e6e6",
    },
    shadows: {
      headline: { ...DEFAULT_SHADOW, enabled: true, color: "rgba(0, 212, 255, 0.4)", blur: 30 },
      subheadline: { ...DEFAULT_SHADOW, enabled: true, color: "rgba(99, 102, 241, 0.4)", blur: 20 },
      body: { ...DEFAULT_SHADOW, enabled: true, color: "rgba(0, 0, 0, 0.5)", blur: 4, offsetY: 2 },
    },
    strokes: {
      headline: { ...DEFAULT_STROKE },
      subheadline: { ...DEFAULT_STROKE },
      body: { ...DEFAULT_STROKE },
    },
    alignments: {
      headline: "center",
      subheadline: "center",
      body: "center",
    },
    rotations: {
      headline: 0,
      sections: [0],
    },
  },
  zIndex: {
    headline: 2,
    sections: [1],
  },
  qrCode: DEFAULT_QR_CODE,
  // Legacy
  textPosition: { x: 50, y: 50 },
};

// Helper to migrate legacy content to new format
export function migratePostContent(content: any): PostContent {
  // If already has new format, return as-is
  if (content.background && content.positions && content.textStyles) {
    return content as PostContent;
  }

  // Migrate from legacy format
  return {
    ...DEFAULT_POST_CONTENT,
    headline: content.headline || "",
    sections: content.sections || [{ subheadline: "", body: "" }],
    format: content.format || "square",
    background: {
      style: content.backgroundStyle || "dark-gradient",
      image: content.backgroundImage,
      opacity: 30,
    },
    showLogo: content.showLogo ?? true,
    fonts: content.fonts || DEFAULT_POST_CONTENT.fonts,
    fontSizes: content.fontSizes || DEFAULT_POST_CONTENT.fontSizes,
    positions: {
      headline: { x: content.textPosition?.x || 50, y: (content.textPosition?.y || 50) - 20 },
      sections: content.sections?.map(() => ({ 
        x: content.textPosition?.x || 50, 
        y: (content.textPosition?.y || 50) + 10 
      })) || [{ x: 50, y: 60 }],
    },
    textStyles: DEFAULT_POST_CONTENT.textStyles,
    zIndex: {
      headline: 2,
      sections: content.sections?.map((_: any, i: number) => i + 1) || [1],
    },
    // Keep legacy for compatibility
    backgroundStyle: content.backgroundStyle,
    backgroundImage: content.backgroundImage,
    textPosition: content.textPosition,
  };
}
