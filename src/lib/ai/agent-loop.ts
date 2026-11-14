import { prisma } from "@/lib/prisma";
import { broadcastRealtimeEvent, CHANNELS } from "@/lib/pusher";
import { sendPushAlert } from "@/lib/cloudinary";
import { updateLiveStockCache } from "@/lib/redis";

export interface AgentLoopResult {
  replyText: string;
  executedTools: string[];
  handoverTriggered: boolean;
  createdOrderNumber?: string;
}

const GEMINI_TOOLS_DECLARATION = [
  {
    functionDeclarations: [
      {
        name: "search_products_and_live_stock",
        description: "Search products in live Supabase inventory, check real-time stock quantities, SKU, barcode, and LKR prices.",
        parameters: {
          type: "OBJECT",
          properties: {
            query: { type: "STRING", description: "Product name or keyword to search" },
          },
          required: ["query"],
        },
      },
      {
        name: "create_whatsapp_order",
        description: "Place a customer order from WhatsApp chat and reserve stock in PostgreSQL.",
        parameters: {
          type: "OBJECT",
          properties: {
            customerName: { type: "STRING" },
            shippingAddress: { type: "STRING" },
            sku: { type: "STRING" },
            quantity: { type: "NUMBER" },
            paymentMethod: { type: "STRING", description: "COD or BANK_TRANSFER" },
          },
          required: ["customerName", "shippingAddress", "sku", "quantity"],
        },
      },
      {
        name: "check_order_status",
        description: "Check the live status of an existing order by Order Number or Customer Phone.",
        parameters: {
          type: "OBJECT",
          properties: {
            orderNumber: { type: "STRING" },
          },
          required: ["orderNumber"],
        },
      },
      {
        name: "qualify_lead_and_schedule",
        description: "Extract lead intent, business type, requirement summary, and schedule follow-up in Leads CRM.",
        parameters: {
          type: "OBJECT",
          properties: {
            intent: { type: "STRING", description: "HIGH_INTENT, ENGAGED, EXPLORING, or URGENT_ESCALATION" },
            issueSummary: { type: "STRING" },
            businessType: { type: "STRING" },
            followUpTime: { type: "STRING" },
          },
          required: ["intent", "issueSummary"],
        },
      },
      {
        name: "request_human_handover",
        description: "Pause the AI bot and escalate the chat to a human support agent immediately.",
        parameters: {
          type: "OBJECT",
          properties: {
            reason: { type: "STRING" },
          },
          required: ["reason"],
        },
      },
    ],
  },
];

