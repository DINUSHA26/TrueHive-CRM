import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { broadcastRealtimeEvent, CHANNELS } from "@/lib/pusher";
import { updateLiveStockCache } from "@/lib/redis";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const categoryId = searchParams.get("categoryId");
    const status = searchParams.get("status");

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { sku: { contains: search, mode: "insensitive" } },
        { barcode: { contains: search, mode: "insensitive" } },
      ];
    }
    if (categoryId && categoryId !== "all") {
      where.categoryId = categoryId;
    }
    if (status === "active") {
      where.isActive = true;
    } else if (status === "inactive") {
      where.isActive = false;
    }

    const [products, totalCount, activeCount, lowStockCount] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: true,
          variants: {
            orderBy: { createdAt: "asc" },
          },
          bomItems: {
            include: { ingredient: true },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.product.count(),
      prisma.product.count({ where: { isActive: true } }),
      prisma.product.count({
        where: {
          isActive: true,
          currentStock: { lte: 5 },
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      products,
      stats: {
        totalProducts: totalCount,
        activeProducts: activeCount,
        lowStockProducts: lowStockCount,
      },
    });
  } catch (error) {
    console.error("[Products API GET Error]:", error);
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name,
      categoryId,
      description,
      sku,
      barcode,
      sellingPrice,
      discountPrice,
      currentStock,
      reorderLevel,
      unit,
      images,
      variants,
    } = body;

    if (!name || typeof name !== "string") {
      return NextResponse.json({ error: "Product name is required" }, { status: 400 });
    }

    const finalBarcode =
      barcode && String(barcode).trim()
        ? String(barcode).trim()
        : `4792026${Math.floor(10000 + Math.random() * 90000)}`;

    const finalSku =
      sku && String(sku).trim()
        ? String(sku).trim().toUpperCase()
        : `TH-PRD-${Math.floor(1000 + Math.random() * 9000)}`;

    let baseSlug = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");
    if (!baseSlug) baseSlug = "product";
    let slug = baseSlug;
    let counter = 1;
    while (await prisma.product.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    const initialStock = Number(currentStock || 0);
    const primaryImage = Array.isArray(images) && images.length > 0 ? (images[0]?.url || images[0]) : null;

    // Transaction to create product + variants
    const product = await prisma.$transaction(async (tx) => {
      const createdProd = await tx.product.create({
        data: {
          name: name.trim(),
          slug,
          sku: finalSku,
          barcode: finalBarcode,
          categoryId: categoryId || null,
          description: description ? String(description).trim() : null,
          imageUrl: primaryImage,
          images: Array.isArray(images) ? images : [],
          sellingPrice: Number(sellingPrice || 0),
          discountPrice: discountPrice ? Number(discountPrice) : null,
          currentStock: initialStock,
          reorderLevel: Number(reorderLevel || 5),
          unit: String(unit || "pcs"),
          isActive: true,
        },
      });

      // Create variants if provided
      if (Array.isArray(variants) && variants.length > 0) {
        for (let i = 0; i < variants.length; i++) {
          const v = variants[i];
          const vSku = v.sku && v.sku.trim() ? v.sku.trim().toUpperCase() : `${finalSku}-V${i + 1}`;
          const vBarcode = v.barcode && v.barcode.trim() ? v.barcode.trim() : `${finalBarcode}${i + 1}`;
          const vPrice = Number(v.sellingPrice ?? createdProd.sellingPrice);
          const vStock = Number(v.currentStock ?? 0);

          await tx.productVariant.create({
            data: {
              productId: createdProd.id,
              name: String(v.name || "Variant"),
              value: v.value ? String(v.value) : null,
              sku: vSku,
              barcode: vBarcode,
              sellingPrice: vPrice,
              priceAdjustment: v.priceAdjustment ? Number(v.priceAdjustment) : 0,
              currentStock: vStock,
              image: v.image || null,
            },
          });
        }
      }

      return createdProd;
    });

    // Update Redis live stock cache and Pusher event
    await updateLiveStockCache(product.sku, product.currentStock);
    await broadcastRealtimeEvent(CHANNELS.STOCK_SYNC, "stock-updated", {
      sku: product.sku,
      newStock: product.currentStock,
    });

    const fullProduct = await prisma.product.findUnique({
      where: { id: product.id },
      include: {
        category: true,
        variants: true,
      },
    });

    return NextResponse.json({ success: true, product: fullProduct });
  } catch (error: any) {
    console.error("[Products API POST Error]:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to create product" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, stockChange, newStock, reason } = body;

    if (!id) {
      return NextResponse.json({ error: "Product ID is required" }, { status: 400 });
    }

    // 1. Quick stock update
    if (stockChange !== undefined || newStock !== undefined) {
      const prod = await prisma.product.findUnique({ where: { id } });
      if (!prod) return NextResponse.json({ error: "Product not found" }, { status: 404 });

      const finalStock =
        newStock !== undefined
          ? Math.max(0, Number(newStock))
          : Math.max(0, prod.currentStock + Number(stockChange));

      const qtyDelta = finalStock - prod.currentStock;

      const updated = await prisma.$transaction(async (tx) => {
        const p = await tx.product.update({
          where: { id },
          data: { currentStock: finalStock },
          include: { category: true, variants: true },
        });

        if (qtyDelta !== 0) {
          await tx.stockMovement.create({
            data: {
              productId: p.id,
              type: qtyDelta > 0 ? "PURCHASE_GRN" : "WASTAGE",
              quantityChange: qtyDelta,
              balanceAfter: finalStock,
              unitCost: p.calculatedCogs || 0,
              notes: reason || "Manual stock adjustment from Product Catalog",
            },
          });
        }

        return p;
      });

      await updateLiveStockCache(updated.sku, updated.currentStock);
      await broadcastRealtimeEvent(CHANNELS.STOCK_SYNC, "stock-updated", {
        sku: updated.sku,
        newStock: updated.currentStock,
      });

      return NextResponse.json({ success: true, product: updated });
    }

    // 2. Full product update
    const {
      name,
      categoryId,
      description,
      sku,
      barcode,
      sellingPrice,
      discountPrice,
      currentStock,
      reorderLevel,
      unit,
      images,
      isActive,
      variants,
    } = body;

    const updated = await prisma.$transaction(async (tx) => {
      const p = await tx.product.update({
        where: { id },
        data: {
          ...(name ? { name: name.trim() } : {}),
          ...(categoryId !== undefined ? { categoryId: categoryId || null } : {}),
          ...(description !== undefined ? { description: description?.trim() || null } : {}),
          ...(sku ? { sku: sku.trim().toUpperCase() } : {}),
          ...(barcode ? { barcode: barcode.trim() } : {}),
          ...(sellingPrice !== undefined ? { sellingPrice: Number(sellingPrice) } : {}),
          ...(discountPrice !== undefined ? { discountPrice: discountPrice ? Number(discountPrice) : null } : {}),
          ...(currentStock !== undefined ? { currentStock: Math.max(0, Number(currentStock)) } : {}),
          ...(reorderLevel !== undefined ? { reorderLevel: Number(reorderLevel) } : {}),
          ...(unit ? { unit: String(unit) } : {}),
          ...(images ? { images, imageUrl: images[0]?.url || images[0] || null } : {}),
          ...(isActive !== undefined ? { isActive: Boolean(isActive) } : {}),
        },
      });

      // Sync variants if array provided
      if (Array.isArray(variants)) {
        // Delete existing and re-create for clean state
        await tx.productVariant.deleteMany({ where: { productId: id } });
        for (let i = 0; i < variants.length; i++) {
          const v = variants[i];
          const vSku = v.sku && v.sku.trim() ? v.sku.trim().toUpperCase() : `${p.sku}-V${i + 1}`;
          const vBarcode = v.barcode && v.barcode.trim() ? v.barcode.trim() : `${p.barcode}${i + 1}`;
          await tx.productVariant.create({
            data: {
              productId: p.id,
              name: String(v.name || "Variant"),
              value: v.value ? String(v.value) : null,
              sku: vSku,
              barcode: vBarcode,
              sellingPrice: Number(v.sellingPrice ?? p.sellingPrice),
              priceAdjustment: Number(v.priceAdjustment || 0),
              currentStock: Number(v.currentStock || 0),
              image: v.image || null,
            },
          });
        }
      }

      return p;
    });

    await updateLiveStockCache(updated.sku, updated.currentStock);
    await broadcastRealtimeEvent(CHANNELS.STOCK_SYNC, "stock-updated", {
      sku: updated.sku,
      newStock: updated.currentStock,
    });

    const fullProduct = await prisma.product.findUnique({
      where: { id: updated.id },
      include: {
        category: true,
        variants: true,
      },
    });

    return NextResponse.json({ success: true, product: fullProduct });
  } catch (error: any) {
    console.error("[Products API PATCH Error]:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to update product" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Product ID is required" }, { status: 400 });
    }

    // Soft delete / deactivate
    const updated = await prisma.product.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({ success: true, message: "Product deactivated", product: updated });
  } catch (error) {
    console.error("[Products API DELETE Error]:", error);
    return NextResponse.json({ error: "Failed to delete product" }, { status: 500 });
  }
}

