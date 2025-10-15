import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin, Loader2, Navigation, X } from "lucide-react";
import { searchPlaces, getCurrentLocation, reverseGeocode, MapboxFeature } from "@/lib/mapbox";
import { useToast } from "@/hooks/use-toast";

interface LocationAutocompleteProps {
  location: { lat: number; lng: number; address: string } | null;
  onLocationSelect: (location: { lat: number; lng: number; address: string } | null) => void;
  label?: string;
  placeholder?: string;
}

export const LocationAutocomplete = ({ 
  location, 
  onLocationSelect, 
  label = "Location (Optional)",
  placeholder = "Search for a venue or address..."
}: LocationAutocompleteProps) => {
  const [searchQuery, setSearchQuery] = useState(location?.address || "");
  const [suggestions, setSuggestions] = useState<MapboxFeature[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

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

    if (searchQuery.length < 3) {
      setSuggestions([]);
      return;
    }

    setIsSearching(true);
    searchTimeoutRef.current = setTimeout(async () => {
      const results = await searchPlaces(searchQuery);
      setSuggestions(results);
      setIsSearching(false);
      setShowSuggestions(true);
    }, 500);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  const handleSelectSuggestion = (feature: MapboxFeature) => {
    const [lng, lat] = feature.center;
    onLocationSelect({
      lat,
      lng,
      address: feature.place_name,
    });
    setSearchQuery(feature.place_name);
    setShowSuggestions(false);
    setSuggestions([]);
  };

  const handleUseCurrentLocation = async () => {
    setIsGettingLocation(true);
    try {
      const coords = await getCurrentLocation();
      const address = await reverseGeocode(coords.lat, coords.lng);
      
      onLocationSelect({
        lat: coords.lat,
        lng: coords.lng,
        address,
      });
      setSearchQuery(address);
      
      toast({
        title: "Location set",
        description: "Using your current location",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not get your current location",
        variant: "destructive",
      });
    } finally {
      setIsGettingLocation(false);
    }
  };

  const handleClearLocation = () => {
    onLocationSelect(null);
    setSearchQuery("");
    setSuggestions([]);
    setShowSuggestions(false);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleUseCurrentLocation}
            disabled={isGettingLocation}
          >
            {isGettingLocation ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Navigation className="w-4 h-4 mr-2" />
            )}
            Use Current
          </Button>
          {location && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClearLocation}
            >
              <X className="w-4 h-4 mr-2" />
              Clear
            </Button>
          )}
        </div>
      </div>

      <div ref={wrapperRef} className="relative">
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder={placeholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => {
              if (suggestions.length > 0) {
                setShowSuggestions(true);
              }
            }}
            className="pl-10 pr-10"
          />
          {isSearching && (
            <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
          )}
        </div>

        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-y-auto">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion.id}
                type="button"
                onClick={() => handleSelectSuggestion(suggestion)}
                className="w-full px-4 py-3 text-left hover:bg-accent transition-colors flex items-start gap-2 border-b last:border-b-0"
              >
                <MapPin className="w-4 h-4 mt-1 flex-shrink-0 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm">{suggestion.text}</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {suggestion.place_name}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {showSuggestions && searchQuery.length >= 3 && suggestions.length === 0 && !isSearching && (
          <div className="absolute z-50 w-full mt-1 bg-background border rounded-md shadow-lg p-4 text-center text-sm text-muted-foreground">
            No locations found. Try a different search term.
          </div>
        )}
      </div>

      {location && (
        <div className="text-sm text-muted-foreground bg-accent/50 rounded-md p-3 flex items-start gap-2">
          <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="font-medium">Selected location:</div>
            <div className="truncate">{location.address}</div>
            <div className="text-xs mt-1">
              Coordinates: {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
            </div>
          </div>
        </div>
      )}

      {!import.meta.env.VITE_MAPBOX_TOKEN && (
        <div className="text-xs text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-950/30 rounded-md p-2">
          ⚠️ Mapbox token not configured. Please add VITE_MAPBOX_TOKEN to your environment.
        </div>
      )}
    </div>
  );
};
