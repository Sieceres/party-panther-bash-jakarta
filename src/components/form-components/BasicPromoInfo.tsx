import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface BasicPromoInfoProps {
  title: string;
  description: string;
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
}

export const BasicPromoInfo = ({ title, description, onTitleChange, onDescriptionChange }: BasicPromoInfoProps) => {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="title">Promo Title *</Label>
        <Input
          id="title"
          placeholder="50% Off Weekend Party at..."
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description *</Label>
        <Textarea
          id="description"
          placeholder="Tell people about this amazing deal..."
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          rows={4}
          required
        />
      </div>
    </>
  );
};