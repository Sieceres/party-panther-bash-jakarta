import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Check, Star, Users, MessageSquare, Building2, Reply } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

const TYPE_ICONS: Record<string, typeof Bell> = {
  claim_result: Building2,
  new_review: Star,
  event_join: Users,
  event_comment: MessageSquare,
  review_reply: Reply,
};

export const UserNotificationBell = ({ userId }: { userId: string }) => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);

  const fetchNotifications = useCallback(async () => {
    const { data, error } = await supabase
      .from("user_notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20);

    if (!error && data) {
      setNotifications(data as Notification[]);
      setUnreadCount(data.filter((n: any) => !n.is_read).length);
    }
  }, [userId]);

  useEffect(() => {
    fetchNotifications();

    const channel = supabase
      .channel("user-notifications")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "user_notifications", filter: `user_id=eq.${userId}` },
        () => fetchNotifications()
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchNotifications, userId]);

  const markAllRead = async () => {
    await supabase
      .from("user_notifications")
      .update({ is_read: true })
      .eq("user_id", userId)
      .eq("is_read", false);
    fetchNotifications();
  };

  const handleClick = async (n: Notification) => {
    if (!n.is_read) {
      await supabase.from("user_notifications").update({ is_read: true }).eq("id", n.id);
    }
    setOpen(false);
    if (n.link) navigate(n.link);
    fetchNotifications();
  };

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="default" className="relative" title="Notifications">
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h4 className="text-sm font-semibold">Notifications</h4>
          {unreadCount > 0 && (
            <button onClick={markAllRead} className="text-xs text-primary hover:underline flex items-center gap-1">
              <Check className="w-3 h-3" /> Mark all read
            </button>
          )}
        </div>
        <ScrollArea className="max-h-80">
          {notifications.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No notifications yet</p>
          ) : (
            notifications.map((n) => {
              const Icon = TYPE_ICONS[n.type] || Bell;
              return (
                <button
                  key={n.id}
                  onClick={() => handleClick(n)}
                  className={`w-full text-left px-4 py-3 flex gap-3 hover:bg-accent/50 transition-colors border-b border-border/30 ${!n.is_read ? "bg-primary/5" : ""}`}
                >
                  <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${!n.is_read ? "text-primary" : "text-muted-foreground"}`} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm leading-tight ${!n.is_read ? "font-semibold" : ""}`}>{n.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">{timeAgo(n.created_at)}</p>
                  </div>
                  {!n.is_read && <span className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />}
                </button>
              );
            })
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};
