import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { BasicPromoInfo } from "./form-components/BasicPromoInfo";
import { PromoDiscount } from "./form-components/PromoDiscount";
import { LocationSelector } from "./form-components/LocationSelector";
import { PromoPricing } from "./form-components/PromoPricing";
import { PromoDetails } from "./form-components/PromoDetails";
import { ImageUpload } from "./form-components/ImageUpload";

export const CreatePromoForm = () => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validUntilDate, setValidUntilDate] = useState<Date>();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    discount: "",
    venue: "",
    address: "",
    category: "",
    originalPrice: "",
    discountedPrice: "",
    dayOfWeek: "",
    area: "",
    drinkType: "",
    image: ""
  });
  const [location, setLocation] = useState<{ lat: number; lng: number; address: string } | null>(null);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please log in to create a promo.",
          variant: "destructive"
        });
        return;
      }

      const { error } = await supabase.from('promos').insert({
        title: formData.title,
        description: formData.description,
        discount_text: formData.discount,
        venue_name: formData.venue,
        venue_address: formData.address,
        venue_latitude: location?.lat,
        venue_longitude: location?.lng,
        category: formData.category,
        original_price_amount: formData.originalPrice ? parseInt(formData.originalPrice.replace(/[^0-9]/g, '')) : null,
        discounted_price_amount: formData.discountedPrice ? parseInt(formData.discountedPrice.replace(/[^0-9]/g, '')) : null,
        valid_until: validUntilDate?.toISOString().split('T')[0],
        day_of_week: formData.dayOfWeek,
        area: formData.area,
        drink_type: formData.drinkType,
        image_url: formData.image,
        created_by: user.id
      });

      if (error) throw error;

      toast({
        title: "Promo Created! 🎉",
        description: "Your promo has been submitted for review and will be live soon.",
      });

      // Reset form
      setFormData({
        title: "",
        description: "",
        discount: "",
        venue: "",
        address: "",
        category: "",
        originalPrice: "",
        discountedPrice: "",
        dayOfWeek: "",
        area: "",
        drinkType: "",
        image: ""
      });
      setValidUntilDate(undefined);
      setLocation(null);
    } catch (error) {
      console.error('Error creating promo:', error);
      toast({
        title: "Error",
        description: "Failed to create promo. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-2xl">
            <Star className="w-6 h-6 text-primary" />
            <span>Create New Promo</span>
          </CardTitle>
          <p className="text-muted-foreground">
            Share exclusive deals and discounts with Jakarta's party community!
          </p>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <BasicPromoInfo
              title={formData.title}
              description={formData.description}
              onTitleChange={(value) => handleInputChange("title", value)}
              onDescriptionChange={(value) => handleInputChange("description", value)}
            />

            <PromoDiscount
              discount={formData.discount}
              venue={formData.venue}
              address={formData.address}
              onDiscountChange={(value) => handleInputChange("discount", value)}
              onVenueChange={(value) => handleInputChange("venue", value)}
              onAddressChange={(value) => handleInputChange("address", value)}
            />

            <LocationSelector
              location={location}
              onLocationSelect={setLocation}
            />

            <PromoPricing
              originalPrice={formData.originalPrice}
              discountedPrice={formData.discountedPrice}
              onOriginalPriceChange={(value) => handleInputChange("originalPrice", value)}
              onDiscountedPriceChange={(value) => handleInputChange("discountedPrice", value)}
            />

            <PromoDetails
              validUntilDate={validUntilDate}
              category={formData.category}
              dayOfWeek={formData.dayOfWeek}
              area={formData.area}
              drinkType={formData.drinkType}
              onValidUntilChange={setValidUntilDate}
              onCategoryChange={(value) => handleInputChange("category", value)}
              onDayOfWeekChange={(value) => handleInputChange("dayOfWeek", value)}
              onAreaChange={(value) => handleInputChange("area", value)}
              onDrinkTypeChange={(value) => handleInputChange("drinkType", value)}
            />

            <ImageUpload
              label="Promo Image"
              imageUrl={formData.image}
              onImageChange={(value) => handleInputChange("image", value)}
              inputId="promo-image"
            />

            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 neon-glow"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Creating Promo..." : "Create Promo"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};