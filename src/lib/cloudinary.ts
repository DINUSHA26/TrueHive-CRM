import { v2 as cloudinary } from "cloudinary";

// Configure Cloudinary from environment variables
if (
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

export const CLOUDINARY_ROOT_FOLDER = "truehive-crm";

export type CloudinaryFolder =
  | "products"
  | "inventory"
  | "chat"
  | "bank-slips"
  | "invoices"
  | "avatars"
  | "marketing"
  | "documents";

export interface CloudinaryUploadResult {
  url: string;
  publicId: string;
  width: number;
  height: number;
  format: string;
  bytes?: number;
  resourceType?: string;
}

/**
 * Upload an image to Cloudinary under truehive-crm/<folder>
 * Automatically converts and stores in WebP format with auto-quality for maximum speed and minimum storage.
 */
export async function uploadImage(
  file: Buffer | string,
  folder: CloudinaryFolder = "products",
  maxWidth: number = 1400
): Promise<CloudinaryUploadResult> {
  try {
    const filePayload =
      typeof file === "string"
        ? file.startsWith("data:")
          ? file
          : `data:image/png;base64,${file}`
        : `data:image/png;base64,${file.toString("base64")}`;

    const result = await cloudinary.uploader.upload(filePayload, {
      folder: `${CLOUDINARY_ROOT_FOLDER}/${folder}`,
      resource_type: "image",
      format: "webp",
      transformation: [
        { width: maxWidth, crop: "limit" },
        { quality: "auto:good", fetch_format: "webp" },
      ],
    });

    return {
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format || "webp",
      bytes: result.bytes,
      resourceType: result.resource_type,
    };
  } catch (error) {
    console.error("[Cloudinary UploadImage Error]:", error);
    throw new Error("Failed to upload image to Cloudinary");
  }
}

/**
 * Upload a document, PDF, Excel sheet, or bank slip to Cloudinary
 */
export async function uploadFile(
  file: Buffer | string,
  mimeType: string,
  folder: CloudinaryFolder = "documents",
  originalFilename?: string
): Promise<CloudinaryUploadResult> {
  try {
    const isPdf =
      mimeType === "application/pdf" || originalFilename?.toLowerCase().endsWith(".pdf");
    const isDoc =
      isPdf ||
      mimeType.includes("spreadsheet") ||
      mimeType.includes("excel") ||
      mimeType.includes("csv") ||
      mimeType.includes("word") ||
      originalFilename?.toLowerCase().endsWith(".xlsx") ||
      originalFilename?.toLowerCase().endsWith(".xls") ||
      originalFilename?.toLowerCase().endsWith(".csv") ||
      originalFilename?.toLowerCase().endsWith(".docx");

    const filePayload =
      typeof file === "string"
        ? file.startsWith("data:")
          ? file
          : `data:${mimeType || "application/octet-stream"};base64,${file}`
        : `data:${mimeType || "application/octet-stream"};base64,${file.toString("base64")}`;

    const result = await cloudinary.uploader.upload(filePayload, {
      folder: `${CLOUDINARY_ROOT_FOLDER}/${folder}`,
      resource_type: isDoc ? "raw" : "auto",
      public_id: originalFilename
        ? isDoc
          ? originalFilename
          : originalFilename.replace(/\.[^/.]+$/, "")
        : undefined,
    });

    return {
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width || 0,
      height: result.height || 0,
      format: result.format || (isPdf ? "pdf" : "raw"),
      bytes: result.bytes,
      resourceType: result.resource_type,
    };
  } catch (error) {
    console.error("[Cloudinary UploadFile Error]:", error);
    throw new Error("Failed to upload document to Cloudinary");
  }
}

/**
 * Upload voice notes / audio messages (stores as audio/video resource type in Cloudinary)
 */
export async function uploadVoiceNote(
  audioBufferOrBase64: Buffer | string,
  folder: CloudinaryFolder = "chat"
): Promise<CloudinaryUploadResult> {
  try {
    const payload =
      typeof audioBufferOrBase64 === "string"
        ? audioBufferOrBase64.startsWith("data:")
          ? audioBufferOrBase64
          : `data:audio/mp3;base64,${audioBufferOrBase64}`
        : `data:audio/mp3;base64,${audioBufferOrBase64.toString("base64")}`;

    const result = await cloudinary.uploader.upload(payload, {
      folder: `${CLOUDINARY_ROOT_FOLDER}/${folder}`,
      resource_type: "video", // Cloudinary stores audio under video resource_type
    });

    return {
      url: result.secure_url,
      publicId: result.public_id,
      width: 0,
      height: 0,
      format: result.format || "mp3",
      bytes: result.bytes,
      resourceType: "video",
    };
  } catch (error) {
    console.error("[Cloudinary UploadVoiceNote Error]:", error);
    throw new Error("Failed to upload audio message to Cloudinary");
  }
}

/**
 * Delete a single asset from Cloudinary by its publicId
 */
export async function deleteImage(publicId: string): Promise<void> {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error("[Cloudinary Delete Error]:", error);
  }
}

/**
 * Delete multiple assets from Cloudinary in bulk
 */
export async function deleteImages(publicIds: string[]): Promise<void> {
  try {
    await cloudinary.api.delete_resources(publicIds);
  } catch (error) {
    console.error("[Cloudinary Bulk Delete Error]:", error);
  }
}

/**
 * Dynamically injects WebP format and auto-quality into any Cloudinary URL on-the-fly
 */
export function optimizeImageUrl(src: string, width: number = 800, quality: number = 80): string {
  if (!src) return "";
  if (!src.includes("res.cloudinary.com")) return src;

  const uploadMarker = "/upload/";
  const index = src.indexOf(uploadMarker);
  if (index === -1) return src;

  const before = src.substring(0, index + uploadMarker.length);
  const after = src.substring(index + uploadMarker.length);

  // Injects f_webp, q_auto:good, dynamic width, and limit crop to prevent upscaling
  const params = `f_webp,q_auto:good,w_${width},c_limit`;
  const match = after.match(/(?:([^\/]+)\/)?(v\d+\/.*)/);
  if (match) {
    const [, , rest] = match;
    return `${before}${params}/${rest}`;
  }
  return `${before}${params}/${after}`;
}

/**
 * Backward compatibility helper for existing TrueHive code
 */
export async function uploadMediaToCloudinary(
  fileBase64OrUrl: string,
  folder: CloudinaryFolder = "products"
): Promise<string> {
  if (!process.env.CLOUDINARY_CLOUD_NAME) {
    return fileBase64OrUrl;
  }
  const res = await uploadImage(fileBase64OrUrl, folder);
  return res.url;
}

/**
 * Push Alert helper
 */
export async function sendPushAlert(payload: {
  title: string;
  body: string;
  type: "HUMAN_HANDOVER" | "LOW_STOCK" | "OVERDUE_LEAD" | "NEW_ORDER";
  referenceId?: string;
}): Promise<boolean> {
  console.log(`[FCM Push Alert - ${payload.type}]: ${payload.title} - ${payload.body}`);
  return true;
}
