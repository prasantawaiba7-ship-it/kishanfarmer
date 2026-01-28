// Utility for crop image placeholder
export const CROP_PLACEHOLDER_URL = '/placeholder.svg';

export function getCropImageUrl(imageUrl: string | null | undefined): string {
  if (!imageUrl || imageUrl.trim() === '') {
    return CROP_PLACEHOLDER_URL;
  }
  return imageUrl;
}

// Component-friendly fallback handler
export function handleCropImageError(e: React.SyntheticEvent<HTMLImageElement>) {
  const target = e.target as HTMLImageElement;
  if (target.src !== CROP_PLACEHOLDER_URL) {
    target.src = CROP_PLACEHOLDER_URL;
  }
}
