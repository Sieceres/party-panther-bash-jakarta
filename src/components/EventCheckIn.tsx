import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CheckCircle2, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface CheckIn {
  id: string;
  user_id: string;
  checked_in_at: string;
  profiles?: {
    display_name: string;
    avatar_url: string;
  };
}

interface EventCheckInProps {
  eventId: string;
  eventDate: string;
  eventTime: string;
  isJoined: boolean;
  canManage: boolean;
}

export const EventCheckIn = ({ 
  eventId, 
  eventDate, 
  eventTime, 
  isJoined,
  canManage 
}: EventCheckInProps) => {
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const eventHasStarted = () => {
    const eventDateTime = new Date(`${eventDate}T${eventTime}`);
    return new Date() >= eventDateTime;
  };

  useEffect(() => {
    loadCheckIns();

    const channel = supabase
      .channel('check-ins-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'event_check_ins',
          filter: `event_id=eq.${eventId}`
        },
        () => loadCheckIns()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [eventId]);

  const loadCheckIns = async () => {
    const { data: session } = await supabase.auth.getSession();
    
    const { data, error } = await supabase
      .from('event_check_ins')
      .select(`
        id,
        user_id,
        checked_in_at,
        profiles:user_id (
          display_name,
          avatar_url
        )
      `)
      .eq('event_id', eventId)
      .order('checked_in_at', { ascending: false });

    if (!error && data) {
      setCheckIns(data as any);
      if (session?.session?.user) {
        setIsCheckedIn(data.some(c => c.user_id === session.session.user.id));
      }
    }
  };

  const handleCheckIn = async () => {
    if (!eventHasStarted()) {
      toast({
        title: "Event hasn't started yet",
        description: "You can only check in once the event has started.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    const { data: session } = await supabase.auth.getSession();
    
    if (!session?.session?.user) {
      toast({
        title: "Not authenticated",
        description: "Please log in to check in.",
        variant: "destructive"
      });
      setLoading(false);
      return;
    }

    const { error } = await supabase
      .from('event_check_ins')
      .insert({
        event_id: eventId,
        user_id: session.session.user.id,
        checked_in_by: session.session.user.id
      });

    if (error) {
      toast({
        title: "Check-in failed",
        description: error.message,
        variant: "destructive"
      });
    } else {
      toast({
        title: "Checked in successfully!",
        description: "You're now checked in to this event."
      });
      setIsCheckedIn(true);
    }
    setLoading(false);
  };

  if (!isJoined) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Event Check-In</span>
          <span className="text-sm text-muted-foreground">
            {checkIns.length} checked in
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isCheckedIn && (
          <Button
            onClick={handleCheckIn}
            disabled={loading || !eventHasStarted()}
            className="w-full"
          >
            {loading ? (
              "Checking in..."
            ) : eventHasStarted() ? (
              <>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Check In Now
              </>
            ) : (
              <>
                <Clock className="w-4 h-4 mr-2" />
                Available when event starts
              </>
            )}
          </Button>
        )}

        {isCheckedIn && (
          <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
            <CheckCircle2 className="w-5 h-5 text-green-500" />
            <span className="text-sm text-green-700 dark:text-green-400">
              You're checked in!
            </span>
          </div>
        )}

        {checkIns.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Checked In Attendees</h4>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {checkIns.map((checkIn) => (
                <div key={checkIn.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={checkIn.profiles?.avatar_url || ''} />
                    <AvatarFallback>
                      {checkIn.profiles?.display_name?.charAt(0) || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {checkIn.profiles?.display_name || 'Anonymous'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(checkIn.checked_in_at), 'MMM d, h:mm a')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
