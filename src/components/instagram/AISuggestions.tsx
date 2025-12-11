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

interface Suggestion {
  headline: string;
  body: string;
}

export const AISuggestions = ({ onApplyHeadline, onApplyBody }: AISuggestionsProps) => {
  const { toast } = useToast();
  const [eventType, setEventType] = useState("");
  const [mood, setMood] = useState("");
  const [details, setDetails] = useState("");
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);

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
      const { data, error } = await supabase.functions.invoke("instagram-ai-suggestions", {
        body: {
          eventType,
          mood,
          details,
        },
      });

      if (error) throw error;

      if (data?.suggestions) {
        setSuggestions(data.suggestions);
      } else {
        // Fallback suggestions if AI fails
        setSuggestions([
          {
            headline: `🎉 ${eventType.toUpperCase()}`,
            body: `Join us for an amazing ${eventType.toLowerCase()}! ${mood ? `Vibes: ${mood}` : ""} ${details ? `• ${details}` : ""}`,
          },
          {
            headline: `Don't Miss This ${eventType}!`,
            body: `The ultimate ${eventType.toLowerCase()} experience awaits. ${details || "Be there or be square!"}`,
          },
          {
            headline: `✨ ${eventType} Alert ✨`,
            body: `Get ready for something special! ${mood ? `It's going to be ${mood.toLowerCase()}.` : ""} Mark your calendars!`,
          },
        ]);
      }
    } catch (error) {
      console.error("Error generating suggestions:", error);
      // Use fallback suggestions
      setSuggestions([
        {
          headline: `🎉 ${eventType.toUpperCase()}`,
          body: `Join us for an unforgettable ${eventType.toLowerCase()}!`,
        },
        {
          headline: `${eventType} You Won't Want to Miss`,
          body: `Something amazing is happening. ${details || "Stay tuned for details!"}`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

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

      {suggestions.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">Suggestions</Label>
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

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {suggestions.map((suggestion, idx) => (
              <Card key={idx} className="p-3 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold text-sm text-primary">{suggestion.headline}</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2"
                    onClick={() => {
                      onApplyHeadline(suggestion.headline);
                      toast({ title: "Headline applied!" });
                    }}
                  >
                    <Check className="w-3 h-3" />
                  </Button>
                </div>
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs text-muted-foreground">{suggestion.body}</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2"
                    onClick={() => {
                      onApplyBody(suggestion.body);
                      toast({ title: "Body text applied!" });
                    }}
                  >
                    <Check className="w-3 h-3" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
