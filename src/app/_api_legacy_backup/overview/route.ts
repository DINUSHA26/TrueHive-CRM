import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const [
      totalOrders,
      ordersAggregate,
      pendingOrdersCount,
      totalProducts,
      productsWithLowStock,
      totalCustomers,
      totalLeads,
      chatRooms,
      recentOrders,
      topProducts,
    ] = await Promise.all([
      prisma.order.count(),
      prisma.order.aggregate({
        _sum: { totalAmount: true, totalCogs: true },
        _avg: { totalAmount: true },
      }),
      prisma.order.count({ where: { status: "PENDING" } }),
      prisma.product.count(),
      prisma.product.findMany({
        where: {
          currentStock: {
            lte: 10,
          },
        },
        select: { id: true },
      }),
      prisma.customer.count(),
      prisma.lead.count(),
      prisma.chatRoom.findMany({
        select: { unreadCount: true, isAiActive: true },
      }),
      prisma.order.findMany({
        take: 6,
        orderBy: { createdAt: "desc" },
        include: { items: true },
      }),
      prisma.product.findMany({
        take: 5,
        orderBy: { currentStock: "asc" },
      }),
    ]);

    const totalRevenue = ordersAggregate._sum.totalAmount || 0;
    const totalCogs = ordersAggregate._sum.totalCogs || 0;
    const avgOrder = ordersAggregate._avg.totalAmount || 0;
    const unreadChats = chatRooms.reduce((acc, c) => acc + (c.unreadCount || 0), 0);
    const escalatedChats = chatRooms.filter((c) => !c.isAiActive).length;

    return NextResponse.json({
      success: true,
      stats: {
        totalRevenue,
        totalCogs,
        totalOrders,
        pendingOrdersCount,
        avgOrder: Math.round(avgOrder),
        totalProducts,
        lowStockCount: productsWithLowStock.length,
        totalCustomers,
        totalLeads,
        unreadChats,
        escalatedChats,
      },
      recentOrders,
      topProducts,
    });
  } catch (error) {
    console.error("[Overview API Error]:", error);
    return NextResponse.json(
      { error: "Failed to fetch overview metrics from database" },
      { status: 500 }
    );
  }
}

