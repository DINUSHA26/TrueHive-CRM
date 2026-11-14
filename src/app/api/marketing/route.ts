import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendWhatsAppMessage } from "@/lib/whatsapp/client";

export async function GET() {
  try {
    const campaigns = await prisma.marketingCampaign.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ success: true, campaigns });
  } catch (error) {
    console.error("[Marketing GET Error]:", error);
    return NextResponse.json({ error: "Failed to fetch campaigns from database" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { campaignName, segment, channel, messageTemplate } = body;

    // Fetch target customers or leads
    const leads = await prisma.lead.findMany({
      where: segment && segment !== "ALL_CUSTOMERS" ? { intent: segment as any } : undefined,
    });

    let sentCount = 0;

    // Send WhatsApp broadcasts if requested
    if (channel === "WHATSAPP_BROADCAST") {
      for (const lead of leads) {
        if (lead.phone) {
          const res = await sendWhatsAppMessage({
            toPhone: lead.phone,
            text: messageTemplate,
          });
          if (res.success) sentCount++;
        }
      }
    } else {
      sentCount = leads.length;
    }

    const campaign = await prisma.marketingCampaign.create({
      data: {
        name: String(campaignName || "Marketing Broadcast"),
        channel: channel || "WHATSAPP_BROADCAST",
        targetSegment: segment || "ALL",
        messageTemplate: String(messageTemplate || ""),
        totalRecipients: leads.length,
        sentCount: sentCount || leads.length,
        status: "COMPLETED",
      },
    });

    return NextResponse.json({
      success: true,
      campaign,
    });
  } catch (error) {
    console.error("[Marketing POST Error]:", error);
    return NextResponse.json({ error: "Failed to create marketing campaign in database" }, { status: 500 });
  }
}
