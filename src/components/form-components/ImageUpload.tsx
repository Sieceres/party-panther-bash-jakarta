import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, Loader2 } from "lucide-react";
import { useState } from "react";
import { uploadImage, UploadProgress } from "@/lib/supabase-storage";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";

interface ImageUploadProps {
  label: string;
  imageUrl: string;
  onImageChange: (imageUrl: string) => void;
  inputId: string;
  uploadToStorage?: boolean;
  storageFolder?: 'events' | 'promos';
}

export const ImageUpload = ({ 
  label, 
  imageUrl, 
  onImageChange, 
  inputId,
  uploadToStorage = true,
  storageFolder = 'events'
}: ImageUploadProps) => {
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({
    progress: 0,
    status: 'idle'
  });
  const [previewUrl, setPreviewUrl] = useState<string>(imageUrl);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show preview immediately
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setPreviewUrl(result);
    };
    reader.readAsDataURL(file);

    // If uploadToStorage is false, use base64 (for receipts via Cloudinary)
    if (!uploadToStorage) {
      reader.onload = (e) => {
        const result = e.target?.result as string;
        onImageChange(result);
      };
      return;
    }

    // Upload to Supabase Storage
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("You must be logged in to upload images");
        return;
      }

      const originalSize = (file.size / 1024).toFixed(0);
      
      const publicUrl = await uploadImage(
        file,
        storageFolder,
        user.id,
        setUploadProgress
      );

      // Calculate size saved (rough estimate)
      const storageUrl = publicUrl;
      const savedKB = Math.max(0, parseInt(originalSize) - 150); // ~150KB optimized JPEG
      
      toast.success(`Image uploaded! Saved ~${savedKB}KB`, {
        description: "Your image has been optimized and uploaded"
      });

      onImageChange(publicUrl);
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload image", {
        description: error instanceof Error ? error.message : "Please try again"
      });
      setUploadProgress({ progress: 0, status: 'error' });
    }
  };

  const isUploading = uploadProgress.status === 'optimizing' || uploadProgress.status === 'uploading';

  return (
    <div className="space-y-2">
      <Label htmlFor={inputId}>{label}</Label>
      <div className="space-y-3">
        <div className="flex items-center space-x-4">
          <Input
            id={inputId}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
            disabled={isUploading}
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => document.getElementById(inputId)?.click()}
            className="flex items-center space-x-2"
            disabled={isUploading}
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{uploadProgress.message || 'Uploading...'}</span>
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                <span>Upload Image</span>
              </>
            )}
          </Button>
          {(previewUrl || imageUrl) && (
            <div className="w-16 h-16 rounded border overflow-hidden">
              <img 
                src={previewUrl || imageUrl} 
                alt="Preview" 
                className="w-full h-full object-cover" 
              />
            </div>
          )}
        </div>
        
        {isUploading && (
          <div className="space-y-1">
            <Progress value={uploadProgress.progress} className="h-2" />
            <p className="text-xs text-muted-foreground">
              {uploadProgress.message}
            </p>
          </div>
        )}

        {uploadProgress.status === 'error' && uploadProgress.message && (
          <p className="text-xs text-destructive">
            {uploadProgress.message}
          </p>
        )}
      </div>
    </div>
  );
};