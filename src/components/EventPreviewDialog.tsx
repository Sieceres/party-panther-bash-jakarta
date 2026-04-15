import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Calendar, User as UserIcon, Eye } from "lucide-react";
import { format } from "date-fns";

interface EventPreviewDialogProps {
  formData: {
    title: string;
    description: string;
    time: string;
    venue: string;
    organizer: string;
    image: string;
  };
  eventDate?: Date;
}

export const EventPreviewDialog = ({ formData, eventDate }: EventPreviewDialogProps) => {
  const hasMinData = formData.title.trim();

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" className="w-full" disabled={!hasMinData}>
          <Eye className="w-4 h-4 mr-2" />
          Preview Event
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Event Preview</DialogTitle>
        </DialogHeader>
        <Card className="neon-card bg-card/95 border border-border/50">
          <div className="p-4 pb-3">
            <h3 className="text-lg font-bold text-foreground line-clamp-2">{formData.title || "Event Title"}</h3>
          </div>
          <div className="relative overflow-hidden bg-muted">
            <img
              src={formData.image || "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&h=600&fit=crop"}
              alt={formData.title}
              className="w-full h-48 object-cover object-center"
              onError={(e) => {
                e.currentTarget.src = "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&h=600&fit=crop";
              }}
            />
            {eventDate && (
              <div className="neon-tag absolute top-3 right-3">
                {format(eventDate, "MMM dd")}
              </div>
            )}
          </div>
          <CardContent className="p-4">
            <div className="space-y-3">
              {eventDate && (
                <div className="flex items-start gap-2">
                  <Calendar className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">{format(eventDate, "EEEE, MMM do")}</p>
                    <p className="text-xs text-muted-foreground">{formData.time || "Time TBD"}</p>
                  </div>
                </div>
              )}
              {formData.venue && (
                <p className="text-sm text-muted-foreground pl-6">{formData.venue}</p>
              )}
              {formData.description && (
                <p className="text-xs text-muted-foreground line-clamp-3 border-t border-border/30 pt-2">{formData.description}</p>
              )}
              <div className="flex items-center justify-between text-xs pt-2 border-t border-border/30">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <UserIcon className="w-4 h-4" />
                  <span>0 going</span>
                </div>
                {formData.organizer && <span className="text-muted-foreground text-xs">by {formData.organizer}</span>}
              </div>
            </div>
          </CardContent>
          <CardFooter className="p-4 pt-0 gap-2">
            <Button variant="cta" size="default" className="flex-1" disabled>
              Join Event
            </Button>
            <Button variant="outline" size="default" disabled>
              View Details
            </Button>
          </CardFooter>
        </Card>
        <p className="text-xs text-muted-foreground text-center">This is how your event will appear in the feed</p>
      </DialogContent>
    </Dialog>
  );
};
