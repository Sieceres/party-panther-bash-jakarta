import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface BasicEventInfoProps {
  title: string;
  description: string;
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
}

export const BasicEventInfo = ({ title, description, onTitleChange, onDescriptionChange }: BasicEventInfoProps) => {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="title">Event Title *</Label>
        <Input
          id="title"
          placeholder="Amazing Party Night at..."
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description *</Label>
        <Textarea
          id="description"
          placeholder="Tell people what makes your event special..."
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          rows={4}
          required
        />
      </div>
    </>
  );
};