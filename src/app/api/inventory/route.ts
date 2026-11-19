import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { broadcastRealtimeEvent, CHANNELS } from "@/lib/pusher";
import { updateLiveStockCache } from "@/lib/redis";

export async function GET() {
  try {
    const [products, ingredients, suppliers, categories] = await Promise.all([
      prisma.product.findMany({
        where: { isActive: true },
        include: {
          category: true,
          variants: true,
          bomItems: {
            include: {
              ingredient: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.ingredient.findMany({
        where: { isActive: true },
        include: {
          supplier: true,
        },
        orderBy: { currentStock: "asc" },
      }),
      prisma.supplier.findMany({
        where: { isActive: true },
        orderBy: { name: "asc" },
      }),
      prisma.category.findMany({
        orderBy: { name: "asc" },
      }),
    ]);

    return NextResponse.json({
      success: true,
      products,
      ingredients,
      suppliers,
      categories,
    });
  } catch (error) {
    console.error("[Inventory GET Error]:", error);
    return NextResponse.json({ error: "Failed to fetch inventory from database" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // 1. CREATE PRODUCT
    if (body.action === "CREATE_PRODUCT") {
      const barcode = body.barcode || `4792026${Math.floor(10000 + Math.random() * 90000)}`;
      const sku = body.sku || `TH-PRD-${Math.floor(100 + Math.random() * 900)}`;
      const slug = (body.name || "prod")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "") + `-${Date.now().toString().slice(-4)}`;

      const bomItemsInput: { ingredientId: string; quantityRequired: number }[] = Array.isArray(body.bom)
        ? body.bom
        : [];

      // Calculate initial COGS
      let calculatedCogs = Number(body.calculatedCogs || 0);
      if (bomItemsInput.length > 0) {
        const ingIds = bomItemsInput.map((b) => b.ingredientId);
        const ings = await prisma.ingredient.findMany({
          where: { id: { in: ingIds } },
        });
        calculatedCogs = bomItemsInput.reduce((acc, b) => {
          const match = ings.find((i) => i.id === b.ingredientId);
          return acc + (match ? match.unitCost * b.quantityRequired : 0);
        }, 0);
      }

      const product = await prisma.product.create({
        data: {
          name: String(body.name),
          slug,
          sku,
          barcode,
          sellingPrice: Number(body.sellingPrice || 0),
          calculatedCogs: Math.round(calculatedCogs),
          currentStock: Number(body.currentStock || 0),
          reorderLevel: Number(body.reorderLevel || 5),
          unit: String(body.unit || "pcs"),
          trackBom: Boolean(body.trackBom ?? true),
          categoryId: body.categoryId || undefined,
          bomItems: {
            create: bomItemsInput.map((b) => ({
              ingredientId: b.ingredientId,
              quantityRequired: Number(b.quantityRequired || 0.1),
            })),
          },
        },
        include: {
          bomItems: {
            include: { ingredient: true },
          },
          category: true,
        },
      });

      await updateLiveStockCache(product.sku, product.currentStock);
      await broadcastRealtimeEvent(CHANNELS.STOCK_SYNC, "product-created", { product });

      return NextResponse.json({ success: true, product });
    }

    // 2. RESTOCK INGREDIENT (GRN)
    if (body.action === "RESTOCK_INGREDIENT") {
      const ingId = body.ingredientId;
      const qty = Number(body.quantity || 0);

      const updated = await prisma.ingredient.update({
        where: { id: ingId },
        data: {
          currentStock: { increment: qty },
          unitCost: body.unitCost ? Number(body.unitCost) : undefined,
        },
      });

      await prisma.stockMovement.create({
        data: {
          ingredientId: updated.id,
          type: "PURCHASE_GRN",
          quantityChange: qty,
          balanceAfter: updated.currentStock,
          unitCost: updated.unitCost,
          notes: body.notes || "Manual GRN Restock",
        },
      });

      return NextResponse.json({ success: true, ingredient: updated });
    }

    // 3. RECORD WASTAGE
    if (body.action === "RECORD_WASTAGE") {
      const ingId = body.ingredientId;
      const qty = Number(body.quantity || 0);

      const ing = await prisma.ingredient.findUnique({ where: { id: ingId } });
      if (!ing) return NextResponse.json({ error: "Ingredient not found" }, { status: 404 });

      const updated = await prisma.ingredient.update({
        where: { id: ingId },
        data: {
          currentStock: { decrement: qty },
        },
      });

      const wastageCost = Math.round(qty * ing.unitCost);

      await prisma.stockMovement.create({
        data: {
          ingredientId: ing.id,
          type: "WASTAGE",
          quantityChange: -qty,
          balanceAfter: updated.currentStock,
          unitCost: ing.unitCost,
          notes: body.reason || "Ingredient wastage recorded",
        },
      });

      await prisma.cashFlowTransaction.create({
        data: {
          transactionCode: `TXN-WST-${Date.now().toString().slice(-6)}`,
          type: "EXPENSE",
          category: "INGREDIENT_WASTAGE",
          amount: wastageCost,
          description: `Wastage logged: ${ing.name} (-${qty} ${ing.unit}) - ${body.reason || "Kitchen spillage"}`,
          paymentMethod: "SYSTEM_LEDGER",
        },
      });

      return NextResponse.json({ success: true, ingredient: updated, wastageCost });
    }

    // 4. ADD BOM ITEM
    if (body.action === "ADD_BOM_ITEM") {
      const { productId, ingredientId, quantityRequired } = body;

      const bomItem = await prisma.productIngredientBOM.upsert({
        where: {
          productId_ingredientId: {
            productId,
            ingredientId,
          },
        },
        update: {
          quantityRequired: Number(quantityRequired),
        },
        create: {
          productId,
          ingredientId,
          quantityRequired: Number(quantityRequired),
        },
        include: {
          ingredient: true,
        },
      });

      return NextResponse.json({ success: true, bomItem });
    }

    // 5. CREATE INGREDIENT
    if (body.action === "CREATE_INGREDIENT") {
      const barcode = body.barcode || `890100${Math.floor(1000 + Math.random() * 9000)}`;
      const sku = body.sku || `ING-${Date.now().toString().slice(-4)}`;

      let supplierId = body.supplierId;
      if (!supplierId && body.supplierName) {
        let sup = await prisma.supplier.findFirst({
          where: { name: body.supplierName },
        });
        if (!sup) {
          sup = await prisma.supplier.create({
            data: {
              name: body.supplierName,
              phone: "+94770000000",
            },
          });
        }
        supplierId = sup.id;
      }

      const newIng = await prisma.ingredient.create({
        data: {
          name: String(body.name),
          sku,
          barcode,
          unit: String(body.unit || "kg"),
          currentStock: Number(body.currentStock || 0),
          reorderLevel: Number(body.reorderLevel || 10),
          unitCost: Number(body.unitCost || 0),
          supplierId: supplierId || undefined,
        },
        include: { supplier: true },
      });

      return NextResponse.json({ success: true, ingredient: newIng });
    }

    // 6. UPDATE INGREDIENT
    if (body.action === "UPDATE_INGREDIENT") {
      const ingId = body.id || body.ingredientId;
      if (!ingId) {
        return NextResponse.json({ error: "Ingredient ID is required" }, { status: 400 });
      }

      let supplierId = body.supplierId;
      if (!supplierId && body.supplierName) {
        let sup = await prisma.supplier.findFirst({
          where: { name: body.supplierName },
        });
        if (!sup) {
          sup = await prisma.supplier.create({
            data: {
              name: body.supplierName,
              phone: "+94770000000",
            },
          });
        }
        supplierId = sup.id;
      }

      const existingIng = await prisma.ingredient.findUnique({
        where: { id: ingId },
      });

      if (!existingIng) {
        return NextResponse.json({ error: "Ingredient not found" }, { status: 404 });
      }

      const updated = await prisma.ingredient.update({
        where: { id: ingId },
        data: {
          name: body.name ? String(body.name).trim() : undefined,
          sku: body.sku ? String(body.sku).trim() : undefined,
          barcode: body.barcode ? String(body.barcode).trim() : undefined,
          unit: body.unit ? String(body.unit) : undefined,
          unitCost: body.unitCost !== undefined ? Number(body.unitCost) : undefined,
          currentStock: body.currentStock !== undefined ? Number(body.currentStock) : undefined,
          reorderLevel: body.reorderLevel !== undefined ? Number(body.reorderLevel) : undefined,
          supplierId: supplierId !== undefined ? supplierId : undefined,
        },
        include: { supplier: true },
      });

      return NextResponse.json({ success: true, ingredient: updated });
    }

    // 7. DELETE / DEACTIVATE INGREDIENT
    if (body.action === "DELETE_INGREDIENT") {
      const ingId = body.id || body.ingredientId;
      if (!ingId) {
        return NextResponse.json({ error: "Ingredient ID is required" }, { status: 400 });
      }

      const updated = await prisma.ingredient.update({
        where: { id: ingId },
        data: { isActive: false },
      });

      return NextResponse.json({ success: true, ingredient: updated });
    }

    return NextResponse.json({ error: "Unknown inventory action" }, { status: 400 });
  } catch (error) {
    console.error("[Inventory POST Error]:", error);
    return NextResponse.json({ error: "Failed to process inventory request in database" }, { status: 500 });
  }
}
