import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { PostContent, PostFormat, BackgroundStyle } from "@/types/instagram-post";

interface PostEditorProps {
  content: PostContent;
  onChange: (content: PostContent) => void;
}

export const PostEditor = ({ content, onChange }: PostEditorProps) => {
  const updateField = <K extends keyof PostContent>(field: K, value: PostContent[K]) => {
    onChange({ ...content, [field]: value });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Post Content</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Format Selector */}
        <div className="space-y-2">
          <Label htmlFor="format">Format</Label>
          <Select
            value={content.format}
            onValueChange={(value: PostFormat) => updateField("format", value)}
          >
            <SelectTrigger id="format">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="square">Square (1:1) - Feed Post</SelectItem>
              <SelectItem value="story">Story (9:16) - Stories/Reels</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Background Style */}
        <div className="space-y-2">
          <Label htmlFor="background">Background Style</Label>
          <Select
            value={content.backgroundStyle}
            onValueChange={(value: BackgroundStyle) => updateField("backgroundStyle", value)}
          >
            <SelectTrigger id="background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="dark-gradient">Dark Gradient</SelectItem>
              <SelectItem value="neon-accent">Neon Accent</SelectItem>
              <SelectItem value="party-vibe">Party Vibe</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Headline */}
        <div className="space-y-2">
          <Label htmlFor="headline">Headline</Label>
          <Input
            id="headline"
            value={content.headline}
            onChange={(e) => updateField("headline", e.target.value)}
            placeholder="Main headline text..."
            maxLength={100}
          />
          <p className="text-xs text-muted-foreground">{content.headline.length}/100</p>
        </div>

        {/* Sub-headline */}
        <div className="space-y-2">
          <Label htmlFor="subheadline">Sub-headline</Label>
          <Input
            id="subheadline"
            value={content.subheadline}
            onChange={(e) => updateField("subheadline", e.target.value)}
            placeholder="Secondary text..."
            maxLength={150}
          />
          <p className="text-xs text-muted-foreground">{content.subheadline.length}/150</p>
        </div>

        {/* Body Text */}
        <div className="space-y-2">
          <Label htmlFor="body">Body Text</Label>
          <Textarea
            id="body"
            value={content.body}
            onChange={(e) => updateField("body", e.target.value)}
            placeholder="Additional details..."
            maxLength={300}
            rows={4}
          />
          <p className="text-xs text-muted-foreground">{content.body.length}/300</p>
        </div>

        {/* Show Logo Toggle */}
        <div className="flex items-center justify-between">
          <Label htmlFor="showLogo">Show Logo & Brand Name</Label>
          <Switch
            id="showLogo"
            checked={content.showLogo}
            onCheckedChange={(checked) => updateField("showLogo", checked)}
          />
        </div>
      </CardContent>
    </Card>
  );
};
