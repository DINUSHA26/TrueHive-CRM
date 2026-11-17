import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status");

    // Fetch categories with children and product count
    const categories = await prisma.category.findMany({
      where: {
        parentId: null, // Root categories
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: "insensitive" } },
                { description: { contains: search, mode: "insensitive" } },
              ],
            }
          : {}),
        ...(status === "active" ? { isActive: true } : status === "inactive" ? { isActive: false } : {}),
      },
      include: {
        children: {
          include: {
            _count: {
              select: { products: true },
            },
          },
          orderBy: { sortOrder: "asc" },
        },
        _count: {
          select: { products: true },
        },
      },
      orderBy: { sortOrder: "asc" },
    });

    // Also get all flat categories for selectors and stats
    const [allCount, rootCount, activeCount, productCount] = await Promise.all([
      prisma.category.count(),
      prisma.category.count({ where: { parentId: null } }),
      prisma.category.count({ where: { isActive: true } }),
      prisma.product.count(),
    ]);

    const flatCategories = await prisma.category.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        slug: true,
        parentId: true,
        isActive: true,
      },
    });

    return NextResponse.json({
      success: true,
      categories,
      flatCategories,
      stats: {
        totalCategories: allCount,
        rootCategories: rootCount,
        activeCategories: activeCount,
        totalProducts: productCount,
      },
    });
  } catch (error) {
    console.error("[Categories API GET Error]:", error);
    return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, description, image, parentId, sortOrder, isActive } = body;

    if (!name || typeof name !== "string") {
      return NextResponse.json({ error: "Category name is required" }, { status: 400 });
    }

    // Generate URL-friendly unique slug
    let baseSlug = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");

    if (!baseSlug) baseSlug = "category";

    let slug = baseSlug;
    let counter = 1;
    while (await prisma.category.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    const category = await prisma.category.create({
      data: {
        name: name.trim(),
        slug,
        description: description ? String(description).trim() : null,
        image: image || null,
        parentId: parentId || null,
        sortOrder: typeof sortOrder === "number" ? sortOrder : 0,
        isActive: isActive !== undefined ? Boolean(isActive) : true,
      },
      include: {
        children: true,
        parent: true,
        _count: { select: { products: true } },
      },
    });

    return NextResponse.json({ success: true, category });
  } catch (error) {
    console.error("[Categories API POST Error]:", error);
    return NextResponse.json({ error: "Failed to create category" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, name, description, image, parentId, sortOrder, isActive } = body;

    if (!id) {
      return NextResponse.json({ error: "Category ID is required" }, { status: 400 });
    }

    const updated = await prisma.category.update({
      where: { id },
      data: {
        ...(name ? { name: name.trim() } : {}),
        ...(description !== undefined ? { description: description?.trim() || null } : {}),
        ...(image !== undefined ? { image: image || null } : {}),
        ...(parentId !== undefined ? { parentId: parentId || null } : {}),
        ...(sortOrder !== undefined ? { sortOrder: Number(sortOrder) } : {}),
        ...(isActive !== undefined ? { isActive: Boolean(isActive) } : {}),
      },
      include: {
        children: true,
        parent: true,
        _count: { select: { products: true } },
      },
    });

    return NextResponse.json({ success: true, category: updated });
  } catch (error) {
    console.error("[Categories API PATCH Error]:", error);
    return NextResponse.json({ error: "Failed to update category" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Category ID is required" }, { status: 400 });
    }

    // Check if category has products
    const productCount = await prisma.product.count({ where: { categoryId: id } });
    if (productCount > 0) {
      return NextResponse.json(
        { error: `Cannot delete category: ${productCount} products are assigned to it.` },
        { status: 400 }
      );
    }

    await prisma.category.delete({ where: { id } });
    return NextResponse.json({ success: true, message: "Category deleted successfully" });
  } catch (error) {
    console.error("[Categories API DELETE Error]:", error);
    return NextResponse.json({ error: "Failed to delete category" }, { status: 500 });
  }
}

