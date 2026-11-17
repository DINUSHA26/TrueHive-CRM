import { NextRequest, NextResponse } from "next/server";
import { SYSTEM_ROLES } from "@/lib/rbac";
import { getNotificationsHistory } from "@/lib/firebase";

const globalForSettings = globalThis as unknown as {
  systemSettings?: {
    businessName: string;
    hotlinePhone: string;
    whatsappPhoneId: string;
    geminiModel: string;
    redisDebounceSeconds: number;
    thermalPrinterWidth: "80mm" | "58mm";
    autoDeductBomOnProcessing: boolean;
    autoSendOrderStatusWhatsApp: boolean;
    googleLiveDocId: string;
    googleLiveSheetId: string;
  };
};

if (!globalForSettings.systemSettings) {
  globalForSettings.systemSettings = {
    businessName: "TrueHive Enterprise (Pvt) Ltd",
    hotlinePhone: "+94 78 163 0865",
    whatsappPhoneId: process.env.WHATSAPP_PHONE_NUMBER_ID || "104928192839102",
    geminiModel: process.env.GEMINI_MODEL || "gemini-3.5-flash",
    redisDebounceSeconds: 3,
    thermalPrinterWidth: "80mm",
    autoDeductBomOnProcessing: true,
    autoSendOrderStatusWhatsApp: true,
    googleLiveDocId: process.env.GOOGLE_LIVE_DOC_ID || "1TrueHiveLiveExecutiveReport2026",
    googleLiveSheetId: process.env.GOOGLE_LIVE_SHEET_ID || "1TrueHiveLiveFinancialLedger2026",
  };
}

export async function GET() {
  return NextResponse.json({
    settings: globalForSettings.systemSettings,
    roles: SYSTEM_ROLES,
    notifications: getNotificationsHistory(),
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    globalForSettings.systemSettings = {
      ...globalForSettings.systemSettings!,
      ...body,
    };
    return NextResponse.json({
      success: true,
      settings: globalForSettings.systemSettings,
    });
  } catch (err) {
    console.error("[Settings API Error]:", err);
    return NextResponse.json({ error: "Failed to save settings" }, { status: 500 });
  }
}
