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
import { Star, Lock, Filter, RotateCcw, ArrowUpDown } from "lucide-react";
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
  sortBy: string;
  loading?: boolean;
  onToggleCreatePromo: () => void;
  onDayFilterChange: (filter: string[]) => void;
  onAreaFilterChange: (filter: string[]) => void;
  onDrinkTypeFilterChange: (filter: string[]) => void;
  onSortChange: (sort: string) => void;
  userAdminStatus?: { is_admin: boolean; is_super_admin: boolean } | null;
  onFavoriteToggle?: (promoId: string, isFavorite: boolean) => void;
}

export const PromosSection = ({ 
  filteredPromos,
  showCreatePromo,
  dayFilter,
  areaFilter,
  drinkTypeFilter,
  sortBy,
  loading = false,
  onToggleCreatePromo,
  onDayFilterChange,
  onAreaFilterChange,
  onDrinkTypeFilterChange,
  onSortChange,
  userAdminStatus,
  onFavoriteToggle
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
    onDayFilterChange(["all"]);
    onAreaFilterChange(["all"]);
    onDrinkTypeFilterChange(["all"]);
  };

  const hasActiveFilters = !dayFilter.includes("all") || !areaFilter.includes("all") || !drinkTypeFilter.includes("all");

  const getFilterDisplayText = (filters: string[], allLabel: string) => {
    if (filters.includes("all") || filters.length === 0) return allLabel;
    if (filters.length === 1) return filters[0].charAt(0).toUpperCase() + filters[0].slice(1);
    return `${filters.length} selected`;
  };

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
    <div className="pt-20 px-4 sm:px-6 md:px-8">
      <div className="container mx-auto space-y-6 sm:space-y-8">
        <div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-[#00CFFF] to-[#4F8EFF] bg-clip-text text-transparent mb-2">Hot Promos</h2>
          <p className="text-sm sm:text-base md:text-lg text-white/80 mb-4 sm:mb-6">Go big without going broke with these amazing deals!</p>
          {!user && (
            <Button
              onClick={handleCreatePromoClick}
              className="bg-gradient-to-r from-neon-blue to-neon-cyan text-white hover:opacity-90"
            >
              <Lock className="w-4 h-4 mr-2" />
              Login to Create Promo
            </Button>
          )}
          {user && (
            <Button
              onClick={handleCreatePromoClick}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <Star className="w-4 h-4 mr-2" />
              Create Promo
            </Button>
          )}
        </div>

        {showCreatePromo && (
          <div className="mb-8">
            <CreatePromoForm />
          </div>
        )}

        {/* Filters and Sort */}
        <div className="flex flex-wrap gap-4 mb-6 items-end">
          <div className="flex flex-col space-y-2">
            <label className="text-sm font-medium text-white/90">
              <Filter className="w-4 h-4 inline mr-1" />
              Day
            </label>
            <Select>
              <SelectTrigger className="glass-control">
                <SelectValue>{getFilterDisplayText(dayFilter, "All days")}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <div className="p-2 space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="all-days"
                      checked={dayFilter.includes("all")}
                      onCheckedChange={(checked) => {
                        if (checked) onDayFilterChange(["all"]);
                      }}
                    />
                    <Label htmlFor="all-days" className="text-sm">All days</Label>
                  </div>
                  {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((day) => (
                    <div key={day} className="flex items-center space-x-2">
                      <Checkbox
                        id={`day-${day.toLowerCase()}`}
                        checked={dayFilter.includes(day.toLowerCase())}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            const newFilters = dayFilter.filter(f => f !== "all");
                            onDayFilterChange([...newFilters, day.toLowerCase()]);
                          } else {
                            const newFilters = dayFilter.filter(f => f !== day.toLowerCase());
                            onDayFilterChange(newFilters.length === 0 ? ["all"] : newFilters);
                          }
                        }}
                      />
                      <Label htmlFor={`day-${day.toLowerCase()}`} className="text-sm">
                        {day}
                      </Label>
                    </div>
                  ))}
                </div>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex flex-col space-y-2">
            <label className="text-sm font-medium text-white/90">
              <Filter className="w-4 h-4 inline mr-1" />
              Area
            </label>
            <Select>
              <SelectTrigger className="glass-control">
                <SelectValue>{getFilterDisplayText(areaFilter, "All areas")}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <div className="p-2 space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="all-areas"
                      checked={areaFilter.includes("all")}
                      onCheckedChange={(checked) => {
                        if (checked) onAreaFilterChange(["all"]);
                      }}
                    />
                    <Label htmlFor="all-areas" className="text-sm">All areas</Label>
                  </div>
                  {["Central", "South", "North", "East", "West"].map((area) => (
                    <div key={area} className="flex items-center space-x-2">
                      <Checkbox
                        id={`area-${area.toLowerCase()}`}
                        checked={areaFilter.includes(area.toLowerCase())}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            const newFilters = areaFilter.filter(f => f !== "all");
                            onAreaFilterChange([...newFilters, area.toLowerCase()]);
                          } else {
                            const newFilters = areaFilter.filter(f => f !== area.toLowerCase());
                            onAreaFilterChange(newFilters.length === 0 ? ["all"] : newFilters);
                          }
                        }}
                      />
                      <Label htmlFor={`area-${area.toLowerCase()}`} className="text-sm">
                        {area}
                      </Label>
                    </div>
                  ))}
                </div>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex flex-col space-y-2">
            <label className="text-sm font-medium text-white/90">
              <Filter className="w-4 h-4 inline mr-1" />
              Drink Type
            </label>
            <Select>
              <SelectTrigger className="glass-control">
                <SelectValue>{getFilterDisplayText(drinkTypeFilter, "All types")}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <div className="p-2 space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="all-drinks"
                      checked={drinkTypeFilter.includes("all")}
                      onCheckedChange={(checked) => {
                        if (checked) onDrinkTypeFilterChange(["all"]);
                      }}
                    />
                    <Label htmlFor="all-drinks" className="text-sm">All types</Label>
                  </div>
                  {["Beer", "Cocktails", "Wine", "Spirits"].map((drink) => (
                    <div key={drink} className="flex items-center space-x-2">
                      <Checkbox
                        id={`drink-${drink.toLowerCase()}`}
                        checked={drinkTypeFilter.includes(drink.toLowerCase())}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            const newFilters = drinkTypeFilter.filter(f => f !== "all");
                            onDrinkTypeFilterChange([...newFilters, drink.toLowerCase()]);
                          } else {
                            const newFilters = drinkTypeFilter.filter(f => f !== drink.toLowerCase());
                            onDrinkTypeFilterChange(newFilters.length === 0 ? ["all"] : newFilters);
                          }
                        }}
                      />
                      <Label htmlFor={`drink-${drink.toLowerCase()}`} className="text-sm">
                        {drink}
                      </Label>
                    </div>
                  ))}
                </div>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex flex-col space-y-2">
            <label className="text-sm font-medium text-white/90">
              <ArrowUpDown className="w-4 h-4 inline mr-1" />
              Sort By
            </label>
            <Select value={sortBy} onValueChange={onSortChange}>
              <SelectTrigger className="glass-control w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="title-az">Title: A-Z</SelectItem>
                <SelectItem value="title-za">Title: Z-A</SelectItem>
                <SelectItem value="valid-until">Valid Until</SelectItem>
              </SelectContent>
            </Select>
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
                  onDayFilterChange(["all"]);
                  onAreaFilterChange(["all"]);
                  onDrinkTypeFilterChange(["all"]);
                }}
                variant="outline"
              >
                Reset filters
              </Button>
            </div>
          ) : (
            filteredPromos.map((promo, index) => (
               <PromoCard 
                key={promo.id} 
                promo={{
                  ...promo,
                  discount: promo.discount_text || "",
                  venue: promo.venue_name || "",
                  validUntil: promo.valid_until || "",
                  image: promo.image_url || "",
                  category: promo.category || "",
                  day: promo.day_of_week || [],
                  area: promo.area || "",
                  drinkType: promo.drink_type || []
                }}
                userAdminStatus={userAdminStatus}
                onFavoriteToggle={onFavoriteToggle}
                index={index}
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
