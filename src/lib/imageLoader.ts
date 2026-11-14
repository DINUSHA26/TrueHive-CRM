import { optimizeImageUrl } from "./cloudinary";

interface ImageLoaderProps {
  src: string;
  width: number;
  quality?: number;
}

/**
 * Next.js custom image loader for Cloudinary assets.
 * Automatically serves WebP format, applies optimal compression, and resizes dynamically.
 */
export default function imageLoader({ src, width, quality = 80 }: ImageLoaderProps): string {
  return optimizeImageUrl(src, width, quality);
}

