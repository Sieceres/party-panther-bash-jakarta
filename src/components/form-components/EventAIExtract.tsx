import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, Upload, FileText, Loader2, ChevronDown, ChevronUp, Pencil } from "lucide-react";
import { toast } from "sonner";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface ExtractedEvent {
  title?: string;
  description?: string;
  date?: string;
  time?: string;
  venue_name?: string;
  venue_address?: string;
  organizer_name?: string;
  price_currency?: string;
  image_url?: string;
}

interface EventAIExtractProps {
  onExtracted: (data: ExtractedEvent) => void;
}

export const EventAIExtract = ({ onExtracted }: EventAIExtractProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<"poster" | "text">("poster");
  const [isExtracting, setIsExtracting] = useState(false);
  const [textInput, setTextInput] = useState("");
  const [aiStyle, setAiStyle] = useState<"playful" | "compact" | "exact" | "custom">("exact");
  const [customInstructions, setCustomInstructions] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePosterUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Convert to base64
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const base64 = ev.target?.result as string;
      await extractFromImage(base64);
    };
    reader.readAsDataURL(file);
  };

  const extractFromImage = async (imageData: string) => {
    setIsExtracting(true);
    try {
      const { data, error } = await supabase.functions.invoke("extract-from-image", {
        body: { image: imageData, type: "event", style: aiStyle, customInstructions: aiStyle === "custom" ? customInstructions : undefined },
      });

      if (error) throw error;

      const items = data?.items;
      if (!items || items.length === 0) {
        toast.error("Could not extract event details from this image");
        return;
      }

      const event = items[0] as ExtractedEvent;
      // Use the uploaded poster as the event image
      event.image_url = imageData;
      onExtracted(event);
      toast.success("Event details extracted!", {
        description: `Found: ${event.title || "event info"}`,
      });
      setIsOpen(false);
    } catch (err: any) {
      console.error("AI extraction error:", err);
      toast.error("Failed to extract event details", {
        description: err.message || "Please try again",
      });
    } finally {
      setIsExtracting(false);
    }
  };

  const extractFromText = async () => {
    if (!textInput.trim()) {
      toast.error("Please enter some text first");
      return;
    }

    setIsExtracting(true);
    try {
      const { data, error } = await supabase.functions.invoke("extract-from-image", {
        body: { text: textInput, type: "event", style: aiStyle, customInstructions: aiStyle === "custom" ? customInstructions : undefined },
      });

      if (error) throw error;

      const items = data?.items;
      if (!items || items.length === 0) {
        toast.error("Could not extract event details from this text");
        return;
      }

      const event = items[0] as ExtractedEvent;
      onExtracted(event);
      toast.success("Event details extracted!", {
        description: `Found: ${event.title || "event info"}`,
      });
      setIsOpen(false);
      setTextInput("");
    } catch (err: any) {
      console.error("AI extraction error:", err);
      toast.error("Failed to extract event details", {
        description: err.message || "Please try again",
      });
    } finally {
      setIsExtracting(false);
    }
  };

  return (
    <div className="border border-dashed border-primary/40 rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-primary hover:bg-primary/5 transition-colors"
      >
        <span className="flex items-center gap-2">
          <Sparkles className="w-4 h-4" />
          Auto-fill from poster or text
        </span>
        {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      {isOpen && (
        <div className="px-4 pb-4 space-y-4">
          <div className="flex gap-2">
            <Button
              type="button"
              variant={mode === "poster" ? "default" : "outline"}
              size="sm"
              onClick={() => setMode("poster")}
              disabled={isExtracting}
            >
              <Upload className="w-3.5 h-3.5 mr-1.5" />
              Poster / Image
            </Button>
            <Button
              type="button"
              variant={mode === "text" ? "default" : "outline"}
              size="sm"
              onClick={() => setMode("text")}
              disabled={isExtracting}
            >
              <FileText className="w-3.5 h-3.5 mr-1.5" />
              Paste Text
            </Button>
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">AI Style</Label>
            <RadioGroup
              value={aiStyle}
              onValueChange={(v) => setAiStyle(v as typeof aiStyle)}
              className="grid grid-cols-2 gap-2"
            >
              <label className={`flex flex-col rounded-md border px-3 py-2 text-sm cursor-pointer transition-colors ${aiStyle === "playful" ? "border-primary bg-primary/5" : "border-input hover:bg-muted/50"}`}>
                <span className="flex items-center gap-2">
                  <RadioGroupItem value="playful" id="style-playful" />
                  <span>🎉 Playful</span>
                </span>
                {aiStyle === "playful" && (
                  <p className="text-[11px] text-muted-foreground mt-1 ml-6">Fun tone with emojis and bullet points — great for social events</p>
                )}
              </label>
              <label className={`flex flex-col rounded-md border px-3 py-2 text-sm cursor-pointer transition-colors ${aiStyle === "compact" ? "border-primary bg-primary/5" : "border-input hover:bg-muted/50"}`}>
                <span className="flex items-center gap-2">
                  <RadioGroupItem value="compact" id="style-compact" />
                  <span>📋 Compact</span>
                </span>
                {aiStyle === "compact" && (
                  <p className="text-[11px] text-muted-foreground mt-1 ml-6">Short &amp; factual — just the essentials, no fluff</p>
                )}
              </label>
              <label className={`flex flex-col rounded-md border px-3 py-2 text-sm cursor-pointer transition-colors ${aiStyle === "exact" ? "border-primary bg-primary/5" : "border-input hover:bg-muted/50"}`}>
                <span className="flex items-center gap-2">
                  <RadioGroupItem value="exact" id="style-exact" />
                  <span>📌 Exact</span>
                </span>
                {aiStyle === "exact" && (
                  <p className="text-[11px] text-muted-foreground mt-1 ml-6">Copies the original text as closely as possible</p>
                )}
              </label>
              <label className={`flex flex-col rounded-md border px-3 py-2 text-sm cursor-pointer transition-colors ${aiStyle === "custom" ? "border-primary bg-primary/5" : "border-input hover:bg-muted/50"}`}>
                <span className="flex items-center gap-2">
                  <RadioGroupItem value="custom" id="style-custom" />
                  <span><Pencil className="w-3 h-3 inline mr-1" />Custom</span>
                </span>
                {aiStyle === "custom" && (
                  <p className="text-[11px] text-muted-foreground mt-1 ml-6">Write your own instructions for the AI</p>
                )}
              </label>
            </RadioGroup>
            {aiStyle === "custom" && (
              <Textarea
                value={customInstructions}
                onChange={(e) => setCustomInstructions(e.target.value)}
                placeholder="e.g. Write the description in Bahasa Indonesia, use bullet points..."
                rows={2}
                className="text-xs"
              />
            )}
          </div>

          {mode === "poster" && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                Upload an event poster or flyer — AI will extract the title, date, time, venue, and more.
              </p>
              <Input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePosterUpload}
                className="hidden"
                disabled={isExtracting}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isExtracting}
                className="w-full"
              >
                {isExtracting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Extracting event details...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Choose Poster Image
                  </>
                )}
              </Button>
            </div>
          )}

          {mode === "text" && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                Paste event details, a caption, or any text — AI will extract what it can.
              </p>
              <Textarea
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="e.g. Join us for Pub Crawl this Saturday at 8PM! Starting at Holywings Kemang. Free entry, dress code casual..."
                rows={4}
                disabled={isExtracting}
              />
              <Button
                type="button"
                variant="default"
                onClick={extractFromText}
                disabled={isExtracting || !textInput.trim()}
                className="w-full"
              >
                {isExtracting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Extracting event details...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Extract Event Details
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
