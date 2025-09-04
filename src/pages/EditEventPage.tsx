import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Tables } from "../integrations/supabase/types";
import { EventForm } from "@/components/EventForm";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Header } from "@/components/Header";
import { getEventBySlugOrId } from "@/lib/slug-utils";

export const EditEventPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [event, setEvent] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvent = async () => {
      if (!id) {
        setLoading(false);
        toast({
          title: "Error",
          description: "Event ID is missing.",
          variant: "destructive"
        });
        return;
      }

      try {
        const { data, error } = await getEventBySlugOrId(id);

        if (error) throw error;
        setEvent(data || null);
      } catch (error) {
        console.error('Error fetching event for edit:', error);
        toast({
          title: "Error",
          description: "Failed to load event for editing.",
          variant: "destructive"
        });
        navigate('/?section=events'); // Redirect if event not found or error
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [id, navigate, toast]);

  const handleSuccess = () => {
    toast({
      title: "Event Updated!",
      description: "Your event has been successfully updated.",
    });
    navigate('/?section=events'); // Navigate back to events after successful update
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background pt-20 px-4">
        <div className="container mx-auto max-w-2xl">
          <Card className="bg-card border-border">
            <CardContent className="pt-6 text-center">
              Loading event data...
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-background pt-20 px-4">
        <div className="container mx-auto max-w-2xl">
          <Card className="bg-card border-border">
            <CardContent className="pt-6 text-center">
              Event not found.
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <>
      <Header activeSection="events" onSectionChange={() => navigate('/?section=events')} />
      <div className="min-h-screen bg-background pt-20 px-4">
        <div className="container mx-auto max-w-2xl">
          <Button
            variant="ghost"
            onClick={() => navigate('/?section=events')}
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Events
          </Button>
          <EventForm initialData={event} onSuccess={handleSuccess} />
        </div>
      </div>
    </>
  );
};