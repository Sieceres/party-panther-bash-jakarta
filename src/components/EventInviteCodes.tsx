import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Copy, Plus, Trash2, Ban, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface InviteCode {
  id: string;
  code: string;
  invited_user_email: string | null;
  used_by: string | null;
  used_at: string | null;
  is_revoked: boolean;
  created_at: string;
  expires_at: string | null;
}

interface EventInviteCodesProps {
  eventId: string;
  eventDate: string;
  eventTime: string;
}

export const EventInviteCodes = ({ eventId, eventDate, eventTime }: EventInviteCodesProps) => {
  const [codes, setCodes] = useState<InviteCode[]>([]);
  const [newEmail, setNewEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadCodes();
  }, [eventId]);

  const loadCodes = async () => {
    const { data, error } = await supabase
      .from('event_invite_codes')
      .select('*')
      .eq('event_id', eventId)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setCodes(data);
    }
  };

  const generateCode = () => {
    return Math.random().toString(36).substring(2, 10).toUpperCase();
  };

  const handleGenerateCode = async () => {
    if (!newEmail.trim()) {
      toast({
        title: "Email required",
        description: "Please enter an email for this invite code.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    const { data: session } = await supabase.auth.getSession();
    
    if (!session?.session?.user) {
      toast({
        title: "Not authenticated",
        variant: "destructive"
      });
      setLoading(false);
      return;
    }

    const code = generateCode();
    const eventDateTime = new Date(`${eventDate}T${eventTime}`);

    const { error } = await supabase
      .from('event_invite_codes')
      .insert({
        event_id: eventId,
        code,
        invited_user_email: newEmail,
        created_by: session.session.user.id,
        expires_at: eventDateTime.toISOString()
      });

    if (error) {
      toast({
        title: "Failed to generate code",
        description: error.message,
        variant: "destructive"
      });
    } else {
      handleCopyCode(code);
      toast({
        title: "Invite code generated and copied!",
        description: `Code: ${code}`
      });
      setNewEmail("");
      setDialogOpen(false);
      loadCodes();
    }
    setLoading(false);
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: "Copied!",
      description: "Invite code copied to clipboard."
    });
  };

  const handleRevokeCode = async (codeId: string) => {
    const { error } = await supabase
      .from('event_invite_codes')
      .update({ is_revoked: true })
      .eq('id', codeId);

    if (error) {
      toast({
        title: "Failed to revoke code",
        description: error.message,
        variant: "destructive"
      });
    } else {
      toast({
        title: "Code revoked",
        description: "This invite code can no longer be used."
      });
      loadCodes();
    }
  };

  const handleDeleteCode = async (codeId: string) => {
    const { error } = await supabase
      .from('event_invite_codes')
      .delete()
      .eq('id', codeId);

    if (error) {
      toast({
        title: "Failed to delete code",
        description: error.message,
        variant: "destructive"
      });
    } else {
      toast({
        title: "Code deleted"
      });
      loadCodes();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Invite Codes</span>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Generate Code
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Generate Invite Code</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="email">Invited Person's Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="person@example.com"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    One code per person. Expires when event starts.
                  </p>
                </div>
                <Button onClick={handleGenerateCode} disabled={loading} className="w-full">
                  Generate Code
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {codes.length === 0 ? (
          <p className="text-center text-muted-foreground py-4">
            No invite codes yet
          </p>
        ) : (
          <div className="space-y-2">
            {codes.map((code) => (
              <div
                key={code.id}
                className={`flex items-center justify-between p-3 rounded-lg border ${
                  code.is_revoked ? 'bg-muted/50 opacity-60' : 'bg-card'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <code className="font-mono font-bold">{code.code}</code>
                    {code.used_by && <Check className="w-4 h-4 text-green-500" />}
                    {code.is_revoked && <Ban className="w-4 h-4 text-red-500" />}
                  </div>
                  <p className="text-sm text-muted-foreground truncate">
                    {code.invited_user_email}
                  </p>
                  {code.used_at && (
                    <p className="text-xs text-muted-foreground">
                      Used {format(new Date(code.used_at), 'MMM d, h:mm a')}
                    </p>
                  )}
                </div>
                <div className="flex gap-1">
                  {!code.is_revoked && !code.used_by && (
                    <>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleCopyCode(code.code)}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRevokeCode(code.id)}
                      >
                        <Ban className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDeleteCode(code.id)}
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
  );
};
