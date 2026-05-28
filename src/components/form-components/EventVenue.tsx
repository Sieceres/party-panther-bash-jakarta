import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { VenueAutocomplete, VenueResult } from "./VenueAutocomplete";
import { LocationAutocomplete } from "./LocationAutocomplete";
import { supabase } from "@/integrations/supabase/client";
import { JAKARTA_AREAS } from "@/lib/area-config";
import { MapPin, Loader2, Sparkles, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EventVenueProps {
  venue: string;
  area: string;
  location: { lat: number; lng: number; address: string } | null;
  selectedVenueId: string | null;
  onVenueChange: (venue: string) => void;
  onAreaChange: (area: string) => void;
  onLocationChange: (location: { lat: number; lng: number; address: string } | null) => void;
  onVenueIdChange: (venueId: string | null) => void;
  autoFilledByAI?: boolean;
}

export const EventVenue = ({ 
  venue, 
  area,
  location, 
  selectedVenueId,
  onVenueChange, 
  onAreaChange,
  onLocationChange,
  onVenueIdChange,
  autoFilledByAI = false,
}: EventVenueProps) => {
  const [isLoadingVenueDetails, setIsLoadingVenueDetails] = useState(false);
  const [manualOverride, setManualOverride] = useState(false);

  // If AI auto-filled the venue and we haven't overridden, collapse area/location pickers.
  const collapsed = autoFilledByAI && !manualOverride && !selectedVenueId;

  const handleVenueSelect = async (venueResult: VenueResult | null) => {
    if (!venueResult) {
      onVenueIdChange(null);
      return;
    }

    onVenueIdChange(venueResult.id);
    if (venueResult.area) {
      onAreaChange(venueResult.area);
    }

    // Fetch full venue details (coordinates, address) from DB
    setIsLoadingVenueDetails(true);
    try {
      const { data, error } = await supabase
        .from("venues")
        .select("latitude, longitude, address, area")
        .eq("id", venueResult.id)
        .single();

      if (!error && data) {
        if (data.latitude && data.longitude) {
          onLocationChange({
            lat: data.latitude,
            lng: data.longitude,
            address: data.address || venueResult.name,
          });
        }
        if (data.area) {
          onAreaChange(data.area);
        }
      }
    } catch (err) {
      console.error("Error fetching venue details:", err);
    } finally {
      setIsLoadingVenueDetails(false);
    }
  };

  // Flatten all neighborhoods for the area select
  const allNeighborhoods = JAKARTA_AREAS.flatMap(region => 
    region.neighborhoods.map(n => ({ neighborhood: n, region: region.label }))
  );

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <VenueAutocomplete
          venue={venue}
          onVenueChange={onVenueChange}
          onVenueSelect={handleVenueSelect}
          selectedVenueId={selectedVenueId}
        />
        {!collapsed && (
        <div className="space-y-2">
          <Label htmlFor="area">Area</Label>
          <Select value={area} onValueChange={onAreaChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select area..." />
            </SelectTrigger>
            <SelectContent>
              {JAKARTA_AREAS.map(region => (
                <div key={region.key}>
                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                    {region.label}
                  </div>
                  {region.neighborhoods.map(n => (
                    <SelectItem key={n} value={n}>
                      {n}
                    </SelectItem>
                  ))}
                </div>
              ))}
            </SelectContent>
          </Select>
        </div>
        )}
      </div>

      {collapsed && (
        <div className="text-sm bg-accent/40 rounded-md p-3 flex items-start gap-2">
          <Sparkles className="w-4 h-4 mt-0.5 flex-shrink-0 text-primary" />
          <div className="flex-1 min-w-0">
            <div className="font-medium">Area &amp; location will be auto-detected</div>
            <div className="text-xs text-muted-foreground mt-0.5">
              We'll scrape this venue's details from the web after you submit. If we can't find it,
              an admin will fill it in — your event still gets created.
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 px-2 mt-1 text-xs"
              onClick={() => setManualOverride(true)}
            >
              <Pencil className="w-3 h-3 mr-1" />
              Edit manually
            </Button>
          </div>
        </div>
      )}

      {isLoadingVenueDetails && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Loading venue location...</span>
        </div>
      )}

      {/* Show location autocomplete if venue has no coordinates yet */}
      {!selectedVenueId && !collapsed && (
        <LocationAutocomplete
          location={location}
          onLocationSelect={onLocationChange}
          label="Venue Location"
          placeholder="Search for venue address..."
        />
      )}

      {/* Show location info if auto-populated from venue */}
      {selectedVenueId && location && (
        <div className="text-sm text-muted-foreground bg-accent/50 rounded-md p-3 flex items-start gap-2">
          <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="font-medium">Location from venue directory</div>
            <div className="truncate">{location.address}</div>
            <div className="text-xs mt-1">
              {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
            </div>
          </div>
        </div>
      )}

      {/* If venue is from directory but has no coordinates, allow manual entry */}
      {selectedVenueId && !location && !isLoadingVenueDetails && (
        <LocationAutocomplete
          location={location}
          onLocationSelect={onLocationChange}
          label="Venue Location (not yet mapped)"
          placeholder="Search for venue address..."
        />
      )}
    </>
  );
};
