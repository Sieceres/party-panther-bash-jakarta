import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, Eye } from "lucide-react";
import { getPlaceholderImage, detectDrinkCategory } from "@/lib/drink-categories";

interface PromoPreviewDialogProps {
  formData: {
    title: string;
    description: string;
    venue: string;
    promoType: string;
    area: string;
    drinkType: string[];
    image: string;
    dayOfWeek: string[];
  };
  validUntilDate?: Date;
}

export const PromoPreviewDialog = ({ formData, validUntilDate }: PromoPreviewDialogProps) => {
  const hasMinData = formData.title.trim();
  const drinkCategory = detectDrinkCategory(formData.title, formData.description, formData.promoType, formData.drinkType);
  const placeholderImage = getPlaceholderImage(drinkCategory);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" className="w-full" disabled={!hasMinData}>
          <Eye className="w-4 h-4 mr-2" />
          Preview Promo
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Promo Preview</DialogTitle>
        </DialogHeader>
        <Card className="neon-card bg-card/95 border border-border/50">
          <div className="relative overflow-hidden bg-muted">
            <img
              src={formData.image || placeholderImage}
              alt={formData.title}
              className="w-full h-48 object-cover object-center"
              onError={(e) => {
                e.currentTarget.src = placeholderImage;
              }}
            />
            {formData.promoType && (
              <Badge className="absolute top-3 right-3 bg-primary/90 text-primary-foreground text-xs">
                {formData.promoType}
              </Badge>
            )}
          </div>
          <CardContent className="p-4 space-y-3">
            <h3 className="text-lg font-bold text-foreground line-clamp-2">{formData.title || "Promo Title"}</h3>
            <p className="text-sm text-muted-foreground">{formData.venue || "Venue Name"}</p>
            {formData.description && (
              <p className="text-xs text-muted-foreground line-clamp-3">{formData.description}</p>
            )}
            <div className="flex flex-wrap gap-1.5">
              {formData.area && (
                <Badge variant="outline" className="text-xs">{formData.area}</Badge>
              )}
              {formData.dayOfWeek?.map(day => (
                <Badge key={day} variant="secondary" className="text-xs">{day}</Badge>
              ))}
              {formData.drinkType?.map(dt => (
                <Badge key={dt} variant="outline" className="text-xs">{dt}</Badge>
              ))}
            </div>
            {validUntilDate && (
              <p className="text-xs text-muted-foreground">Valid until {validUntilDate.toLocaleDateString()}</p>
            )}
            <div className="flex items-center gap-1 text-xs text-muted-foreground pt-2 border-t border-border/30">
              <Star className="w-3.5 h-3.5" />
              <span>No reviews yet</span>
            </div>
          </CardContent>
          <CardFooter className="p-4 pt-0">
            <Button variant="cta" size="default" className="w-full" disabled>
              View Details
            </Button>
          </CardFooter>
        </Card>
        <p className="text-xs text-muted-foreground text-center">This is how your promo will appear in the feed</p>
      </DialogContent>
    </Dialog>
  );
};
