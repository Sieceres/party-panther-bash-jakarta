interface CloudinaryUploadResponse {
  secure_url: string;
  public_id: string;
  width: number;
  height: number;
  format: string;
  resource_type: string;
}

interface CloudinaryConfig {
  cloudName: string;
  uploadPreset: string;
}

// You'll need to set these values in your Cloudinary dashboard
const CLOUDINARY_CONFIG: CloudinaryConfig = {
  cloudName: 'dqett77uc', // Replace with your Cloudinary cloud name
  uploadPreset: 'Party_Panther_receipts' // Replace with your upload preset
};

export const uploadToCloudinary = async (
  file: File,
  folder: string = 'receipts'
): Promise<CloudinaryUploadResponse> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_CONFIG.uploadPreset);
  formData.append('folder', folder);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/dqett77uc/image/upload`,
    {
      method: 'POST',
      body: formData
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error('Cloudinary upload failed:', {
      status: response.status,
      statusText: response.statusText,
      error: errorData,
      url: response.url
    });
    
    // Provide more specific error messages
    const errorMessage = errorData?.error?.message || `Upload failed with status ${response.status}`;
    throw new Error(`Cloudinary Error: ${errorMessage}`);
  }

  const result = await response.json();
  console.log('Cloudinary upload successful:', result);
  return result;
};

export const deleteFromCloudinary = async (publicId: string): Promise<void> => {
  // Note: Deletion requires server-side implementation with your API secret
  // This is a placeholder - you'd need to implement a server endpoint
  console.warn('Cloudinary deletion requires server-side implementation');
};

export const getOptimizedImageUrl = (
  url: string,
  options: {
    width?: number;
    height?: number;
    quality?: number;
    format?: string;
  } = {}
): string => {
  if (!url || !url.includes('cloudinary.com')) {
    return url;
  }

  const { width, height, quality = 80, format } = options;
  let transformations = [`q_${quality}`];

  if (width && height) {
    transformations.push(`w_${width},h_${height},c_fill`);
  } else if (width) {
    transformations.push(`w_${width}`);
  } else if (height) {
    transformations.push(`h_${height}`);
  }

  if (format) {
    transformations.push(`f_${format}`);
  }

  // Insert transformations into Cloudinary URL
  const uploadIndex = url.indexOf('/upload/');
  if (uploadIndex !== -1) {
    return url.slice(0, uploadIndex + 8) + transformations.join(',') + '/' + url.slice(uploadIndex + 8);
  }

  return url;
};