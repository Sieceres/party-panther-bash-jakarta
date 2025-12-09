import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import type { PostContent, PostFormat, BackgroundStyle, ContentSection } from "@/types/instagram-post";

interface PostEditorProps {
  content: PostContent;
  onChange: (content: PostContent) => void;
}

export const PostEditor = ({ content, onChange }: PostEditorProps) => {
  const updateField = <K extends keyof PostContent>(field: K, value: PostContent[K]) => {
    onChange({ ...content, [field]: value });
  };

  const updateSection = (index: number, field: keyof ContentSection, value: string) => {
    const newSections = [...content.sections];
    newSections[index] = { ...newSections[index], [field]: value };
    onChange({ ...content, sections: newSections });
  };

  const addSection = () => {
    onChange({
      ...content,
      sections: [...content.sections, { subheadline: "", body: "" }],
    });
  };

  const removeSection = (index: number) => {
    const newSections = content.sections.filter((_, i) => i !== index);
    onChange({ ...content, sections: newSections });
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

        {/* Content Sections */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Content Sections</Label>
            <Button variant="outline" size="sm" onClick={addSection}>
              <Plus className="w-4 h-4 mr-1" />
              Add Section
            </Button>
          </div>

          {content.sections.map((section, index) => (
            <div key={index} className="p-4 border rounded-lg space-y-4 bg-muted/30">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">
                  Section {index + 1}
                </span>
                {content.sections.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeSection(index)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>

              {/* Sub-headline */}
              <div className="space-y-2">
                <Label htmlFor={`subheadline-${index}`}>Sub-headline</Label>
                <Input
                  id={`subheadline-${index}`}
                  value={section.subheadline}
                  onChange={(e) => updateSection(index, "subheadline", e.target.value)}
                  placeholder="Secondary text..."
                  maxLength={150}
                />
                <p className="text-xs text-muted-foreground">{section.subheadline.length}/150</p>
              </div>

              {/* Body Text */}
              <div className="space-y-2">
                <Label htmlFor={`body-${index}`}>Body Text</Label>
                <Textarea
                  id={`body-${index}`}
                  value={section.body}
                  onChange={(e) => updateSection(index, "body", e.target.value)}
                  placeholder="Additional details..."
                  maxLength={300}
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">{section.body.length}/300</p>
              </div>
            </div>
          ))}
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
