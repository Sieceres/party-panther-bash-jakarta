import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload } from "lucide-react";

interface ImageUploadProps {
  label: string;
  imageUrl: string;
  onImageChange: (imageUrl: string) => void;
  inputId: string;
}

export const ImageUpload = ({ label, imageUrl, onImageChange, inputId }: ImageUploadProps) => {
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        onImageChange(result);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={inputId}>{label}</Label>
      <div className="flex items-center space-x-4">
        <Input
          id={inputId}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => document.getElementById(inputId)?.click()}
          className="flex items-center space-x-2"
        >
          <Upload className="w-4 h-4" />
          <span>Upload Image</span>
        </Button>
        {imageUrl && (
          <div className="w-16 h-16 rounded border overflow-hidden">
            <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
          </div>
        )}
      </div>
    </div>
  );
};