import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface PromoPricingProps {
  originalPrice: string;
  discountedPrice: string;
  onOriginalPriceChange: (price: string) => void;
  onDiscountedPriceChange: (price: string) => void;
}

export const PromoPricing = ({ 
  originalPrice, 
  discountedPrice, 
  onOriginalPriceChange, 
  onDiscountedPriceChange 
}: PromoPricingProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="originalPrice">Original Price</Label>
        <Input
          id="originalPrice"
          placeholder="200000"
          value={originalPrice}
          onChange={(e) => onOriginalPriceChange(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="discountedPrice">Discounted Price</Label>
        <Input
          id="discountedPrice"
          placeholder="100000"
          value={discountedPrice}
          onChange={(e) => onDiscountedPriceChange(e.target.value)}
        />
      </div>
    </div>
  );
};