import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { VoucherDisplay } from "./VoucherDisplay";
import { Ticket } from "lucide-react";

interface UserVouchersProps {
  userId: string;
}

export const UserVouchers = ({ userId }: UserVouchersProps) => {
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [promoMap, setPromoMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVouchers = async () => {
      const { data, error } = await supabase
        .from("promo_vouchers")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (!error && data) {
        setVouchers(data);
        // Fetch promo titles
        const promoIds = [...new Set(data.map((v: any) => v.promo_id))];
        if (promoIds.length > 0) {
          const { data: promos } = await supabase
            .from("promos")
            .select("id, title")
            .in("id", promoIds);
          if (promos) {
            const map: Record<string, string> = {};
            promos.forEach((p: any) => { map[p.id] = p.title; });
            setPromoMap(map);
          }
        }
      }
      setLoading(false);
    };
    fetchVouchers();
  }, [userId]);

  if (loading) return null;
  if (vouchers.length === 0) return null;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <Ticket className="w-5 h-5 text-primary" />
        My Vouchers
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {vouchers.map((v: any) => (
          <VoucherDisplay
            key={v.id}
            code={v.code}
            promoTitle={promoMap[v.promo_id] || "Promo"}
            redemptionMode={v.redemption_mode}
            isRedeemed={v.is_redeemed}
            redemptionCount={v.redemption_count}
            lastRedeemedAt={v.last_redeemed_at}
            cooldownDays={v.cooldown_days}
            expiresAt={v.expires_at}
          />
        ))}
      </div>
    </div>
  );
};
