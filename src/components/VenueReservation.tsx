import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CalendarCheck, ExternalLink, MessageCircle } from "lucide-react";
import { format } from "date-fns";

export function buildReservationText(venue: string, people: number, date: string, time: string, name: string) {
  const d = date ? format(new Date(date + "T00:00:00"), "EEEE, d MMMM yyyy") : date;
  return `Hi, ${venue}!\n\nI would like to reserve a table, if possible.\n\n- For ${people} people\n- On ${d}\n- At ${time}\n- Under the name ${name}\n\nPlease confirm your availability. Thank you!\n\n_Sent through partypanther.net_`;
}

interface Props {
  venueName: string;
  whatsapp: string | null;
  bookingUrl: string | null;
}

export function VenueReservation({ venueName, whatsapp, bookingUrl }: Props) {
  const [open, setOpen] = useState(false);
  const [people, setPeople] = useState("2");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [name, setName] = useState("");
  if (!whatsapp && !bookingUrl) return null;

  const valid = Number(people) >= 1 && date && time && name.trim();
  const send = () => {
    const text = buildReservationText(venueName, Number(people), date, time, name.trim());
    window.open(`https://wa.me/${whatsapp!.replace(/\D/g, "")}?text=${encodeURIComponent(text)}`, "_blank", "noopener");
    setOpen(false);
  };
  const url = bookingUrl && (bookingUrl.startsWith("http") ? bookingUrl : `https://${bookingUrl}`);

  return (
    <Card>
      <CardHeader><CardTitle className="flex items-center gap-2"><CalendarCheck className="w-5 h-5" /> Reserve a table</CardTitle></CardHeader>
      <CardContent className="space-y-2">
        {whatsapp && (
          <Button className="w-full" onClick={() => setOpen(true)}>
            <MessageCircle className="w-4 h-4 mr-2" /> Reserve via WhatsApp
          </Button>
        )}
        {url && (
          <Button asChild variant="outline" className="w-full">
            <a href={url} target="_blank" rel="noopener noreferrer"><ExternalLink className="w-4 h-4 mr-2" /> Book online</a>
          </Button>
        )}
      </CardContent>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reserve at {venueName}</DialogTitle>
            <DialogDescription>We'll open WhatsApp with your reservation message ready to send.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <div><Label>Number of people</Label><Input type="number" min={1} max={100} value={people} onChange={e => setPeople(e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Date</Label><Input type="date" min={format(new Date(), "yyyy-MM-dd")} value={date} onChange={e => setDate(e.target.value)} /></div>
              <div><Label>Time</Label><Input type="time" value={time} onChange={e => setTime(e.target.value)} /></div>
            </div>
            <div><Label>Name</Label><Input maxLength={80} value={name} onChange={e => setName(e.target.value)} placeholder="Your name" /></div>
          </div>
          <DialogFooter>
            <Button disabled={!valid} onClick={send}><MessageCircle className="w-4 h-4 mr-2" /> Open WhatsApp</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
