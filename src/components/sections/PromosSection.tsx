import { Tables } from "../../integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { PromoReviewPanel } from "@/components/PromoReviewPanel";
import { Input } from "@/components/ui/input";
import { PromoCard } from "@/components/PromoCard";
import { CreatePromoForm } from "@/components/CreatePromoForm";
import { SpinningPaws } from "@/components/ui/spinning-paws";
import { ContinuousStarfield } from "@/components/ContinuousStarfield";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from "@/components/ui/select";
import { AreaFilterList } from "@/components/ui/area-filter";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { LoginDialog } from "@/components/LoginDialog";
import { Star, Lock, Filter, RotateCcw, ArrowUpDown, Download, Search, ClipboardCheck } from "lucide-react";
import { exportPromosToExcel } from "@/lib/promo-export";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { User } from "@supabase/supabase-js";
import { PROMO_TYPES as PROMO_TYPE_LIST } from "@/lib/promo-types";


interface PromosSectionProps {
  promos: Tables<'promos'>[];
  filteredPromos: Tables<'promos'>[];
  showCreatePromo: boolean;
  dayFilter: string[];
  areaFilter: string[];
  drinkTypeFilter: string[];
  promoTypeFilter: string[];
  sortBy: string;
  searchQuery: string;
  loading?: boolean;
  onToggleCreatePromo: () => void;
  onDayFilterChange: (filter: string[]) => void;
  onAreaFilterChange: (filter: string[]) => void;
  onDrinkTypeFilterChange: (filter: string[]) => void;
  onPromoTypeFilterChange: (filter: string[]) => void;
  onSortChange: (sort: string) => void;
  onSearchChange: (query: string) => void;
  userAdminStatus?: { is_admin: boolean; is_super_admin: boolean } | null;
  onFavoriteToggle?: (promoId: string, isFavorite: boolean) => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
}

