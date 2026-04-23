import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, Loader2, Sparkles } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { uploadImage, UploadProgress } from "@/lib/supabase-storage";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";

interface ImageUploadProps {
  label: string;
  imageUrl: string;
  onImageChange: (imageUrl: string) => void;
  inputId: string;
  uploadToStorage?: boolean;
  storageFolder?: 'events' | 'promos';
  /**
   * If provided, pasted/uploaded images will additionally be sent to the AI
   * extractor and the result will be passed back via this callback so the
   * parent form can autofill its fields. The user can opt out per-upload via
   * the "Use as [event/promo] image" checkbox (which controls whether the
   * image itself is also stored as the entity image).
   */
  onAIExtract?: (data: Record<string, any>) => void;
  aiExtractType?: 'event' | 'promo';
}

export const ImageUpload = ({ 
  label, 
  imageUrl, 
  onImageChange, 
  inputId,
  uploadToStorage = true,
  storageFolder = 'events',
  onAIExtract,
  aiExtractType,
}: ImageUploadProps) => {
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({
    progress: 0,
    status: 'idle'
  });
  const [previewUrl, setPreviewUrl] = useState<string>(imageUrl);
  const [useAsImage, setUseAsImage] = useState<boolean>(true);
  const [isExtracting, setIsExtracting] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const useAsImageRef = useRef(useAsImage);
  useEffect(() => { useAsImageRef.current = useAsImage; }, [useAsImage]);

  // Listen for paste events globally when this component is mounted
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of Array.from(items)) {
        if (item.type.startsWith('image/')) {
          e.preventDefault();
          const file = item.getAsFile();
          if (file) {
            processFile(file);
          }
          return;
        }
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [uploadToStorage, storageFolder, onAIExtract, aiExtractType]);

  const runAIExtract = async (base64: string) => {
    if (!onAIExtract || !aiExtractType) return;
    setIsExtracting(true);
    try {
      const { data, error } = await supabase.functions.invoke("extract-from-image", {
        body: { image: base64, type: aiExtractType, style: "exact" },
      });
      if (error) throw error;
      const item = data?.items?.[0];
      if (item) {
        onAIExtract(item);
        toast.success(`AI auto-filled ${aiExtractType} details`, {
          description: item.title ? `Found: ${item.title}` : undefined,
        });
      }
    } catch (err) {
      console.error("AI extract from image failed:", err);
      toast.error("Couldn't auto-fill from image");
    } finally {
      setIsExtracting(false);
    }
  };

  const processFile = async (file: File) => {
    // Show preview immediately (also used as the source for AI extraction)
    let base64Data: string | null = null;
    const reader = new FileReader();
    reader.onload = async (e) => {
      const result = e.target?.result as string;
      base64Data = result;
      setPreviewUrl(result);
      // Kick off AI extraction in parallel with upload (if enabled)
      if (onAIExtract && aiExtractType) {
        runAIExtract(result);
      }
    };
    reader.readAsDataURL(file);

    // If the user opted out of using this as the image, skip upload entirely
    if (!useAsImageRef.current) {
      return;
    }

    if (!uploadToStorage) {
      const r2 = new FileReader();
      r2.onload = (e) => {
        const result = e.target?.result as string;
        onImageChange(result);
      };
      r2.readAsDataURL(file);
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("You must be logged in to upload images");
        return;
      }
      const originalSize = (file.size / 1024).toFixed(0);
      const publicUrl = await uploadImage(file, storageFolder, user.id, setUploadProgress);
      const savedKB = Math.max(0, parseInt(originalSize) - 150);
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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    processFile(file);
  };

  const isUploading = uploadProgress.status === 'optimizing' || uploadProgress.status === 'uploading';

  return (
    <div className="space-y-2" ref={containerRef}>
      <Label htmlFor={inputId}>{label}</Label>
      <p className="text-xs text-muted-foreground">
        You can also paste an image from your clipboard (Ctrl+V / ⌘+V)
        {onAIExtract && aiExtractType ? ` — AI will auto-fill ${aiExtractType} details from it` : ""}
      </p>
      {onAIExtract && aiExtractType && (
        <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer select-none">
          <Checkbox
            checked={useAsImage}
            onCheckedChange={(v) => setUseAsImage(v === true)}
          />
          <span>Also use this as the {aiExtractType} image</span>
        </label>
      )}
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
          {isExtracting && (
            <div className="flex items-center text-xs text-primary gap-1.5">
              <Sparkles className="w-3.5 h-3.5 animate-pulse" />
              <span>AI reading image…</span>
            </div>
          )}
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