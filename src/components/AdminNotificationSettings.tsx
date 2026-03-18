import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Bell, Loader2 } from "lucide-react";

interface NotificationSetting {
  id: string;
  notification_type: string;
  enabled: boolean;
}

const TYPE_LABELS: Record<string, { label: string; description: string; emoji: string }> = {
  new_report: { label: "New Report", description: "When a user reports content", emoji: "🚨" },
  new_user: { label: "New User Signup", description: "When a new user registers", emoji: "👤" },
  new_promo: { label: "New Promo", description: "When a promo is created", emoji: "🎉" },
  new_event: { label: "New Event", description: "When an event is created", emoji: "📅" },
  new_venue: { label: "New Venue", description: "When a venue is added", emoji: "📍" },
  new_venue_claim: { label: "Venue Claim", description: "When a user claims a venue", emoji: "🏢" },
  new_review: { label: "New Review", description: "When a promo review is posted", emoji: "⭐" },
  new_venue_edit: { label: "Venue Edit", description: "When a venue edit is suggested", emoji: "✏️" },
  user_flagged: { label: "User Flagged", description: "When anti-spam flags a user", emoji: "⚠️" },
};

export function AdminNotificationSettings() {
  const [settings, setSettings] = useState<NotificationSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    const { data, error } = await supabase
      .from("notification_settings")
      .select("*")
      .order("notification_type");

    if (error) {
      console.error("Error fetching notification settings:", error);
      toast.error("Failed to load notification settings");
    } else {
      setSettings(data || []);
    }
    setLoading(false);
  };

  const handleToggle = async (id: string, type: string, newEnabled: boolean) => {
    setToggling(type);
    const { error } = await supabase
      .from("notification_settings")
      .update({ enabled: newEnabled, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) {
      toast.error("Failed to update setting");
    } else {
      setSettings((prev) =>
        prev.map((s) => (s.id === id ? { ...s, enabled: newEnabled } : s))
      );
      toast.success(`${TYPE_LABELS[type]?.label || type} notifications ${newEnabled ? "enabled" : "disabled"}`);
    }
    setToggling(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="w-5 h-5" />
          Telegram Notification Settings
        </CardTitle>
        <CardDescription>
          Control which events trigger Telegram notifications to the admin chat.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {settings.map((setting) => {
            const meta = TYPE_LABELS[setting.notification_type];
            return (
              <div
                key={setting.id}
                className="flex items-center justify-between p-3 rounded-lg border border-border"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{meta?.emoji || "📢"}</span>
                  <div>
                    <Label className="font-medium">
                      {meta?.label || setting.notification_type}
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      {meta?.description || ""}
                    </p>
                  </div>
                </div>
                <Switch
                  checked={setting.enabled}
                  onCheckedChange={(checked) =>
                    handleToggle(setting.id, setting.notification_type, checked)
                  }
                  disabled={toggling === setting.notification_type}
                />
              </div>
            );
          })}
          {settings.length === 0 && (
            <p className="text-muted-foreground text-center py-4">
              No notification settings found.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
