import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Trash2, Plus, ChevronDown, ChevronUp } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export interface ExtractedPromo {
  id: string;
  selected: boolean;
  title: string;
  description: string;
  venue_name: string;
  venue_address: string;
  discount_text: string;
  promo_type: string;
  day_of_week: string[];
  area: string;
  drink_type: string[];
  original_price_amount: number | null;
  discounted_price_amount: number | null;
  price_currency: string;
  category: string;
}

export interface ExtractedEvent {
  id: string;
  selected: boolean;
  title: string;
  description: string;
  date: string;
  time: string;
  venue_name: string;
  venue_address: string;
  organizer_name: string;
  price_currency: string;
}

interface BatchImportReviewProps {
  type: "promo" | "event";
  items: (ExtractedPromo | ExtractedEvent)[];
  onItemsChange: (items: (ExtractedPromo | ExtractedEvent)[]) => void;
}

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const PROMO_TYPES = ["Free Flow", "Ladies Night", "Bottle Promo", "Other"];
const CATEGORIES = ["bar", "club", "restaurant", "cafe", "hotel", "rooftop", "beach_club", "other"];

export const BatchImportReview = ({ type, items, onItemsChange }: BatchImportReviewProps) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const selectedCount = items.filter(i => i.selected).length;

  const toggleAll = (checked: boolean) => {
    onItemsChange(items.map(i => ({ ...i, selected: checked })));
  };

  const toggleItem = (id: string) => {
    onItemsChange(items.map(i => i.id === id ? { ...i, selected: !i.selected } : i));
  };

  const updateItem = (id: string, field: string, value: any) => {
    onItemsChange(items.map(i => i.id === id ? { ...i, [field]: value } : i));
  };

  const removeItem = (id: string) => {
    onItemsChange(items.filter(i => i.id !== id));
  };

  const toggleDay = (id: string, day: string) => {
    const item = items.find(i => i.id === id) as ExtractedPromo;
    if (!item) return;
    const days = item.day_of_week.includes(day)
      ? item.day_of_week.filter(d => d !== day)
      : [...item.day_of_week, day];
    updateItem(id, "day_of_week", days);
  };

  const isPromo = type === "promo";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Checkbox
            checked={selectedCount === items.length && items.length > 0}
            onCheckedChange={(checked) => toggleAll(!!checked)}
          />
          <span className="text-sm text-muted-foreground">
            {selectedCount} of {items.length} selected
          </span>
        </div>
      </div>

      <div className="space-y-3">
        {items.map((item) => {
          const isExpanded = expandedId === item.id;
          const hasTitle = item.title?.trim();
          const hasVenue = isPromo ? (item as ExtractedPromo).venue_name?.trim() : true;
          const isValid = hasTitle && (isPromo ? (item as ExtractedPromo).discount_text?.trim() && hasVenue : true);

          return (
            <Card
              key={item.id}
              className={`transition-all ${!item.selected ? "opacity-50" : ""} ${!isValid ? "border-destructive/50" : ""}`}
            >
              <CardContent className="p-4 space-y-3">
                {/* Header row */}
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={item.selected}
                    onCheckedChange={() => toggleItem(item.id)}
                  />
                  <div className="flex-1 min-w-0">
                    <Input
                      value={item.title}
                      onChange={(e) => updateItem(item.id, "title", e.target.value)}
                      placeholder="Title *"
                      className="font-medium"
                    />
                  </div>
                  {isPromo && (
                    <Badge variant="outline" className="shrink-0">
                      {(item as ExtractedPromo).venue_name || "No venue"}
                    </Badge>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setExpandedId(isExpanded ? null : item.id)}
                  >
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeItem(item.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                {/* Summary when collapsed */}
                {!isExpanded && isPromo && (
                  <div className="flex flex-wrap gap-1.5 pl-9">
                    {(item as ExtractedPromo).discount_text && (
                      <Badge variant="secondary" className="text-xs">{(item as ExtractedPromo).discount_text}</Badge>
                    )}
                    {(item as ExtractedPromo).day_of_week?.map(d => (
                      <Badge key={d} variant="outline" className="text-xs">{d.slice(0, 3)}</Badge>
                    ))}
                  </div>
                )}

                {/* Expanded edit form */}
                {isExpanded && (
                  <div className="pl-9 space-y-3">
                    {isPromo ? (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <Input
                            value={(item as ExtractedPromo).venue_name}
                            onChange={(e) => updateItem(item.id, "venue_name", e.target.value)}
                            placeholder="Venue name *"
                          />
                          <Input
                            value={(item as ExtractedPromo).discount_text}
                            onChange={(e) => updateItem(item.id, "discount_text", e.target.value)}
                            placeholder="Discount text *"
                          />
                        </div>
                        <Input
                          value={item.description}
                          onChange={(e) => updateItem(item.id, "description", e.target.value)}
                          placeholder="Description"
                        />
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <Select
                            value={(item as ExtractedPromo).promo_type || ""}
                            onValueChange={(v) => updateItem(item.id, "promo_type", v)}
                          >
                            <SelectTrigger><SelectValue placeholder="Promo type" /></SelectTrigger>
                            <SelectContent>
                              {PROMO_TYPES.map(t => (
                                <SelectItem key={t} value={t}>{t.replace(/_/g, " ")}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Select
                            value={(item as ExtractedPromo).category || ""}
                            onValueChange={(v) => updateItem(item.id, "category", v)}
                          >
                            <SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
                            <SelectContent>
                              {CATEGORIES.map(c => (
                                <SelectItem key={c} value={c}>{c.replace(/_/g, " ")}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Input
                            value={(item as ExtractedPromo).area}
                            onChange={(e) => updateItem(item.id, "area", e.target.value)}
                            placeholder="Area"
                          />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <Input
                            value={(item as ExtractedPromo).venue_address}
                            onChange={(e) => updateItem(item.id, "venue_address", e.target.value)}
                            placeholder="Venue address"
                          />
                          <div className="flex gap-2">
                            <Input
                              type="number"
                              value={(item as ExtractedPromo).original_price_amount ?? ""}
                              onChange={(e) => updateItem(item.id, "original_price_amount", e.target.value ? Number(e.target.value) : null)}
                              placeholder="Original price"
                            />
                            <Input
                              type="number"
                              value={(item as ExtractedPromo).discounted_price_amount ?? ""}
                              onChange={(e) => updateItem(item.id, "discounted_price_amount", e.target.value ? Number(e.target.value) : null)}
                              placeholder="Discounted price"
                            />
                          </div>
                        </div>
                        {/* Days */}
                        <div>
                          <p className="text-xs text-muted-foreground mb-1.5">Active days</p>
                          <div className="flex flex-wrap gap-1.5">
                            {DAYS.map(day => (
                              <Badge
                                key={day}
                                variant={(item as ExtractedPromo).day_of_week?.includes(day) ? "default" : "outline"}
                                className="cursor-pointer"
                                onClick={() => toggleDay(item.id, day)}
                              >
                                {day.slice(0, 3)}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <Input
                          value={item.description}
                          onChange={(e) => updateItem(item.id, "description", e.target.value)}
                          placeholder="Description"
                        />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <Input
                            type="date"
                            value={(item as ExtractedEvent).date}
                            onChange={(e) => updateItem(item.id, "date", e.target.value)}
                            placeholder="Date"
                          />
                          <Input
                            type="time"
                            value={(item as ExtractedEvent).time}
                            onChange={(e) => updateItem(item.id, "time", e.target.value)}
                            placeholder="Time"
                          />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <Input
                            value={(item as ExtractedEvent).venue_name}
                            onChange={(e) => updateItem(item.id, "venue_name", e.target.value)}
                            placeholder="Venue name"
                          />
                          <Input
                            value={(item as ExtractedEvent).venue_address}
                            onChange={(e) => updateItem(item.id, "venue_address", e.target.value)}
                            placeholder="Venue address"
                          />
                        </div>
                        <Input
                          value={(item as ExtractedEvent).organizer_name}
                          onChange={(e) => updateItem(item.id, "organizer_name", e.target.value)}
                          placeholder="Organizer name"
                        />
                      </>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {items.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No items extracted. Try uploading a different image.
        </div>
      )}
    </div>
  );
};
