import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Star, CalendarIcon, Upload, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { GoogleMap } from "./GoogleMap";
import { supabase } from "@/integrations/supabase/client";

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
  const [showMap, setShowMap] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        handleInputChange("image", result);
      };
      reader.readAsDataURL(file);
    }
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
            {/* Promo Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Promo Title *</Label>
              <Input
                id="title"
                placeholder="50% Off Weekend Party at..."
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                placeholder="Tell people about this amazing deal..."
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                rows={4}
                required
              />
            </div>

            {/* Discount and Venue */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="discount">Discount *</Label>
                <Input
                  id="discount"
                  placeholder="50% OFF"
                  value={formData.discount}
                  onChange={(e) => handleInputChange("discount", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="venue">Venue Name *</Label>
                <Input
                  id="venue"
                  placeholder="Club/Bar/Restaurant name"
                  value={formData.venue}
                  onChange={(e) => handleInputChange("venue", e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Address */}
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                placeholder="Full address"
                value={formData.address}
                onChange={(e) => handleInputChange("address", e.target.value)}
              />
            </div>

            {/* Location Selection */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Location (Optional)</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowMap(!showMap)}
                >
                  <MapPin className="w-4 h-4 mr-2" />
                  {showMap ? "Hide Map" : "Select Location"}
                </Button>
              </div>
              {location && (
                <p className="text-sm text-muted-foreground">
                  Selected: {location.address}
                </p>
              )}
              {showMap && (
                <GoogleMap
                  onLocationSelect={setLocation}
                  height="300px"
                />
              )}
            </div>

            {/* Pricing */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="originalPrice">Original Price</Label>
                <Input
                  id="originalPrice"
                  placeholder="200000"
                  value={formData.originalPrice}
                  onChange={(e) => handleInputChange("originalPrice", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="discountedPrice">Discounted Price</Label>
                <Input
                  id="discountedPrice"
                  placeholder="100000"
                  value={formData.discountedPrice}
                  onChange={(e) => handleInputChange("discountedPrice", e.target.value)}
                />
              </div>
            </div>


            {/* Valid Until and Category */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Valid Until</Label>
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
                      onSelect={setValidUntilDate}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  placeholder="Drinks, Food, Entry..."
                  value={formData.category}
                  onChange={(e) => handleInputChange("category", e.target.value)}
                />
              </div>
            </div>

            {/* Additional Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dayOfWeek">Day of Week</Label>
                <Select value={formData.dayOfWeek} onValueChange={(value) => handleInputChange("dayOfWeek", value)}>
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
                <Select value={formData.area} onValueChange={(value) => handleInputChange("area", value)}>
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
                <Select value={formData.drinkType} onValueChange={(value) => handleInputChange("drinkType", value)}>
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

            {/* Image Upload */}
            <div className="space-y-2">
              <Label htmlFor="image">Promo Image</Label>
              <div className="flex items-center space-x-4">
                <Input
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById('image')?.click()}
                  className="flex items-center space-x-2"
                >
                  <Upload className="w-4 h-4" />
                  <span>Upload Image</span>
                </Button>
                {formData.image && (
                  <div className="w-16 h-16 rounded border overflow-hidden">
                    <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
            </div>

            {/* Submit Button */}
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