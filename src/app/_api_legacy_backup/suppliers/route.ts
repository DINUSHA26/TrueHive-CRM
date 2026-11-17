import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const [suppliers, purchaseOrders, ingredients] = await Promise.all([
      prisma.supplier.findMany({
        where: { isActive: true },
        include: {
          ingredients: true,
          purchaseOrders: {
            orderBy: { createdAt: "desc" },
            take: 5,
          },
        },
        orderBy: { name: "asc" },
      }),
      prisma.purchaseOrder.findMany({
        include: {
          supplier: true,
          items: {
            include: { ingredient: true },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.ingredient.findMany({
        where: { isActive: true },
        select: { id: true, name: true, unit: true, unitCost: true, currentStock: true },
      }),
    ]);

    return NextResponse.json({
      success: true,
      suppliers,
      purchaseOrders,
      ingredients,
    });
  } catch (error) {
    console.error("[Suppliers GET Error]:", error);
    return NextResponse.json({ error: "Failed to fetch suppliers from database" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // 1. CREATE SUPPLIER
    if (body.action === "CREATE_SUPPLIER") {
      const supplier = await prisma.supplier.create({
        data: {
          name: String(body.name),
          contactPerson: body.contactPerson || null,
          phone: String(body.phone),
          email: body.email || null,
          address: body.address || null,
          creditBalance: Number(body.creditBalance || 0),
        },
      });

      return NextResponse.json({ success: true, supplier });
    }

    // 2. CREATE PURCHASE ORDER
    if (body.action === "CREATE_PO") {
      const { supplierId, ingredientId, quantity, unitCost } = body;
      const count = await prisma.purchaseOrder.count();
      const poNumber = `PO-2026-${String(40 + count).padStart(3, "0")}`;

      const ing = await prisma.ingredient.findUnique({ where: { id: ingredientId } });
      const qty = Number(quantity || 10);
      const cost = Number(unitCost || (ing ? ing.unitCost : 0));
      const totalAmount = qty * cost;

      const po = await prisma.$transaction(async (tx) => {
        // Increase supplier credit balance
        await tx.supplier.update({
          where: { id: supplierId },
          data: { creditBalance: { increment: totalAmount } },
        });

        return tx.purchaseOrder.create({
          data: {
            poNumber,
            supplierId,
            status: "SENT",
            totalAmount,
            items: {
              create: [
                {
                  ingredientId,
                  itemName: ing ? ing.name : "Raw Material",
                  quantityOrdered: qty,
                  unitCost: cost,
                  totalCost: totalAmount,
                },
              ],
            },
          },
          include: {
            supplier: true,
            items: true,
          },
        });
      });

      return NextResponse.json({ success: true, purchaseOrder: po });
    }

    // 3. RECEIVE PO AS GRN
    if (body.action === "RECEIVE_PO_GRN") {
      const { poId } = body;

      const po = await prisma.purchaseOrder.findUnique({
        where: { id: poId },
        include: { items: true },
      });

      if (!po) return NextResponse.json({ error: "PO not found" }, { status: 404 });

      await prisma.$transaction(async (tx) => {
        for (const item of po.items) {
          if (item.ingredientId) {
            const ing = await tx.ingredient.update({
              where: { id: item.ingredientId },
              data: {
                currentStock: { increment: item.quantityOrdered },
                unitCost: item.unitCost,
              },
            });

            await tx.stockMovement.create({
              data: {
                ingredientId: item.ingredientId,
                type: "PURCHASE_GRN",
                quantityChange: item.quantityOrdered,
                balanceAfter: ing.currentStock,
                unitCost: item.unitCost,
                referenceId: po.poNumber,
                notes: `GRN received for ${po.poNumber}`,
              },
            });
          }
        }

        await tx.purchaseOrder.update({
          where: { id: po.id },
          data: {
            status: "COMPLETED",
            receivedAt: new Date(),
          },
        });
      });

      const updated = await prisma.purchaseOrder.findUnique({
        where: { id: po.id },
        include: { supplier: true, items: true },
      });

      return NextResponse.json({ success: true, purchaseOrder: updated });
    }

    // 4. PAY SUPPLIER
    if (body.action === "PAY_SUPPLIER") {
      const { supplierId, amount } = body;
      const payAmount = Number(amount || 0);

      const supplier = await prisma.supplier.findUnique({ where: { id: supplierId } });
      if (!supplier) return NextResponse.json({ error: "Supplier not found" }, { status: 404 });

      await prisma.$transaction(async (tx) => {
        await tx.supplier.update({
          where: { id: supplierId },
          data: { creditBalance: { decrement: payAmount } },
        });

        await tx.cashFlowTransaction.create({
          data: {
            transactionCode: `TXN-SUP-${Date.now().toString().slice(-6)}`,
            type: "SUPPLIER_PAYMENT",
            category: "SUPPLIER_CREDIT_SETTLEMENT",
            amount: payAmount,
            description: `Settled Supplier Payable to ${supplier.name}`,
            paymentMethod: "BANK_TRANSFER",
          },
        });
      });

      const updated = await prisma.supplier.findUnique({ where: { id: supplierId } });
      return NextResponse.json({ success: true, supplier: updated });
    }

    return NextResponse.json({ error: "Unknown supplier action" }, { status: 400 });
  } catch (error) {
    console.error("[Suppliers POST Error]:", error);
    return NextResponse.json({ error: "Failed to process supplier request in database" }, { status: 500 });
  }
}
