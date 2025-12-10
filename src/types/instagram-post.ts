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
