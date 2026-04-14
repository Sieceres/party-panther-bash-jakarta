import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, Upload, FileText, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";

interface ExtractedEvent {
  title?: string;
  description?: string;
  date?: string;
  time?: string;
  venue_name?: string;
  venue_address?: string;
  organizer_name?: string;
  price_currency?: string;
}

interface EventAIExtractProps {
  onExtracted: (data: ExtractedEvent) => void;
}

export const EventAIExtract = ({ onExtracted }: EventAIExtractProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<"poster" | "text">("poster");
  const [isExtracting, setIsExtracting] = useState(false);
  const [textInput, setTextInput] = useState("");
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
        body: { image: imageData, type: "event" },
      });

      if (error) throw error;

      const items = data?.items;
      if (!items || items.length === 0) {
        toast.error("Could not extract event details from this image");
        return;
      }

      const event = items[0] as ExtractedEvent;
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
        body: { text: textInput, type: "event" },
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