export const PromosSection = ({ 
  promos,
  filteredPromos,
  showCreatePromo,
  dayFilter,
  areaFilter,
  drinkTypeFilter,
  promoTypeFilter,
  sortBy,
  searchQuery,
  loading = false,
  onToggleCreatePromo,
  onDayFilterChange,
  onAreaFilterChange,
  onDrinkTypeFilterChange,
  onPromoTypeFilterChange,
  onSortChange,
  onSearchChange,
  userAdminStatus,
  onFavoriteToggle,
  onLoadMore,
  hasMore = false
}: PromosSectionProps) => {
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [reviewMode, setReviewMode] = useState(false);
  const [selectedPromoId, setSelectedPromoId] = useState<string | null>(null);
  const [localPromos, setLocalPromos] = useState(filteredPromos);

  // Sync localPromos with filteredPromos
  useEffect(() => {
    setLocalPromos(filteredPromos);
  }, [filteredPromos]);
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
    onPromoTypeFilterChange(["all"]);
  };

  const hasActiveFilters = !dayFilter.includes("all") || !areaFilter.includes("all") || !drinkTypeFilter.includes("all") || !promoTypeFilter.includes("all");

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

  const drinkTypeOptions = [
    { id: 'all', label: 'All Types' },
    ...PROMO_TYPE_LIST.map(t => ({ id: t, label: t }))
  ];

  return (
    <div className="relative">
      <ContinuousStarfield />
      <div className="pt-20 px-4 sm:px-6 md:px-8 relative z-10">
        <div className="container mx-auto space-y-6 sm:space-y-8">
        <div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-[#00CFFF] to-[#4F8EFF] bg-clip-text text-transparent mb-2">Hot Promos</h2>
          <p className="text-sm sm:text-base md:text-lg text-white/80 mb-4 sm:mb-6">Go big without going broke with these amazing deals!</p>
          {!user && (
            <Button
              onClick={handleCreatePromoClick}
              size="lg"
              className="bg-gradient-to-r from-neon-blue to-neon-cyan text-white hover:opacity-90 min-h-[44px]"
            >
              <Lock className="w-5 h-5 mr-2" />
              Login to Create Promo
            </Button>
          )}
          {user && (
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={handleCreatePromoClick}
                size="lg"
                className="bg-primary hover:bg-primary/90 text-primary-foreground min-h-[44px]"
              >
                <Star className="w-5 h-5 mr-2" />
                Create Promo
              </Button>
              {(userAdminStatus?.is_admin || userAdminStatus?.is_super_admin) && (
                <>
                  <Button
                    onClick={async () => {
                      const { data: allPromos, error } = await supabase.rpc('get_promos_simple');
                      if (error) {
                        toast({ title: "Export failed", description: error.message, variant: "destructive" });
                        return;
                      }
                      exportPromosToExcel((allPromos || []) as Tables<'promos'>[]);
                    }}
                    size="lg"
                    variant="outline"
                    className="min-h-[44px]"
                  >
                    <Download className="w-5 h-5 mr-2" />
                    Export to Excel
                  </Button>
                  <Button
                    onClick={() => setReviewMode(!reviewMode)}
                    size="lg"
                    variant={reviewMode ? "default" : "outline"}
                    className="min-h-[44px]"
                  >
                    <ClipboardCheck className="w-5 h-5 mr-2" />
                    {reviewMode ? "Exit Review" : "Review Categories"}
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
        {showCreatePromo && (
          <div className="mb-8">
            <CreatePromoForm />
          </div>
        )}

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search venue, area, or keyword..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 glass-control"
          />
        </div>

        {/* Filters and Sort */}
        <div className="flex flex-wrap gap-4 mb-6 items-end">
          <div className="flex flex-col space-y-2">
            <label className="text-sm font-medium text-white/90">
              <Filter className="w-4 h-4 inline mr-1" />
              Day
            </label>
            <Select>
              <SelectTrigger className="glass-control">
                <SelectValue placeholder={getFilterDisplayText(dayFilter, "All days")} />
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
                <SelectValue placeholder={getFilterDisplayText(areaFilter, "All areas")} />
              </SelectTrigger>
              <SelectContent>
                <AreaFilterList
                  selectedValues={areaFilter.includes("all") ? [] : areaFilter}
                  onToggle={(val) => {
                    const current = areaFilter.filter(f => f !== "all");
                    if (current.includes(val)) {
                      const next = current.filter(f => f !== val);
                      onAreaFilterChange(next.length === 0 ? ["all"] : next);
                    } else {
                      onAreaFilterChange([...current, val]);
                    }
                  }}
                  showAll
                  allChecked={areaFilter.includes("all")}
                  onAllToggle={() => onAreaFilterChange(["all"])}
                />
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
                <SelectValue placeholder={getFilterDisplayText(drinkTypeFilter, "All types")} />
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
              <Filter className="w-4 h-4 inline mr-1" />
              Promo Type
            </label>
            <Select>
              <SelectTrigger className="glass-control">
                <SelectValue placeholder={getFilterDisplayText(promoTypeFilter, "All types")} />
              </SelectTrigger>
              <SelectContent>
                <div className="p-2 space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="all-promo-types"
                      checked={promoTypeFilter.includes("all")}
                      onCheckedChange={(checked) => {
                        if (checked) onPromoTypeFilterChange(["all"]);
                      }}
                    />
                    <Label htmlFor="all-promo-types" className="text-sm">All types</Label>
                  </div>
                  {PROMO_TYPE_LIST.map((type) => (
                    <div key={type} className="flex items-center space-x-2">
                      <Checkbox
                        id={`promo-type-${type}`}
                        checked={promoTypeFilter.includes(type)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            const newFilters = promoTypeFilter.filter(f => f !== "all");
                            onPromoTypeFilterChange([...newFilters, type]);
                          } else {
                            const newFilters = promoTypeFilter.filter(f => f !== type);
                            onPromoTypeFilterChange(newFilters.length === 0 ? ["all"] : newFilters);
                          }
                        }}
                      />
                      <Label htmlFor={`promo-type-${type}`} className="text-sm">
                        {type}
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
            <div className="col-span-full text-center py-16 sm:py-20 px-4">
              <div className="max-w-md mx-auto space-y-4">
                <div className="text-6xl mb-4">🍹</div>
                <h3 className="text-xl sm:text-2xl font-bold text-white">No promos match your filters</h3>
                <p className="text-sm sm:text-base text-muted-foreground">
                  Try adjusting your filters to discover amazing drink deals and promotions! 🎊
                </p>
                {hasActiveFilters && (
                  <Button 
                    onClick={resetAllFilters}
                    variant="default"
                    size="lg"
                    className="mt-4"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Reset All Filters
                  </Button>
                )}
              </div>
            </div>
          ) : (
            localPromos.map((promo, index) => (
               <PromoCard 
                key={promo.id} 
                promo={{
                  ...promo,
                  discount: promo.discount_text || "",
                  venue: promo.venue_name || "",
                  validUntil: promo.valid_until || "",
                  image: promo.image_url || "",
                  category: promo.category || "",
                  promoType: promo.promo_type || "",
                  day: promo.day_of_week || [],
                  area: promo.area || "",
                  drinkType: promo.drink_type || []
                }}
                userAdminStatus={userAdminStatus}
                onFavoriteToggle={onFavoriteToggle}
                index={index}
                isSelected={reviewMode && promo.id === selectedPromoId}
              />
            ))
          )}
        </div>

        {/* Load More Button */}
        {!loading && hasMore && filteredPromos.length > 0 && (
          <div className="flex justify-center mt-8">
            <Button onClick={onLoadMore} size="lg" variant="outline">
              Load More Promos
            </Button>
          </div>
        )}
        
        <LoginDialog
          open={showLoginDialog} 
          onOpenChange={setShowLoginDialog}
          onSuccess={() => {
            setShowLoginDialog(false);
            onToggleCreatePromo();
          }}
        />
        
        {reviewMode && (userAdminStatus?.is_admin || userAdminStatus?.is_super_admin) && (
          <PromoReviewPanel
            promos={localPromos.map(p => ({
              id: p.id,
              title: p.title,
              venue_name: p.venue_name,
              category: p.promo_type,
            }))}
            onClose={() => {
              setReviewMode(false);
              setSelectedPromoId(null);
            }}
            selectedPromoId={selectedPromoId}
            onSelectedChange={setSelectedPromoId}
            onCategoryUpdated={(promoId, newCategory) => {
              setLocalPromos(prev =>
                prev.map(p => p.id === promoId ? { ...p, promo_type: newCategory } : p)
              );
            }}
          />
        )}
      </div>
      </div>
    </div>
  );
};
