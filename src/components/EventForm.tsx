import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { EventTagSelector } from "./form-components/EventTagSelector";
import { EventPrivacySettings } from "./form-components/EventPrivacySettings";

import { Tables } from "../integrations/supabase/types";
import { getEventUrl } from "@/lib/slug-utils";

interface EventFormProps {
  initialData?: Tables<'events'>; // Optional initial data for editing
  onSuccess?: () => void; // Callback for successful submission
}

export const EventForm = ({ initialData, onSuccess }: EventFormProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  const [eventDate, setEventDate] = useState<Date | undefined>(
    initialData?.date 
      ? (() => {
          const [year, month, day] = initialData.date.split('-').map(Number);
          return new Date(year, month - 1, day); // Create date in local timezone
        })()
      : undefined
  );
  const [isRecurrent, setIsRecurrent] = useState(initialData?.is_recurrent || false);
  const [trackPayments, setTrackPayments] = useState(initialData?.track_payments || false);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [accessLevel, setAccessLevel] = useState<string>(initialData?.access_level || 'public');
  const [maxAttendees, setMaxAttendees] = useState<number | null>(initialData?.max_attendees || null);
  const [enableCheckIn, setEnableCheckIn] = useState(initialData?.enable_check_in || false);
  const [enablePhotos, setEnablePhotos] = useState(initialData?.enable_photos || false);
  const [instagramPostUrl, setInstagramPostUrl] = useState(initialData?.instagram_post_url || "");
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
      setEventDate(
        initialData.date 
          ? (() => {
              const [year, month, day] = initialData.date.split('-').map(Number);
              return new Date(year, month - 1, day); // Create date in local timezone
            })()
          : undefined
      );
      setIsRecurrent(initialData.is_recurrent || false);
      setTrackPayments(initialData.track_payments || false);
      setAccessLevel(initialData.access_level || 'public');
      setMaxAttendees(initialData.max_attendees || null);
      setEnableCheckIn(initialData.enable_check_in || false);
      setEnablePhotos(initialData.enable_photos || false);
      handleSetLocation(
        initialData.venue_latitude && initialData.venue_longitude
          ? { lat: initialData.venue_latitude, lng: initialData.venue_longitude, address: initialData.venue_address || "" }
          : null
      );

      // Fetch existing tags for this event
      const fetchTags = async () => {
        const { data, error } = await supabase
          .from('event_tag_assignments')
          .select('tag_id')
          .eq('event_id', initialData.id);
        if (!error && data) {
          setSelectedTagIds(data.map(t => t.tag_id));
        }
      };
      fetchTags();
    }
  }, [initialData, handleSetLocation]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (!initialData?.id) {
      setHasUnsavedChanges(true);
    }
  };

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges && !initialData?.id) {
        e.preventDefault();
        e.returnValue = 'If you leave the page, your event will not be saved. Are you sure you want to exit?';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges, initialData?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      console.log('=== EVENT FORM SUBMISSION STARTED ===');
      const { data: { user } } = await supabase.auth.getUser();
      console.log('User authenticated:', user?.id);
      
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please log in to create an event.",
          variant: "destructive"
        });
        setIsSubmitting(false);
        return;
      }

      // Validate event date is not in the past (only for new events)
      if (!initialData && eventDate && formData.time) {
        const year = eventDate.getFullYear();
        const month = String(eventDate.getMonth() + 1).padStart(2, '0');
        const day = String(eventDate.getDate()).padStart(2, '0');
        const dateString = `${year}-${month}-${day}`;
        
        const eventDateTime = new Date(`${dateString}T${formData.time}`);
        const now = new Date();
        
        console.log('Date validation - Event time:', eventDateTime, 'Now:', now);
        
        if (eventDateTime < now) {
          console.log('Date validation FAILED - event is in the past');
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
        date: eventDate ? `${eventDate.getFullYear()}-${String(eventDate.getMonth() + 1).padStart(2, '0')}-${String(eventDate.getDate()).padStart(2, '0')}` : undefined,
        time: formData.time,
        venue_name: formData.venue,
        venue_address: formData.address,
        venue_latitude: location?.lat,
        venue_longitude: location?.lng,
        organizer_name: formData.organizer,
        organizer_whatsapp: formData.whatsapp,
        image_url: formData.image,
        is_recurrent: isRecurrent,
        track_payments: trackPayments,
        instagram_post_url: instagramPostUrl || null,
        created_by: user.id
      };
      
      console.log('Event data to submit:', eventData);

      let error;
      let newEventId = null;
      
      if (initialData?.id) {
        // Update existing event
        console.log('Updating event:', initialData.id);
        const { error: updateError } = await supabase
          .from('events')
          .update(eventData)
          .eq('id', initialData.id);
        error = updateError;
        console.log('Update result - error:', updateError);
      } else {
        // Insert new event
        console.log('Inserting new event...');
        const { data: insertData, error: insertError } = await supabase
          .from('events')
          .insert(eventData)
          .select('id')
          .single();
        error = insertError;
        newEventId = insertData?.id;
        console.log('Insert result - newEventId:', newEventId, 'error:', insertError);
      }

      if (error) {
        console.error('Database operation failed:', error);
        throw error;
      }

      // Handle tag assignments for both new and updated events
      const eventId = initialData?.id || newEventId;
      if (eventId) {
        // Delete existing tag assignments
        await supabase
          .from('event_tag_assignments')
          .delete()
          .eq('event_id', eventId);

        // Insert new tag assignments
        if (selectedTagIds.length > 0) {
          const tagAssignments = selectedTagIds.map(tagId => ({
            event_id: eventId,
            tag_id: tagId
          }));
          await supabase
            .from('event_tag_assignments')
            .insert(tagAssignments);
        }
      }

      // Handle new event creation tasks
      if (!initialData?.id && newEventId) {
        // Automatically join the organizer to their own event
        const { error: attendeeError } = await supabase
          .from('event_attendees')
          .insert({
            event_id: newEventId,
            user_id: user.id
          });

        if (attendeeError) {
          console.warn('Failed to auto-join organizer to event:', attendeeError);
        }

      }

      toast({
        title: initialData?.id ? "Event Updated! 🎉" : "Event Created! 🎉",
        description: initialData?.id ? "Your event has been updated successfully." : "Your event has been submitted for review and will be live soon.",
      });

      if (!initialData?.id) {
        setHasUnsavedChanges(false);
        setTimeout(async () => {
          // Fetch the newly created event to get its slug for navigation
          const { data: eventData } = await supabase
            .from('events')
            .select('id, slug')
            .eq('id', newEventId)
            .single();
          
          const eventUrl = eventData?.slug ? `/event/${eventData.slug}` : `/event/${newEventId}`;
          navigate(eventUrl);
        }, 1000);
      } else {
        onSuccess?.(); // Call onSuccess callback for edits
      }

    } catch (error: any) {
      console.error('=== EVENT FORM SUBMISSION ERROR ===');
      console.error('Error type:', typeof error);
      console.error('Error object:', error);
      console.error('Error message:', error?.message);
      console.error('Error details:', error?.details);
      console.error('Error hint:', error?.hint);
      console.error('Error code:', error?.code);
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
              isEditing={!!initialData}
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
              uploadToStorage={true}
              storageFolder="events"
            />

            <EventTagSelector
              selectedTagIds={selectedTagIds}
              onChange={setSelectedTagIds}
            />

            <EventPrivacySettings
              accessLevel={accessLevel}
              maxAttendees={maxAttendees}
              enableCheckIn={enableCheckIn}
              enablePhotos={enablePhotos}
              isRecurrent={isRecurrent}
              trackPayments={trackPayments}
              instagramPostUrl={instagramPostUrl}
              onAccessLevelChange={setAccessLevel}
              onMaxAttendeesChange={setMaxAttendees}
              onEnableCheckInChange={setEnableCheckIn}
              onEnablePhotosChange={setEnablePhotos}
              onIsRecurrentChange={setIsRecurrent}
              onTrackPaymentsChange={setTrackPayments}
              onInstagramPostUrlChange={setInstagramPostUrl}
            />

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