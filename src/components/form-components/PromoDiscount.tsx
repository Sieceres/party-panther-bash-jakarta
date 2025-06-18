import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface PromoDiscountProps {
  discount: string;
  venue: string;
  address: string;
  onDiscountChange: (discount: string) => void;
  onVenueChange: (venue: string) => void;
  onAddressChange: (address: string) => void;
}

export const PromoDiscount = ({ 
  discount, 
  venue, 
  address, 
  onDiscountChange, 
  onVenueChange, 
  onAddressChange 
}: PromoDiscountProps) => {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="discount">Discount *</Label>
          <Input
            id="discount"
            placeholder="50% OFF"
            value={discount}
            onChange={(e) => onDiscountChange(e.target.value)}
            required
          />
        </div>
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