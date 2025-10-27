import { supabase } from "@/integrations/supabase/client";

const BUCKET_NAME = "Party Panther Bucket I";
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_IMAGE_WIDTH = 1920;
const JPEG_QUALITY = 0.8;

export interface UploadProgress {
  progress: number;
  status: 'idle' | 'optimizing' | 'uploading' | 'complete' | 'error';
  message?: string;
}

/**
 * Optimize image client-side: resize and compress to JPEG
 */
export async function optimizeImage(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      img.src = e.target?.result as string;
    };

    img.onload = () => {
      // Calculate new dimensions
      let width = img.width;
      let height = img.height;

      if (width > MAX_IMAGE_WIDTH) {
        height = (height * MAX_IMAGE_WIDTH) / width;
        width = MAX_IMAGE_WIDTH;
      }

      // Create canvas and draw resized image
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      // Convert to JPEG blob
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Failed to create blob'));
            return;
          }

          // If optimized size is larger than original, use original
          if (blob.size > file.size) {
            resolve(file);
            return;
          }

          // Create new File from blob
          const optimizedFile = new File(
            [blob],
            file.name.replace(/\.[^/.]+$/, '.jpg'),
            { type: 'image/jpeg' }
          );

          resolve(optimizedFile);
        },
        'image/jpeg',
        JPEG_QUALITY
      );
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Generate unique filename with timestamp and random ID
 */
function generateFilename(originalName: string): string {
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(2, 15);
  const extension = originalName.split('.').pop() || 'jpg';
  return `${timestamp}-${randomId}.${extension}`;
}

/**
 * Upload image to Supabase Storage
 */
export async function uploadImage(
  file: File,
  folder: 'events' | 'promos',
  userId: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<string> {
  try {
    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      throw new Error(`File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit`);
    }

    // Optimize image
    onProgress?.({ progress: 0, status: 'optimizing', message: 'Optimizing image...' });
    const optimizedFile = await optimizeImage(file);

    // Generate file path
    const filename = generateFilename(file.name);
    const filePath = `${folder}/${userId}/${filename}`;

    // Upload to storage
    onProgress?.({ progress: 50, status: 'uploading', message: 'Uploading to storage...' });
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, optimizedFile, {
        contentType: optimizedFile.type,
        upsert: false,
      });

    if (error) {
      throw error;
    }

    // Get public URL
    const publicUrl = getPublicUrl(data.path);
    
    onProgress?.({ progress: 100, status: 'complete', message: 'Upload complete!' });
    
    return publicUrl;
  } catch (error) {
    onProgress?.({ progress: 0, status: 'error', message: error instanceof Error ? error.message : 'Upload failed' });
    throw error;
  }
}

/**
 * Get public URL for a storage path
 */
export function getPublicUrl(path: string): string {
  const { data } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(path);
  
  return data.publicUrl;
}

/**
 * Delete image from storage
 */
export async function deleteImage(url: string): Promise<void> {
  try {
    // Extract path from URL
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');
    const bucketIndex = pathParts.findIndex(part => part === 'object');
    
    if (bucketIndex === -1) {
      throw new Error('Invalid storage URL');
    }

    const path = pathParts.slice(bucketIndex + 3).join('/'); // Skip 'object', 'public', bucket_name

    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([path]);

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error('Failed to delete image:', error);
    // Don't throw - deletion failure shouldn't block other operations
  }
}

/**
 * Check if URL is a Supabase Storage URL
 */
export function isStorageUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.includes('supabase.co') && urlObj.pathname.includes('/storage/');
  } catch {
    return false;
  }
}

/**
 * Check if URL is a base64 data URL
 */
export function isBase64Url(url: string): boolean {
  return url.startsWith('data:image/');
}
