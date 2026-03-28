import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Ticket } from "lucide-react";

interface VoucherSettingsProps {
  voucherEnabled: boolean;
  voucherMode: string;
  voucherCooldownDays: number | null;
  onEnabledChange: (enabled: boolean) => void;
  onModeChange: (mode: string) => void;
  onCooldownChange: (days: number | null) => void;
}

export const VoucherSettings = ({
  voucherEnabled,
  voucherMode,
  voucherCooldownDays,
  onEnabledChange,
  onModeChange,
  onCooldownChange,
}: VoucherSettingsProps) => {
  return (
    <div className="space-y-4 p-4 rounded-lg border border-border bg-muted/30">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Ticket className="w-4 h-4 text-primary" />
          <Label htmlFor="voucher-toggle" className="font-semibold cursor-pointer">
            Enable Voucher Redemption
          </Label>
        </div>
        <Switch
          id="voucher-toggle"
          checked={voucherEnabled}
          onCheckedChange={onEnabledChange}
        />
      </div>

      {voucherEnabled && (
        <div className="space-y-3 pl-6 border-l-2 border-primary/20">
          <div className="space-y-2">
            <Label>Voucher Mode</Label>
            <Select value={voucherMode} onValueChange={onModeChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="single">Single-use (one redemption per user)</SelectItem>
                <SelectItem value="multi">Multi-use (can be redeemed repeatedly)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {voucherMode === "multi" && (
            <div className="space-y-2">
              <Label>Cooldown Period (days)</Label>
              <Input
                type="number"
                min={0}
                max={365}
                placeholder="e.g. 7"
                value={voucherCooldownDays ?? ""}
                onChange={(e) => {
                  const val = e.target.value ? parseInt(e.target.value) : null;
                  onCooldownChange(val);
                }}
              />
              <p className="text-xs text-muted-foreground">
                How many days before a user can redeem again. Leave empty for no cooldown.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
