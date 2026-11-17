import { NextRequest, NextResponse } from "next/server";
import { syncLiveGoogleDocsAndSheets } from "@/lib/google-docs/live-sync";
import { getStore } from "@/lib/store";

export async function GET() {
  const store = getStore();
  return NextResponse.json({
    history: store.googleSyncHistory,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const result = await syncLiveGoogleDocsAndSheets(body.reportTitle);
    return NextResponse.json({
      success: true,
      result,
      history: getStore().googleSyncHistory,
    });
  } catch (err) {
    console.error("[Google Reports API Error]:", err);
    return NextResponse.json({ error: "Failed to sync Google Docs & Sheets" }, { status: 500 });
  }
}
