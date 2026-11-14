import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getStore } from "@/lib/store";
import { bufferWhatsAppMessage, consumeBufferedWhatsAppMessages, markWebhookProcessed } from "@/lib/redis";
import { runGeminiAgenticLoop } from "@/lib/ai/agent-loop";
import { sendWhatsAppMessage } from "@/lib/whatsapp/client";
import { broadcastRealtimeEvent, CHANNELS } from "@/lib/pusher";

/**
 * Official Meta WhatsApp Cloud API Webhook
 * GET: Webhook Verification Challenge (Meta Hub Challenge)
 * POST: Inbound Customer Message Receiver + DB Persistence + Redis Buffer + Gemini Agentic Loop
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const expectedToken = process.env.WHATSAPP_VERIFY_TOKEN || "truehive_webhook_verify_token_2026";
  if (mode === "subscribe" && token === expectedToken) {
    console.log("[WhatsApp Webhook]: Hub challenge verified successfully!");
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ status: "WhatsApp Webhook Active" }, { status: 200 });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // 1. Check for Meta delivery/read status updates
    const value = body.entry?.[0]?.changes?.[0]?.value;
    if (value?.statuses && !value?.messages) {
      return NextResponse.json({ status: "status_update_acknowledged" }, { status: 200 });
    }

    // Support both official Meta Cloud API payload and internal Simulator payload
    const isMetaPayload = Boolean(value?.messages?.[0]);
    let customerPhone = "";
    let customerName = "WhatsApp Customer";
    let messageText = "";
    let messageType: "TEXT" | "AUDIO" | "IMAGE" = "TEXT";
    let waMessageId = `wamid.${Date.now()}`;

    if (isMetaPayload) {
      const msg = value.messages[0];
      waMessageId = msg.id;
      customerPhone = msg.from;
      customerName = value.contacts?.[0]?.profile?.name || customerPhone;

      if (msg.type === "text") {
        messageText = msg.text?.body || "";
      } else if (msg.type === "audio") {
        messageType = "AUDIO";
        messageText = "[Voice Note Received]: Customer inquiry";
      } else if (msg.type === "image") {
        messageType = "IMAGE";
        messageText = msg.image?.caption || "[Image Attachment Uploaded]";
      }
    } else {
      customerPhone = String(body.phone || "");
      customerName = String(body.customerName || body.phone || "Customer");
      messageText = String(body.message || "");
      messageType = body.messageType || "TEXT";
    }

    if (!customerPhone || !messageText.trim()) {
      return NextResponse.json({ status: "no_message_content" }, { status: 200 });
    }

    console.log(`[WhatsApp Webhook Inbound] From: ${customerName} (${customerPhone}) - Message: "${messageText}"`);

    // Idempotency check via Redis / memory
    const isFirstTime = await markWebhookProcessed(waMessageId);
    if (!isFirstTime) {
      console.log(`[WhatsApp Webhook]: Duplicate message ignored: ${waMessageId}`);
      return NextResponse.json({ status: "duplicate_ignored" });
    }

    // Buffer rapid messages in Redis / memory
    await bufferWhatsAppMessage(customerPhone, messageText);
    const combinedText = await consumeBufferedWhatsAppMessages(customerPhone);

    // 2. Persist Customer & Chat in PostgreSQL Supabase
    let chatRoomId: string | null = null;
    let isAiActive = true;

    try {
      let customer = await prisma.customer.findUnique({
        where: { phone: customerPhone },
      });

      if (!customer) {
        customer = await prisma.customer.create({
          data: {
            name: customerName,
            phone: customerPhone,
            whatsappId: customerPhone,
          },
        });
      }

      let chatRoom = await prisma.chatRoom.findUnique({
        where: { whatsappPhone: customerPhone },
      });

      if (!chatRoom) {
        chatRoom = await prisma.chatRoom.create({
          data: {
            customerId: customer.id,
            whatsappPhone: customerPhone,
            customerName,
            isAiActive: true,
            handoverStatus: "AI_ACTIVE",
            unreadCount: 1,
            lastMessageText: combinedText,
          },
        });
      } else {
        chatRoom = await prisma.chatRoom.update({
          where: { id: chatRoom.id },
          data: {
            customerName,
            unreadCount: { increment: 1 },
            lastMessageText: combinedText,
            lastMessageAt: new Date(),
          },
        });
      }

      chatRoomId = chatRoom.id;
      isAiActive = chatRoom.isAiActive;

      // Save Inbound Message
      await prisma.chatMessage.create({
        data: {
          chatRoomId: chatRoom.id,
          waMessageId,
          direction: "INBOUND",
          senderType: "CUSTOMER",
          messageType,
          content: combinedText,
        },
      });

      // Broadcast Pusher Realtime Event
      await broadcastRealtimeEvent(CHANNELS.LIVE_CHAT, "message-received", {
        chatRoomId: chatRoom.id,
        phone: customerPhone,
        customerName,
        message: combinedText,
        direction: "INBOUND",
      });
    } catch (dbErr) {
      console.warn("[WhatsApp Webhook DB Warn]:", dbErr);
    }

    // Also update in-memory store for fallback
    const store = getStore();
    let memoryChat = store.chats.find((c) => c.whatsappPhone === customerPhone);
    if (!memoryChat) {
      memoryChat = {
        id: chatRoomId || `chat-${Date.now()}`,
        customerName,
        whatsappPhone: customerPhone,
        isAiActive: true,
        handoverStatus: "AI_ACTIVE",
        unreadCount: 1,
        lastMessageText: combinedText,
        lastMessageAt: "Just now",
        messages: [],
      };
      store.chats.unshift(memoryChat);
    }

    memoryChat.messages.push({
      id: `m-in-${Date.now()}`,
      direction: "INBOUND",
      senderType: "CUSTOMER",
      messageType,
      content: combinedText,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    });
    memoryChat.lastMessageText = combinedText;
    memoryChat.lastMessageAt = "Just now";

    // If Human Handover is active (AI paused), do NOT run AI bot
    if (!isAiActive) {
      return NextResponse.json({
        success: true,
        aiPaused: true,
        message: "Chat is in Human Handover mode. Message queued for human agent.",
      });
    }

    // 3. Run Gemini Agentic Tool-Calling Loop
    const agentOutput = await runGeminiAgenticLoop({
      customerPhone,
      customerName,
      incomingMessage: combinedText,
      messageType,
    });

    console.log(`[WhatsApp Webhook AI Reply]: "${agentOutput.replyText}"`);

    // 4. Send Reply via Meta WhatsApp Cloud API
    const sendResult = await sendWhatsAppMessage({
      toPhone: customerPhone,
      text: agentOutput.replyText,
    });

    // 5. Persist Outbound AI Message
    if (chatRoomId) {
      try {
        await prisma.chatMessage.create({
          data: {
            chatRoomId,
            waMessageId: sendResult.waMessageId,
            direction: "OUTBOUND",
            senderType: "AI_BOT",
            messageType: "TEXT",
            content: agentOutput.replyText,
            aiToolCalls: agentOutput.executedTools,
          },
        });

        await prisma.chatRoom.update({
          where: { id: chatRoomId },
          data: {
            lastMessageText: agentOutput.replyText,
            lastMessageAt: new Date(),
          },
        });

        await broadcastRealtimeEvent(CHANNELS.LIVE_CHAT, "message-sent", {
          chatRoomId,
          phone: customerPhone,
          customerName,
          message: agentOutput.replyText,
          direction: "OUTBOUND",
          tools: agentOutput.executedTools,
        });
      } catch (saveOutboundErr) {
        console.warn("[WhatsApp Webhook Outbound DB Warn]:", saveOutboundErr);
      }
    }

    memoryChat.messages.push({
      id: `m-out-${Date.now()}`,
      direction: "OUTBOUND",
      senderType: "AI_BOT",
      messageType: "TEXT",
      content: agentOutput.replyText,
      toolCalls: agentOutput.executedTools,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    });
    memoryChat.lastMessageText = agentOutput.replyText;

    return NextResponse.json({
      success: true,
      sentToWhatsApp: sendResult.success,
      waMessageId: sendResult.waMessageId,
      agentOutput,
    });
  } catch (err) {
    console.error("[WhatsApp Webhook Error]:", err);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
