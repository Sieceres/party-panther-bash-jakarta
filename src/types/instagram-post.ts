export type PostFormat = "square" | "story";
export type BackgroundStyle = "dark-gradient" | "neon-accent" | "party-vibe";

export interface ContentSection {
  subheadline: string;
  body: string;
}

export interface PostContent {
  headline: string;
  sections: ContentSection[];
  format: PostFormat;
  backgroundStyle: BackgroundStyle;
  showLogo: boolean;
}
