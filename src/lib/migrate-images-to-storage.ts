import { supabase } from "@/integrations/supabase/client";
import { uploadImage, isBase64Url } from "./supabase-storage";

export interface MigrationProgress {
  total: number;
  completed: number;
  failed: number;
  status: 'idle' | 'running' | 'complete' | 'error';
  currentItem?: string;
  errors: Array<{ id: string; title: string; error: string }>;
}

/**
 * Convert base64 data URL to File object
 */
async function base64ToFile(base64Url: string, filename: string): Promise<File> {
  const response = await fetch(base64Url);
  const blob = await response.blob();
  return new File([blob], filename, { type: blob.type });
}

/**
 * Migrate event images from base64 to Supabase Storage
 */
export async function migrateEventImages(
  onProgress?: (progress: MigrationProgress) => void
): Promise<MigrationProgress> {
  const progress: MigrationProgress = {
    total: 0,
    completed: 0,
    failed: 0,
    status: 'running',
    errors: []
  };

  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error("Must be authenticated to migrate images");
    }

    // Fetch all events with base64 images
    const { data: events, error: fetchError } = await supabase
      .from('events')
      .select('id, title, image_url, created_by')
      .like('image_url', 'data:image/%');

    if (fetchError) throw fetchError;
    if (!events || events.length === 0) {
      progress.status = 'complete';
      onProgress?.(progress);
      return progress;
    }

    progress.total = events.length;
    onProgress?.(progress);

    // Process each event
    for (const event of events) {
      progress.currentItem = event.title;
      onProgress?.(progress);

      try {
        if (!isBase64Url(event.image_url)) {
          progress.completed++;
          continue;
        }

        // Convert base64 to file
        const file = await base64ToFile(event.image_url, `${event.id}.jpg`);

        // Upload to storage
        const publicUrl = await uploadImage(
          file,
          'events',
          event.created_by,
          undefined
        );

        // Update database
        const { error: updateError } = await supabase
          .from('events')
          .update({ image_url: publicUrl })
          .eq('id', event.id);

        if (updateError) throw updateError;

        progress.completed++;
      } catch (error) {
        progress.failed++;
        progress.errors.push({
          id: event.id,
          title: event.title,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }

      onProgress?.(progress);
    }

    progress.status = 'complete';
    onProgress?.(progress);
    return progress;
  } catch (error) {
    progress.status = 'error';
    progress.errors.push({
      id: 'system',
      title: 'System Error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    onProgress?.(progress);
    return progress;
  }
}

/**
 * Migrate promo images from base64 to Supabase Storage
 */
export async function migratePromoImages(
  onProgress?: (progress: MigrationProgress) => void
): Promise<MigrationProgress> {
  const progress: MigrationProgress = {
    total: 0,
    completed: 0,
    failed: 0,
    status: 'running',
    errors: []
  };

  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error("Must be authenticated to migrate images");
    }

    // Fetch all promos with base64 images
    const { data: promos, error: fetchError } = await supabase
      .from('promos')
      .select('id, title, image_url, created_by')
      .like('image_url', 'data:image/%');

    if (fetchError) throw fetchError;
    if (!promos || promos.length === 0) {
      progress.status = 'complete';
      onProgress?.(progress);
      return progress;
    }

    progress.total = promos.length;
    onProgress?.(progress);

    // Process each promo
    for (const promo of promos) {
      progress.currentItem = promo.title;
      onProgress?.(progress);

      try {
        if (!isBase64Url(promo.image_url)) {
          progress.completed++;
          continue;
        }

        // Convert base64 to file
        const file = await base64ToFile(promo.image_url, `${promo.id}.jpg`);

        // Upload to storage
        const publicUrl = await uploadImage(
          file,
          'promos',
          promo.created_by,
          undefined
        );

        // Update database
        const { error: updateError } = await supabase
          .from('promos')
          .update({ image_url: publicUrl })
          .eq('id', promo.id);

        if (updateError) throw updateError;

        progress.completed++;
      } catch (error) {
        progress.failed++;
        progress.errors.push({
          id: promo.id,
          title: promo.title,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }

      onProgress?.(progress);
    }

    progress.status = 'complete';
    onProgress?.(progress);
    return progress;
  } catch (error) {
    progress.status = 'error';
    progress.errors.push({
      id: 'system',
      title: 'System Error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    onProgress?.(progress);
    return progress;
  }
}

/**
 * Migrate all images (events and promos) from base64 to Supabase Storage
 */
export async function migrateAllImages(
  onProgress?: (progress: MigrationProgress) => void
): Promise<{ events: MigrationProgress; promos: MigrationProgress }> {
  const eventsProgress = await migrateEventImages(onProgress);
  const promosProgress = await migratePromoImages(onProgress);

  return {
    events: eventsProgress,
    promos: promosProgress
  };
}
