import { useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Plus, Trash2, RotateCcw, Upload, X, Move } from "lucide-react";
import { ColorPicker, ColorPresets } from "./ColorPicker";
import { TextEffectsPanel } from "./TextEffectsPanel";
import { EmojiPicker } from "./EmojiPicker";
import { QRCodeSection } from "./QRCodeSection";
import { EventSelector } from "./EventSelector";
import { AISuggestions } from "./AISuggestions";
import type { 
  PostContent, 
  PostFormat, 
  BackgroundStyle, 
  BackgroundCoverage,
  ContentSection, 
  FontFamily,
  ColorSettings,
  TextShadowSettings,
  TextStrokeSettings,
  TextAlignment,
} from "@/types/instagram-post";

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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState("layout");

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

  const updateColor = (field: keyof ColorSettings, value: string) => {
    onChange({
      ...content,
      textStyles: {
        ...content.textStyles,
        colors: { ...content.textStyles.colors, [field]: value },
      },
    });
  };

  const updateShadow = (field: "headline" | "subheadline" | "body", shadow: TextShadowSettings) => {
    onChange({
      ...content,
      textStyles: {
        ...content.textStyles,
        shadows: { ...content.textStyles.shadows, [field]: shadow },
      },
    });
  };

  const updateStroke = (field: "headline" | "subheadline" | "body", stroke: TextStrokeSettings) => {
    onChange({
      ...content,
      textStyles: {
        ...content.textStyles,
        strokes: { ...content.textStyles.strokes, [field]: stroke },
      },
    });
  };

  const updateAlignment = (field: "headline" | "subheadline" | "body", alignment: TextAlignment) => {
    onChange({
      ...content,
      textStyles: {
        ...content.textStyles,
        alignments: { ...content.textStyles.alignments, [field]: alignment },
      },
    });
  };

  const updateRotation = (type: "headline" | "section", value: number, index?: number) => {
    if (type === "headline") {
      onChange({
        ...content,
        textStyles: {
          ...content.textStyles,
          rotations: { ...content.textStyles.rotations, headline: value },
        },
      });
    } else if (typeof index === "number") {
      const newRotations = [...content.textStyles.rotations.sections];
      newRotations[index] = value;
      onChange({
        ...content,
        textStyles: {
          ...content.textStyles,
          rotations: { ...content.textStyles.rotations, sections: newRotations },
        },
      });
    }
  };

  const updateSection = (index: number, field: keyof ContentSection, value: string) => {
    const newSections = [...content.sections];
    newSections[index] = { ...newSections[index], [field]: value };
    onChange({ ...content, sections: newSections });
  };

  const updateSectionPosition = (index: number, axis: "x" | "y", value: number) => {
    const newPositions = [...content.positions.sections];
    newPositions[index] = { ...newPositions[index], [axis]: value };
    onChange({
      ...content,
      positions: { ...content.positions, sections: newPositions },
    });
  };

  const updateHeadlinePosition = (axis: "x" | "y", value: number) => {
    onChange({
      ...content,
      positions: {
        ...content.positions,
        headline: { ...content.positions.headline, [axis]: value },
      },
    });
  };

  const addSection = () => {
    const newSections = [...content.sections, { subheadline: "", body: "" }];
    const newSectionPositions = [...content.positions.sections, { x: 50, y: 50 + content.sections.length * 15 }];
    const newSectionRotations = [...content.textStyles.rotations.sections, 0];
    const newSectionZIndex = [...content.zIndex.sections, content.sections.length + 1];
    
    onChange({
      ...content,
      sections: newSections,
      positions: { ...content.positions, sections: newSectionPositions },
      textStyles: {
        ...content.textStyles,
        rotations: { ...content.textStyles.rotations, sections: newSectionRotations },
      },
      zIndex: { ...content.zIndex, sections: newSectionZIndex },
    });
  };

  const removeSection = (index: number) => {
    if (content.sections.length <= 1) return;
    
    const newSections = content.sections.filter((_, i) => i !== index);
    const newSectionPositions = content.positions.sections.filter((_, i) => i !== index);
    const newSectionRotations = content.textStyles.rotations.sections.filter((_, i) => i !== index);
    const newSectionZIndex = content.zIndex.sections.filter((_, i) => i !== index);
    
    onChange({
      ...content,
      sections: newSections,
      positions: { ...content.positions, sections: newSectionPositions },
      textStyles: {
        ...content.textStyles,
        rotations: { ...content.textStyles.rotations, sections: newSectionRotations },
      },
      zIndex: { ...content.zIndex, sections: newSectionZIndex },
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onChange({
          ...content,
          background: {
            ...content.background,
            style: "custom-image",
            image: reader.result as string,
          },
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const clearBackgroundImage = () => {
    onChange({
      ...content,
      background: {
        ...content.background,
        style: "dark-gradient",
        image: undefined,
      },
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const insertEmoji = (emoji: string, field: "headline" | "subheadline" | "body", sectionIndex?: number) => {
    if (field === "headline") {
      onChange({ ...content, headline: content.headline + emoji });
    } else if (typeof sectionIndex === "number") {
      const newSections = [...content.sections];
      newSections[sectionIndex] = {
        ...newSections[sectionIndex],
        [field]: newSections[sectionIndex][field] + emoji,
      };
      onChange({ ...content, sections: newSections });
    }
  };

  const handleAutoFill = (updates: Partial<PostContent>) => {
    onChange({ ...content, ...updates });
  };

  return (
    <Card>
      <CardContent className="p-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full flex flex-wrap gap-1 h-auto p-1 mb-4">
            <TabsTrigger value="layout" className="text-xs px-3 py-1.5 flex-1 min-w-[60px]">Layout</TabsTrigger>
            <TabsTrigger value="content" className="text-xs px-3 py-1.5 flex-1 min-w-[60px]">Content</TabsTrigger>
            <TabsTrigger value="styling" className="text-xs px-3 py-1.5 flex-1 min-w-[60px]">Styling</TabsTrigger>
            <TabsTrigger value="effects" className="text-xs px-3 py-1.5 flex-1 min-w-[60px]">Effects</TabsTrigger>
            <TabsTrigger value="extras" className="text-xs px-3 py-1.5 flex-1 min-w-[60px]">Extras</TabsTrigger>
          </TabsList>

          {/* LAYOUT TAB */}
          <TabsContent value="layout" className="space-y-4 mt-0">
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
                  <SelectItem value="portrait">Portrait (4:5) - Feed Post</SelectItem>
                  <SelectItem value="story">Story (9:16) - Stories/Reels</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Background Style */}
            <div className="space-y-2">
              <Label htmlFor="background">Background Style</Label>
              <Select
                value={content.background.style}
                onValueChange={(value: BackgroundStyle) => {
                  if (value !== "custom-image") {
                    onChange({
                      ...content,
                      background: { ...content.background, style: value, image: undefined },
                    });
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }
                }}
              >
                <SelectTrigger id="background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dark-gradient">Dark Gradient</SelectItem>
                  <SelectItem value="hero-style">Hero Style (Floating Glows)</SelectItem>
                  <SelectItem value="neon-accent">Neon Accent</SelectItem>
                  {content.background.image && <SelectItem value="custom-image">Custom Image</SelectItem>}
                </SelectContent>
              </Select>
            </div>

            {/* Background Image Upload */}
            <div className="space-y-2">
              <Label>Background Image</Label>
              <div className="flex gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {content.background.image ? "Change Image" : "Upload Image"}
                </Button>
                {content.background.image && (
                  <Button variant="outline" size="icon" onClick={clearBackgroundImage}>
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
              {content.background.image && (
                <div className="space-y-4 p-3 border rounded-lg bg-muted/30">
                  <p className="text-xs text-muted-foreground">Custom background image active</p>
                  <div className="space-y-1">
                    <Label className="text-xs">Overlay Darkness: {content.background.opacity}%</Label>
                    <Slider
                      value={[content.background.opacity]}
                      onValueChange={([opacity]) => onChange({
                        ...content,
                        background: { ...content.background, opacity },
                      })}
                      min={0}
                      max={80}
                      step={5}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Image Coverage</Label>
                    <Select
                      value={content.background.coverage || "full"}
                      onValueChange={(value: BackgroundCoverage) => onChange({
                        ...content,
                        background: { ...content.background, coverage: value },
                      })}
                    >
                      <SelectTrigger className="text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="full">Full Cover</SelectItem>
                        <SelectItem value="top">Top Half</SelectItem>
                        <SelectItem value="bottom">Bottom Half</SelectItem>
                        <SelectItem value="left">Left Half</SelectItem>
                        <SelectItem value="right">Right Half</SelectItem>
                        <SelectItem value="middle">Middle (Stars Top & Bottom)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {content.background.coverage && content.background.coverage !== "full" && (
                    <div className="space-y-1">
                      <Label className="text-xs">Coverage Amount: {content.background.coveragePercent || 50}%</Label>
                      <Slider
                        value={[content.background.coveragePercent || 50]}
                        onValueChange={([coveragePercent]) => onChange({
                          ...content,
                          background: { ...content.background, coveragePercent },
                        })}
                        min={10}
                        max={90}
                        step={5}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Show Logo Toggle */}
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <Label htmlFor="showLogo">Show Logo & Brand Name</Label>
              <Switch
                id="showLogo"
                checked={content.showLogo ?? true}
                onCheckedChange={(checked) => updateField("showLogo", checked)}
              />
            </div>
          </TabsContent>

          {/* CONTENT TAB */}
          <TabsContent value="content" className="space-y-4 mt-0">
            {/* Headline */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="headline">Headline</Label>
                <EmojiPicker onSelect={(emoji) => insertEmoji(emoji, "headline")} />
              </div>
              <Input
                id="headline"
                value={content.headline}
                onChange={(e) => updateField("headline", e.target.value)}
                placeholder="Main headline text..."
                maxLength={100}
              />
              <p className="text-xs text-muted-foreground">{content.headline.length}/100</p>
              
              {/* Headline Position */}
              <div className="grid grid-cols-2 gap-2 p-2 bg-muted/20 rounded">
                <div className="space-y-1">
                  <Label className="text-xs flex items-center gap-1">
                    <Move className="w-3 h-3" /> X: {content.positions.headline.x}%
                  </Label>
                  <Slider
                    value={[content.positions.headline.x]}
                    onValueChange={([v]) => updateHeadlinePosition("x", v)}
                    min={10}
                    max={90}
                    step={1}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Y: {content.positions.headline.y}%</Label>
                  <Slider
                    value={[content.positions.headline.y]}
                    onValueChange={([v]) => updateHeadlinePosition("y", v)}
                    min={10}
                    max={90}
                    step={1}
                  />
                </div>
              </div>
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
                <div key={index} className="p-3 border rounded-lg space-y-3 bg-muted/30">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">
                      Section {index + 1}
                    </span>
                    {content.sections.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeSection(index)}
                        className="text-destructive hover:text-destructive h-7"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>

                  {/* Section Position */}
                  <div className="grid grid-cols-2 gap-2 p-2 bg-background/50 rounded">
                    <div className="space-y-1">
                      <Label className="text-xs flex items-center gap-1">
                        <Move className="w-3 h-3" /> X: {content.positions.sections[index]?.x || 50}%
                      </Label>
                      <Slider
                        value={[content.positions.sections[index]?.x || 50]}
                        onValueChange={([v]) => updateSectionPosition(index, "x", v)}
                        min={10}
                        max={90}
                        step={1}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Y: {content.positions.sections[index]?.y || 50}%</Label>
                      <Slider
                        value={[content.positions.sections[index]?.y || 50]}
                        onValueChange={([v]) => updateSectionPosition(index, "y", v)}
                        min={10}
                        max={90}
                        step={1}
                      />
                    </div>
                  </div>

                  {/* Sub-headline */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <Label htmlFor={`subheadline-${index}`} className="text-xs">Sub-headline</Label>
                      <EmojiPicker onSelect={(emoji) => insertEmoji(emoji, "subheadline", index)} />
                    </div>
                    <Input
                      id={`subheadline-${index}`}
                      value={section.subheadline}
                      onChange={(e) => updateSection(index, "subheadline", e.target.value)}
                      placeholder="Secondary text..."
                      maxLength={150}
                    />
                  </div>

                  {/* Body Text */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <Label htmlFor={`body-${index}`} className="text-xs">Body Text</Label>
                      <EmojiPicker onSelect={(emoji) => insertEmoji(emoji, "body", index)} />
                    </div>
                    <Textarea
                      id={`body-${index}`}
                      value={section.body}
                      onChange={(e) => updateSection(index, "body", e.target.value)}
                      placeholder="Additional details..."
                      maxLength={300}
                      rows={2}
                    />
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* STYLING TAB */}
          <TabsContent value="styling" className="space-y-4 mt-0">
            {/* Text Colors */}
            <div className="space-y-3">
              <Label className="font-medium">Text Colors</Label>
              <ColorPresets onSelect={(colors) => onChange({
                ...content,
                textStyles: { ...content.textStyles, colors },
              })} />
              <div className="grid grid-cols-3 gap-2">
                <ColorPicker
                  label="Headline"
                  value={content.textStyles.colors.headline}
                  onChange={(color) => updateColor("headline", color)}
                />
                <ColorPicker
                  label="Sub-headline"
                  value={content.textStyles.colors.subheadline}
                  onChange={(color) => updateColor("subheadline", color)}
                />
                <ColorPicker
                  label="Body"
                  value={content.textStyles.colors.body}
                  onChange={(color) => updateColor("body", color)}
                />
              </div>
            </div>

            {/* Font Settings */}
            <div className="space-y-3 p-3 border rounded-lg bg-muted/30">
              <div className="flex items-center justify-between">
                <Label className="font-medium">Fonts</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    onChange({
                      ...content,
                      fonts: { headline: "Poppins", subheadline: "Poppins", body: "Poppins" },
                      fontSizes: { headline: 72, subheadline: 48, body: 32 },
                    });
                  }}
                  className="text-xs text-muted-foreground hover:text-foreground h-7"
                >
                  <RotateCcw className="w-3 h-3 mr-1" />
                  Reset
                </Button>
              </div>
              
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Headline</Label>
                  <Select
                    value={content.fonts.headline}
                    onValueChange={(value: FontFamily) => updateFont("headline", value)}
                  >
                    <SelectTrigger className="text-xs h-8">
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

                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Sub-headline</Label>
                  <Select
                    value={content.fonts.subheadline}
                    onValueChange={(value: FontFamily) => updateFont("subheadline", value)}
                  >
                    <SelectTrigger className="text-xs h-8">
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

                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Body</Label>
                  <Select
                    value={content.fonts.body}
                    onValueChange={(value: FontFamily) => updateFont("body", value)}
                  >
                    <SelectTrigger className="text-xs h-8">
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

              <div className="space-y-3 pt-2 border-t border-border/50">
                <Label className="text-xs text-muted-foreground">Font Sizes</Label>
                
                <div className="space-y-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Headline: {content.fontSizes.headline}px</Label>
                    <Slider
                      value={[content.fontSizes.headline]}
                      onValueChange={([value]) => updateFontSize("headline", value)}
                      min={32}
                      max={120}
                      step={2}
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs">Sub-headline: {content.fontSizes.subheadline}px</Label>
                    <Slider
                      value={[content.fontSizes.subheadline]}
                      onValueChange={([value]) => updateFontSize("subheadline", value)}
                      min={20}
                      max={80}
                      step={2}
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs">Body: {content.fontSizes.body}px</Label>
                    <Slider
                      value={[content.fontSizes.body]}
                      onValueChange={([value]) => updateFontSize("body", value)}
                      min={16}
                      max={56}
                      step={2}
                    />
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* EFFECTS TAB */}
          <TabsContent value="effects" className="space-y-4 mt-0">
            <div className="space-y-3">
              <TextEffectsPanel
                label="Headline"
                shadow={content.textStyles.shadows.headline}
                stroke={content.textStyles.strokes.headline}
                alignment={content.textStyles.alignments.headline}
                rotation={content.textStyles.rotations.headline}
                onShadowChange={(s) => updateShadow("headline", s)}
                onStrokeChange={(s) => updateStroke("headline", s)}
                onAlignmentChange={(a) => updateAlignment("headline", a)}
                onRotationChange={(r) => updateRotation("headline", r)}
              />
              <TextEffectsPanel
                label="Sub-headline"
                shadow={content.textStyles.shadows.subheadline}
                stroke={content.textStyles.strokes.subheadline}
                alignment={content.textStyles.alignments.subheadline}
                rotation={0}
                onShadowChange={(s) => updateShadow("subheadline", s)}
                onStrokeChange={(s) => updateStroke("subheadline", s)}
                onAlignmentChange={(a) => updateAlignment("subheadline", a)}
                onRotationChange={() => {}}
              />
              <TextEffectsPanel
                label="Body"
                shadow={content.textStyles.shadows.body}
                stroke={content.textStyles.strokes.body}
                alignment={content.textStyles.alignments.body}
                rotation={0}
                onShadowChange={(s) => updateShadow("body", s)}
                onStrokeChange={(s) => updateStroke("body", s)}
                onAlignmentChange={(a) => updateAlignment("body", a)}
                onRotationChange={() => {}}
              />
            </div>
          </TabsContent>

          {/* EXTRAS TAB */}
          <TabsContent value="extras" className="space-y-4 mt-0">
            {/* Event Auto-fill */}
            <div className="space-y-2 p-3 border rounded-lg">
              <Label className="font-medium">Auto-fill from Event</Label>
              <EventSelector onAutoFill={handleAutoFill} />
            </div>

            {/* QR Code */}
            <div className="space-y-2 p-3 border rounded-lg">
              <Label className="font-medium">QR Code</Label>
              {content.qrCode && (
                <QRCodeSection
                  settings={content.qrCode}
                  onChange={(qrCode) => updateField("qrCode", qrCode)}
                />
              )}
            </div>

            {/* AI Suggestions */}
            <div className="space-y-2 p-3 border rounded-lg">
              <Label className="font-medium">AI Text Suggestions</Label>
              <AISuggestions
                onApplyHeadline={(headline) => updateField("headline", headline)}
                onApplyBody={(body) => {
                  if (content.sections.length > 0) {
                    const newSections = [...content.sections];
                    newSections[0] = { ...newSections[0], body };
                    onChange({ ...content, sections: newSections });
                  }
                }}
              />
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
