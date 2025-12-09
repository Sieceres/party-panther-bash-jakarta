import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Plus, Trash2 } from "lucide-react";
import type { PostContent, PostFormat, BackgroundStyle, ContentSection, FontFamily } from "@/types/instagram-post";

interface PostEditorProps {
  content: PostContent;
  onChange: (content: PostContent) => void;
}

const FONT_OPTIONS: { value: FontFamily; label: string }[] = [
  { value: "Poppins", label: "Poppins" },
  { value: "Inter", label: "Inter" },
  { value: "Montserrat", label: "Montserrat" },
  { value: "Playfair Display", label: "Playfair Display" },
  { value: "Bebas Neue", label: "Bebas Neue" },
  { value: "Oswald", label: "Oswald" },
];

export const PostEditor = ({ content, onChange }: PostEditorProps) => {
  const updateField = <K extends keyof PostContent>(field: K, value: PostContent[K]) => {
    onChange({ ...content, [field]: value });
  };

  const updateFont = (field: keyof PostContent["fonts"], value: FontFamily) => {
    onChange({
      ...content,
      fonts: { ...content.fonts, [field]: value },
    });
  };

  const updateFontSize = (field: keyof PostContent["fontSizes"], value: number) => {
    onChange({
      ...content,
      fontSizes: { ...content.fontSizes, [field]: value },
    });
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
              <SelectItem value="hero-style">Hero Style (Floating Glows)</SelectItem>
              <SelectItem value="neon-accent">Neon Accent</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Font Settings */}
        <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
          <Label className="text-sm font-medium">Font Settings</Label>
          
          {/* Font Family Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="font-headline" className="text-xs text-muted-foreground">Headline Font</Label>
              <Select
                value={content.fonts.headline}
                onValueChange={(value: FontFamily) => updateFont("headline", value)}
              >
                <SelectTrigger id="font-headline" className="text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FONT_OPTIONS.map((font) => (
                    <SelectItem key={font.value} value={font.value} style={{ fontFamily: font.value }}>
                      {font.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="font-subheadline" className="text-xs text-muted-foreground">Sub-headline Font</Label>
              <Select
                value={content.fonts.subheadline}
                onValueChange={(value: FontFamily) => updateFont("subheadline", value)}
              >
                <SelectTrigger id="font-subheadline" className="text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FONT_OPTIONS.map((font) => (
                    <SelectItem key={font.value} value={font.value} style={{ fontFamily: font.value }}>
                      {font.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="font-body" className="text-xs text-muted-foreground">Body Font</Label>
              <Select
                value={content.fonts.body}
                onValueChange={(value: FontFamily) => updateFont("body", value)}
              >
                <SelectTrigger id="font-body" className="text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FONT_OPTIONS.map((font) => (
                    <SelectItem key={font.value} value={font.value} style={{ fontFamily: font.value }}>
                      {font.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Font Size Controls */}
          <div className="space-y-4 pt-2 border-t border-border/50">
            <Label className="text-xs text-muted-foreground">Font Sizes</Label>
            
            <div className="space-y-3">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label className="text-xs">Headline: {content.fontSizes.headline}px</Label>
                </div>
                <Slider
                  value={[content.fontSizes.headline]}
                  onValueChange={([value]) => updateFontSize("headline", value)}
                  min={32}
                  max={120}
                  step={2}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label className="text-xs">Sub-headline: {content.fontSizes.subheadline}px</Label>
                </div>
                <Slider
                  value={[content.fontSizes.subheadline]}
                  onValueChange={([value]) => updateFontSize("subheadline", value)}
                  min={20}
                  max={80}
                  step={2}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label className="text-xs">Body: {content.fontSizes.body}px</Label>
                </div>
                <Slider
                  value={[content.fontSizes.body]}
                  onValueChange={([value]) => updateFontSize("body", value)}
                  min={16}
                  max={56}
                  step={2}
                  className="w-full"
                />
              </div>
            </div>
          </div>
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
