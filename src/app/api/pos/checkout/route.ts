import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { broadcastRealtimeEvent, CHANNELS } from "@/lib/pusher";
import { updateLiveStockCache } from "@/lib/redis";
import { sendWhatsAppMessage } from "@/lib/whatsapp/client";
import { sendInvoiceEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const cartItems: { productId: string; quantity: number }[] = body.items || [];

    if (cartItems.length === 0) {
      return NextResponse.json({ error: "POS Cart is empty" }, { status: 400 });
    }

    const discountAmount = Number(body.discountAmount || 0);
    const customerName = String(body.customerName || "Walk-in Customer");
    const customerPhone = String(body.customerPhone || "");
    const customerEmail = String(body.customerEmail || "");
    const paymentMethod = body.paymentMethod || "CASH";

    // Run checkout inside real PostgreSQL Prisma atomic transaction
    const result = await prisma.$transaction(async (tx) => {
      let subtotal = 0;
      let totalCogs = 0;
      const orderItemsData = [];
      const bomDeductionsLog: string[] = [];

      // Fetch products with their BOM items
      const productIds = cartItems.map((c) => c.productId);
      const products = await tx.product.findMany({
        where: { id: { in: productIds } },
        include: {
          bomItems: {
            include: { ingredient: true },
          },
        },
      });

      for (const item of cartItems) {
        const prod = products.find((p) => p.id === item.productId);
        if (!prod) continue;

        const qty = Number(item.quantity || 1);
        const lineTotal = prod.sellingPrice * qty;
        const lineCogs = prod.calculatedCogs * qty;

        subtotal += lineTotal;
        totalCogs += lineCogs;

        // 1. Deduct Product stock
        const updatedProd = await tx.product.update({
          where: { id: prod.id },
          data: {
            currentStock: { decrement: qty },
          },
        });

        // Record stock movement for product
        await tx.stockMovement.create({
          data: {
            productId: prod.id,
            type: "POS_SALE",
            quantityChange: -qty,
            balanceAfter: updatedProd.currentStock,
            unitCost: prod.calculatedCogs,
            notes: `POS Sale to ${customerName}`,
          },
        });

        // 2. Deduct BOM Ingredients for POS direct sale
        if (prod.trackBom && prod.bomItems.length > 0) {
          for (const bomItem of prod.bomItems) {
            const ingQty = Number((bomItem.quantityRequired * qty).toFixed(3));
            const updatedIng = await tx.ingredient.update({
              where: { id: bomItem.ingredientId },
              data: {
                currentStock: { decrement: ingQty },
              },
            });

            bomDeductionsLog.push(`${bomItem.ingredient.name}: -${ingQty}${bomItem.ingredient.unit}`);

            await tx.stockMovement.create({
              data: {
                ingredientId: bomItem.ingredientId,
                type: "ORDER_PROCESSING_BOM",
                quantityChange: -ingQty,
                balanceAfter: updatedIng.currentStock,
                unitCost: bomItem.ingredient.unitCost,
                notes: `POS BOM deduction for ${prod.name} x${qty}`,
              },
            });
          }
        }

        orderItemsData.push({
          productId: prod.id,
          productName: prod.name,
          sku: prod.sku,
          barcode: prod.barcode,
          quantity: qty,
          unitPrice: prod.sellingPrice,
          unitCogs: prod.calculatedCogs,
          totalPrice: lineTotal,
        });
      }

      const totalAmount = Math.max(0, subtotal - discountAmount);
      const count = await tx.order.count();
      const orderNumber = `#POS-${1100 + count}`;
      const barcode = orderNumber.replace("#", "").replace("-", "");

      // 3. Create Order
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          barcode,
          customerName,
          customerPhone: customerPhone || "Walk-in",
          shippingAddress: "POS Counter Pickup",
          source: "POS_TERMINAL",
          status: "DELIVERED",
          paymentMethod: paymentMethod as any,
          paymentStatus: "PAID",
          subtotal,
          discountAmount,
          totalAmount,
          totalCogs,
          bomDeducted: true,
          bomDeductedAt: new Date(),
          items: {
            create: orderItemsData,
          },
          statusHistory: {
            create: {
              status: "DELIVERED",
              note: `POS Counter checkout paid via ${paymentMethod}`,
            },
          },
        },
        include: {
          items: true,
        },
      });

      // 4. Create Financial Transaction (Income)
      await tx.cashFlowTransaction.create({
        data: {
          transactionCode: `TXN-POS-${Date.now().toString().slice(-6)}`,
          type: "INCOME",
          category: "POS_SALE",
          amount: totalAmount,
          description: `POS Sale ${orderNumber} (${customerName})`,
          paymentMethod,
          referenceOrderId: newOrder.id,
        },
      });

      // 5. Create Financial Transaction (COGS)
      if (totalCogs > 0) {
        await tx.cashFlowTransaction.create({
          data: {
            transactionCode: `TXN-COGS-${Date.now().toString().slice(-6)}`,
            type: "COGS_RECOGNITION",
            category: "BOM_INGREDIENT_DEDUCTION",
            amount: totalCogs,
            description: `Auto BOM Cost Recognition for ${orderNumber} (${bomDeductionsLog.join(", ")})`,
            paymentMethod: "SYSTEM_LEDGER",
            referenceOrderId: newOrder.id,
          },
        });
      }

      return {
        order: newOrder,
        bomDeductionsLog,
        orderItemsData,
        totalAmount,
        orderNumber,
      };
    });

    // Broadcast stock updates
    await broadcastRealtimeEvent(CHANNELS.STOCK_SYNC, "pos-checkout-completed", {
      orderNumber: result.orderNumber,
    });

    // Send WhatsApp receipt if valid phone is provided
    if (customerPhone && customerPhone.length >= 9) {
      const itemsText = result.orderItemsData
        .map((i) => `• ${i.productName} x${i.quantity} = LKR ${i.totalPrice.toLocaleString()}`)
        .join("\n");
      await sendWhatsAppMessage({
        toPhone: customerPhone,
        text: `🧾 *TrueHive Official POS E-Receipt (${result.orderNumber})*\nCustomer: ${customerName}\n\n${itemsText}\n\n*Total Paid: LKR ${result.totalAmount.toLocaleString()}* (${paymentMethod})\nThank you for choosing TrueHive!`,
      });
    }

    // Send email receipt if email provided
    if (customerEmail) {
      await sendInvoiceEmail({
        to: customerEmail,
        customerName,
        orderNumber: result.orderNumber,
        totalAmount: result.totalAmount,
        items: result.orderItemsData.map((i) => ({
          name: i.productName,
          quantity: i.quantity,
          total: i.totalPrice,
        })),
      });
    }

    return NextResponse.json({
      success: true,
      order: result.order,
      bomDeductionsLog: result.bomDeductionsLog,
    });
  } catch (error) {
    console.error("[POS Checkout Error]:", error);
    return NextResponse.json({ error: "POS Checkout transaction failed in database" }, { status: 500 });
  }
}
