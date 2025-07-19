import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface PromoDetailsProps {
  validUntilDate: Date | undefined;
  category: string;
  promoType: string;
  dayOfWeek: string;
  area: string;
  drinkType: string;
  onValidUntilChange: (date: Date | undefined) => void;
  onCategoryChange: (category: string) => void;
  onPromoTypeChange: (type: string) => void;
  onDayOfWeekChange: (day: string) => void;
  onAreaChange: (area: string) => void;
  onDrinkTypeChange: (type: string) => void;
}

export const PromoDetails = ({ 
  validUntilDate, 
  category, 
  promoType,
  dayOfWeek, 
  area, 
  drinkType,
  onValidUntilChange, 
  onCategoryChange, 
  onPromoTypeChange,
  onDayOfWeekChange, 
  onAreaChange, 
  onDrinkTypeChange 
}: PromoDetailsProps) => {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Valid Until *</Label>
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
        <div className="space-y-2">
          <Label htmlFor="category">Category *</Label>
          <Input
            id="category"
            placeholder="Drinks, Food, Entry..."
            value={category}
            onChange={(e) => onCategoryChange(e.target.value)}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="promoType">Promo Type *</Label>
        <Select value={promoType} onValueChange={onPromoTypeChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select promo type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Free Flow">Free Flow</SelectItem>
            <SelectItem value="Ladies Night">Ladies Night</SelectItem>
            <SelectItem value="Bottle Promo">Bottle Promo</SelectItem>
            <SelectItem value="Other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="dayOfWeek">Day of Week</Label>
          <Select value={dayOfWeek} onValueChange={onDayOfWeekChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select day" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="monday">Monday</SelectItem>
              <SelectItem value="tuesday">Tuesday</SelectItem>
              <SelectItem value="wednesday">Wednesday</SelectItem>
              <SelectItem value="thursday">Thursday</SelectItem>
              <SelectItem value="friday">Friday</SelectItem>
              <SelectItem value="saturday">Saturday</SelectItem>
              <SelectItem value="sunday">Sunday</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="area">Area</Label>
          <Select value={area} onValueChange={onAreaChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select area" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="north">North Jakarta</SelectItem>
              <SelectItem value="south">South Jakarta</SelectItem>
              <SelectItem value="east">East Jakarta</SelectItem>
              <SelectItem value="west">West Jakarta</SelectItem>
              <SelectItem value="central">Central Jakarta</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="drinkType">Drink Type</Label>
          <Select value={drinkType} onValueChange={onDrinkTypeChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cocktails">Cocktails</SelectItem>
              <SelectItem value="beer">Beer</SelectItem>
              <SelectItem value="wine">Wine</SelectItem>
              <SelectItem value="spirits">Spirits</SelectItem>
              <SelectItem value="all">All Drinks</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </>
  );
};