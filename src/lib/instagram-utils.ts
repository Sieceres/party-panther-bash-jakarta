/**
 * Extracts Instagram post ID from various Instagram URL formats
 * @param url - Instagram URL (e.g., https://www.instagram.com/p/POST_ID/)
 * @returns Post ID or null if invalid
 */
export const extractInstagramPostId = (url: string): string | null => {
  if (!url) return null;
  
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/').filter(Boolean);
    
    // Handle /p/POST_ID/ or /reel/POST_ID/ formats
    if ((pathParts[0] === 'p' || pathParts[0] === 'reel') && pathParts[1]) {
      return pathParts[1];
    }
  } catch {
    return null;
  }
  
  return null;
};

/**
 * Validates if a URL is a valid Instagram post URL
 * @param url - URL to validate
 * @returns boolean indicating if URL is valid Instagram post
 */
export const isValidInstagramUrl = (url: string): boolean => {
  if (!url) return false;
  
  try {
    const urlObj = new URL(url);
    return urlObj.hostname === 'www.instagram.com' || urlObj.hostname === 'instagram.com';
  } catch {
    return false;
  }
};

/**
 * Generates Instagram embed URL from post ID
 * @param postId - Instagram post ID
 * @returns Embed URL
 */
export const getInstagramEmbedUrl = (postId: string): string => {
  return `https://www.instagram.com/p/${postId}/embed/`;
};
