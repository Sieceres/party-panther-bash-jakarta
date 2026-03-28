import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ShieldCheck, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface VenuePinSetupProps {
  venueId: string;
}

async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export const VenuePinSetup = ({ venueId }: VenuePinSetupProps) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [saving, setSaving] = useState(false);
  const [hasPin, setHasPin] = useState(false);

  useEffect(() => {
    supabase
      .from("venue_pins")
      .select("id")
      .eq("venue_id", venueId)
      .then(({ data }) => {
        setHasPin((data?.length || 0) > 0);
      });
  }, [venueId]);

  const handleSave = async () => {
    if (pin.length !== 4 || pin !== confirmPin) {
      toast({ title: "PINs don't match", description: "Please make sure both PINs are identical 4-digit numbers.", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const pinHash = await hashPin(pin);

      // Upsert: delete existing then insert
      await supabase.from("venue_pins").delete().eq("venue_id", venueId);
      const { error } = await supabase.from("venue_pins").insert({
        venue_id: venueId,
        pin_hash: pinHash,
        created_by: user.id,
      });

      if (error) throw error;

      toast({ title: "PIN saved! 🔒", description: "Your venue redemption PIN has been set.", duration: 3000 });
      setHasPin(true);
      setOpen(false);
      setPin("");
      setConfirmPin("");
    } catch (err: any) {
      console.error("Error saving PIN:", err);
      toast({ title: "Error", description: err.message || "Failed to save PIN", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          {hasPin ? <Lock className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
          {hasPin ? "Update Redemption PIN" : "Set Redemption PIN"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-primary" />
            {hasPin ? "Update" : "Set"} Redemption PIN
          </DialogTitle>
          <DialogDescription>
            This 4-digit PIN is used by your staff to verify and redeem customer vouchers. Keep it private.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>New PIN</Label>
            <Input
              type="text"
              inputMode="numeric"
              maxLength={4}
              placeholder="••••"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
              className="text-center text-2xl tracking-[0.5em] font-mono"
            />
          </div>
          <div className="space-y-2">
            <Label>Confirm PIN</Label>
            <Input
              type="text"
              inputMode="numeric"
              maxLength={4}
              placeholder="••••"
              value={confirmPin}
              onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
              className="text-center text-2xl tracking-[0.5em] font-mono"
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSave} disabled={pin.length !== 4 || pin !== confirmPin || saving}>
            {saving ? "Saving..." : "Save PIN"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
