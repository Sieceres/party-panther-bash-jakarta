import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { VenueAutocomplete, VenueResult } from "./VenueAutocomplete";
import { LocationAutocomplete } from "./LocationAutocomplete";
import { supabase } from "@/integrations/supabase/client";
import { JAKARTA_AREAS } from "@/lib/area-config";
import { MapPin, Loader2 } from "lucide-react";

interface EventVenueProps {
  venue: string;
  area: string;
  location: { lat: number; lng: number; address: string } | null;
  selectedVenueId: string | null;
  onVenueChange: (venue: string) => void;
  onAreaChange: (area: string) => void;
  onLocationChange: (location: { lat: number; lng: number; address: string } | null) => void;
  onVenueIdChange: (venueId: string | null) => void;
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
}: EventVenueProps) => {
  const [isLoadingVenueDetails, setIsLoadingVenueDetails] = useState(false);

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
      </div>

      {isLoadingVenueDetails && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Loading venue location...</span>
        </div>
      )}

      {/* Show location autocomplete if venue has no coordinates yet */}
      {!selectedVenueId && (
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
