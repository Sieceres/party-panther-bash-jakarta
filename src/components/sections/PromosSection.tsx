import { Tables } from "../../integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { PromoCard } from "@/components/PromoCard";
import { CreatePromoForm } from "@/components/CreatePromoForm";
import { SpinningPaws } from "@/components/ui/spinning-paws";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { LoginDialog } from "@/components/LoginDialog";
import { Star, Lock, Filter, RotateCcw } from "lucide-react";
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
  const [showLoginDialog, setShowLoginDialog] = useState(false);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);

  const handleCreatePromoClick = () => {
    if (!user) {
      setShowLoginDialog(true);
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

        {/* Dropdown and Checkbox Filters */}
        <div className="space-y-6 mb-6">
          {/* Dropdown Filters */}
          <div className="flex flex-wrap gap-4">
            <div className="flex flex-col space-y-2">
              <label className="text-sm font-medium">Day</label>
              <Select value={dayFilter} onValueChange={onDayFilterChange}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All days" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All days</SelectItem>
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
            
            <div className="flex flex-col space-y-2">
              <label className="text-sm font-medium">Area</label>
              <Select value={areaFilter} onValueChange={onAreaFilterChange}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All areas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All areas</SelectItem>
                  <SelectItem value="central">Central</SelectItem>
                  <SelectItem value="south">South</SelectItem>
                  <SelectItem value="north">North</SelectItem>
                  <SelectItem value="east">East</SelectItem>
                  <SelectItem value="west">West</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex flex-col space-y-2">
              <label className="text-sm font-medium">Drink Type</label>
              <Select value={drinkTypeFilter} onValueChange={onDrinkTypeFilterChange}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  <SelectItem value="beer">Beer</SelectItem>
                  <SelectItem value="cocktails">Cocktails</SelectItem>
                  <SelectItem value="wine">Wine</SelectItem>
                  <SelectItem value="spirits">Spirits</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Checkbox Filters */}
          <div className="border border-border rounded-lg p-4 bg-card">
            <h3 className="text-sm font-medium mb-3">Quick Filters</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {/* Day Checkboxes */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Days</Label>
                {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((day) => (
                  <div key={day} className="flex items-center space-x-2">
                    <Checkbox
                      id={day.toLowerCase()}
                      checked={dayFilter === day.toLowerCase()}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          onDayFilterChange(day.toLowerCase());
                        } else if (dayFilter === day.toLowerCase()) {
                          onDayFilterChange("all");
                        }
                      }}
                    />
                    <Label htmlFor={day.toLowerCase()} className="text-xs">
                      {day}
                    </Label>
                  </div>
                ))}
              </div>

              {/* Area Checkboxes */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Areas</Label>
                {["Central", "South", "North", "East", "West"].map((area) => (
                  <div key={area} className="flex items-center space-x-2">
                    <Checkbox
                      id={area.toLowerCase()}
                      checked={areaFilter === area.toLowerCase()}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          onAreaFilterChange(area.toLowerCase());
                        } else if (areaFilter === area.toLowerCase()) {
                          onAreaFilterChange("all");
                        }
                      }}
                    />
                    <Label htmlFor={area.toLowerCase()} className="text-xs">
                      {area}
                    </Label>
                  </div>
                ))}
              </div>

              {/* Drink Type Checkboxes */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Drinks</Label>
                {["Beer", "Cocktails", "Wine", "Spirits"].map((drink) => (
                  <div key={drink} className="flex items-center space-x-2">
                    <Checkbox
                      id={drink.toLowerCase()}
                      checked={drinkTypeFilter === drink.toLowerCase()}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          onDrinkTypeFilterChange(drink.toLowerCase());
                        } else if (drinkTypeFilter === drink.toLowerCase()) {
                          onDrinkTypeFilterChange("all");
                        }
                      }}
                    />
                    <Label htmlFor={drink.toLowerCase()} className="text-xs">
                      {drink}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-full flex justify-center items-center py-20">
              <SpinningPaws size="lg" />
            </div>
          ) : filteredPromos.length === 0 ? (
            <div className="col-span-full text-center py-20">
              <h3 className="text-xl font-semibold mb-2">No promos found</h3>
              <p className="text-muted-foreground mb-4">
                Try adjusting your filters to see more promotions.
              </p>
              <Button 
                onClick={() => {
                  onDayFilterChange("all");
                  onAreaFilterChange("all");
                  onDrinkTypeFilterChange("all");
                }}
                variant="outline"
              >
                Reset filters
              </Button>
            </div>
          ) : (
            filteredPromos.map((promo) => (
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
            ))
          )}
        </div>
        
        <LoginDialog 
          open={showLoginDialog} 
          onOpenChange={setShowLoginDialog}
          onSuccess={() => {
            setShowLoginDialog(false);
            onToggleCreatePromo();
          }}
        />
      </div>
    </div>
  );
};