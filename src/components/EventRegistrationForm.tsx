import { useEffect, useState } from "react";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CheckCircle2, ClipboardList, UserCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/lib/toast";
import { RegField } from "@/lib/registration";

interface Props {
  eventId: string;
  fields: RegField[];
  capacity: number | null;
}

const baseSchema = z.object({
  name: z.string().trim().min(1, "Please enter your name").max(120),
  email: z.string().trim().email("Please enter a valid email").max(255),
});

export function EventRegistrationForm({ eventId, fields, capacity }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [count, setCount] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    (supabase.rpc as any)("get_event_registration_count", { _event_id: eventId }).then(({ data }: any) => setCount(data ?? 0));
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, [eventId]);

  const set = (id: string, v: any) => setAnswers((a) => ({ ...a, [id]: v }));

  const prefill = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: p } = await supabase.from("profiles").select("display_name, instagram, whatsapp, gender, age").eq("user_id", user.id).maybeSingle();
    if (p?.display_name) setName(p.display_name);
    if (user.email) setEmail(user.email);
    const next = { ...answers };
    fields.forEach((f) => {
      if (f.prefill && p && (p as any)[f.prefill] != null && (p as any)[f.prefill] !== "") next[f.id] = String((p as any)[f.prefill]);
      if (f.type === "email" && user.email && !next[f.id]) next[f.id] = user.email;
    });
    setAnswers(next);
    toast.success("Filled in from your profile");
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const base = baseSchema.safeParse({ name, email });
    if (!base.success) return toast.error(base.error.errors[0].message);
    for (const f of fields) {
      const v = answers[f.id];
      const empty = v === undefined || v === null || v === "" || (Array.isArray(v) && v.length === 0);
      if (f.required && empty) return toast.error(`Please answer "${f.label}"`);
      if (!empty && f.type === "email" && !z.string().email().safeParse(v).success) return toast.error(`"${f.label}" must be a valid email`);
      if (!empty && f.type === "phone" && !/^[+0-9 ()-]{6,20}$/.test(v)) return toast.error(`"${f.label}" must be a valid phone number`);
      if (!empty && typeof v === "string" && v.length > 2000) return toast.error(`"${f.label}" is too long`);
    }
    setSubmitting(true);
    const { data, error } = await (supabase.rpc as any)("submit_event_registration", {
      _event_id: eventId, _name: name.trim(), _email: email.trim(), _answers: answers,
    });
    setSubmitting(false);
    if (error) return toast.error(error.message);
    // email the organizer (best effort)
    supabase.functions.invoke("notify-registration", { body: { registration_id: data } }).catch(() => {});
    setDone(true);
    setCount((c) => (c ?? 0) + 1);
    toast.success("You're registered!");
  };

  const full = capacity != null && count != null && count >= capacity;

  return (
    <Card className="bg-card/80 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <ClipboardList className="w-5 h-5 text-primary" /> Register
        </CardTitle>
        {capacity != null && count != null && (
          <p className="text-xs text-muted-foreground">{Math.max(0, capacity - count)} of {capacity} spots left</p>
        )}
      </CardHeader>
      <CardContent>
        {done ? (
          <div className="flex flex-col items-center text-center gap-2 py-6">
            <CheckCircle2 className="w-10 h-10 text-primary" />
            <p className="font-medium">Thanks, you're registered!</p>
            <p className="text-sm text-muted-foreground">The organizer has been notified.</p>
          </div>
        ) : full ? (
          <p className="text-sm text-muted-foreground">Registration is full.</p>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            {userId && (
              <Button type="button" variant="outline" size="sm" className="w-full" onClick={prefill}>
                <UserCircle2 className="w-4 h-4 mr-2" /> Prefill from my Party Panther profile
              </Button>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="reg-name">Name *</Label>
              <Input id="reg-name" value={name} maxLength={120} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="reg-email">Email *</Label>
              <Input id="reg-email" type="email" value={email} maxLength={255} onChange={(e) => setEmail(e.target.value)} />
            </div>
            {fields.map((f) => (
              <div key={f.id} className="space-y-1.5">
                <Label htmlFor={`reg-${f.id}`}>{f.label}{f.required && " *"}</Label>
                {f.type === "long_text" ? (
                  <Textarea id={`reg-${f.id}`} value={answers[f.id] || ""} maxLength={2000} onChange={(e) => set(f.id, e.target.value)} />
                ) : f.type === "single_choice" ? (
                  <RadioGroup value={answers[f.id] || ""} onValueChange={(v) => set(f.id, v)}>
                    {(f.options || []).map((o) => (
                      <label key={o} className="flex items-center gap-2 text-sm"><RadioGroupItem value={o} /> {o}</label>
                    ))}
                  </RadioGroup>
                ) : f.type === "multi_choice" ? (
                  <div className="space-y-1.5">
                    {(f.options || []).map((o) => {
                      const cur: string[] = answers[f.id] || [];
                      return (
                        <label key={o} className="flex items-center gap-2 text-sm">
                          <Checkbox checked={cur.includes(o)}
                            onCheckedChange={(v) => set(f.id, v ? [...cur, o] : cur.filter((x) => x !== o))} /> {o}
                        </label>
                      );
                    })}
                  </div>
                ) : (
                  <Input
                    id={`reg-${f.id}`}
                    type={f.type === "email" ? "email" : f.type === "phone" ? "tel" : f.type === "number" ? "number" : f.type === "date" ? "date" : "text"}
                    value={answers[f.id] || ""}
                    maxLength={500}
                    onChange={(e) => set(f.id, e.target.value)}
                  />
                )}
              </div>
            ))}
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "Sending…" : "Register"}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
