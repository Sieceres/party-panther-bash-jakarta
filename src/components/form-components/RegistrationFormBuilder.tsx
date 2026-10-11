import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowDown, ArrowUp, ClipboardList, Plus, Trash2, X } from "lucide-react";
import { FIELD_TYPE_LABELS, RegField, RegFieldType, isChoice, newField } from "@/lib/registration";

interface Props {
  enabled: boolean;
  fields: RegField[];
  capacity: number | null;
  onEnabledChange: (v: boolean) => void;
  onFieldsChange: (f: RegField[]) => void;
  onCapacityChange: (v: number | null) => void;
}

export const RegistrationFormBuilder = ({ enabled, fields, capacity, onEnabledChange, onFieldsChange, onCapacityChange }: Props) => {
  const update = (i: number, patch: Partial<RegField>) =>
    onFieldsChange(fields.map((f, idx) => (idx === i ? { ...f, ...patch } : f)));
  const move = (i: number, d: number) => {
    const j = i + d;
    if (j < 0 || j >= fields.length) return;
    const next = [...fields];
    [next[i], next[j]] = [next[j], next[i]];
    onFieldsChange(next);
  };

  return (
    <Card className="border-border">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between gap-3 text-base">
          <span className="flex items-center gap-2"><ClipboardList className="w-4 h-4 text-primary" /> Registration form</span>
          <Switch checked={enabled} onCheckedChange={onEnabledChange} aria-label="Enable registration form" />
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Let people sign up with a form, even without an account. Name and email are always asked. You get notified for every registration.
        </p>
      </CardHeader>
      {enabled && (
        <CardContent className="space-y-4">
          <div className="space-y-2 max-w-xs">
            <Label htmlFor="reg-capacity">Maximum registrations (optional)</Label>
            <Input
              id="reg-capacity"
              type="number"
              min={1}
              placeholder="No limit"
              value={capacity ?? ""}
              onChange={(e) => onCapacityChange(e.target.value ? Math.max(1, parseInt(e.target.value)) : null)}
            />
          </div>

          {fields.map((f, i) => (
            <div key={f.id} className="rounded-md border border-border p-3 space-y-3">
              <div className="flex flex-col sm:flex-row gap-2">
                <Input
                  placeholder="Question"
                  value={f.label}
                  maxLength={200}
                  onChange={(e) => update(i, { label: e.target.value })}
                  className="flex-1"
                />
                <Select
                  value={f.type}
                  onValueChange={(t: RegFieldType) =>
                    update(i, { type: t, options: isChoice(t) ? f.options?.length ? f.options : ["Option 1"] : undefined })
                  }
                >
                  <SelectTrigger className="sm:w-56"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(FIELD_TYPE_LABELS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {isChoice(f.type) && (
                <div className="space-y-2 pl-1">
                  {(f.options || []).map((o, oi) => (
                    <div key={oi} className="flex gap-2">
                      <Input
                        value={o}
                        maxLength={100}
                        onChange={(e) => update(i, { options: f.options!.map((x, k) => (k === oi ? e.target.value : x)) })}
                      />
                      <Button type="button" variant="ghost" size="icon" aria-label="Remove option"
                        onClick={() => update(i, { options: f.options!.filter((_, k) => k !== oi) })}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  <Button type="button" variant="ghost" size="sm"
                    onClick={() => update(i, { options: [...(f.options || []), `Option ${(f.options?.length || 0) + 1}`] })}>
                    <Plus className="w-4 h-4 mr-1" /> Add option
                  </Button>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-4">
                  <label className="flex items-center gap-2 text-sm">
                    <Switch checked={f.required} onCheckedChange={(v) => update(i, { required: v })} /> Required
                  </label>
                  {(f.type === "short_text" || f.type === "phone" || f.type === "number" || f.type === "single_choice") && (
                    <Select value={f.prefill || "none"} onValueChange={(v) => update(i, { prefill: v === "none" ? null : (v as any) })}>
                      <SelectTrigger className="h-8 w-48 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No profile prefill</SelectItem>
                        <SelectItem value="instagram">Prefill: Instagram</SelectItem>
                        <SelectItem value="whatsapp">Prefill: WhatsApp</SelectItem>
                        <SelectItem value="gender">Prefill: Gender</SelectItem>
                        <SelectItem value="age">Prefill: Age</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>
                <div className="flex gap-1">
                  <Button type="button" variant="ghost" size="icon" aria-label="Move up" onClick={() => move(i, -1)}><ArrowUp className="w-4 h-4" /></Button>
                  <Button type="button" variant="ghost" size="icon" aria-label="Move down" onClick={() => move(i, 1)}><ArrowDown className="w-4 h-4" /></Button>
                  <Button type="button" variant="ghost" size="icon" aria-label="Delete question"
                    onClick={() => onFieldsChange(fields.filter((_, k) => k !== i))}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </div>
          ))}

          <Button type="button" variant="outline" onClick={() => onFieldsChange([...fields, newField()])}>
            <Plus className="w-4 h-4 mr-1" /> Add question
          </Button>
        </CardContent>
      )}
    </Card>
  );
};
