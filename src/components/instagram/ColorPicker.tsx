import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { COLOR_PRESETS } from "@/types/instagram-post";

interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (color: string) => void;
}

const QUICK_COLORS = [
  "#00d4ff", "#6366f1", "#e6e6e6", "#ff00ff", "#00ffff", "#ffffff",
  "#ff4444", "#ffaa00", "#00ff88", "#ff6b6b", "#9b59b6", "#3498db",
  "#d4af37", "#c0c0c0", "#f5f5f5", "#000000", "#1a1a2e", "#fffacd",
];

export const ColorPicker = ({ label, value, onChange }: ColorPickerProps) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-2">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-start gap-2 h-9"
          >
            <div
              className="w-5 h-5 rounded border border-border"
              style={{ backgroundColor: value }}
            />
            <span className="text-sm font-mono">{value}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-3" align="start">
          <div className="space-y-3">
            <div className="flex gap-2">
              <Input
                type="color"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-12 h-10 p-1 cursor-pointer"
              />
              <Input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder="#000000"
                className="flex-1 font-mono text-sm"
              />
            </div>
            
            <div>
              <Label className="text-xs text-muted-foreground mb-2 block">Quick Colors</Label>
              <div className="grid grid-cols-6 gap-1">
                {QUICK_COLORS.map((color) => (
                  <button
                    key={color}
                    className={`w-7 h-7 rounded border transition-all hover:scale-110 ${
                      value === color ? "ring-2 ring-primary ring-offset-1" : "border-border"
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => {
                      onChange(color);
                      setOpen(false);
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

interface ColorPresetsProps {
  onSelect: (colors: { headline: string; subheadline: string; body: string }) => void;
}

export const ColorPresets = ({ onSelect }: ColorPresetsProps) => {
  const presets = Object.entries(COLOR_PRESETS);

  return (
    <div className="space-y-2">
      <Label className="text-xs text-muted-foreground">Color Themes</Label>
      <div className="grid grid-cols-3 gap-2">
        {presets.map(([name, colors]) => (
          <Button
            key={name}
            variant="outline"
            size="sm"
            className="h-auto py-2 px-2 flex-col gap-1"
            onClick={() => onSelect(colors)}
          >
            <div className="flex gap-0.5">
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: colors.headline }} />
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: colors.subheadline }} />
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: colors.body }} />
            </div>
            <span className="text-[10px] capitalize">{name.replace(/([A-Z])/g, ' $1').trim()}</span>
          </Button>
        ))}
      </div>
    </div>
  );
};
