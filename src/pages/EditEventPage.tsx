import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Tables } from "../integrations/supabase/types";
import { EventForm } from "@/components/EventForm";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button"; // Import Button
import { ArrowLeft } from "lucide-react"; // Import ArrowLeft icon

export const EditEventPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [event, setEvent] = useState<Tables<'events'> | null>(null);
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
        const { data, error } = await supabase
          .from('events')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;
        setEvent(data);
      } catch (error) {
        console.error('Error fetching event for edit:', error);
        toast({
          title: "Error",
          description: "Failed to load event for editing.",
          variant: "destructive"
        });
        navigate('/profile'); // Redirect if event not found or error
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
    navigate('/profile'); // Navigate back to profile after successful update
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
    <div className="min-h-screen bg-background pt-20 px-4">
      <div className="container mx-auto max-w-2xl">
        <Button
          variant="ghost"
          onClick={() => navigate('/profile')}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Profile
        </Button>
        <EventForm initialData={event} onSuccess={handleSuccess} />
      </div>
    </div>
  );
};