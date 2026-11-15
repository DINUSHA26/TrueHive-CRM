import { NextRequest, NextResponse } from "next/server";
import { getWhatsAppCredentials } from "@/lib/whatsapp/client";

export async function GET(req: NextRequest) {
  const creds = getWhatsAppCredentials();
  const rawPhoneId = process.env.WHATSAPP_PHONE_NUMBER_ID || "";
  const rawToken = process.env.WHATSAPP_ACCESS_TOKEN || process.env.WHATSAPP_TOKEN || "";
  const rawWabaId = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID || "";

  // 1. Check Phone Details on Meta Graph API
  let metaPhoneCheck: any = null;
  let metaPhoneStatus: number = 0;
  if (creds.phoneId && creds.token) {
    try {
      const phoneRes = await fetch(
        `https://graph.facebook.com/${creds.version}/${creds.phoneId}?fields=verified_name,display_phone_number,quality_rating,status,code_verification_status&access_token=${creds.token}`
      );
      metaPhoneStatus = phoneRes.status;
      metaPhoneCheck = await phoneRes.json();
    } catch (e: any) {
      metaPhoneCheck = { error: e.message };
    }
  }

  // 2. Test send a diagnostic ping if requested (?sendTo=94765731249)
  const sendTo = req.nextUrl.searchParams.get("sendTo");
  let testSendResult: any = null;
  if (sendTo && creds.phoneId && creds.token) {
    try {
      const sendRes = await fetch(
        `https://graph.facebook.com/${creds.version}/${creds.phoneId}/messages`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${creds.token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to: sendTo.replace(/[^0-9]/g, ""),
            type: "text",
            text: { body: `[Diagnostics Check]: Cloud API connection verified at ${new Date().toISOString()}` },
          }),
        }
      );
      testSendResult = {
        httpStatus: sendRes.status,
        body: await sendRes.json(),
      };
    } catch (e: any) {
      testSendResult = { error: e.message };
    }
  }

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    environment: {
      rawPhoneId: {
        valueMasked: rawPhoneId ? `${rawPhoneId.slice(0, 4)}...${rawPhoneId.slice(-4)}` : "MISSING",
        length: rawPhoneId.length,
        hasQuotes: rawPhoneId.startsWith('"') || rawPhoneId.startsWith("'"),
      },
      cleanedPhoneId: creds.phoneId,
      rawToken: {
        prefix: rawToken ? rawToken.slice(0, 7) : "MISSING",
        suffix: rawToken ? rawToken.slice(-6) : "MISSING",
        length: rawToken.length,
        hasQuotes: rawToken.startsWith('"') || rawToken.startsWith("'"),
        hasBearer: rawToken.startsWith("Bearer "),
      },
      wabaId: rawWabaId,
      apiVersion: creds.version,
    },
    metaPhoneCheck: {
      httpStatus: metaPhoneStatus,
      data: metaPhoneCheck,
    },
    testSendResult,
  });
}
