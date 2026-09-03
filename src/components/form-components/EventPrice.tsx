import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface EventPriceProps {
  priceAmount: number | null;
  priceCurrency: string;
  onPriceAmountChange: (value: number | null) => void;
  onPriceCurrencyChange: (value: string) => void;
}

export const EventPrice = ({
  priceAmount,
  priceCurrency,
  onPriceAmountChange,
  onPriceCurrencyChange,
}: EventPriceProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="event-price">Price per person (Optional)</Label>
        <Input
          id="event-price"
          type="number"
          min={0}
          placeholder="e.g. 150000"
          value={priceAmount ?? ""}
          onChange={(e) => {
            const v = e.target.value;
            onPriceAmountChange(v === "" ? null : Math.max(0, Math.floor(Number(v))));
          }}
        />
        <p className="text-xs text-muted-foreground">Leave empty for free events.</p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="event-currency">Currency</Label>
        <Select value={priceCurrency} onValueChange={onPriceCurrencyChange}>
          <SelectTrigger id="event-currency">
            <SelectValue placeholder="Currency" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="IDR">IDR</SelectItem>
            <SelectItem value="USD">USD</SelectItem>
            <SelectItem value="EUR">EUR</SelectItem>
            <SelectItem value="SGD">SGD</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};
