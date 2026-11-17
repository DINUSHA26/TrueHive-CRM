import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendOrderStatusWhatsAppNotification } from "@/lib/whatsapp/client";
import { broadcastRealtimeEvent, CHANNELS } from "@/lib/pusher";
import { sendPushAlert } from "@/lib/cloudinary";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    const orders = await prisma.order.findMany({
      where: status && status !== "ALL" ? { status: status as any } : undefined,
      include: {
        items: true,
        statusHistory: {
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, orders });
  } catch (error) {
    console.error("[Orders GET Error]:", error);
    return NextResponse.json({ error: "Failed to fetch orders from database" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { orderId, newStatus } = await req.json();

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: {
              include: {
                bomItems: {
                  include: { ingredient: true },
                },
              },
            },
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const bomDeductions: string[] = [];

    // Atomic transaction for BOM deduction if changing to PROCESSING
    await prisma.$transaction(async (tx) => {
      // 1. If moving to PROCESSING and BOM hasn't been deducted yet
      if (newStatus === "PROCESSING" && !order.bomDeducted) {
        for (const item of order.items) {
          if (item.product?.trackBom && item.product.bomItems.length > 0) {
            for (const bomItem of item.product.bomItems) {
              const qtyToDeduct = bomItem.quantityRequired * item.quantity;
              const ing = await tx.ingredient.update({
                where: { id: bomItem.ingredientId },
                data: {
                  currentStock: {
                    decrement: qtyToDeduct,
                  },
                },
              });

              bomDeductions.push(`${ing.name}: -${qtyToDeduct.toFixed(2)} ${ing.unit}`);

              // Record stock movement
              await tx.stockMovement.create({
                data: {
                  ingredientId: ing.id,
                  type: "ORDER_PROCESSING_BOM",
                  quantityChange: -qtyToDeduct,
                  balanceAfter: ing.currentStock,
                  referenceId: order.orderNumber,
                  notes: `Auto BOM deduction for ${order.orderNumber} (${item.product.name} x${item.quantity})`,
                },
              });

              if (ing.currentStock <= ing.reorderLevel) {
                await sendPushAlert({
                  title: `Low Stock Alert: ${ing.name}`,
                  body: `Stock is at ${ing.currentStock} ${ing.unit} (Reorder level: ${ing.reorderLevel})`,
                  type: "LOW_STOCK",
                  referenceId: ing.id,
                });
              }
            }
          }
        }

        // Record COGS in Cash Flow Transaction
        await tx.cashFlowTransaction.create({
          data: {
            transactionCode: `TXN-BOM-${Date.now().toString().slice(-6)}`,
            type: "COGS_RECOGNITION",
            category: "BOM_INGREDIENT_DEDUCTION",
            amount: order.totalCogs,
            description: `Auto BOM Cost Recognition for ${order.orderNumber} (${bomDeductions.join(", ")})`,
            paymentMethod: "SYSTEM_LEDGER",
            referenceOrderId: order.id,
          },
        });
      }

      // 2. Update Order status
      await tx.order.update({
        where: { id: order.id },
        data: {
          status: newStatus,
          bomDeducted: newStatus === "PROCESSING" ? true : order.bomDeducted,
          bomDeductedAt: newStatus === "PROCESSING" ? new Date() : order.bomDeductedAt,
        },
      });

      // 3. Log OrderStatusHistory
      await tx.orderStatusHistory.create({
        data: {
          orderId: order.id,
          status: newStatus,
          whatsappSent: true,
          note: `Status updated to ${newStatus}`,
        },
      });
    });

    // Send WhatsApp Notification to Customer
    const waResult = await sendOrderStatusWhatsAppNotification({
      toPhone: order.customerPhone,
      customerName: order.customerName,
      orderNumber: order.orderNumber,
      newStatus,
      totalAmount: order.totalAmount,
      bomDeducted: newStatus === "PROCESSING" || order.bomDeducted,
    });

    // Real-time broadcast
    await broadcastRealtimeEvent(CHANNELS.ORDERS, "order-status-updated", {
      orderId: order.id,
      orderNumber: order.orderNumber,
      newStatus,
      bomDeductions,
    });

    const updatedOrder = await prisma.order.findUnique({
      where: { id: order.id },
      include: { items: true, statusHistory: true },
    });

    return NextResponse.json({
      success: true,
      order: updatedOrder,
      bomDeductions,
      whatsappMessageSent: waResult.messageSent,
    });
  } catch (error) {
    console.error("[Orders PATCH Error]:", error);
    return NextResponse.json({ error: "Failed to update order status in database" }, { status: 500 });
  }
}
