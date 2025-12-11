import { useEffect, useRef, useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { QrCode, RefreshCw } from "lucide-react";
import type { QRCodeSettings } from "@/types/instagram-post";

interface QRCodeSectionProps {
  settings: QRCodeSettings;
  onChange: (settings: QRCodeSettings) => void;
}

// Simple QR Code generator using canvas
// For production, consider using a library like 'qrcode'
const generateQRDataUrl = async (url: string, size: number): Promise<string> => {
  // This is a placeholder - in production use a proper QR library
  // For now, we'll use a simple external API
  const encodedUrl = encodeURIComponent(url);
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodedUrl}&bgcolor=ffffff&color=000000`;
};

export const QRCodeSection = ({ settings, onChange }: QRCodeSectionProps) => {
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [generating, setGenerating] = useState(false);

  const generatePreview = async () => {
    if (!settings.url || !settings.enabled) {
      setPreviewUrl("");
      return;
    }
    setGenerating(true);
    try {
      const qrUrl = await generateQRDataUrl(settings.url, 150);
      setPreviewUrl(qrUrl);
    } catch (error) {
      console.error("Error generating QR code:", error);
    } finally {
      setGenerating(false);
    }
  };

  useEffect(() => {
    if (settings.enabled && settings.url) {
      const timeout = setTimeout(generatePreview, 500);
      return () => clearTimeout(timeout);
    }
  }, [settings.url, settings.enabled]);

  const positionPresets = [
    { label: "Top Left", x: 10, y: 10 },
    { label: "Top Right", x: 90, y: 10 },
    { label: "Bottom Left", x: 10, y: 90 },
    { label: "Bottom Right", x: 90, y: 90 },
  ];

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <QrCode className="w-4 h-4 text-muted-foreground" />
          <Label className="text-sm font-medium">QR Code</Label>
        </div>
        <Switch
          checked={settings.enabled}
          onCheckedChange={(enabled) => onChange({ ...settings, enabled })}
        />
      </div>

      {settings.enabled && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">URL / Link</Label>
            <div className="flex gap-2">
              <Input
                value={settings.url}
                onChange={(e) => onChange({ ...settings, url: e.target.value })}
                placeholder="https://example.com"
                className="flex-1"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={generatePreview}
                disabled={generating || !settings.url}
              >
                <RefreshCw className={`w-4 h-4 ${generating ? "animate-spin" : ""}`} />
              </Button>
            </div>
          </div>

          {previewUrl && (
            <div className="flex justify-center">
              <img
                src={previewUrl}
                alt="QR Code Preview"
                className="w-24 h-24 rounded border bg-white"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Size: {settings.size}px</Label>
            <Slider
              value={[settings.size]}
              onValueChange={([size]) => onChange({ ...settings, size })}
              min={60}
              max={200}
              step={10}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Position Presets</Label>
            <div className="grid grid-cols-2 gap-2">
              {positionPresets.map((preset) => (
                <Button
                  key={preset.label}
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => onChange({ ...settings, position: { x: preset.x, y: preset.y } })}
                >
                  {preset.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">X: {settings.position.x}%</Label>
              <Slider
                value={[settings.position.x]}
                onValueChange={([x]) => onChange({ ...settings, position: { ...settings.position, x } })}
                min={5}
                max={95}
                step={1}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Y: {settings.position.y}%</Label>
              <Slider
                value={[settings.position.y]}
                onValueChange={([y]) => onChange({ ...settings, position: { ...settings.position, y } })}
                min={5}
                max={95}
                step={1}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper to get QR code URL for canvas rendering
export const getQRCodeImageUrl = async (url: string, size: number): Promise<string> => {
  return generateQRDataUrl(url, size);
};
