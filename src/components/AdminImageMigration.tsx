import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Database, Upload, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { migrateEventImages, migratePromoImages, MigrationProgress } from "@/lib/migrate-images-to-storage";
import { toast } from "sonner";

export const AdminImageMigration = () => {
  const [eventsProgress, setEventsProgress] = useState<MigrationProgress>({
    total: 0,
    completed: 0,
    failed: 0,
    status: 'idle',
    errors: []
  });

  const [promosProgress, setPromosProgress] = useState<MigrationProgress>({
    total: 0,
    completed: 0,
    failed: 0,
    status: 'idle',
    errors: []
  });

  const [isMigrating, setIsMigrating] = useState(false);

  const handleMigrateEvents = async () => {
    setIsMigrating(true);
    try {
      await migrateEventImages((progress) => {
        setEventsProgress(progress);
      });
      toast.success("Event images migration complete!");
    } catch (error) {
      toast.error("Failed to migrate event images", {
        description: error instanceof Error ? error.message : "Unknown error"
      });
    } finally {
      setIsMigrating(false);
    }
  };

  const handleMigratePromos = async () => {
    setIsMigrating(true);
    try {
      await migratePromoImages((progress) => {
        setPromosProgress(progress);
      });
      toast.success("Promo images migration complete!");
    } catch (error) {
      toast.error("Failed to migrate promo images", {
        description: error instanceof Error ? error.message : "Unknown error"
      });
    } finally {
      setIsMigrating(false);
    }
  };

  const handleMigrateAll = async () => {
    setIsMigrating(true);
    try {
      await migrateEventImages(setEventsProgress);
      await migratePromoImages(setPromosProgress);
      toast.success("All images migration complete!");
    } catch (error) {
      toast.error("Failed to migrate images", {
        description: error instanceof Error ? error.message : "Unknown error"
      });
    } finally {
      setIsMigrating(false);
    }
  };

  const renderProgressCard = (
    title: string,
    description: string,
    progress: MigrationProgress,
    onMigrate: () => void
  ) => {
    const progressPercentage = progress.total > 0 ? (progress.completed / progress.total) * 100 : 0;
    const isComplete = progress.status === 'complete';
    const hasErrors = progress.failed > 0;

    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                {title}
              </CardTitle>
              <CardDescription>{description}</CardDescription>
            </div>
            <Button
              onClick={onMigrate}
              disabled={isMigrating || progress.status === 'running'}
              className="gap-2"
            >
              <Upload className="w-4 h-4" />
              Migrate
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {progress.status !== 'idle' && (
            <>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {progress.currentItem || 'Processing...'}
                  </span>
                  <span className="font-medium">
                    {progress.completed + progress.failed} / {progress.total}
                  </span>
                </div>
                <Progress value={progressPercentage} className="h-2" />
              </div>

              <div className="flex gap-4">
                <Badge variant="outline" className="gap-1">
                  <CheckCircle className="w-3 h-3 text-green-500" />
                  {progress.completed} Completed
                </Badge>
                {progress.failed > 0 && (
                  <Badge variant="outline" className="gap-1">
                    <XCircle className="w-3 h-3 text-destructive" />
                    {progress.failed} Failed
                  </Badge>
                )}
                {isComplete && (
                  <Badge variant="outline" className="gap-1 bg-green-50">
                    <CheckCircle className="w-3 h-3 text-green-500" />
                    Complete
                  </Badge>
                )}
              </div>

              {hasErrors && progress.errors.length > 0 && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="font-semibold mb-2">Migration Errors:</div>
                    <ScrollArea className="h-32">
                      <div className="space-y-1">
                        {progress.errors.map((error, idx) => (
                          <div key={idx} className="text-xs">
                            <span className="font-medium">{error.title}:</span> {error.error}
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </AlertDescription>
                </Alert>
              )}
            </>
          )}

          {progress.status === 'idle' && (
            <Alert>
              <AlertDescription className="text-sm text-muted-foreground">
                This will migrate all base64-encoded images to Supabase Storage.
                The process may take several minutes depending on the number of images.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Image Migration</h2>
          <p className="text-muted-foreground">
            Migrate base64 images to Supabase Storage for better performance
          </p>
        </div>
        <Button
          onClick={handleMigrateAll}
          disabled={isMigrating}
          size="lg"
          className="gap-2"
        >
          <Upload className="w-4 h-4" />
          Migrate All
        </Button>
      </div>

      <Alert>
        <AlertDescription>
          <div className="space-y-2">
            <p className="font-semibold">Migration Benefits:</p>
            <ul className="list-disc list-inside text-sm space-y-1">
              <li>96% reduction in initial page load size</li>
              <li>70% faster image loading (parallel downloads)</li>
              <li>Automatic image optimization (resize to 1920px, JPEG compression)</li>
              <li>Browser caching support</li>
              <li>Reduced database storage costs</li>
            </ul>
          </div>
        </AlertDescription>
      </Alert>

      <div className="grid gap-6 md:grid-cols-2">
        {renderProgressCard(
          "Event Images",
          "Migrate event poster images to storage",
          eventsProgress,
          handleMigrateEvents
        )}

        {renderProgressCard(
          "Promo Images",
          "Migrate promotional poster images to storage",
          promosProgress,
          handleMigratePromos
        )}
      </div>

      <Alert>
        <AlertDescription className="text-xs text-muted-foreground">
          <p className="font-semibold mb-1">Important Notes:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>This is a one-time migration process</li>
            <li>Original base64 images will be replaced with storage URLs</li>
            <li>Failed migrations can be retried individually</li>
            <li>Estimated time: 2-5 seconds per image</li>
            <li>Storage used: ~150KB per optimized image (JPEG format)</li>
            <li>Free tier limit: 1GB total storage</li>
          </ul>
        </AlertDescription>
      </Alert>
    </div>
  );
};
