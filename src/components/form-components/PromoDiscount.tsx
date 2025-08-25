import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface PromoDiscountProps {
  venue: string;
  address: string;
  onVenueChange: (venue: string) => void;
  onAddressChange: (address: string) => void;
}

export const PromoDiscount = ({ 
  venue, 
  address, 
  onVenueChange, 
  onAddressChange 
}: PromoDiscountProps) => {
  return (
    <>
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
    </>
  );
};