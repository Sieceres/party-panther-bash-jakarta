import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Tables } from "@/integrations/supabase/types";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";
import { getPromoUrl } from "@/lib/slug-utils";
import { getRegionLabelForArea, normalizeArea } from "@/lib/area-config";

export type PromoSortKey = "name" | "type" | "day" | "area" | "price";
export type SortDirection = "asc" | "desc";

const DAY_ORDER = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

const dayRank = (days: string[] | null | undefined) => {
  if (!days || days.length === 0) return 99;
  return Math.min(
    ...days.map((d) => {
      const idx = DAY_ORDER.indexOf(String(d).toLowerCase());
      return idx === -1 ? 99 : idx;
    })
  );
};

const formatDays = (days: string[] | null | undefined) => {
  if (!days || days.length === 0) return "—";
  if (days.length === 7) return "Every day";
  return days
    .map((d) => String(d).charAt(0).toUpperCase() + String(d).slice(1, 3))
    .join(", ");
};

const formatPrice = (amount: number | null | undefined, currency?: string | null) => {
  if (amount == null) return "—";
  const code = currency || "IDR";
  const formatted = new Intl.NumberFormat("id-ID").format(amount);
  return code === "IDR" ? `Rp ${formatted}` : `${code} ${formatted}`;
};

const regionOf = (area: string | null | undefined) => {
  if (!area) return "";
  return getRegionLabelForArea(area) || normalizeArea(area);
};

const SORT_LABELS: Record<PromoSortKey, string> = {
  name: "Name",
  type: "Promo Type",
  day: "Day",
  area: "Area",
  price: "Price",
};

interface PromoListViewProps {
  promos: Tables<"promos">[];
  sortKey: PromoSortKey;
  sortDir: SortDirection;
  onSortChange: (key: PromoSortKey, dir: SortDirection) => void;
}

export const PromoListView = ({ promos, sortKey, sortDir, onSortChange }: PromoListViewProps) => {
  const navigate = useNavigate();

  const sorted = useMemo(() => {
    const dir = sortDir === "asc" ? 1 : -1;
    const copy = [...promos];
    copy.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "name":
          cmp = (a.title || "").localeCompare(b.title || "");
          break;
        case "type":
          cmp = (a.promo_type || "").localeCompare(b.promo_type || "");
          break;
        case "day":
          cmp = dayRank(a.day_of_week) - dayRank(b.day_of_week);
          break;
        case "area":
          cmp =
            regionOf(a.area).localeCompare(regionOf(b.area)) ||
            (a.area || "").localeCompare(b.area || "");
          break;
        case "price": {
          const pa = a.discounted_price_amount ?? Number.MAX_SAFE_INTEGER;
          const pb = b.discounted_price_amount ?? Number.MAX_SAFE_INTEGER;
          cmp = pa - pb;
          break;
        }
      }
      if (cmp === 0) cmp = (a.title || "").localeCompare(b.title || "");
      return cmp * dir;
    });
    return copy;
  }, [promos, sortKey, sortDir]);

  const toggleSort = (key: PromoSortKey) => {
    if (key === sortKey) {
      onSortChange(key, sortDir === "asc" ? "desc" : "asc");
    } else {
      onSortChange(key, "asc");
    }
  };

  const SortIcon = ({ column }: { column: PromoSortKey }) => {
    if (column !== sortKey) return <ChevronsUpDown className="w-3.5 h-3.5 opacity-40" />;
    return sortDir === "asc" ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />;
  };

  const columns: { key: PromoSortKey; className: string }[] = [
    { key: "name", className: "w-[34%]" },
    { key: "type", className: "w-[16%]" },
    { key: "day", className: "w-[18%]" },
    { key: "area", className: "w-[20%]" },
    { key: "price", className: "w-[12%] justify-end" },
  ];

  return (
    <div>
      {/* Mobile sort control */}
      <div className="md:hidden flex items-center gap-2 mb-3">
        <span className="text-sm text-white/70">Sort by</span>
        <Select
          value={`${sortKey}:${sortDir}`}
          onValueChange={(v) => {
            const [k, d] = v.split(":") as [PromoSortKey, SortDirection];
            onSortChange(k, d);
          }}
        >
          <SelectTrigger className="glass-control w-52">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(SORT_LABELS) as PromoSortKey[]).flatMap((k) => [
              <SelectItem key={`${k}:asc`} value={`${k}:asc`}>{SORT_LABELS[k]} ↑</SelectItem>,
              <SelectItem key={`${k}:desc`} value={`${k}:desc`}>{SORT_LABELS[k]} ↓</SelectItem>,
            ])}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border border-border/40 overflow-hidden bg-background/40 backdrop-blur-sm">
        {/* Desktop header */}
        <div className="hidden md:flex items-center px-4 py-2 border-b border-border/40 bg-white/5">
          {columns.map((col) => (
            <button
              key={col.key}
              type="button"
              onClick={() => toggleSort(col.key)}
              className={`${col.className} flex items-center gap-1 text-xs font-semibold uppercase tracking-wide hover:text-primary transition-colors ${
                col.key === sortKey ? "text-primary" : "text-white/70"
              }`}
            >
              {SORT_LABELS[col.key]}
              <SortIcon column={col.key} />
            </button>
          ))}
        </div>

        <ul className="divide-y divide-border/30">
          {sorted.map((promo) => (
            <li key={promo.id}>
              <button
                type="button"
                onClick={() => navigate(getPromoUrl(promo as never))}
                className="w-full text-left px-4 py-3 hover:bg-primary/10 transition-colors"
              >
                {/* Desktop row */}
                <div className="hidden md:flex items-center">
                  <div className="w-[34%] pr-3 min-w-0">
                    <div className="font-medium text-white truncate">{promo.title}</div>
                    <div className="text-xs text-muted-foreground truncate">{promo.venue_name}</div>
                  </div>
                  <div className="w-[16%] pr-3 min-w-0">
                    {promo.promo_type ? (
                      <Badge variant="secondary" className="text-xs">{promo.promo_type}</Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </div>
                  <div className="w-[18%] pr-3 text-sm text-white/80 truncate">{formatDays(promo.day_of_week)}</div>
                  <div className="w-[20%] pr-3 text-sm text-white/80 min-w-0">
                    <span className="block truncate">{promo.area || "—"}</span>
                    {regionOf(promo.area) && regionOf(promo.area) !== promo.area && (
                      <span className="block text-xs text-muted-foreground truncate">{regionOf(promo.area)}</span>
                    )}
                  </div>
                  <div className="w-[12%] text-right text-sm font-semibold text-primary">
                    {formatPrice(promo.discounted_price_amount, promo.price_currency)}
                  </div>
                </div>

                {/* Mobile compact row */}
                <div className="md:hidden space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-medium text-white truncate">{promo.title}</div>
                      <div className="text-xs text-muted-foreground truncate">{promo.venue_name}</div>
                    </div>
                    <div className="text-sm font-semibold text-primary whitespace-nowrap">
                      {formatPrice(promo.discounted_price_amount, promo.price_currency)}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-white/70">
                    {promo.promo_type && (
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{promo.promo_type}</Badge>
                    )}
                    <span>{formatDays(promo.day_of_week)}</span>
                    {promo.area && <span>· {promo.area}</span>}
                  </div>
                </div>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
