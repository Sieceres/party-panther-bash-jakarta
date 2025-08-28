import { Tables } from "../../integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { PromoCard } from "@/components/PromoCard";
import { CreatePromoForm } from "@/components/CreatePromoForm";
import { SpinningPaws } from "@/components/ui/spinning-paws";
import { Checkbox } from "@/components/ui/checkbox";
import { Filter, Star, Lock, X, RotateCcw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { User } from "@supabase/supabase-js";

interface PromosSectionProps {
  promos: Tables<'promos'>[];
  filteredPromos: Tables<'promos'>[];
  showCreatePromo: boolean;
  dayFilter: string[];
  areaFilter: string[];
  drinkTypeFilter: string[];
  loading?: boolean;
  onToggleCreatePromo: () => void;
  onClaimPromo: (promoId: string) => void;
  onDayFilterChange: (filters: string[]) => void;
  onAreaFilterChange: (filters: string[]) => void;
  onDrinkTypeFilterChange: (filters: string[]) => void;
}

export const PromosSection = ({ 
  filteredPromos,
  showCreatePromo,
  dayFilter,
  areaFilter,
  drinkTypeFilter,
  loading = false,
  onToggleCreatePromo,
  onClaimPromo,
  onDayFilterChange,
  onAreaFilterChange,
  onDrinkTypeFilterChange
}: PromosSectionProps) => {
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);

  const handleCreatePromoClick = () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to create a promo.",
        variant: "destructive"
      });
      return;
    }
    onToggleCreatePromo();
  };

  const resetAllFilters = () => {
    onDayFilterChange([]);
    onAreaFilterChange([]);
    onDrinkTypeFilterChange([]);
  };

  const hasActiveFilters = dayFilter.length > 0 || areaFilter.length > 0 || drinkTypeFilter.length > 0;

  const dayOptions = [
    { id: 'monday', label: 'Monday' },
    { id: 'tuesday', label: 'Tuesday' },
    { id: 'wednesday', label: 'Wednesday' },
    { id: 'thursday', label: 'Thursday' },
    { id: 'friday', label: 'Friday' },
    { id: 'saturday', label: 'Saturday' },
    { id: 'sunday', label: 'Sunday' }
  ];

  const areaOptions = [
    { id: 'north', label: 'North Jakarta' },
    { id: 'south', label: 'South Jakarta' },
    { id: 'east', label: 'East Jakarta' },
    { id: 'west', label: 'West Jakarta' },
    { id: 'central', label: 'Central Jakarta' }
  ];

  const drinkTypeOptions = [
    { id: 'Free Flow', label: 'Free Flow' },
    { id: 'Ladies Night', label: 'Ladies Night' },
    { id: 'Bottle Promo', label: 'Bottle Promo' },
    { id: 'Other', label: 'Other' }
  ];

  const handleDayChange = (dayId: string, checked: boolean) => {
    if (checked) {
      onDayFilterChange([...dayFilter, dayId]);
    } else {
      onDayFilterChange(dayFilter.filter(d => d !== dayId));
    }
  };

  const handleAreaChange = (areaId: string, checked: boolean) => {
    if (checked) {
      onAreaFilterChange([...areaFilter, areaId]);
    } else {
      onAreaFilterChange(areaFilter.filter(a => a !== areaId));
    }
  };

  const handleDrinkTypeChange = (typeId: string, checked: boolean) => {
    if (checked) {
      onDrinkTypeFilterChange([...drinkTypeFilter, typeId]);
    } else {
      onDrinkTypeFilterChange(drinkTypeFilter.filter(t => t !== typeId));
    }
  };

  return (
    <div className="pt-20 px-4">
      <div className="container mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-4xl font-bold gradient-text mb-2">Hot Promos</h2>
            <p className="text-muted-foreground">Save money while partying with these exclusive deals</p>
          </div>
          <Button
            onClick={handleCreatePromoClick}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            {user ? (
              <>
                <Star className="w-4 h-4 mr-2" />
                Create Promo
              </>
            ) : (
              <>
                <Lock className="w-4 h-4 mr-2" />
                Login to Create Promo
              </>
            )}
          </Button>
        </div>

        {showCreatePromo && (
          <div className="mb-8">
            <CreatePromoForm />
          </div>
        )}

        {/* Filter Controls */}
        <div className="p-6 bg-card rounded-lg border">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Filter by:</span>
            </div>
            {hasActiveFilters && (
              <Button
                variant="outline"
                size="sm"
                onClick={resetAllFilters}
                className="text-xs"
              >
                <RotateCcw className="w-3 h-3 mr-1" />
                Reset Filters
              </Button>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Day Filter */}
            <div>
              <h4 className="font-medium mb-3">Day of Week</h4>
              <div className="space-y-2">
                {dayOptions.map(day => (
                  <div key={day.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`day-${day.id}`}
                      checked={dayFilter.includes(day.id)}
                      onCheckedChange={(checked) => handleDayChange(day.id, !!checked)}
                    />
                    <label
                      htmlFor={`day-${day.id}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {day.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Area Filter */}
            <div>
              <h4 className="font-medium mb-3">Area</h4>
              <div className="space-y-2">
                {areaOptions.map(area => (
                  <div key={area.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`area-${area.id}`}
                      checked={areaFilter.includes(area.id)}
                      onCheckedChange={(checked) => handleAreaChange(area.id, !!checked)}
                    />
                    <label
                      htmlFor={`area-${area.id}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {area.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Drink Type Filter */}
            <div>
              <h4 className="font-medium mb-3">Promo Type</h4>
              <div className="space-y-2">
                {drinkTypeOptions.map(type => (
                  <div key={type.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`type-${type.id}`}
                      checked={drinkTypeFilter.includes(type.id)}
                      onCheckedChange={(checked) => handleDrinkTypeChange(type.id, !!checked)}
                    />
                    <label
                      htmlFor={`type-${type.id}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {type.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <div className="col-span-full flex justify-center items-center py-20">
            <SpinningPaws size="lg" />
          </div>
        ) : filteredPromos.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPromos.map((promo) => (
              <PromoCard 
                key={promo.id} 
                promo={{
                  ...promo,
                  discount: promo.discount_text,
                  venue: promo.venue_name,
                  validUntil: promo.valid_until,
                  image: promo.image_url || 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800&h=600&fit=crop',
                  originalPrice: promo.original_price_amount ? `IDR ${promo.original_price_amount.toLocaleString()}` : 'N/A',
                  discountedPrice: promo.discounted_price_amount ? `IDR ${promo.discounted_price_amount.toLocaleString()}` : 'FREE',
                  day: promo.day_of_week?.toLowerCase(),
                  area: promo.area?.toLowerCase(),
                  drinkType: promo.drink_type?.toLowerCase(),
                  created_by: promo.created_by
                }}
                onClaim={onClaimPromo} 
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 space-y-4">
            <div className="w-24 h-24 mx-auto rounded-full bg-muted/20 flex items-center justify-center">
              <X className="w-12 h-12 text-muted-foreground" />
            </div>
            <h3 className="text-2xl font-semibold text-muted-foreground">No promos found</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              We couldn't find any promos matching your current filters. Try adjusting your selection or check back later for new deals.
            </p>
            {hasActiveFilters && (
              <Button
                variant="outline"
                onClick={resetAllFilters}
                className="mt-4"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset all filters
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};