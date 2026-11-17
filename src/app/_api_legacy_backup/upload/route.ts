import { NextRequest, NextResponse } from "next/server";
import {
  uploadImage,
  uploadFile,
  uploadVoiceNote,
  type CloudinaryFolder,
} from "@/lib/cloudinary";

const VALID_FOLDERS: CloudinaryFolder[] = [
  "products",
  "inventory",
  "chat",
  "bank-slips",
  "invoices",
  "avatars",
  "marketing",
  "documents",
];

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const requestedFolder = (formData.get("folder") as string) || "products";

    if (!file) {
      return NextResponse.json(
        { success: false, error: "ගොනුවක් සපයා නොමැත (No file provided)" },
        { status: 400 }
      );
    }

    const folder: CloudinaryFolder = VALID_FOLDERS.includes(
      requestedFolder as CloudinaryFolder
    )
      ? (requestedFolder as CloudinaryFolder)
      : "products";

    const fileNameLower = (file.name || "").toLowerCase();
    const isImage = file.type.startsWith("image/");
    const isAudio =
      file.type.startsWith("audio/") ||
      fileNameLower.endsWith(".mp3") ||
      fileNameLower.endsWith(".ogg") ||
      fileNameLower.endsWith(".wav") ||
      fileNameLower.endsWith(".m4a");
    const isPdf =
      file.type === "application/pdf" || fileNameLower.endsWith(".pdf");
    const isExcel =
      file.type ===
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
      file.type === "application/vnd.ms-excel" ||
      file.type === "text/csv" ||
      file.type.includes("spreadsheet") ||
      file.type.includes("excel") ||
      fileNameLower.endsWith(".xlsx") ||
      fileNameLower.endsWith(".xls") ||
      fileNameLower.endsWith(".csv");
    const isWord =
      file.type === "application/msword" ||
      file.type ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      fileNameLower.endsWith(".doc") ||
      fileNameLower.endsWith(".docx");

    // Validate allowed file types
    if (!isImage && !isAudio && !isPdf && !isExcel && !isWord) {
      return NextResponse.json(
        {
          success: false,
          error:
            "සහය නොදක්වන ගොනු වර්ගයකි. කරුණාකර පින්තූර (JPG, PNG, WebP), හඬ පට (Audio), PDF හෝ ලේඛන පමණක් Upload කරන්න.",
        },
        { status: 400 }
      );
    }

    // Size limit: 20MB for docs/audio, 10MB for images
    const maxAllowedSize = isImage ? 10 * 1024 * 1024 : 20 * 1024 * 1024;
    if (file.size > maxAllowedSize) {
      const maxMB = Math.round(maxAllowedSize / (1024 * 1024));
      return NextResponse.json(
        {
          success: false,
          error: `ගොනුවේ ප්‍රමාණය ${maxMB}MB ට වඩා අඩු විය යුතුය.`,
        },
        { status: 400 }
      );
    }

    // Convert to Buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    let result;
    if (isImage) {
      // Upload image as WebP with auto-quality into truehive-crm/<folder>
      result = await uploadImage(buffer, folder);
    } else if (isAudio) {
      // Upload voice note / audio into truehive-crm/<folder>
      result = await uploadVoiceNote(buffer, folder);
    } else {
      // Upload document / PDF into truehive-crm/<folder>
      result = await uploadFile(buffer, file.type, folder, file.name);
    }

    const detectedType = isImage
      ? "image"
      : isAudio
      ? "audio"
      : isPdf
      ? "pdf"
      : isExcel
      ? "excel"
      : "document";

    return NextResponse.json({
      success: true,
      data: {
        ...result,
        name: file.name,
        size: file.size,
        fileType: detectedType,
        folder: `truehive-crm/${folder}`,
      },
    });
  } catch (error) {
    console.error("[Upload API Error]:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Cloudinary වෙත ගොනුව Upload කිරීමේදී දෝෂයක් ඇති විය.",
      },
      { status: 500 }
    );
  }
}

