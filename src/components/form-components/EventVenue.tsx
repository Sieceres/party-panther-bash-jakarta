import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LocationAutocomplete } from "./LocationAutocomplete";

interface EventVenueProps {
  venue: string;
  address: string;
  location: { lat: number; lng: number; address: string } | null;
  onVenueChange: (venue: string) => void;
  onAddressChange: (address: string) => void;
  onLocationChange: (location: { lat: number; lng: number; address: string } | null) => void;
}

export const EventVenue = ({ 
  venue, 
  address, 
  location, 
  onVenueChange, 
  onAddressChange, 
  onLocationChange 
}: EventVenueProps) => {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="venue">Venue Name *</Label>
          <Input
            id="venue"
            placeholder="Club/Bar/Restaurant name"
            value={venue}
            onChange={(e) => onVenueChange(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="address">Address</Label>
          <Input
            id="address"
            placeholder="Full address"
            value={address}
            onChange={(e) => onAddressChange(e.target.value)}
          />
        </div>
      </div>

      <LocationAutocomplete
        location={location}
        onLocationSelect={onLocationChange}
        label="Venue Location"
        placeholder="Search for venue address..."
      />
    </>
  );
};