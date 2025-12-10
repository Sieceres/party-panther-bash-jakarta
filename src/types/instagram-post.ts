export type PostFormat = "square" | "portrait" | "story";
export type BackgroundStyle = "dark-gradient" | "hero-style" | "neon-accent";
export type FontFamily = "Poppins" | "Inter" | "Montserrat" | "Playfair Display" | "Bebas Neue" | "Oswald";

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

export interface PostContent {
  headline: string;
  sections: ContentSection[];
  format: PostFormat;
  backgroundStyle: BackgroundStyle;
  showLogo: boolean;
  fonts: FontSettings;
  fontSizes: FontSizeSettings;
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

export const DEFAULT_POST_CONTENT: PostContent = {
  headline: "",
  sections: [{ subheadline: "", body: "" }],
  format: "square",
  backgroundStyle: "dark-gradient",
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
};
