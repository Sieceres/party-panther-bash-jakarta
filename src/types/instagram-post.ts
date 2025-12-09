export type PostFormat = "square" | "story";
export type BackgroundStyle = "dark-gradient" | "neon-accent" | "party-vibe";

export interface PostContent {
  headline: string;
  subheadline: string;
  body: string;
  format: PostFormat;
  backgroundStyle: BackgroundStyle;
  showLogo: boolean;
}
