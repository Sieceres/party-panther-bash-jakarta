import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, AlignLeft, AlignCenter, AlignRight, RotateCcw } from "lucide-react";
import type { TextShadowSettings, TextStrokeSettings, TextAlignment } from "@/types/instagram-post";
import { useState } from "react";

interface TextEffectsPanelProps {
  label: string;
  shadow: TextShadowSettings;
  stroke: TextStrokeSettings;
  alignment: TextAlignment;
  rotation: number;
  onShadowChange: (shadow: TextShadowSettings) => void;
  onStrokeChange: (stroke: TextStrokeSettings) => void;
  onAlignmentChange: (alignment: TextAlignment) => void;
  onRotationChange: (rotation: number) => void;
}

export const TextEffectsPanel = ({
  label,
  shadow,
  stroke,
  alignment,
  rotation,
  onShadowChange,
  onStrokeChange,
  onAlignmentChange,
  onRotationChange,
}: TextEffectsPanelProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <Button variant="ghost" className="w-full justify-between px-2 h-8 text-xs">
          <span>{label} Effects</span>
          <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-4 pt-2 px-2">
        {/* Alignment */}
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Alignment</Label>
          <div className="flex gap-1">
            <Button
              variant={alignment === "left" ? "default" : "outline"}
              size="sm"
              className="flex-1 h-8"
              onClick={() => onAlignmentChange("left")}
            >
              <AlignLeft className="w-4 h-4" />
            </Button>
            <Button
              variant={alignment === "center" ? "default" : "outline"}
              size="sm"
              className="flex-1 h-8"
              onClick={() => onAlignmentChange("center")}
            >
              <AlignCenter className="w-4 h-4" />
            </Button>
            <Button
              variant={alignment === "right" ? "default" : "outline"}
              size="sm"
              className="flex-1 h-8"
              onClick={() => onAlignmentChange("right")}
            >
              <AlignRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Rotation */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label className="text-xs text-muted-foreground">Rotation: {rotation}°</Label>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2"
              onClick={() => onRotationChange(0)}
            >
              <RotateCcw className="w-3 h-3" />
            </Button>
          </div>
          <Slider
            value={[rotation]}
            onValueChange={([v]) => onRotationChange(v)}
            min={-45}
            max={45}
            step={1}
          />
        </div>

        {/* Shadow */}
        <div className="space-y-2 p-2 border rounded bg-muted/20">
          <div className="flex items-center justify-between">
            <Label className="text-xs">Shadow</Label>
            <Switch
              checked={shadow.enabled}
              onCheckedChange={(enabled) => onShadowChange({ ...shadow, enabled })}
            />
          </div>
          {shadow.enabled && (
            <div className="space-y-2 pt-2">
              <div className="flex gap-2 items-center">
                <Label className="text-xs w-14">Color</Label>
                <Input
                  type="color"
                  value={shadow.color.startsWith("rgba") ? "#000000" : shadow.color}
                  onChange={(e) => onShadowChange({ ...shadow, color: e.target.value })}
                  className="w-10 h-6 p-0.5"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Blur: {shadow.blur}px</Label>
                <Slider
                  value={[shadow.blur]}
                  onValueChange={([v]) => onShadowChange({ ...shadow, blur: v })}
                  min={0}
                  max={50}
                  step={1}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">X: {shadow.offsetX}px</Label>
                  <Slider
                    value={[shadow.offsetX]}
                    onValueChange={([v]) => onShadowChange({ ...shadow, offsetX: v })}
                    min={-20}
                    max={20}
                    step={1}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Y: {shadow.offsetY}px</Label>
                  <Slider
                    value={[shadow.offsetY]}
                    onValueChange={([v]) => onShadowChange({ ...shadow, offsetY: v })}
                    min={-20}
                    max={20}
                    step={1}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Stroke */}
        <div className="space-y-2 p-2 border rounded bg-muted/20">
          <div className="flex items-center justify-between">
            <Label className="text-xs">Stroke/Outline</Label>
            <Switch
              checked={stroke.enabled}
              onCheckedChange={(enabled) => onStrokeChange({ ...stroke, enabled })}
            />
          </div>
          {stroke.enabled && (
            <div className="space-y-2 pt-2">
              <div className="flex gap-2 items-center">
                <Label className="text-xs w-14">Color</Label>
                <Input
                  type="color"
                  value={stroke.color}
                  onChange={(e) => onStrokeChange({ ...stroke, color: e.target.value })}
                  className="w-10 h-6 p-0.5"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Width: {stroke.width}px</Label>
                <Slider
                  value={[stroke.width]}
                  onValueChange={([v]) => onStrokeChange({ ...stroke, width: v })}
                  min={1}
                  max={10}
                  step={1}
                />
              </div>
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};
