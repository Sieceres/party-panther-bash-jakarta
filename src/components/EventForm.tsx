import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Calendar as CalendarIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { BasicEventInfo } from "./form-components/BasicEventInfo";
import { EventDateTime } from "./form-components/EventDateTime";
import { EventVenue } from "./form-components/EventVenue";
import { EventOrganizer } from "./form-components/EventOrganizer";
import { ImageUpload } from "./form-components/ImageUpload";
import { Tables } from "../integrations/supabase/types";

interface EventFormProps {
  initialData?: Tables<'events'>; // Optional initial data for editing
  onSuccess?: () => void; // Callback for successful submission
}

export const EventForm = ({ initialData, onSuccess }: EventFormProps) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [eventDate, setEventDate] = useState<Date | undefined>(initialData?.date ? new Date(initialData.date) : undefined);
  const [isRecurrent, setIsRecurrent] = useState(initialData?.is_recurrent || false);
  const [formData, setFormData] = useState({
    title: initialData?.title || "",
    description: initialData?.description || "",
    time: initialData?.time || "",
    venue: initialData?.venue_name || "",
    address: initialData?.venue_address || "",
    organizer: initialData?.organizer_name || "",
    whatsapp: initialData?.organizer_whatsapp || "",
    image: initialData?.image_url || ""
  });
  const [location, setLocation] = useState<{ lat: number; lng: number; address: string } | null>(
    initialData?.venue_latitude && initialData?.venue_longitude
      ? { lat: initialData.venue_latitude, lng: initialData.venue_longitude, address: initialData.venue_address || "" }
      : null
  );

  const handleSetLocation = useCallback((newLocation: { lat: number; lng: number; address: string } | null) => {
    setLocation(newLocation);
  }, []);

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || "",
        description: initialData.description || "",
        time: initialData.time || "",
        venue: initialData.venue_name || "",
        address: initialData.venue_address || "",
        organizer: initialData.organizer_name || "",
        whatsapp: initialData.organizer_whatsapp || "",
        image: initialData.image_url || ""
      });
      setEventDate(initialData.date ? new Date(initialData.date) : undefined);
      setIsRecurrent(initialData.is_recurrent || false);
      handleSetLocation(
        initialData.venue_latitude && initialData.venue_longitude
          ? { lat: initialData.venue_latitude, lng: initialData.venue_longitude, address: initialData.venue_address || "" }
          : null
      );
    }
  }, [initialData, handleSetLocation]);

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

      // Validate event date is not in the past
      if (eventDate && formData.time) {
        const eventDateTime = new Date(`${eventDate.toISOString().split('T')[0]}T${formData.time}`);
        const now = new Date();
        
        if (eventDateTime < now) {
          toast({
            title: "Invalid date",
            description: "Cannot create an event in the past. Please select a future date and time.",
            variant: "destructive"
          });
          setIsSubmitting(false);
          return;
        }
      }

      const eventData = {
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
        is_recurrent: isRecurrent,
        created_by: user.id
      };

      let error;
      if (initialData?.id) {
        // Update existing event
        const { error: updateError } = await supabase
          .from('events')
          .update(eventData)
          .eq('id', initialData.id);
        error = updateError;
      } else {
        // Insert new event
        const { error: insertError } = await supabase.from('events').insert(eventData);
        error = insertError;
      }

      if (error) throw error;

      toast({
        title: initialData?.id ? "Event Updated! 🎉" : "Event Created! 🎉",
        description: initialData?.id ? "Your event has been updated successfully." : "Your event has been submitted for review and will be live soon.",
      });

      if (!initialData?.id) {
        // Reset form only for new event creation
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
        setIsRecurrent(false);
      }

      onSuccess?.(); // Call onSuccess callback

    } catch (error) {
      console.error(initialData?.id ? 'Error updating event:' : 'Error creating event:', error);
      toast({
        title: "Error",
        description: initialData?.id ? "Failed to update event. Please try again." : "Failed to create event. Please try again.",
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
            <span>{initialData?.id ? "Edit Event" : "Create New Event"}</span>
          </CardTitle>
          <p className="text-muted-foreground">
            {initialData?.id ? "Update your event details." : "Share your amazing event with Jakarta's party community!"}
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
              onLocationChange={handleSetLocation}
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

            <div className="flex items-center space-x-2">
              <Checkbox
                id="isRecurrent"
                checked={isRecurrent}
                onCheckedChange={(checked) => setIsRecurrent(!!checked)}
              />
              <Label htmlFor="isRecurrent">Recurrent Event</Label>
            </div>

            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 neon-glow"
              disabled={isSubmitting}
            >
              {isSubmitting ? (initialData?.id ? "Saving Changes..." : "Creating Event...") : (initialData?.id ? "Save Changes" : "Create Event")}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};