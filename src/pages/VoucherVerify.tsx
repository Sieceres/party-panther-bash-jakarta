import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle2, XCircle, Ticket, ShieldCheck, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SpinningPaws } from "@/components/ui/spinning-paws";
import { usePageTitle } from "@/hooks/usePageTitle";

const VoucherVerify = () => {
  const { code } = useParams<{ code: string }>();
  const [loading, setLoading] = useState(true);
  const [voucherData, setVoucherData] = useState<any>(null);
  const [status, setStatus] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [pin, setPin] = useState("");
  const [redeeming, setRedeeming] = useState(false);
  const [redeemResult, setRedeemResult] = useState<{ success: boolean; message: string } | null>(null);

  usePageTitle("Verify Voucher");

  useEffect(() => {
    const lookup = async () => {
      if (!code) return;
      try {
        const { data, error: fnErr } = await supabase.functions.invoke("redeem-voucher", {
          body: { code: code.toUpperCase(), action: "lookup" },
        });
        if (fnErr) throw fnErr;
        if (data.error) {
          setError(data.error);
        } else {
          setVoucherData(data);
          setStatus(data.status);
        }
      } catch (err: any) {
        setError(err.message || "Failed to look up voucher");
      } finally {
        setLoading(false);
      }
    };
    lookup();
  }, [code]);

  const handleRedeem = async () => {
    if (pin.length !== 4) return;
    setRedeeming(true);
    setRedeemResult(null);
    try {
      const { data, error: fnErr } = await supabase.functions.invoke("redeem-voucher", {
        body: { code: code!.toUpperCase(), venue_pin: pin, action: "redeem" },
      });
      if (fnErr) throw fnErr;
      if (data.error) {
        setRedeemResult({ success: false, message: data.error });
      } else {
        setRedeemResult({ success: true, message: data.message });
        setStatus("redeemed");
      }
    } catch (err: any) {
      setRedeemResult({ success: false, message: err.message || "Redemption failed" });
    } finally {
      setRedeeming(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <SpinningPaws size="lg" />
          <p className="text-muted-foreground">Looking up voucher...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center space-y-4">
            <XCircle className="w-16 h-16 text-destructive mx-auto" />
            <h2 className="text-xl font-bold">Voucher Not Found</h2>
            <p className="text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { voucher, promo } = voucherData;
  const isValid = status === "valid";

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Ticket className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="text-xl">Voucher Verification</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Promo info */}
          <div className="space-y-2">
            {promo.image_url && (
              <div className="aspect-video rounded-lg overflow-hidden bg-muted mb-3">
                <img src={promo.image_url} alt={promo.title} className="w-full h-full object-cover" />
              </div>
            )}
            <h3 className="font-bold text-lg">{promo.title}</h3>
            <p className="text-muted-foreground">{promo.venue_name}</p>
            <Badge variant="secondary" className="font-bold">{promo.discount_text}</Badge>
          </div>

          {/* Status */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
            <span className="text-sm font-medium">Status</span>
            <Badge
              variant={isValid ? "default" : "destructive"}
              className={isValid ? "bg-green-600" : ""}
            >
              {status === "valid" ? "✓ Valid" : status === "expired" ? "Expired" : status === "redeemed" ? "Redeemed" : "Cooldown"}
            </Badge>
          </div>

          {/* Voucher code */}
          <div className="text-center">
            <code className="text-xl font-mono font-bold tracking-widest text-primary">{voucher.code}</code>
            <p className="text-xs text-muted-foreground mt-1">
              {voucher.redemption_mode === "single" ? "Single use" : "Multi-use"} • 
              Used {voucher.redemption_count} time{voucher.redemption_count !== 1 ? "s" : ""}
            </p>
          </div>

          {/* Redeem section */}
          {redeemResult ? (
            <div className={`p-4 rounded-lg text-center space-y-2 ${redeemResult.success ? "bg-green-500/10 border border-green-500/30" : "bg-destructive/10 border border-destructive/30"}`}>
              {redeemResult.success ? (
                <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto" />
              ) : (
                <XCircle className="w-12 h-12 text-destructive mx-auto" />
              )}
              <p className="font-semibold">{redeemResult.message}</p>
            </div>
          ) : isValid ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <ShieldCheck className="w-4 h-4" />
                <span>Venue staff: enter your 4-digit PIN to redeem</span>
              </div>
              <div className="space-y-2">
                <Label htmlFor="pin">Venue PIN</Label>
                <Input
                  id="pin"
                  type="text"
                  inputMode="numeric"
                  maxLength={4}
                  placeholder="••••"
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  className="text-center text-2xl tracking-[0.5em] font-mono"
                />
              </div>
              <Button
                onClick={handleRedeem}
                disabled={pin.length !== 4 || redeeming}
                className="w-full"
              >
                {redeeming ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Verifying...</>
                ) : (
                  "Redeem Voucher"
                )}
              </Button>
            </div>
          ) : (
            <p className="text-center text-muted-foreground text-sm">
              {status === "expired" ? "This voucher has expired and can no longer be redeemed." :
               status === "redeemed" ? "This voucher has already been redeemed." :
               "This voucher is on cooldown and cannot be used yet."}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default VoucherVerify;
