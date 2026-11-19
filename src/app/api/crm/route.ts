import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendWhatsAppMessage } from "@/lib/whatsapp/client";
import { syncContactToZohoCampaigns } from "@/lib/email";
import { getStore } from "@/lib/store";
import { broadcastRealtimeEvent, CHANNELS } from "@/lib/pusher";

function formatChatRooms(chatRooms: any[]) {
  return (chatRooms || []).map((room) => ({
    id: room.id,
    customerName: room.customerName || room.customer?.name || room.whatsappPhone,
    whatsappPhone: room.whatsappPhone,
    isAiActive: room.isAiActive,
    handoverStatus: (room.handoverStatus || "AI_ACTIVE") as "AI_ACTIVE" | "HUMAN_HANDOVER" | "URGENT_ESCALATION",
    unreadCount: room.unreadCount || 0,
    lastMessageText: room.lastMessageText || "",
    lastMessageAt: room.lastMessageAt
      ? new Date(room.lastMessageAt).toLocaleTimeString("en-US", {
          timeZone: "Asia/Colombo",
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        })
      : "Just now",
    messages: (room.messages || []).map((m: any) => ({
      id: m.id,
      direction: (m.direction || "INBOUND") as "INBOUND" | "OUTBOUND",
      senderType: (m.senderType || "CUSTOMER") as "CUSTOMER" | "AI_BOT" | "HUMAN_AGENT" | "SYSTEM",
      messageType: (m.messageType || "TEXT") as "TEXT" | "AUDIO" | "IMAGE" | "INVOICE",
      content: m.content || "",
      toolCalls: Array.isArray(m.aiToolCalls) ? (m.aiToolCalls as string[]) : [],
      timestamp: m.createdAt
        ? new Date(m.createdAt).toLocaleTimeString("en-US", {
            timeZone: "Asia/Colombo",
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          })
        : "Just now",
    })),
  }));
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const view = searchParams.get("view");

    // Fast path: Only WhatsApp Chats
    if (view === "chats") {
      const chatRooms = await prisma.chatRoom.findMany({
        select: {
          id: true,
          customerName: true,
          whatsappPhone: true,
          isAiActive: true,
          handoverStatus: true,
          unreadCount: true,
          lastMessageText: true,
          lastMessageAt: true,
          messages: {
            take: 35,
            orderBy: { createdAt: "asc" },
            select: {
              id: true,
              direction: true,
              senderType: true,
              messageType: true,
              content: true,
              aiToolCalls: true,
              createdAt: true,
            },
          },
        },
        orderBy: { lastMessageAt: "desc" },
      });

      const formattedChats = formatChatRooms(chatRooms);
      const storeChats = getStore().chats;
      const finalChats = formattedChats.length > 0 ? formattedChats : storeChats;

      return NextResponse.json({
        success: true,
        chats: finalChats,
        chatRooms: finalChats,
      }, {
        headers: { "Cache-Control": "no-store, max-age=0" }
      });
    }

    // Fast path: Only Leads Pipeline
    if (view === "leads") {
      const leads = await prisma.lead.findMany({
        include: {
          callNotes: {
            orderBy: { createdAt: "desc" },
          },
          customer: true,
        },
        orderBy: { updatedAt: "desc" },
      });
      return NextResponse.json({ success: true, leads }, {
        headers: { "Cache-Control": "no-store, max-age=0" }
      });
    }

    // Fast path: Only Customers Directory
    if (view === "customers") {
      const customers = await prisma.customer.findMany({
        orderBy: { totalSpent: "desc" },
      });
      return NextResponse.json({ success: true, customers }, {
        headers: { "Cache-Control": "no-store, max-age=0" }
      });
    }

    // Combined fallback (Overview / Initial Full Load)
    const [leads, customers, chatRooms] = await Promise.all([
      prisma.lead.findMany({
        include: {
          callNotes: {
            orderBy: { createdAt: "desc" },
          },
          customer: true,
        },
        orderBy: { updatedAt: "desc" },
      }),
      prisma.customer.findMany({
        orderBy: { totalSpent: "desc" },
      }),
      prisma.chatRoom.findMany({
        select: {
          id: true,
          customerName: true,
          whatsappPhone: true,
          isAiActive: true,
          handoverStatus: true,
          unreadCount: true,
          lastMessageText: true,
          lastMessageAt: true,
          messages: {
            take: 35,
            orderBy: { createdAt: "asc" },
            select: {
              id: true,
              direction: true,
              senderType: true,
              messageType: true,
              content: true,
              aiToolCalls: true,
              createdAt: true,
            },
          },
        },
        orderBy: { lastMessageAt: "desc" },
      }),
    ]);

    const formattedChats = formatChatRooms(chatRooms);
    const storeChats = getStore().chats;
    const finalChats = formattedChats.length > 0 ? formattedChats : storeChats;

    return NextResponse.json({
      success: true,
      leads,
      customers,
      chats: finalChats,
      chatRooms: finalChats,
    }, {
      headers: { "Cache-Control": "no-store, max-age=0" }
    });
  } catch (error) {
    console.error("[CRM GET Error]:", error);
    const store = getStore();
    return NextResponse.json({
      success: true,
      leads: store.leads,
      customers: [],
      chats: store.chats,
      chatRooms: store.chats,
    });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // 1. UPDATE LEAD OR ADD CALL NOTE
    if (body.action === "UPDATE_LEAD") {
      const { leadId, stage, note, authorName } = body;

      const lead = await prisma.lead.update({
        where: { id: leadId },
        data: {
          stage: stage ? (stage as any) : undefined,
          callNotes: note
            ? {
                create: {
                  note: String(note),
                  authorName: String(authorName || "Staff"),
                },
              }
            : undefined,
        },
        include: {
          callNotes: true,
        },
      });

      return NextResponse.json({ success: true, lead });
    }

    // 2. CREATE APPOINTMENT / LEAD
    if (body.action === "CREATE_APPOINTMENT") {
      const { customerName, phone, town, issueSummary, businessType, nextFollowUpAt, intent } = body;

      // Upsert Customer
      const customer = await prisma.customer.upsert({
        where: { phone: String(phone) },
        update: { name: customerName },
        create: {
          name: customerName,
          phone: String(phone),
          whatsappId: String(phone),
          city: town,
        },
      });

      const lead = await prisma.lead.create({
        data: {
          customerId: customer.id,
          customerName,
          phone: String(phone),
          town: town || "Colombo",
          stage: "SCHEDULED",
          intent: (intent || "HIGH_INTENT") as any,
          issueSummary: issueSummary || "Scheduled consultation appointment",
          businessType: businessType || "Direct Customer",
          nextFollowUpAt: nextFollowUpAt ? new Date(nextFollowUpAt) : new Date(Date.now() + 86400000),
          callNotes: {
            create: {
              note: `Appointment scheduled for ${nextFollowUpAt || "Tomorrow"}`,
              authorName: "System",
            },
          },
        },
        include: {
          callNotes: true,
        },
      });

      return NextResponse.json({ success: true, lead });
    }

    // 3. TOGGLE CHAT HANDOVER
    if (body.action === "TOGGLE_HANDOVER") {
      const { chatId, isAiActive } = body;

      const chat = await prisma.chatRoom.update({
        where: { id: chatId },
        data: {
          isAiActive: Boolean(isAiActive),
          handoverStatus: isAiActive ? "AI_ACTIVE" : "HUMAN_HANDOVER",
          unreadCount: 0,
        },
        include: {
          messages: {
            take: 30,
            orderBy: { createdAt: "asc" },
          },
        },
      });

      await broadcastRealtimeEvent(CHANNELS.LIVE_CHAT, "chat-read", {
        chatRoomId: chat.id,
        phone: chat.whatsappPhone,
      });

      return NextResponse.json({ success: true, chat });
    }

    // 4. MARK CHAT AS READ / SEEN
    if (body.action === "MARK_AS_READ" || body.action === "SEEN_CHAT") {
      const { chatId, phone } = body;
      if (!chatId && !phone) {
        return NextResponse.json({ error: "chatId or phone is required" }, { status: 400 });
      }

      try {
        const whereClause = chatId ? { id: String(chatId) } : { whatsappPhone: String(phone) };
        const updatedChat = await prisma.chatRoom.update({
          where: whereClause,
          data: {
            unreadCount: 0,
          },
          select: {
            id: true,
            whatsappPhone: true,
            unreadCount: true,
          },
        });

        // Also update memory fallback store
        const store = getStore();
        const memChat = store.chats.find(
          (c) => c.id === chatId || c.whatsappPhone === phone || (chatId && c.id === updatedChat.id)
        );
        if (memChat) {
          memChat.unreadCount = 0;
        }

        // Broadcast Pusher Realtime Event
        await broadcastRealtimeEvent(CHANNELS.LIVE_CHAT, "chat-read", {
          chatRoomId: updatedChat.id,
          phone: updatedChat.whatsappPhone,
        });

        return NextResponse.json({ success: true, chat: updatedChat });
      } catch (markErr) {
        console.warn("[CRM MARK_AS_READ Warn]:", markErr);
        const store = getStore();
        const memChat = store.chats.find((c) => c.id === chatId || c.whatsappPhone === phone);
        if (memChat) memChat.unreadCount = 0;
        return NextResponse.json({ success: true });
      }
    }

    // 5. SEND MANUAL HUMAN REPLY IN WHATSAPP CHAT
    if (body.action === "SEND_HUMAN_REPLY" || body.action === "SEND_REPLY") {
      const { chatId } = body;
      const message = String(body.message || body.text || "").trim();
      if (!message) return NextResponse.json({ error: "Message content cannot be empty" }, { status: 400 });

      const chat = await prisma.chatRoom.findUnique({
        where: { id: chatId },
      });

      if (!chat) return NextResponse.json({ error: "Chat not found" }, { status: 404 });

      // Send via WhatsApp Cloud API
      await sendWhatsAppMessage({
        toPhone: chat.whatsappPhone,
        text: String(message),
      });

      // Save to Database
      await prisma.chatMessage.create({
        data: {
          chatRoomId: chat.id,
          direction: "OUTBOUND",
          senderType: "HUMAN_AGENT",
          messageType: "TEXT",
          content: String(message),
        },
      });

      const updatedChat = await prisma.chatRoom.update({
        where: { id: chat.id },
        data: {
          lastMessageText: String(message),
          lastMessageAt: new Date(),
          unreadCount: 0,
        },
        include: {
          messages: {
            take: 30,
            orderBy: { createdAt: "asc" },
          },
        },
      });

      await broadcastRealtimeEvent(CHANNELS.LIVE_CHAT, "message-sent", {
        chatRoomId: chat.id,
        phone: chat.whatsappPhone,
        customerName: chat.customerName,
        message: String(message),
        direction: "OUTBOUND",
      });

      return NextResponse.json({ success: true, chat: updatedChat });
    }

    // 6. SYNC LEADS TO ZOHO CAMPAIGNS
    if (body.action === "SYNC_ZOHO") {
      const leads = await prisma.lead.findMany();
      let syncedCount = 0;

      for (const lead of leads) {
        const res = await syncContactToZohoCampaigns({
          name: lead.customerName,
          phone: lead.phone,
          segment: lead.intent,
          intent: lead.intent,
        });
        if (res.synced) syncedCount++;
      }

      return NextResponse.json({
        success: true,
        syncedCount,
        message: `Successfully synced ${syncedCount} leads to Zoho Marketing Campaigns.`,
      });
    }

    return NextResponse.json({ error: "Invalid CRM action" }, { status: 400 });
  } catch (error) {
    console.error("[CRM POST Error]:", error);
    return NextResponse.json({ error: "Failed to process CRM request in database" }, { status: 500 });
  }
}
