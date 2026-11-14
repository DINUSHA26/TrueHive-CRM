import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function sendInvoiceEmail(params: {
  to: string;
  customerName: string;
  orderNumber: string;
  totalAmount: number;
  items: { name: string; quantity: number; total: number }[];
}): Promise<boolean> {
  if (!resend) {
    console.log(`[Resend Mock] Invoice ${params.orderNumber} emailed to ${params.to}`);
    return true;
  }

  try {
    await resend.emails.send({
      from: process.env.EMAIL_FROM || "TrueHive CRM <orders@truehive.lk>",
      to: params.to,
      subject: `Invoice ${params.orderNumber} from TrueHive`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
          <h2 style="color: #0f172a;">TrueHive Official Invoice (${params.orderNumber})</h2>
          <p>Dear ${params.customerName},</p>
          <p>Thank you for your purchase. Here is your invoice summary:</p>
          <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
            <thead>
              <tr style="background: #f8fafc; text-align: left;">
                <th style="padding: 8px; border-bottom: 1px solid #e2e8f0;">Item</th>
                <th style="padding: 8px; border-bottom: 1px solid #e2e8f0;">Qty</th>
                <th style="padding: 8px; border-bottom: 1px solid #e2e8f0;">Total (LKR)</th>
              </tr>
            </thead>
            <tbody>
              ${params.items
                .map(
                  (i) => `
                <tr>
                  <td style="padding: 8px; border-bottom: 1px solid #f1f5f9;">${i.name}</td>
                  <td style="padding: 8px; border-bottom: 1px solid #f1f5f9;">${i.quantity}</td>
                  <td style="padding: 8px; border-bottom: 1px solid #f1f5f9;">LKR ${i.total.toLocaleString()}</td>
                </tr>`
                )
                .join("")}
            </tbody>
          </table>
          <h3 style="text-align: right; color: #0f172a;">Grand Total: LKR ${params.totalAmount.toLocaleString()}</h3>
        </div>
      `,
    });
    return true;
  } catch (err) {
    console.error("[Resend Error]:", err);
    return false;
  }
}

export async function syncContactToZohoCampaigns(contact: {
  name: string;
  email?: string;
  phone: string;
  segment: string;
  intent?: string;
}): Promise<{ synced: boolean; message: string }> {
  if (!process.env.ZOHO_CLIENT_ID || !process.env.ZOHO_REFRESH_TOKEN) {
    return {
      synced: true,
      message: `Simulated Zoho Campaigns sync for ${contact.name} (${contact.phone}) in segment [${contact.segment}]`,
    };
  }

  try {
    const tokenRes = await fetch(
      `https://accounts.zoho.com/oauth/v2/token?refresh_token=${process.env.ZOHO_REFRESH_TOKEN}&client_id=${process.env.ZOHO_CLIENT_ID}&client_secret=${process.env.ZOHO_CLIENT_SECRET}&grant_type=refresh_token`,
      { method: "POST" }
    );
    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) {
      return { synced: false, message: "Zoho token refresh failed" };
    }

    const contactInfo = encodeURIComponent(
      JSON.stringify({
        "First Name": contact.name,
        "Contact Email": contact.email || `${contact.phone.replace(/\+/g, "")}@whatsapp.truehive.lk`,
        Phone: contact.phone,
        Segment: contact.segment,
        Intent: contact.intent || "HIGH_INTENT",
      })
    );

    await fetch(
      `https://campaigns.zoho.com/api/v1.1/json/listsubscribe?resfmt=JSON&listkey=${process.env.ZOHO_LIST_KEY}&contactinfo=${contactInfo}`,
      {
        method: "POST",
        headers: { Authorization: `Zoho-oauthtoken ${tokenData.access_token}` },
      }
    );

    return { synced: true, message: "Synced to Zoho Marketing Campaigns" };
  } catch (err) {
    console.error("[Zoho Campaigns Error]:", err);
    return { synced: false, message: "Error syncing to Zoho" };
  }
}
