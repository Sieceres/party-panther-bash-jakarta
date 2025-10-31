import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { format } from "date-fns";
import { Phone, MessageCircle, Mail, Users, MoreHorizontal, Trash2 } from "lucide-react";

interface ContactLog {
  id: string;
  contact_date: string;
  contact_method: string;
  notes: string;
  contacted_by: string;
  created_at: string;
  contacted_by_profile?: {
    display_name: string;
  };
}

interface ContactLogManagerProps {
  contactId: string;
  contactName: string;
}

export const ContactLogManager = ({ contactId, contactName }: ContactLogManagerProps) => {
  const [logs, setLogs] = useState<ContactLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  
  // Form state
  const [contactDate, setContactDate] = useState(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
  const [contactMethod, setContactMethod] = useState("whatsapp");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchLogs();
  }, [contactId]);

  const fetchLogs = async () => {
    try {
      const { data: logsData, error: logsError } = await supabase
        .from("contact_logs")
        .select("*")
        .eq("contact_id", contactId)
        .order("contact_date", { ascending: false });

      if (logsError) throw logsError;

      // Fetch profile data for contacted_by users
      if (logsData && logsData.length > 0) {
        const userIds = [...new Set(logsData.map(log => log.contacted_by))];
        const { data: profilesData, error: profilesError } = await supabase
          .from("profiles")
          .select("user_id, display_name")
          .in("user_id", userIds);

        if (profilesError) throw profilesError;

        const profilesMap = new Map(profilesData?.map(p => [p.user_id, p]) || []);
        const enrichedLogs = logsData.map(log => ({
          ...log,
          contacted_by_profile: profilesMap.get(log.contacted_by)
        }));

        setLogs(enrichedLogs);
      } else {
        setLogs([]);
      }
    } catch (error) {
      console.error("Error fetching contact logs:", error);
      toast.error("Failed to load contact history");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("contact_logs").insert({
        contact_id: contactId,
        contacted_by: user.id,
        contact_date: new Date(contactDate).toISOString(),
        contact_method: contactMethod,
        notes: notes.trim(),
      });

      if (error) throw error;

      toast.success("Contact log added successfully");
      setNotes("");
      setContactDate(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
      setContactMethod("whatsapp");
      setShowForm(false);
      fetchLogs();
    } catch (error) {
      console.error("Error adding contact log:", error);
      toast.error("Failed to add contact log");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (logId: string) => {
    if (!confirm("Are you sure you want to delete this contact log?")) return;

    try {
      const { error } = await supabase
        .from("contact_logs")
        .delete()
        .eq("id", logId);

      if (error) throw error;

      toast.success("Contact log deleted");
      fetchLogs();
    } catch (error) {
      console.error("Error deleting contact log:", error);
      toast.error("Failed to delete contact log");
    }
  };

  const getMethodIcon = (method: string) => {
    switch (method) {
      case "phone": return <Phone className="w-4 h-4" />;
      case "whatsapp": return <MessageCircle className="w-4 h-4" />;
      case "email": return <Mail className="w-4 h-4" />;
      case "in-person": return <Users className="w-4 h-4" />;
      default: return <MoreHorizontal className="w-4 h-4" />;
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading contact history...</div>;
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Contact History - {contactName}</CardTitle>
            <Button onClick={() => setShowForm(!showForm)} size="sm">
              {showForm ? "Cancel" : "Add Contact Log"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {showForm && (
            <form onSubmit={handleSubmit} className="mb-6 space-y-4 p-4 bg-muted/50 rounded-lg">
              <div className="space-y-2">
                <Label htmlFor="contact-date">Date & Time</Label>
                <Input
                  id="contact-date"
                  type="datetime-local"
                  value={contactDate}
                  onChange={(e) => setContactDate(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact-method">Contact Method</Label>
                <Select value={contactMethod} onValueChange={setContactMethod}>
                  <SelectTrigger id="contact-method">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                    <SelectItem value="phone">Phone Call</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="in-person">In Person</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes *</Label>
                <Textarea
                  id="notes"
                  placeholder="What was discussed? What's the outcome? Next steps?"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  required
                  rows={4}
                  className="resize-none"
                />
              </div>

              <Button type="submit" disabled={submitting}>
                {submitting ? "Saving..." : "Save Contact Log"}
              </Button>
            </form>
          )}

          {logs.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No contact history yet. Add your first log entry above.
            </p>
          ) : (
            <div className="space-y-4">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="border rounded-lg p-4 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {getMethodIcon(log.contact_method)}
                        <span className="font-medium capitalize">{log.contact_method}</span>
                        <span className="text-muted-foreground">•</span>
                        <span className="text-sm text-muted-foreground">
                          {format(new Date(log.contact_date), "PPp")}
                        </span>
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{log.notes}</p>
                      <div className="mt-2 text-xs text-muted-foreground">
                        Logged by {log.contacted_by_profile?.display_name || "Unknown"} on{" "}
                        {format(new Date(log.created_at), "PP")}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(log.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
