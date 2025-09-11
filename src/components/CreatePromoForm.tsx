import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [validUntilDate, setValidUntilDate] = useState<Date>();
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    venue: "",
    address: "",
    promoType: "",
    dayOfWeek: [] as string[],
    area: "",
    drinkType: [] as string[],
    image: ""
  });
  const [location, setLocation] = useState<{ lat: number; lng: number; address: string } | null>(null);

  const handleInputChange = (field: string, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasUnsavedChanges(true);
    // Clear errors when user starts typing
    if (formErrors.length > 0) {
      setFormErrors([]);
    }
  };

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = 'If you leave the page, your promo will not be saved. Are you sure you want to exit?';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const validateForm = () => {
    const errors = [];
    
    if (!formData.title.trim()) errors.push("Title is required");
    if (!formData.description.trim()) errors.push("Description is required");
    if (!formData.venue.trim()) errors.push("Venue name is required");
    if (!formData.promoType) errors.push("Promo type is required");
    
    return errors;
  };

  const isFormValid = () => {
    return formData.title.trim() && 
           formData.description.trim() && 
           formData.venue.trim() && 
           formData.promoType;
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
        setIsSubmitting(false);
        return;
      }

      // Validate all required fields
      const validationErrors = validateForm();
      if (validationErrors.length > 0) {
        setFormErrors(validationErrors);
        toast({
          title: "Please fill in all required fields",
          description: validationErrors.join(", "),
          variant: "destructive"
        });
        setIsSubmitting(false);
        return;
      }

      const { error } = await supabase.from('promos').insert({
        title: formData.title,
        description: formData.description,
        discount_text: formData.promoType, // Use promo type as discount text
        venue_name: formData.venue,
        venue_address: formData.address,
        venue_latitude: location?.lat,
        venue_longitude: location?.lng,
        promo_type: formData.promoType,
        price_currency: "IDR",
        valid_until: validUntilDate?.toISOString(),
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

      setHasUnsavedChanges(false);
      setTimeout(() => {
        navigate('/?section=promos');
      }, 1000);
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
              venue={formData.venue}
              address={formData.address}
              onVenueChange={(value) => handleInputChange("venue", value)}
              onAddressChange={(value) => handleInputChange("address", value)}
            />

            <LocationSelector
              location={location}
              onLocationSelect={setLocation}
            />

            <PromoDetails
              validUntilDate={validUntilDate}
              promoType={formData.promoType}
              dayOfWeek={formData.dayOfWeek}
              area={formData.area}
              drinkType={formData.drinkType}
              onValidUntilChange={(date) => {
                setValidUntilDate(date);
                if (formErrors.length > 0) {
                  setFormErrors([]);
                }
              }}
              onPromoTypeChange={(value) => handleInputChange("promoType", value)}
              onDayOfWeekChange={(values) => handleInputChange("dayOfWeek", values)}
              onAreaChange={(value) => handleInputChange("area", value)}
              onDrinkTypeChange={(values) => handleInputChange("drinkType", values)}
            />

              <ImageUpload
                label="Promo Image/Poster"
                imageUrl={formData.image}
                onImageChange={(value) => handleInputChange("image", value)}
                inputId="promo-image"
              />

            {formErrors.length > 0 && (
              <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                <h4 className="font-semibold text-destructive mb-2">Please fix the following errors:</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-destructive">
                  {formErrors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 neon-glow disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSubmitting || !isFormValid()}
            >
              {isSubmitting ? "Creating Promo..." : "Create Promo"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};