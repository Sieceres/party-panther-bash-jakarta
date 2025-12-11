import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Sparkles, Loader2, RefreshCw, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AISuggestionsProps {
  onApplyHeadline: (headline: string) => void;
  onApplyBody: (body: string) => void;
}

export const AISuggestions = ({ onApplyHeadline, onApplyBody }: AISuggestionsProps) => {
  const { toast } = useToast();
  const [eventType, setEventType] = useState("");
  const [mood, setMood] = useState("");
  const [details, setDetails] = useState("");
  const [loading, setLoading] = useState(false);
  const [headlineSuggestions, setHeadlineSuggestions] = useState<string[]>([]);
  const [bodySuggestions, setBodySuggestions] = useState<string[]>([]);

  const generateSuggestions = async () => {
    if (!eventType) {
      toast({
        title: "Missing Info",
        description: "Please enter at least the event type",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Fetch headlines and body text in parallel
      const [headlineRes, bodyRes] = await Promise.all([
        supabase.functions.invoke("instagram-ai-suggestions", {
          body: { eventType, mood, details, suggestionType: "headline" },
        }),
        supabase.functions.invoke("instagram-ai-suggestions", {
          body: { eventType, mood, details, suggestionType: "body" },
        }),
      ]);

      if (headlineRes.error) {
        console.error("Headline error:", headlineRes.error);
        throw headlineRes.error;
      }
      if (bodyRes.error) {
        console.error("Body error:", bodyRes.error);
        throw bodyRes.error;
      }

      setHeadlineSuggestions(headlineRes.data?.suggestions || []);
      setBodySuggestions(bodyRes.data?.suggestions || []);

      toast({ title: "Suggestions generated!" });
    } catch (error: any) {
      console.error("Error generating suggestions:", error);
      
      // Check for rate limit or payment errors
      if (error?.message?.includes("429") || error?.message?.includes("Rate limit")) {
        toast({
          title: "Rate Limited",
          description: "Too many requests. Please wait a moment and try again.",
          variant: "destructive",
        });
      } else if (error?.message?.includes("402") || error?.message?.includes("credits")) {
        toast({
          title: "Credits Exhausted",
          description: "AI credits exhausted. Please add credits to continue.",
          variant: "destructive",
        });
      } else {
        // Use fallback suggestions
        setHeadlineSuggestions([
          `🎉 ${eventType.toUpperCase()}`,
          `Don't Miss This ${eventType}!`,
          `✨ ${eventType} Alert ✨`,
        ]);
        setBodySuggestions([
          `Join us for an unforgettable ${eventType.toLowerCase()}! ${mood ? `Vibes: ${mood}` : ""}`,
          `Something amazing is happening. ${details || "Stay tuned for details!"}`,
        ]);
        toast({
          title: "Using fallback suggestions",
          description: "AI unavailable, showing sample suggestions",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const hasSuggestions = headlineSuggestions.length > 0 || bodySuggestions.length > 0;

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
      <div className="flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-primary" />
        <Label className="text-sm font-medium">AI Text Suggestions</Label>
      </div>

      <div className="space-y-3">
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Event Type *</Label>
          <Input
            value={eventType}
            onChange={(e) => setEventType(e.target.value)}
            placeholder="e.g., Party, Workshop, Concert..."
          />
        </div>

        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Mood / Vibe</Label>
          <Input
            value={mood}
            onChange={(e) => setMood(e.target.value)}
            placeholder="e.g., Energetic, Chill, Elegant..."
          />
        </div>

        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Key Details</Label>
          <Textarea
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            placeholder="Date, venue, special guests, theme..."
            rows={2}
          />
        </div>

        <Button onClick={generateSuggestions} disabled={loading} className="w-full">
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Generate Suggestions
            </>
          )}
        </Button>
      </div>

      {hasSuggestions && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">Results</Label>
            <Button
              variant="ghost"
              size="sm"
              onClick={generateSuggestions}
              disabled={loading}
              className="h-6 px-2"
            >
              <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>

          {headlineSuggestions.length > 0 && (
            <div className="space-y-2">
              <Label className="text-xs font-medium">Headlines</Label>
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {headlineSuggestions.map((headline, idx) => (
                  <Card key={idx} className="p-2 flex items-center justify-between gap-2">
                    <p className="text-sm font-medium truncate">{headline}</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 shrink-0"
                      onClick={() => {
                        onApplyHeadline(headline);
                        toast({ title: "Headline applied!" });
                      }}
                    >
                      <Check className="w-3 h-3" />
                    </Button>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {bodySuggestions.length > 0 && (
            <div className="space-y-2">
              <Label className="text-xs font-medium">Body Text</Label>
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {bodySuggestions.map((body, idx) => (
                  <Card key={idx} className="p-2 flex items-start justify-between gap-2">
                    <p className="text-xs text-muted-foreground">{body}</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 shrink-0"
                      onClick={() => {
                        onApplyBody(body);
                        toast({ title: "Body text applied!" });
                      }}
                    >
                      <Check className="w-3 h-3" />
                    </Button>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
