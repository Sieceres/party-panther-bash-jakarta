import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin, Loader2, Building2, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface VenueResult {
  id: string;
  name: string;
  address: string | null;
  area: string | null;
}

interface VenueAutocompleteProps {
  venue: string;
  onVenueChange: (venue: string) => void;
  onVenueSelect: (venue: VenueResult | null) => void;
  selectedVenueId?: string | null;
}

export const VenueAutocomplete = ({
  venue,
  onVenueChange,
  onVenueSelect,
  selectedVenueId,
}: VenueAutocompleteProps) => {
  const [suggestions, setSuggestions] = useState<VenueResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (venue.length < 2) {
      setSuggestions([]);
      setHasSearched(false);
      return;
    }

    // If a venue is already selected and the text matches, don't re-search
    if (selectedVenueId) return;

    setIsSearching(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const { data, error } = await supabase
          .from("venues")
          .select("id, name, address, area")
          .ilike("name", `%${venue}%`)
          .limit(8);

        if (!error && data) {
          setSuggestions(data as VenueResult[]);
        }
      } catch (err) {
        console.error("Venue search error:", err);
      } finally {
        setIsSearching(false);
        setHasSearched(true);
        setShowSuggestions(true);
      }
    }, 300);

    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [venue, selectedVenueId]);

  const handleSelect = (v: VenueResult) => {
    onVenueChange(v.name);
    onVenueSelect(v);
    setShowSuggestions(false);
    setSuggestions([]);
  };

  const handleInputChange = (value: string) => {
    onVenueChange(value);
    // Clear venue selection when user modifies the text
    if (selectedVenueId) {
      onVenueSelect(null);
    }
  };

  const noResults = hasSearched && suggestions.length === 0 && venue.length >= 2 && !isSearching;

  return (
    <div className="space-y-2">
      <Label htmlFor="venue">Venue Name *</Label>
      <div ref={wrapperRef} className="relative">
        <div className="relative">
          <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            id="venue"
            placeholder="Start typing to search venues..."
            value={venue}
            onChange={(e) => handleInputChange(e.target.value)}
            onFocus={() => {
              if (suggestions.length > 0 && !selectedVenueId) {
                setShowSuggestions(true);
              }
            }}
            className="pl-10 pr-10"
            required
          />
          {isSearching && (
            <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
          )}
        </div>

        {/* Dropdown suggestions */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-background border border-border rounded-md shadow-lg max-h-60 overflow-y-auto">
            {suggestions.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => handleSelect(s)}
                className="w-full px-4 py-3 text-left hover:bg-accent transition-colors flex items-start gap-2 border-b border-border last:border-b-0"
              >
                <MapPin className="w-4 h-4 mt-1 flex-shrink-0 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm">{s.name}</div>
                  {s.address && (
                    <div className="text-xs text-muted-foreground truncate">{s.address}</div>
                  )}
                  {s.area && (
                    <div className="text-xs text-muted-foreground">{s.area}</div>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}

        {/* No results message */}
        {showSuggestions && noResults && (
          <div className="absolute z-50 w-full mt-1 bg-background border border-border rounded-md shadow-lg p-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Plus className="w-4 h-4 flex-shrink-0" />
              <span>
                "<span className="font-medium text-foreground">{venue}</span>" isn't in our directory yet — it will be created automatically
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Selected venue indicator */}
      {selectedVenueId && (
        <div className="text-xs text-muted-foreground bg-accent/50 rounded-md px-3 py-2 flex items-center gap-1.5">
          <MapPin className="w-3 h-3 flex-shrink-0" />
          <span>Linked to existing venue</span>
        </div>
      )}

      {/* New venue indicator (when typed but no match selected) */}
      {!selectedVenueId && venue.length >= 2 && hasSearched && !isSearching && !showSuggestions && (
        <div className="text-xs text-muted-foreground bg-accent/50 rounded-md px-3 py-2 flex items-center gap-1.5">
          <Plus className="w-3 h-3 flex-shrink-0" />
          <span>New venue — will be created automatically</span>
        </div>
      )}
    </div>
  );
};
