import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Wallet, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ReceiptUpload } from "./ReceiptUpload";
import Linkify from "linkify-react";

interface EventPaymentInfoProps {
  eventId: string;
  userId: string;
  paymentInfo?: string | null;
  attendeeId: string;
  paymentStatus?: boolean;
  paymentClaimedAt?: string | null;
  receiptUrl?: string | null;
  onClaimed: () => void;
  onReceiptUploaded: (url: string) => void;
}

export const EventPaymentInfo = ({
  eventId,
  userId,
  paymentInfo,
  attendeeId,
  paymentStatus,
  paymentClaimedAt,
  receiptUrl,
  onClaimed,
  onReceiptUploaded,
}: EventPaymentInfoProps) => {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const handleMarkPaid = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("event_attendees")
        .update({ payment_claimed_at: new Date().toISOString() })
        .eq("id", attendeeId);
      if (error) throw error;
      onClaimed();
      toast({
        title: "Marked as paid",
        description: "You're now shown as Pending until the organizer confirms. Upload a receipt to speed it up.",
      });
    } catch (e) {
      console.error(e);
      toast({ title: "Error", description: "Could not save. Please try again.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <Wallet className="w-4 h-4" />
          Payment info
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Payment info</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {paymentInfo ? (
            <div className="rounded-lg bg-muted p-3 text-sm whitespace-pre-line break-words">
              <Linkify options={{ target: "_blank", className: "text-primary underline" }}>{paymentInfo}</Linkify>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              The organizer hasn't added payment details yet. Contact them for instructions.
            </p>
          )}

          {paymentStatus ? (
            <div className="flex items-center gap-2 text-sm text-green-600">
              <CheckCircle2 className="w-4 h-4" /> Payment confirmed by the organizer.
            </div>
          ) : paymentClaimedAt ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-amber-600">
                <CheckCircle2 className="w-4 h-4" /> Marked as paid — pending confirmation.
              </div>
              <ReceiptUpload
                eventId={eventId}
                userId={userId}
                currentReceiptUrl={receiptUrl || undefined}
                onReceiptUploaded={onReceiptUploaded}
              />
            </div>
          ) : (
            <Button onClick={handleMarkPaid} disabled={saving} className="w-full">
              {saving ? "Saving..." : "I have paid"}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};