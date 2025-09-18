import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { BasicPromoInfo } from "@/components/form-components/BasicPromoInfo";
import { PromoDiscount } from "@/components/form-components/PromoDiscount";
import { LocationSelector } from "@/components/form-components/LocationSelector";
import { PromoDetails } from "@/components/form-components/PromoDetails";
import { ImageUpload } from "@/components/form-components/ImageUpload";
import { SpinningPaws } from "@/components/ui/spinning-paws";

export const EditPromoPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validUntilDate, setValidUntilDate] = useState<Date>();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    discount: "",
    venue: "",
    address: "",
    dayOfWeek: [] as string[],
    area: "",
    drinkType: [] as string[],
    image: ""
  });
  const [location, setLocation] = useState<{ lat: number; lng: number; address: string } | null>(null);

  useEffect(() => {
    const fetchPromo = async () => {
      if (!id) return;
      
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          toast({
            title: "Authentication required",
            description: "Please sign in to edit promos.",
            variant: "destructive",
          });
          navigate('/auth');
          return;
        }

        const { data: promo, error } = await supabase
          .from('promos')
          .select('*')
          .eq('id', id)
          .eq('created_by', user.id)
          .single();

        if (error) {
          console.error('Error fetching promo:', error);
          toast({
            title: "Error",
            description: "Failed to load promo data.",
            variant: "destructive",
          });
          navigate('/profile');
          return;
        }

        if (promo) {
          console.log('Promo data:', promo); // Debug log
          
          setFormData({
            title: promo.title || "",
            description: promo.description || "",
            discount: promo.discount_text || "",
            venue: promo.venue_name || "",
            address: promo.venue_address || "",
            dayOfWeek: Array.isArray(promo.day_of_week) ? promo.day_of_week : (promo.day_of_week ? [promo.day_of_week] : []),
            area: promo.area || "",
            drinkType: Array.isArray(promo.drink_type) ? promo.drink_type : (promo.drink_type ? [promo.drink_type] : []),
            image: promo.image_url || ""
          });

          if (promo.venue_latitude && promo.venue_longitude) {
            setLocation({
              lat: promo.venue_latitude,
              lng: promo.venue_longitude,
              address: promo.venue_address || ""
            });
          }

          if (promo.valid_until) {
            setValidUntilDate(new Date(promo.valid_until));
          }
        }
      } catch (error) {
        console.error('Error:', error);
        toast({
          title: "Error",
          description: "An unexpected error occurred.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPromo();
  }, [id, navigate, toast]);

  const handleInputChange = (field: string, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    
    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please log in to update this promo.",
          variant: "destructive"
        });
        return;
      }

      const promoData = {
        title: formData.title,
        description: formData.description,
        discount_text: formData.discount,
        venue_name: formData.venue,
        venue_address: location?.address || formData.address,
        venue_latitude: location?.lat || null,
        venue_longitude: location?.lng || null,
        valid_until: validUntilDate?.toISOString() || null,
        day_of_week: formData.dayOfWeek,
        area: formData.area,
        drink_type: formData.drinkType,
        image_url: formData.image || null,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('promos')
        .update(promoData)
        .eq('id', id)
        .eq('created_by', user.id);

      if (error) {
        console.error('Error updating promo:', error);
        toast({
          title: "Error",
          description: "Failed to update promo. Please try again.",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Success! 🎉",
        description: "Promo updated successfully!",
      });

      navigate('/profile');
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="pt-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center space-y-4">
            <SpinningPaws size="lg" />
            <div className="text-center">Loading promo data...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-20 px-4 pb-8">
      <div className="container mx-auto max-w-4xl">
        <Button
          variant="ghost"
          onClick={() => navigate('/profile')}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Profile
        </Button>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-2xl font-bold gradient-text flex items-center space-x-2">
              <span>Edit Promo</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <BasicPromoInfo
                title={formData.title}
                description={formData.description}
                onTitleChange={(value) => handleInputChange('title', value)}
                onDescriptionChange={(value) => handleInputChange('description', value)}
              />

              <PromoDiscount
                venue={formData.venue}
                address={formData.address}
                onVenueChange={(value) => handleInputChange('venue', value)}
                onAddressChange={(value) => handleInputChange('address', value)}
              />

              <LocationSelector
                location={location}
                onLocationSelect={setLocation}
                label="Venue Location (Optional)"
              />

              <PromoDetails
                dayOfWeek={formData.dayOfWeek}
                area={formData.area}
                drinkType={formData.drinkType}
                validUntilDate={validUntilDate}
                onDayOfWeekChange={(values) => handleInputChange('dayOfWeek', values)}
                onAreaChange={(value) => handleInputChange('area', value)}
                onDrinkTypeChange={(values) => handleInputChange('drinkType', values)}
                onValidUntilChange={setValidUntilDate}
              />

              <ImageUpload
                label="Promo Image"
                imageUrl={formData.image}
                onImageChange={(value) => handleInputChange('image', value)}
                inputId="promo-image-upload"
              />

              <div className="flex justify-end space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/profile')}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-primary hover:bg-primary/90"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {isSubmitting ? 'Updating...' : 'Update Promo'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};