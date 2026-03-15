import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MultiSelect } from "@/components/ui/multi-select";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { JAKARTA_AREAS } from "@/lib/area-config";

interface PromoDetailsProps {
  validUntilDate: Date | undefined;
  promoType?: string;
  dayOfWeek: string[];
  area: string;
  drinkType: string[];
  onValidUntilChange: (date: Date | undefined) => void;
  onPromoTypeChange?: (type: string) => void;
  onDayOfWeekChange: (days: string[]) => void;
  onAreaChange: (area: string) => void;
  onDrinkTypeChange: (types: string[]) => void;
}

export const PromoDetails = ({ 
  validUntilDate, 
  promoType,
  dayOfWeek, 
  area, 
  drinkType,
  onValidUntilChange, 
  onPromoTypeChange,
  onDayOfWeekChange, 
  onAreaChange, 
  onDrinkTypeChange 
}: PromoDetailsProps) => {
  return (
    <>
      <div className="space-y-2">
        <Label>Valid Until (Optional)</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !validUntilDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {validUntilDate ? format(validUntilDate, "dd/MM/yyyy") : "Pick a date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={validUntilDate}
              onSelect={onValidUntilChange}
              initialFocus
              className="pointer-events-auto"
            />
          </PopoverContent>
        </Popover>
      </div>

      {promoType !== undefined && onPromoTypeChange && (
        <div className="space-y-2">
          <Label htmlFor="promoType">Promo Type *</Label>
          <Select value={promoType} onValueChange={onPromoTypeChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select promo type" />
            </SelectTrigger>
            <SelectContent>
              {PROMO_TYPES.map((type) => (
                <SelectItem key={type} value={type}>{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>
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
    </>
  );
};