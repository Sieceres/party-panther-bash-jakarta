import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface EventBasicInfoProps {
  title: string;
  description: string;
  onTitleChange: (title: string) => void;
  onDescriptionChange: (description: string) => void;
}

export const EventBasicInfo = ({ title, description, onTitleChange, onDescriptionChange }: EventBasicInfoProps) => {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Event Title *</Label>
        <Input
          id="title"
          placeholder="Amazing Friday Night Party"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Description *</Label>
        <Textarea
          id="description"
          placeholder="Describe your event - what makes it special?"
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          required
          className="min-h-[100px]"
        />
      </div>
    </div>
  );
};