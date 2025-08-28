import { Tables } from "../../integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { PromoCard } from "@/components/PromoCard";
import { CreatePromoForm } from "@/components/CreatePromoForm";
import { SpinningPaws } from "@/components/ui/spinning-paws";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Filter, Star, Lock, RotateCcw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { User } from "@supabase/supabase-js";

interface PromosSectionProps {
  promos: Tables<'promos'>[];
  filteredPromos: Tables<'promos'>[];
  showCreatePromo: boolean;
  dayFilter: string;
  areaFilter: string;
  drinkTypeFilter: string;
  loading?: boolean;
  onToggleCreatePromo: () => void;
  onClaimPromo: (promoId: string) => void;
  onDayFilterChange: (filter: string) => void;
  onAreaFilterChange: (filter: string) => void;
  onDrinkTypeFilterChange: (filter: string) => void;
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
    onDayFilterChange("all");
    onAreaFilterChange("all");
    onDrinkTypeFilterChange("all");
  };

  const hasActiveFilters = dayFilter !== "all" || areaFilter !== "all" || drinkTypeFilter !== "all";

  const dayOptions = [
    { id: 'all', label: 'All Days' },
    { id: 'monday', label: 'Monday' },
    { id: 'tuesday', label: 'Tuesday' },
    { id: 'wednesday', label: 'Wednesday' },
    { id: 'thursday', label: 'Thursday' },
    { id: 'friday', label: 'Friday' },
    { id: 'saturday', label: 'Saturday' },
    { id: 'sunday', label: 'Sunday' }
  ];

  const areaOptions = [
    { id: 'all', label: 'All Areas' },
    { id: 'north', label: 'North Jakarta' },
    { id: 'south', label: 'South Jakarta' },
    { id: 'east', label: 'East Jakarta' },
    { id: 'west', label: 'West Jakarta' },
    { id: 'central', label: 'Central Jakarta' }
  ];

  const drinkTypeOptions = [
    { id: 'all', label: 'All Types' },
    { id: 'Free Flow', label: 'Free Flow' },
    { id: 'Ladies Night', label: 'Ladies Night' },
    { id: 'Bottle Promo', label: 'Bottle Promo' },
    { id: 'Other', label: 'Other' }
  ];


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
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Day Filter */}
            <div>
              <Select value={dayFilter} onValueChange={onDayFilterChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select day" />
                </SelectTrigger>
                <SelectContent>
                  {dayOptions.map(day => (
                    <SelectItem key={day.id} value={day.id}>
                      {day.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Area Filter */}
            <div>
              <Select value={areaFilter} onValueChange={onAreaFilterChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select area" />
                </SelectTrigger>
                <SelectContent>
                  {areaOptions.map(area => (
                    <SelectItem key={area.id} value={area.id}>
                      {area.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Drink Type Filter */}
            <div>
              <Select value={drinkTypeFilter} onValueChange={onDrinkTypeFilterChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select promo type" />
                </SelectTrigger>
                <SelectContent>
                  {drinkTypeOptions.map(type => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
            <h3 className="text-2xl font-semibold text-muted-foreground">No corresponding promo found</h3>
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
                Reset filters
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};