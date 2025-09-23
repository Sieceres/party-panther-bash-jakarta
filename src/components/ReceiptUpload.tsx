import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Upload, FileImage, X, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { supabase } from "@/integrations/supabase/client";

interface ReceiptUploadProps {
  eventId: string;
  userId: string;
  currentReceiptUrl?: string;
  onReceiptUploaded: (receiptUrl: string) => void;
}

export const ReceiptUpload = ({ 
  eventId, 
  userId, 
  currentReceiptUrl, 
  onReceiptUploaded 
}: ReceiptUploadProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { toast } = useToast();

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFileSelection(files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      handleFileSelection(files[0]);
    }
  };

  const handleFileSelection = (file: File) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file (JPG, PNG, etc.)",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select a file smaller than 10MB",
        variant: "destructive"
      });
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    try {
      // Upload to Cloudinary
      const uploadResult = await uploadToCloudinary(selectedFile, `receipts/${eventId}`);
      
      // Update database
      const { error } = await supabase
        .from('event_attendees')
        .update({
          receipt_url: uploadResult.secure_url,
          receipt_uploaded_at: new Date().toISOString()
        })
        .eq('event_id', eventId)
        .eq('user_id', userId);

      if (error) throw error;

      onReceiptUploaded(uploadResult.secure_url);
      setIsOpen(false);
      setSelectedFile(null);
      setPreviewUrl(null);

      toast({
        title: "Receipt uploaded successfully! 📄",
        description: "Your payment receipt has been uploaded for admin review.",
      });
    } catch (error) {
      console.error('Error uploading receipt:', error);
      
      // Extract specific error message
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      toast({
        title: "Upload failed",
        description: errorMessage.includes('Cloudinary Error:') 
          ? errorMessage.replace('Cloudinary Error: ', '') 
          : "Failed to upload receipt. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const clearSelection = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant={currentReceiptUrl ? "secondary" : "outline"} 
          size="sm"
          className="flex items-center gap-2"
        >
          {currentReceiptUrl ? (
            <>
              <CheckCircle className="w-4 h-4" />
              View Receipt
            </>
          ) : (
            <>
              <Upload className="w-4 h-4" />
              Upload Receipt
            </>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {currentReceiptUrl ? "Payment Receipt" : "Upload Payment Receipt"}
          </DialogTitle>
        </DialogHeader>
        
        {currentReceiptUrl && (
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Your receipt has been uploaded and is under review.
            </div>
            <Card>
              <CardContent className="p-4">
                <img 
                  src={currentReceiptUrl} 
                  alt="Payment receipt" 
                  className="w-full h-auto rounded"
                />
              </CardContent>
            </Card>
          </div>
        )}

        {!currentReceiptUrl && (
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Upload a photo of your payment receipt for verification.
            </div>

            {!selectedFile ? (
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <FileImage className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                <div className="space-y-2">
                  <p className="text-sm font-medium">Drop your receipt here</p>
                  <p className="text-xs text-muted-foreground">or click to browse</p>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileInput}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative">
                  <img 
                    src={previewUrl!} 
                    alt="Receipt preview" 
                    className="w-full h-48 object-cover rounded"
                  />
                  <Button
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={clearSelection}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <Button 
                  onClick={handleUpload} 
                  disabled={isUploading}
                  className="w-full"
                >
                  {isUploading ? "Uploading..." : "Upload Receipt"}
                </Button>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};