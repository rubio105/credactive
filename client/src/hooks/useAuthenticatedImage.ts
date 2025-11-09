import { useState, useEffect } from 'react';

/**
 * Custom hook to fetch and display images that require authentication.
 * Fetches the image with credentials, creates an object URL, and handles cleanup.
 * 
 * @param imageUrl - The URL of the authenticated image resource (e.g., /profile-images/filename.jpg)
 * @returns The object URL for the image, or null if loading/failed
 */
export function useAuthenticatedImage(imageUrl: string | null | undefined): string | null {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!imageUrl) {
      setObjectUrl(null);
      return;
    }

    let cancelled = false;
    let currentObjectUrl: string | null = null;

    const fetchImage = async () => {
      try {
        const response = await fetch(imageUrl, {
          credentials: 'include',
        });

        if (!response.ok) {
          console.error(`Failed to fetch authenticated image: ${response.status}`);
          setObjectUrl(null); // Reset state on failure
          return;
        }

        const blob = await response.blob();
        
        if (cancelled) {
          return;
        }

        currentObjectUrl = URL.createObjectURL(blob);
        setObjectUrl(currentObjectUrl);
      } catch (error) {
        console.error('Error fetching authenticated image:', error);
        setObjectUrl(null); // Reset state on error
      }
    };

    fetchImage();

    return () => {
      cancelled = true;
      if (currentObjectUrl) {
        URL.revokeObjectURL(currentObjectUrl);
      }
    };
  }, [imageUrl]);

  return objectUrl;
}
