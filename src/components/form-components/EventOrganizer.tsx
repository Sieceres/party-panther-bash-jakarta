import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface EventOrganizerProps {
  organizer: string;
  whatsapp: string;
  onOrganizerChange: (organizer: string) => void;
  onWhatsappChange: (whatsapp: string) => void;
}

export const EventOrganizer = ({ organizer, whatsapp, onOrganizerChange, onWhatsappChange }: EventOrganizerProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="organizer">Organizer Name</Label>
        <Input
          id="organizer"
          placeholder="Your name or organization (optional)"
          value={organizer}
          onChange={(e) => onOrganizerChange(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="whatsapp">WhatsApp (Optional)</Label>
        <Input
          id="whatsapp"
          placeholder="+62..."
          value={whatsapp}
          onChange={(e) => onWhatsappChange(e.target.value)}
        />
      </div>
    </div>
  );
};