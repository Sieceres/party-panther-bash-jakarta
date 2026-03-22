import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { VenueAutocomplete, VenueResult } from "./VenueAutocomplete";

interface PromoDiscountProps {
  venue: string;
  address: string;
  selectedVenueId?: string | null;
  onVenueChange: (venue: string) => void;
  onAddressChange: (address: string) => void;
  onVenueSelect?: (venue: VenueResult | null) => void;
}

export const PromoDiscount = ({ 
  venue, 
  address,
  selectedVenueId,
  onVenueChange, 
  onAddressChange,
  onVenueSelect,
}: PromoDiscountProps) => {
  const handleVenueSelect = (v: VenueResult | null) => {
    if (onVenueSelect) onVenueSelect(v);
    if (v?.address) {
      onAddressChange(v.address);
    }
  };

  return (
    <>
      <VenueAutocomplete
        venue={venue}
        onVenueChange={onVenueChange}
        onVenueSelect={handleVenueSelect}
        selectedVenueId={selectedVenueId}
      />

      <div className="space-y-2">
        <Label htmlFor="address">Address</Label>
        <Input
          id="address"
          placeholder="Full address"
          value={address}
          onChange={(e) => onAddressChange(e.target.value)}
        />
      </div>
    </>
  );
};
