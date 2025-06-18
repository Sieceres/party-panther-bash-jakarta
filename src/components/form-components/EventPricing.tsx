import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface EventPricingProps {
  price: string;
  capacity: string;
  onPriceChange: (price: string) => void;
  onCapacityChange: (capacity: string) => void;
}

export const EventPricing = ({ price, capacity, onPriceChange, onCapacityChange }: EventPricingProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="price">Ticket Price</Label>
        <Input
          id="price"
          placeholder="IDR 150,000 or Free"
          value={price}
          onChange={(e) => onPriceChange(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="capacity">Capacity</Label>
        <Input
          id="capacity"
          type="number"
          placeholder="100"
          value={capacity}
          onChange={(e) => onCapacityChange(e.target.value)}
        />
      </div>
    </div>
  );
};