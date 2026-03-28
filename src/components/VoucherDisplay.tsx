import { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Copy, CheckCircle2, Clock, XCircle, Ticket } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface VoucherDisplayProps {
  code: string;
  promoTitle: string;
  redemptionMode: string;
  isRedeemed: boolean;
  redemptionCount: number;
  lastRedeemedAt: string | null;
  cooldownDays: number | null;
  expiresAt: string | null;
}

export const VoucherDisplay = ({
  code,
  promoTitle,
  redemptionMode,
  isRedeemed,
  redemptionCount,
  lastRedeemedAt,
  cooldownDays,
  expiresAt,
}: VoucherDisplayProps) => {
  const { toast } = useToast();
  const verifyUrl = `${window.location.origin}/voucher/${code}`;

  const expired = expiresAt && new Date(expiresAt) < new Date();
  const singleUsed = redemptionMode === "single" && isRedeemed;

  let cooldownActive = false;
  let cooldownEnd: Date | null = null;
  if (redemptionMode === "multi" && lastRedeemedAt && cooldownDays) {
    cooldownEnd = new Date(lastRedeemedAt);
    cooldownEnd.setDate(cooldownEnd.getDate() + cooldownDays);
    cooldownActive = cooldownEnd > new Date();
  }

  const statusLabel = expired
    ? "Expired"
    : singleUsed
    ? "Redeemed"
    : cooldownActive
    ? "Cooldown"
    : "Active";

  const statusColor = expired || singleUsed
    ? "destructive"
    : cooldownActive
    ? "secondary"
    : "default";

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium truncate">{promoTitle}</CardTitle>
          <Badge variant={statusColor as any}>{statusLabel}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-center p-3 bg-white rounded-lg">
          <QRCodeSVG value={verifyUrl} size={140} />
        </div>

        <div className="flex items-center justify-between gap-2 p-2 bg-muted rounded-md">
          <code className="text-sm font-mono font-bold tracking-wider">{code}</code>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              navigator.clipboard.writeText(code);
              toast({ title: "Code copied!", duration: 2000 });
            }}
          >
            <Copy className="w-3.5 h-3.5" />
          </Button>
        </div>

        <div className="text-xs text-muted-foreground space-y-1">
          <p>{redemptionMode === "single" ? "Single use" : `Multi-use${cooldownDays ? ` (${cooldownDays}d cooldown)` : ""}`}</p>
          {redemptionCount > 0 && <p>Used {redemptionCount} time{redemptionCount !== 1 ? "s" : ""}</p>}
          {cooldownActive && cooldownEnd && <p>Available again: {cooldownEnd.toLocaleDateString()}</p>}
          {expiresAt && <p>Expires: {new Date(expiresAt).toLocaleDateString()}</p>}
        </div>
      </CardContent>
    </Card>
  );
};
