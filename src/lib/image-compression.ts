/**
 * High-speed client-side image compressor.
 * Compresses raw high-res camera/phone photos (often 5MB - 15MB) down to ~100KB - 250KB WebP/JPEG
 * before uploading to prevent HTTP 413 (Payload Too Large) and accelerate upload speeds.
 */
export async function compressImageClient(
  file: File,
  maxWidth = 1200,
  maxHeight = 1200,
  quality = 0.8
): Promise<File> {
  // If not an image or SVG/GIF, return as is
  if (!file.type.startsWith("image/") || file.type.includes("svg") || file.type.includes("gif")) {
    return file;
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;

      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calculate aspect-ratio safe scaling
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          return resolve(file); // fallback
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Convert to WebP or JPEG blob
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              return resolve(file);
            }
            const extension = blob.type === "image/webp" ? ".webp" : ".jpg";
            const newFileName = file.name.replace(/\.[^/.]+$/, "") + extension;
            const compressedFile = new File([blob], newFileName, {
              type: blob.type,
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          },
          "image/webp",
          quality
        );
      };

      img.onerror = () => {
        resolve(file); // fallback on image load error
      };
    };

    reader.onerror = () => {
      resolve(file); // fallback on read error
    };
  });
}
