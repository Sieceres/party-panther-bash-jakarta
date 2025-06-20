import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { BasicEventInfo } from "./form-components/BasicEventInfo";
import { EventDateTime } from "./form-components/EventDateTime";
import { EventVenue } from "./form-components/EventVenue";
import { EventOrganizer } from "./form-components/EventOrganizer";
import { ImageUpload } from "./form-components/ImageUpload";

export const CreateEventForm = () => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [eventDate, setEventDate] = useState<Date>();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    time: "",
    venue: "",
    address: "",
    organizer: "",
    whatsapp: "",
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
          description: "Please log in to create an event.",
          variant: "destructive"
        });
        return;
      }

      const { error } = await supabase.from('events').insert({
        title: formData.title,
        description: formData.description,
        date: eventDate?.toISOString().split('T')[0],
        time: formData.time,
        venue_name: formData.venue,
        venue_address: formData.address,
        venue_latitude: location?.lat,
        venue_longitude: location?.lng,
        organizer_name: formData.organizer || null,
        organizer_whatsapp: formData.whatsapp,
        image_url: formData.image,
        created_by: user.id
      });

      if (error) throw error;

      toast({
        title: "Event Created! 🎉",
        description: "Your event has been submitted for review and will be live soon.",
      });

      // Reset form
      setFormData({
        title: "",
        description: "",
        time: "",
        venue: "",
        address: "",
        organizer: "",
        whatsapp: "",
        image: ""
      });
      setEventDate(undefined);
      setLocation(null);
    } catch (error) {
      console.error('Error creating event:', error);
      toast({
        title: "Error",
        description: "Failed to create event. Please try again.",
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
            <CalendarIcon className="w-6 h-6 text-primary" />
            <span>Create New Event</span>
          </CardTitle>
          <p className="text-muted-foreground">
            Share your amazing event with Jakarta's party community!
          </p>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <BasicEventInfo
              title={formData.title}
              description={formData.description}
              onTitleChange={(value) => handleInputChange("title", value)}
              onDescriptionChange={(value) => handleInputChange("description", value)}
            />

            <EventDateTime
              eventDate={eventDate}
              time={formData.time}
              onDateChange={setEventDate}
              onTimeChange={(value) => handleInputChange("time", value)}
            />

            <EventVenue
              venue={formData.venue}
              address={formData.address}
              location={location}
              onVenueChange={(value) => handleInputChange("venue", value)}
              onAddressChange={(value) => handleInputChange("address", value)}
              onLocationChange={setLocation}
            />

            <EventOrganizer
              organizer={formData.organizer}
              whatsapp={formData.whatsapp}
              onOrganizerChange={(value) => handleInputChange("organizer", value)}
              onWhatsappChange={(value) => handleInputChange("whatsapp", value)}
            />

            <ImageUpload
              label="Event Image"
              imageUrl={formData.image}
              onImageChange={(value) => handleInputChange("image", value)}
              inputId="event-image"
            />

            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 neon-glow"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Creating Event..." : "Create Event"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};