
import { Button } from "@/components/ui/button";
import { PromoCard } from "@/components/PromoCard";
import { CreatePromoForm } from "@/components/CreatePromoForm";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Filter, Star } from "lucide-react";

interface PromosSectionProps {
  promos: any[];
  filteredPromos: any[];
  showCreatePromo: boolean;
  dayFilter: string;
  areaFilter: string;
  drinkTypeFilter: string;
  onToggleCreatePromo: () => void;
  onClaimPromo: (promoId: string) => void;
  onDayFilterChange: (value: string) => void;
  onAreaFilterChange: (value: string) => void;
  onDrinkTypeFilterChange: (value: string) => void;
}

export const PromosSection = ({ 
  filteredPromos,
  showCreatePromo,
  dayFilter,
  areaFilter,
  drinkTypeFilter,
  onToggleCreatePromo,
  onClaimPromo,
  onDayFilterChange,
  onAreaFilterChange,
  onDrinkTypeFilterChange
}: PromosSectionProps) => {
  return (
    <div className="pt-20 px-4">
      <div className="container mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-4xl font-bold gradient-text mb-2">Hot Promos</h2>
            <p className="text-muted-foreground">Save money while partying with these exclusive deals</p>
          </div>
          <Button
            onClick={onToggleCreatePromo}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            <Star className="w-4 h-4 mr-2" />
            Create Promo
          </Button>
        </div>

        {showCreatePromo && (
          <div className="mb-8">
            <CreatePromoForm />
          </div>
        )}

        {/* Filter Controls */}
        <div className="flex flex-col sm:flex-row gap-4 p-4 bg-card rounded-lg border">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">Filter by:</span>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            <Select value={dayFilter} onValueChange={onDayFilterChange}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Day of week" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Days</SelectItem>
                <SelectItem value="monday">Monday</SelectItem>
                <SelectItem value="tuesday">Tuesday</SelectItem>
                <SelectItem value="wednesday">Wednesday</SelectItem>
                <SelectItem value="thursday">Thursday</SelectItem>
                <SelectItem value="friday">Friday</SelectItem>
                <SelectItem value="saturday">Saturday</SelectItem>
                <SelectItem value="sunday">Sunday</SelectItem>
              </SelectContent>
            </Select>

            <Select value={areaFilter} onValueChange={onAreaFilterChange}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Area" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Areas</SelectItem>
                <SelectItem value="north">North Jakarta</SelectItem>
                <SelectItem value="south">South Jakarta</SelectItem>
                <SelectItem value="east">East Jakarta</SelectItem>
                <SelectItem value="west">West Jakarta</SelectItem>
                <SelectItem value="central">Central Jakarta</SelectItem>
              </SelectContent>
            </Select>

            <Select value={drinkTypeFilter} onValueChange={onDrinkTypeFilterChange}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Drink type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Drinks</SelectItem>
                <SelectItem value="cocktails">Cocktails</SelectItem>
                <SelectItem value="beer">Beer</SelectItem>
                <SelectItem value="wine">Wine</SelectItem>
                <SelectItem value="spirits">Spirits</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPromos.map((promo) => (
            <PromoCard 
              key={promo.id} 
              promo={{
                ...promo,
                discount: promo.discount_text,
                venue: promo.venue_name,
                validUntil: promo.valid_until,
                originalPrice: promo.original_price_amount ? `IDR ${promo.original_price_amount.toLocaleString()}` : 'N/A',
                discountedPrice: promo.discounted_price_amount ? `IDR ${promo.discounted_price_amount.toLocaleString()}` : 'FREE',
                day: promo.day_of_week?.toLowerCase(),
                area: promo.area?.toLowerCase(),
                drinkType: promo.drink_type?.toLowerCase()
              }} 
              onClaim={onClaimPromo} 
            />
          ))}
        </div>
      </div>
    </div>
  );
};