export async function runGeminiAgenticLoop(params: {
  customerPhone: string;
  customerName: string;
  incomingMessage: string;
  messageType?: "TEXT" | "AUDIO" | "IMAGE";
}): Promise<AgentLoopResult> {
  const executedTools: string[] = [];
  let handoverTriggered = false;
  let createdOrderNumber: string | undefined;

  const executeTool = async (toolName: string, args: Record<string, unknown>): Promise<string> => {
    // 1. Search Live Database Products
    if (toolName === "search_products_and_live_stock") {
      const q = String(args.query || "").trim();
      const matches = await prisma.product.findMany({
        where: q
          ? {
              OR: [
                { name: { contains: q, mode: "insensitive" } },
                { sku: { contains: q, mode: "insensitive" } },
                { description: { contains: q, mode: "insensitive" } },
              ],
            }
          : undefined,
        take: 6,
      });

      const list = matches.map(
        (p) => `${p.name} [SKU: ${p.sku}] - Price: LKR ${p.sellingPrice} - Stock: ${p.currentStock} ${p.unit}`
      );
      executedTools.push(`search_products_and_live_stock('${q}') -> Found ${list.length} items`);
      return JSON.stringify({ availableProducts: list });
    }

    // 2. Create WhatsApp Order in PostgreSQL
    if (toolName === "create_whatsapp_order") {
      const sku = String(args.sku || "").trim();
      const qty = Math.max(1, Number(args.quantity || 1));

      const prod = await prisma.product.findFirst({
        where: sku ? { sku } : undefined,
      });

      if (!prod) {
        executedTools.push(`create_whatsapp_order(sku='${sku}') -> PRODUCT_NOT_FOUND`);
        return JSON.stringify({ error: "Product not found" });
      }

      if (prod.currentStock < qty) {
        executedTools.push(`create_whatsapp_order(sku='${prod.sku}') -> INSUFFICIENT_STOCK`);
        return JSON.stringify({ error: `Only ${prod.currentStock} units available in stock.` });
      }

      const total = prod.sellingPrice * qty;
      const count = await prisma.order.count();
      const newOrderNum = `#ORD-${2500 + count}`;
      const barcode = newOrderNum.replace("#", "").replace("-", "");

      await prisma.$transaction(async (tx) => {
        // Deduct product stock
        await tx.product.update({
          where: { id: prod.id },
          data: { currentStock: { decrement: qty } },
        });

        // Find or create customer
        const cust = await tx.customer.upsert({
          where: { phone: params.customerPhone },
          update: { name: params.customerName },
          create: {
            name: params.customerName,
            phone: params.customerPhone,
            whatsappId: params.customerPhone,
          },
        });

        // Create Order
        await tx.order.create({
          data: {
            orderNumber: newOrderNum,
            barcode,
            customerId: cust.id,
            customerName: params.customerName,
            customerPhone: params.customerPhone,
            shippingAddress: String(args.shippingAddress || "Colombo"),
            source: "WHATSAPP_AI",
            status: "PENDING",
            paymentMethod: (args.paymentMethod === "BANK_TRANSFER" ? "BANK_TRANSFER" : "COD") as any,
            paymentStatus: "UNPAID",
            subtotal: total,
            totalAmount: total,
            totalCogs: prod.calculatedCogs * qty,
            items: {
              create: [
                {
                  productId: prod.id,
                  productName: prod.name,
                  sku: prod.sku,
                  barcode: prod.barcode,
                  quantity: qty,
                  unitPrice: prod.sellingPrice,
                  unitCogs: prod.calculatedCogs,
                  totalPrice: total,
                },
              ],
            },
          },
        });
      });

      createdOrderNumber = newOrderNum;
      await updateLiveStockCache(prod.sku, prod.currentStock - qty);
      await broadcastRealtimeEvent(CHANNELS.STOCK_SYNC, "stock-updated", {
        sku: prod.sku,
        newStock: prod.currentStock - qty,
      });

      executedTools.push(`create_whatsapp_order(sku='${prod.sku}', qty=${qty}) -> Created ${newOrderNum}`);
      return JSON.stringify({ success: true, orderNumber: newOrderNum, totalAmount: total });
    }

    // 3. Check Order Status
    if (toolName === "check_order_status") {
      const ordNum = String(args.orderNumber || "").toUpperCase().trim();
      const ord = await prisma.order.findFirst({
        where: {
          OR: [
            ordNum ? { orderNumber: { contains: ordNum, mode: "insensitive" } } : {},
            { customerPhone: params.customerPhone },
          ],
        },
        orderBy: { createdAt: "desc" },
      });

      if (!ord) {
        executedTools.push(`check_order_status('${ordNum}') -> NOT_FOUND`);
        return JSON.stringify({ found: false });
      }

      executedTools.push(`check_order_status('${ord.orderNumber}') -> Status: ${ord.status}`);
      return JSON.stringify({
        found: true,
        orderNumber: ord.orderNumber,
        status: ord.status,
        totalAmount: ord.totalAmount,
      });
    }

    // 4. Qualify Lead
    if (toolName === "qualify_lead_and_schedule") {
      const intent = (args.intent as any) || "HIGH_INTENT";
      const summary = String(args.issueSummary || params.incomingMessage);

      await prisma.lead.upsert({
        where: { id: `lead-${params.customerPhone}` },
        update: {
          intent,
          issueSummary: summary,
          updatedAt: new Date(),
        },
        create: {
          id: `lead-${params.customerPhone}`,
          customerName: params.customerName,
          phone: params.customerPhone,
          town: "Colombo",
          stage: "NEW",
          intent,
          issueSummary: summary,
          businessType: String(args.businessType || "Retail Inquiry"),
          needsMediaSupport: params.messageType !== "TEXT",
          nextFollowUpAt: new Date(Date.now() + 86400000),
        },
      });

      executedTools.push(`qualify_lead_and_schedule(intent='${intent}') -> Saved in DB`);
      return JSON.stringify({ success: true, intent });
    }

    // 5. Request Human Handover
    if (toolName === "request_human_handover") {
      handoverTriggered = true;
      const reason = String(args.reason || "Customer requested live agent");

      await prisma.chatRoom.updateMany({
        where: { whatsappPhone: params.customerPhone },
        data: {
          isAiActive: false,
          handoverStatus: "URGENT_ESCALATION",
          escalationReason: reason,
        },
      });

      await sendPushAlert({
        title: `Urgent Handover: ${params.customerName}`,
        body: reason,
        type: "HUMAN_HANDOVER",
      });

      await broadcastRealtimeEvent(CHANNELS.LIVE_CHAT, "handover-triggered", {
        phone: params.customerPhone,
        customerName: params.customerName,
        reason,
      });

      executedTools.push(`request_human_handover(reason='${reason}') -> AI Paused`);
      return JSON.stringify({ handoverStatus: "URGENT_ESCALATION", aiPaused: true });
    }

    return JSON.stringify({ status: "ok" });
  };

  // If GEMINI_API_KEY is configured in .env, run live multi-step function calling loop
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey && apiKey !== "your_gemini_api_key") {
    try {
      const configuredModel = (process.env.GEMINI_MODEL || "gemini-3.5-flash").replace(/^models\//, "");
      const candidateModels = [configuredModel, "gemini-3.5-flash", "gemini-3.8-flash", "gemini-3.1-flash-lite"];
      const uniqueModels = Array.from(new Set(candidateModels));

      const systemInstruction = `You are Business Hub AI, an intelligent WhatsApp commerce & CRM assistant for our Sri Lankan business.
Reply naturally, politely, and helpfully in Sinhala (or Singlish/English if the customer chats in English).
Always use the search_products_and_live_stock tool to check real-time stock and prices in the database before quoting.
When the customer wishes to buy or gives an address/quantity, call create_whatsapp_order.
When the customer inquires about their order status or mentions an order number (#ORD-...), call check_order_status.
When the customer has custom inquiries or quotes, qualify them with qualify_lead_and_schedule.
When the customer requests a human agent, manager, or has an urgent complaint, call request_human_handover.
Quote currency clearly as LKR or රු.`;

      const contents: Record<string, unknown>[] = [
        {
          role: "user",
          parts: [{ text: `Customer (${params.customerName}, ${params.customerPhone}): ${params.incomingMessage}` }],
        },
      ];

      for (const model of uniqueModels) {
        let modelSuccess = false;
        try {
          for (let step = 0; step < 3; step++) {
            const res = await fetch(
              `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  systemInstruction: { parts: [{ text: systemInstruction }] },
                  contents,
                  tools: GEMINI_TOOLS_DECLARATION,
                  generationConfig: {
                    thinkingConfig: { thinkingBudget: 0 },
                  },
                }),
                signal: AbortSignal.timeout(12000),
              }
            );

            if (!res.ok) {
              const errBody = await res.text();
              console.warn(`[Gemini Model ${model}] HTTP ${res.status}:`, errBody);
              break;
            }

            const data = await res.json();
            const candidate = data?.candidates?.[0];
            const part = candidate?.content?.parts?.[0];
            if (!part) break;

            if (part.functionCall) {
              const { name, args } = part.functionCall;
              const toolResultStr = await executeTool(name, args || {});
              let parsedResult: unknown;
              try {
                parsedResult = JSON.parse(toolResultStr);
              } catch {
                parsedResult = { result: toolResultStr };
              }

              contents.push({ role: "model", parts: candidate.content.parts });
              contents.push({
                role: "user",
                parts: [{ functionResponse: { name, response: parsedResult } }],
              });
              continue;
            }

            if (part.text) {
              modelSuccess = true;
              return {
                replyText: part.text,
                executedTools,
                handoverTriggered,
                createdOrderNumber,
              };
            }
          }
        } catch (mErr) {
          console.warn(`[Gemini Loop Model Error ${model}]:`, mErr);
        }
        if (modelSuccess) break;
      }
    } catch (err) {
      console.error("[Gemini Loop Fallback]:", err);
    }
  }

  // Fallback intelligent agent loop querying live Prisma
  const msgLower = params.incomingMessage.toLowerCase();

  if (
    msgLower.includes("agent") ||
    msgLower.includes("human") ||
    msgLower.includes("manager") ||
    msgLower.includes("urgent") ||
    msgLower.includes("කතා කරන්න")
  ) {
    await executeTool("request_human_handover", { reason: params.incomingMessage });
    await executeTool("qualify_lead_and_schedule", { intent: "URGENT_ESCALATION", issueSummary: params.incomingMessage });
    return {
      replyText: "ඔබගේ පණිවිඩය අපගේ පාරිභෝගික සේවා නියෝජිතයෙකු වෙත යොමු කරන ලදී. මොහොතකින් අපගේ නියෝජිතයෙකු සම්බන්ධ වනු ඇත.",
      executedTools,
      handoverTriggered: true,
    };
  }

  if (msgLower.includes("ord-") || msgLower.includes("status") || msgLower.includes("track")) {
    const match = params.incomingMessage.match(/#?ORD-\d+/i);
    const statusJson = await executeTool("check_order_status", { orderNumber: match ? match[0] : "" });
    const parsed = JSON.parse(statusJson);
    if (parsed.found) {
      return {
        replyText: `ආයුබෝවන් ${params.customerName}! ඔබගේ ඇණවුම (${parsed.orderNumber}) මේ වන විට **${parsed.status}** තත්ත්වයේ පවතී. මුළු මුදල: LKR ${parsed.totalAmount?.toLocaleString()}.`,
        executedTools,
        handoverTriggered: false,
      };
    }
  }

  if (msgLower.includes("order") || msgLower.includes("buy") || msgLower.includes("cod") || msgLower.includes("එවන්න")) {
    const orderRes = await executeTool("create_whatsapp_order", {
      customerName: params.customerName,
      shippingAddress: params.incomingMessage,
      quantity: 1,
      paymentMethod: "COD",
    });
    const parsedOrder = JSON.parse(orderRes);
    await executeTool("qualify_lead_and_schedule", {
      intent: "HIGH_INTENT",
      issueSummary: `Placed WhatsApp order via AI: ${params.incomingMessage}`,
    });

    return {
      replyText: `ස්තූතියි ${params.customerName}! ඔබගේ ඇණවුම (${parsedOrder.orderNumber}) සාර්ථකව සටහන් කරගත්තා. මුළු මුදල LKR ${parsedOrder.totalAmount?.toLocaleString()} (COD). ඇණවුම PROCESSING තත්ත්වයට පත් වූ සැණින් ඔබට WhatsApp පණිවිඩයක් ලැබෙනු ඇත!`,
      executedTools,
      handoverTriggered: false,
      createdOrderNumber: parsedOrder.orderNumber,
    };
  }

  // Default: list live items from Supabase
  const searchRes = await executeTool("search_products_and_live_stock", { query: "" });
  const parsedSearch = JSON.parse(searchRes);
  const catalogLines = (parsedSearch.availableProducts || []).slice(0, 4).join("\n• ");

  return {
    replyText: `ආයුබෝවන් ${params.customerName}! Business Hub වෙත සාදරයෙන් පිළිගනිමු. මේ වන විට අප සතුව ඇති සජීවී තොග:\n\n• ${catalogLines}\n\nඇණවුම් කිරීමට ඔබට අවශ්‍ය භාණ්ඩය සහ ලිපිනය අප වෙත එවන්න!`,
    executedTools,
    handoverTriggered: false,
  };
}
