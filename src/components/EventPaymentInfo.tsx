import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Wallet, CheckCircle2, QrCode } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ReceiptUpload } from "./ReceiptUpload";
import Linkify from "linkify-react";

interface EventPaymentInfoProps {
  eventId: string;
  userId: string;
  paymentInfo?: string | null;
  paymentMethods?: { method: string; detail: string }[] | null;
  paymentQrUrl?: string | null;
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
  paymentMethods,
  paymentQrUrl,
  attendeeId,
  paymentStatus,
  paymentClaimedAt,
  receiptUrl,
  onClaimed,
  onReceiptUploaded,
}: EventPaymentInfoProps) => {
  const [open, setOpen] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [cooldown, setCooldown] = useState(false);
  const { toast } = useToast();

  const startCooldown = () => {
    setCooldown(true);
    setTimeout(() => setCooldown(false), 30000);
  };

  const handleMarkPaid = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("event_attendees")
        .update({ payment_claimed_at: new Date().toISOString() })
        .eq("id", attendeeId);
      if (error) throw error;
      onClaimed();
      startCooldown();
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

  const handleUnmarkPaid = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("event_attendees")
        .update({ payment_claimed_at: null })
        .eq("id", attendeeId);
      if (error) throw error;
      onClaimed();
      startCooldown();
      toast({
        title: "Payment claim removed",
        description: "You're no longer shown as pending payment.",
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
          {paymentMethods && paymentMethods.length > 0 && (
            <ul className="divide-y rounded-lg border">
              {paymentMethods.map((m, i) => (
                <li key={i} className="flex items-center justify-between gap-3 p-3 text-sm">
                  <span className="font-medium">{m.method}</span>
                  <span className="text-right break-all text-muted-foreground">{m.detail}</span>
                </li>
              ))}
            </ul>
          )}

          {paymentQrUrl && (
            <Button
              type="button"
              variant="outline"
              className="w-full flex items-center gap-2"
              onClick={() => setQrOpen(true)}
            >
              <QrCode className="w-4 h-4" /> Show QR code
            </Button>
          )}

          {paymentInfo ? (
            <div className="rounded-lg bg-muted p-3 text-sm whitespace-pre-line break-words">
              <Linkify options={{ target: "_blank", className: "text-primary underline" }}>{paymentInfo}</Linkify>
            </div>
          ) : (!paymentMethods || paymentMethods.length === 0) && !paymentQrUrl ? (
            <p className="text-sm text-muted-foreground">
              The organizer hasn't added payment details yet. Contact them for instructions.
            </p>
          ) : null}

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
              <Button
                variant="ghost"
                size="sm"
                onClick={handleUnmarkPaid}
                disabled={saving || cooldown}
                className="w-full"
              >
                {saving ? "Saving..." : cooldown ? "Please wait a moment..." : "I haven't paid yet"}
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <Button onClick={handleMarkPaid} disabled={saving || cooldown} className="w-full">
                {saving ? "Saving..." : cooldown ? "Please wait a moment..." : "I have paid"}
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                You can change this a limited number of times.
              </p>
            </div>
          )}

        </div>
      </DialogContent>

      <Dialog open={qrOpen} onOpenChange={setQrOpen}>
        <DialogContent className="sm:max-w-xs">
          <DialogHeader>
            <DialogTitle>Scan to pay</DialogTitle>
          </DialogHeader>
          {paymentQrUrl && (
            <img src={paymentQrUrl} alt="Payment QR code" className="w-full rounded-lg bg-white p-2" />
          )}
        </DialogContent>
      </Dialog>
    </Dialog>
  );
};