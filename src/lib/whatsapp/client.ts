/**
 * Official Meta WhatsApp Cloud API Client
 * Sends interactive messages, AI replies, digital invoices, and automated Order Status updates.
 */

export async function sendWhatsAppMessage(params: {
  toPhone: string;
  text: string;
  previewUrl?: boolean;
}): Promise<{ success: boolean; waMessageId: string }> {
  let cleanPhone = params.toPhone.replace(/[^0-9]/g, "");
  if (cleanPhone.startsWith("0") && cleanPhone.length === 10) {
    cleanPhone = `94${cleanPhone.slice(1)}`;
  }

  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const version = process.env.WHATSAPP_API_VERSION || "v21.0";

  if (!phoneId || !token || phoneId === "your_phone_number_id") {
    console.log(`[WhatsApp Cloud API Mock -> ${cleanPhone}]: ${params.text}`);
    return {
      success: true,
      waMessageId: `wamid.truehive_${Date.now()}`,
    };
  }

  try {
    const url = `https://graph.facebook.com/${version}/${phoneId}/messages`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: cleanPhone,
        type: "text",
        text: {
          preview_url: params.previewUrl ?? false,
          body: params.text,
        },
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      console.error("[WhatsApp Cloud API Send Error]: HTTP", res.status, JSON.stringify(data, null, 2));
    }
    return {
      success: res.ok,
      waMessageId: data?.messages?.[0]?.id || `wamid.${Date.now()}`,
    };
  } catch (err) {
    console.error("[WhatsApp Cloud API Error]:", err);
    return { success: false, waMessageId: `wamid.err_${Date.now()}` };
  }
}

export async function sendOrderStatusWhatsAppNotification(params: {
  toPhone: string;
  customerName: string;
  orderNumber: string;
  newStatus: string;
  totalAmount: number;
  bomDeducted?: boolean;
}): Promise<{ success: boolean; messageSent: string }> {
  const statusMessages: Record<string, string> = {
    CONFIRMED: `✅ ආයුබෝවන් ${params.customerName}! ඔබගේ ඇණවුම (${params.orderNumber}) තහවුරු කරන ලදී. මුළු මුදල: LKR ${params.totalAmount.toLocaleString()}.`,
    PROCESSING: `👨‍🍳 සුබ ආරංචියක් ${params.customerName}! ඔබගේ ඇණවුම (${params.orderNumber}) දැන් සූදානම් කෙරෙමින් පවතී (PROCESSING). නැවුම් අමුද්‍රව්‍ය වෙන් කර නිෂ්පාදනය ආරම්භ කර ඇත.`,
    READY_TO_SHIP: `📦 ඔබගේ ඇණවුම (${params.orderNumber}) ඇසුරුම් කර බෙදාහැරීම සඳහා සූදානම් කර ඇත!`,
    SHIPPED: `🚚 ඔබගේ ඇණවුම (${params.orderNumber}) දැන් බෙදාහැරීමේ නියෝජිතයා අතට පත් කර ඇත (Out for Delivery).`,
    DELIVERED: `🎉 ඔබගේ ඇණවුම (${params.orderNumber}) සාර්ථකව භාර දෙන ලදී! TrueHive තෝරා ගැනීම ගැන ස්තූතියි.`,
    CANCELLED: `⚠️ ඔබගේ ඇණවුම (${params.orderNumber}) අවලංගු කර ඇත. වැඩිදුර විස්තර සඳහා අප අමතන්න.`,
  };

  const text =
    statusMessages[params.newStatus] ||
    `🔔 ඔබගේ ඇණවුම (${params.orderNumber}) තත්ත්වය [${params.newStatus}] ලෙස යාවත්කාලීන විය.`;

  const res = await sendWhatsAppMessage({
    toPhone: params.toPhone,
    text,
  });

  return {
    success: res.success,
    messageSent: text,
  };
}
