import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Upload, X, Flag, Trash2, ZoomIn } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

const PhotoDeleteButton = ({ photo, canManage, onDelete }: { photo: Photo; canManage: boolean; onDelete: () => void }) => {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setCurrentUserId(data?.session?.user?.id || null);
    });
  }, []);

  if (!canManage && photo.uploaded_by !== currentUserId) return null;

  return (
    <Button size="sm" variant="destructive" onClick={onDelete}>
      <Trash2 className="w-4 h-4 mr-2" />
      Delete
    </Button>
  );
};

interface Photo {
  id: string;
  photo_url: string;
  uploaded_by: string;
  uploaded_at: string;
  profiles?: {
    display_name: string;
    avatar_url: string;
  };
}

interface EventPhotoGalleryProps {
  eventId: string;
  isJoined: boolean;
  canManage: boolean;
}

export const EventPhotoGallery = ({ eventId, isJoined, canManage }: EventPhotoGalleryProps) => {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [uploading, setUploading] = useState(false);
  const [userPhotoCount, setUserPhotoCount] = useState(0);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadPhotos();
    loadUserPhotoCount();

    const channel = supabase
      .channel('photos-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'event_photos',
          filter: `event_id=eq.${eventId}`
        },
        () => loadPhotos()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [eventId]);

  const loadPhotos = async () => {
    const { data, error } = await supabase
      .from('event_photos')
      .select(`
        id,
        photo_url,
        uploaded_by,
        uploaded_at,
        profiles:uploaded_by (
          display_name,
          avatar_url
        )
      `)
      .eq('event_id', eventId)
      .eq('is_hidden', false)
      .order('uploaded_at', { ascending: false });

    if (!error && data) {
      setPhotos(data as any);
    }
  };

  const loadUserPhotoCount = async () => {
    const { data: session } = await supabase.auth.getSession();
    if (!session?.session?.user) return;

    const { count } = await supabase
      .from('event_photos')
      .select('*', { count: 'exact', head: true })
      .eq('event_id', eventId)
      .eq('uploaded_by', session.session.user.id);

    setUserPhotoCount(count || 0);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 20 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Maximum file size is 20MB",
        variant: "destructive"
      });
      return;
    }

    if (userPhotoCount >= 5) {
      toast({
        title: "Upload limit reached",
        description: "You can only upload 5 photos per event",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);
    const { data: session } = await supabase.auth.getSession();
    
    if (!session?.session?.user) {
      toast({
        title: "Not authenticated",
        description: "Please log in to upload photos.",
        variant: "destructive"
      });
      setUploading(false);
      return;
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${eventId}/${session.session.user.id}/${Date.now()}.${fileExt}`;

    const { error: uploadError, data: uploadData } = await supabase.storage
      .from('Party Panther Bucket I')
      .upload(fileName, file);

    if (uploadError) {
      toast({
        title: "Upload failed",
        description: uploadError.message,
        variant: "destructive"
      });
      setUploading(false);
      return;
    }

    const { data: publicUrl } = supabase.storage
      .from('Party Panther Bucket I')
      .getPublicUrl(fileName);

    const { error: dbError } = await supabase
      .from('event_photos')
      .insert({
        event_id: eventId,
        uploaded_by: session.session.user.id,
        photo_url: publicUrl.publicUrl
      });

    if (dbError) {
      toast({
        title: "Failed to save photo",
        description: dbError.message,
        variant: "destructive"
      });
    } else {
      toast({
        title: "Photo uploaded!",
        description: "Your photo has been added to the gallery."
      });
      setShowUploadDialog(false);
      loadUserPhotoCount();
    }
    setUploading(false);
  };

  const handleReport = async () => {
    if (!selectedPhoto || !reportReason.trim()) return;

    const { data: session } = await supabase.auth.getSession();
    if (!session?.session?.user) return;

    const { error } = await supabase
      .from('event_photo_reports')
      .insert({
        photo_id: selectedPhoto.id,
        reported_by: session.session.user.id,
        reason: reportReason
      });

    if (error) {
      toast({
        title: "Report failed",
        description: error.message,
        variant: "destructive"
      });
    } else {
      toast({
        title: "Photo reported",
        description: "Thank you for reporting. We'll review this photo."
      });
      setReportDialogOpen(false);
      setReportReason("");
    }
  };

  const handleDelete = async () => {
    if (!selectedPhoto) return;

    const { error } = await supabase
      .from('event_photos')
      .delete()
      .eq('id', selectedPhoto.id);

    if (error) {
      toast({
        title: "Delete failed",
        description: error.message,
        variant: "destructive"
      });
    } else {
      toast({
        title: "Photo deleted",
        description: "The photo has been removed from the gallery."
      });
      setDeleteDialogOpen(false);
      setSelectedPhoto(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Event Photos</span>
          {isJoined && (
            <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
              <DialogTrigger asChild>
                <Button size="sm" disabled={userPhotoCount >= 5}>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload ({userPhotoCount}/5)
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Upload Photo</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="photo">Select Photo (max 20MB)</Label>
                    <Input
                      id="photo"
                      type="file"
                      accept="image/*"
                      onChange={handleUpload}
                      disabled={uploading}
                    />
                  </div>
                  {uploading && <p className="text-sm text-muted-foreground">Uploading...</p>}
                </div>
              </DialogContent>
            </Dialog>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {photos.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No photos yet. Be the first to share!
          </p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {photos.map((photo) => (
              <div key={photo.id} className="relative group">
                <Dialog>
                  <DialogTrigger asChild>
                    <div className="relative aspect-square rounded-lg overflow-hidden cursor-pointer">
                      <img
                        src={photo.photo_url}
                        alt="Event photo"
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                        <ZoomIn className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl">
                    <div className="space-y-4">
                      <img
                        src={photo.photo_url}
                        alt="Event photo"
                        className="w-full rounded-lg"
                      />
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={photo.profiles?.avatar_url || ''} />
                            <AvatarFallback>
                              {photo.profiles?.display_name?.charAt(0) || '?'}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm">
                            {photo.profiles?.display_name || 'Anonymous'}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedPhoto(photo);
                              setReportDialogOpen(true);
                            }}
                          >
                            <Flag className="w-4 h-4 mr-2" />
                            Report
                          </Button>
                          <PhotoDeleteButton
                            photo={photo}
                            canManage={canManage}
                            onDelete={() => {
                              setSelectedPhoto(photo);
                              setDeleteDialogOpen(true);
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            ))}
          </div>
        )}

        <AlertDialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Report Photo</AlertDialogTitle>
              <AlertDialogDescription>
                Please provide a reason for reporting this photo.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <Textarea
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              placeholder="Describe why this photo should be reviewed..."
              className="min-h-24"
            />
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleReport} disabled={!reportReason.trim()}>
                Submit Report
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Photo</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this photo? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
};
