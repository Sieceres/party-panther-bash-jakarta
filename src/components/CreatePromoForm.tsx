import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Star, CalendarIcon, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export const CreatePromoForm = () => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validUntilDate, setValidUntilDate] = useState<Date>();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    discount: "",
    venue: "",
    originalPrice: "",
    discountedPrice: "",
    category: "",
    image: ""
  });

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

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

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
      originalPrice: "",
      discountedPrice: "",
      category: "",
      image: ""
    });
    setValidUntilDate(undefined);

    setIsSubmitting(false);
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
                <Label htmlFor="venue">Venue *</Label>
                <Input
                  id="venue"
                  placeholder="Club/Bar/Restaurant name"
                  value={formData.venue}
                  onChange={(e) => handleInputChange("venue", e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Pricing */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="originalPrice">Original Price *</Label>
                <Input
                  id="originalPrice"
                  placeholder="IDR 200,000"
                  value={formData.originalPrice}
                  onChange={(e) => handleInputChange("originalPrice", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="discountedPrice">Discounted Price *</Label>
                <Input
                  id="discountedPrice"
                  placeholder="IDR 100,000"
                  value={formData.discountedPrice}
                  onChange={(e) => handleInputChange("discountedPrice", e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Valid Until and Category */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Valid Until *</Label>
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