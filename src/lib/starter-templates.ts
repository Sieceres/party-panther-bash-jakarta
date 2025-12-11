import { PostContent, DEFAULT_SHADOW, DEFAULT_STROKE } from "@/types/instagram-post";

// Helper to create default content with overrides
const createTemplate = (overrides: Partial<PostContent>): PostContent => ({
  headline: "",
  sections: [],
  format: "square",
  background: {
    style: "dark-gradient",
    opacity: 30,
  },
  showLogo: true,
  fonts: {
    headline: "Playfair Display",
    subheadline: "Inter",
    body: "Inter",
  },
  fontSizes: {
    headline: 48,
    subheadline: 24,
    body: 18,
  },
  positions: {
    headline: { x: 50, y: 25 },
    sections: [],
  },
  textStyles: {
    colors: {
      headline: "#ffffff",
      subheadline: "#ffffff",
      body: "#ffffff",
    },
    shadows: {
      headline: { ...DEFAULT_SHADOW },
      subheadline: { ...DEFAULT_SHADOW },
      body: { ...DEFAULT_SHADOW },
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
      sections: [],
    },
  },
  zIndex: {
    headline: 10,
    sections: [],
  },
  ...overrides,
});

export const STARTER_TEMPLATES: Array<{
  name: string;
  description: string;
  settings: PostContent;
}> = [
  {
    name: "Party Announcement",
    description: "Bold headline with neon accents - perfect for club nights and parties",
    settings: createTemplate({
      headline: "PARTY NIGHT",
      sections: [
        { subheadline: "SATURDAY • 10PM", body: "Join us for an unforgettable night" },
      ],
      background: { style: "neon-accent", opacity: 40 },
      fonts: { headline: "Bebas Neue", subheadline: "Inter", body: "Inter" },
      fontSizes: { headline: 64, subheadline: 28, body: 18 },
      positions: {
        headline: { x: 50, y: 35 },
        sections: [{ x: 50, y: 60 }],
      },
      textStyles: {
        colors: { headline: "#ff00ff", subheadline: "#ffffff", body: "#ffffff" },
        shadows: {
          headline: { enabled: true, color: "#ff00ff", blur: 20, offsetX: 0, offsetY: 0 },
          subheadline: { ...DEFAULT_SHADOW },
          body: { ...DEFAULT_SHADOW },
        },
        strokes: {
          headline: { ...DEFAULT_STROKE },
          subheadline: { ...DEFAULT_STROKE },
          body: { ...DEFAULT_STROKE },
        },
        alignments: { headline: "center", subheadline: "center", body: "center" },
        rotations: { headline: 0, sections: [0] },
      },
      zIndex: { headline: 10, sections: [9] },
    }),
  },
  {
    name: "Elegant Event",
    description: "Sophisticated design with serif fonts - ideal for upscale venues",
    settings: createTemplate({
      headline: "An Evening to Remember",
      sections: [
        { subheadline: "December 31st, 2024", body: "Dress code: Black tie" },
      ],
      background: { style: "hero-style", opacity: 50 },
      fonts: { headline: "Playfair Display", subheadline: "Inter", body: "Inter" },
      fontSizes: { headline: 42, subheadline: 22, body: 16 },
      positions: {
        headline: { x: 50, y: 40 },
        sections: [{ x: 50, y: 62 }],
      },
      textStyles: {
        colors: { headline: "#ffd700", subheadline: "#ffffff", body: "#e0e0e0" },
        shadows: {
          headline: { enabled: true, color: "#000000", blur: 8, offsetX: 2, offsetY: 2 },
          subheadline: { ...DEFAULT_SHADOW },
          body: { ...DEFAULT_SHADOW },
        },
        strokes: {
          headline: { ...DEFAULT_STROKE },
          subheadline: { ...DEFAULT_STROKE },
          body: { ...DEFAULT_STROKE },
        },
        alignments: { headline: "center", subheadline: "center", body: "center" },
        rotations: { headline: 0, sections: [0] },
      },
      zIndex: { headline: 10, sections: [9] },
    }),
  },
  {
    name: "Minimalist",
    description: "Clean and simple with lots of breathing room",
    settings: createTemplate({
      headline: "Less is More",
      sections: [
        { subheadline: "", body: "Simple. Clean. Effective." },
      ],
      background: { style: "dark-gradient", opacity: 0 },
      fonts: { headline: "Inter", subheadline: "Inter", body: "Inter" },
      fontSizes: { headline: 36, subheadline: 20, body: 16 },
      positions: {
        headline: { x: 50, y: 45 },
        sections: [{ x: 50, y: 60 }],
      },
      textStyles: {
        colors: { headline: "#ffffff", subheadline: "#a0a0a0", body: "#a0a0a0" },
        shadows: {
          headline: { ...DEFAULT_SHADOW },
          subheadline: { ...DEFAULT_SHADOW },
          body: { ...DEFAULT_SHADOW },
        },
        strokes: {
          headline: { ...DEFAULT_STROKE },
          subheadline: { ...DEFAULT_STROKE },
          body: { ...DEFAULT_STROKE },
        },
        alignments: { headline: "center", subheadline: "center", body: "center" },
        rotations: { headline: 0, sections: [0] },
      },
      zIndex: { headline: 10, sections: [9] },
    }),
  },
  {
    name: "Neon Vibes",
    description: "High contrast neon colors with glow effects",
    settings: createTemplate({
      headline: "NEON NIGHTS",
      sections: [
        { subheadline: "GLOW WITH US", body: "Where the music never stops" },
      ],
      background: { style: "dark-gradient", opacity: 0 },
      fonts: { headline: "Bebas Neue", subheadline: "Oswald", body: "Inter" },
      fontSizes: { headline: 56, subheadline: 24, body: 16 },
      positions: {
        headline: { x: 50, y: 35 },
        sections: [{ x: 50, y: 58 }],
      },
      textStyles: {
        colors: { headline: "#00ffff", subheadline: "#ff00ff", body: "#ffffff" },
        shadows: {
          headline: { enabled: true, color: "#00ffff", blur: 30, offsetX: 0, offsetY: 0 },
          subheadline: { enabled: true, color: "#ff00ff", blur: 20, offsetX: 0, offsetY: 0 },
          body: { ...DEFAULT_SHADOW },
        },
        strokes: {
          headline: { ...DEFAULT_STROKE },
          subheadline: { ...DEFAULT_STROKE },
          body: { ...DEFAULT_STROKE },
        },
        alignments: { headline: "center", subheadline: "center", body: "center" },
        rotations: { headline: 0, sections: [0] },
      },
      zIndex: { headline: 10, sections: [9] },
    }),
  },
  {
    name: "Story Format",
    description: "Vertical layout optimized for Instagram Stories",
    settings: createTemplate({
      headline: "SWIPE UP",
      sections: [
        { subheadline: "FOR MORE INFO", body: "Don't miss out on this amazing event!" },
      ],
      format: "story",
      background: { style: "hero-style", opacity: 40 },
      fonts: { headline: "Bebas Neue", subheadline: "Montserrat", body: "Inter" },
      fontSizes: { headline: 52, subheadline: 26, body: 18 },
      positions: {
        headline: { x: 50, y: 40 },
        sections: [{ x: 50, y: 55 }],
      },
      textStyles: {
        colors: { headline: "#ffffff", subheadline: "#ffffff", body: "#ffffff" },
        shadows: {
          headline: { enabled: true, color: "#000000", blur: 10, offsetX: 0, offsetY: 4 },
          subheadline: { ...DEFAULT_SHADOW },
          body: { ...DEFAULT_SHADOW },
        },
        strokes: {
          headline: { ...DEFAULT_STROKE },
          subheadline: { ...DEFAULT_STROKE },
          body: { ...DEFAULT_STROKE },
        },
        alignments: { headline: "center", subheadline: "center", body: "center" },
        rotations: { headline: 0, sections: [0] },
      },
      zIndex: { headline: 10, sections: [9] },
    }),
  },
  {
    name: "Bold Announcement",
    description: "High-impact design with outlined text for maximum visibility",
    settings: createTemplate({
      headline: "BIG NEWS",
      sections: [
        { subheadline: "SOMETHING AMAZING IS COMING", body: "Stay tuned for the reveal" },
      ],
      background: { style: "neon-accent", opacity: 30 },
      fonts: { headline: "Bebas Neue", subheadline: "Oswald", body: "Inter" },
      fontSizes: { headline: 72, subheadline: 22, body: 16 },
      positions: {
        headline: { x: 50, y: 40 },
        sections: [{ x: 50, y: 65 }],
      },
      textStyles: {
        colors: { headline: "#ffffff", subheadline: "#ffffff", body: "#e0e0e0" },
        shadows: {
          headline: { ...DEFAULT_SHADOW },
          subheadline: { ...DEFAULT_SHADOW },
          body: { ...DEFAULT_SHADOW },
        },
        strokes: {
          headline: { enabled: true, color: "#000000", width: 4 },
          subheadline: { ...DEFAULT_STROKE },
          body: { ...DEFAULT_STROKE },
        },
        alignments: { headline: "center", subheadline: "center", body: "center" },
        rotations: { headline: 0, sections: [0] },
      },
      zIndex: { headline: 10, sections: [9] },
    }),
  },
];
