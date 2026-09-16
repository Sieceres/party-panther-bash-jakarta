import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MultiSelect } from "@/components/ui/multi-select";
import { JAKARTA_AREAS } from "@/lib/area-config";
import { PROMO_TYPES } from "@/lib/promo-types";

interface PromoDetailsProps {
  promoTypes?: string[];
  dayOfWeek: string[];
  area: string;
  drinkType: string[];
  discountedPrice?: string;
  onPromoTypesChange?: (types: string[]) => void;
  onDayOfWeekChange: (days: string[]) => void;
  onAreaChange: (area: string) => void;
  onDrinkTypeChange: (types: string[]) => void;
  onDiscountedPriceChange?: (value: string) => void;
}


export const PromoDetails = ({ 
  promoTypes,
  dayOfWeek, 
  area, 
  drinkType,
  discountedPrice,
  onPromoTypesChange,
  onDayOfWeekChange, 
  onAreaChange, 
  onDrinkTypeChange,
  onDiscountedPriceChange
}: PromoDetailsProps) => {

  return (
    <>
      {promoTypes !== undefined && onPromoTypesChange && (
        <div className="space-y-2">
          <Label htmlFor="promoType">Promo Type *</Label>
          <MultiSelect
            options={PROMO_TYPES.map((type) => ({ value: type, label: type }))}
            selectedValues={promoTypes}
            onSelectionChange={onPromoTypesChange}
            placeholder="Select promo type(s)"
          />
          <p className="text-xs text-muted-foreground">You can pick more than one type.</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="dayOfWeek">Days of Week</Label>
          <MultiSelect
            options={[
              { value: "monday", label: "Monday" },
              { value: "tuesday", label: "Tuesday" },
              { value: "wednesday", label: "Wednesday" },
              { value: "thursday", label: "Thursday" },
              { value: "friday", label: "Friday" },
              { value: "saturday", label: "Saturday" },
              { value: "sunday", label: "Sunday" }
            ]}
            selectedValues={dayOfWeek}
            onSelectionChange={onDayOfWeekChange}
            placeholder="Select days"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="area">Area</Label>
          <Select value={area} onValueChange={onAreaChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select area" />
            </SelectTrigger>
            <SelectContent>
              {JAKARTA_AREAS.map((region) => (
                <SelectGroup key={region.key}>
                  <SelectLabel>{region.label}</SelectLabel>
                  {region.neighborhoods.map((hood) => (
                    <SelectItem key={hood} value={hood}>{hood}</SelectItem>
                  ))}
                </SelectGroup>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="drinkType">Drink Types</Label>
          <MultiSelect
            options={[
              { value: "cocktails", label: "Cocktails" },
              { value: "beer", label: "Beer" },
              { value: "wine", label: "Wine" },
              { value: "spirits", label: "Spirits" },
              { value: "all", label: "All Drinks" }
            ]}
            selectedValues={drinkType}
            onSelectionChange={onDrinkTypeChange}
            placeholder="Select drink types"
          />
        </div>
      </div>

      {onDiscountedPriceChange && (
        <div className="space-y-2">
          <Label htmlFor="discountedPrice">Promo Price (IDR)</Label>
          <Input
            id="discountedPrice"
            type="number"
            inputMode="numeric"
            min={0}
            value={discountedPrice ?? ""}
            onChange={(e) => onDiscountedPriceChange(e.target.value)}
            placeholder="e.g. 160000"
          />
        </div>
      )}


    </>
  );
};