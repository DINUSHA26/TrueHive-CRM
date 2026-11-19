import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const date = searchParams.get("date");
    const month = searchParams.get("month");
    const fromDate = searchParams.get("fromDate");
    const toDate = searchParams.get("toDate");
    const status = searchParams.get("status");

    const where: any = {};
    if (search) {
      where.OR = [
        { invoiceNumber: { contains: search, mode: "insensitive" } },
        { customerName: { contains: search, mode: "insensitive" } },
        { customerPhone: { contains: search, mode: "insensitive" } },
      ];
    }
    if (status && status !== "ALL") {
      where.status = status;
    }
    if (date) {
      const d = new Date(date);
      const nextD = new Date(d);
      nextD.setDate(nextD.getDate() + 1);
      where.issuedAt = { gte: d, lt: nextD };
    } else if (month) {
      const [year, m] = month.split("-").map(Number);
      const start = new Date(year, m - 1, 1);
      const end = new Date(year, m, 1);
      where.issuedAt = { gte: start, lt: end };
    } else if (fromDate || toDate) {
      where.issuedAt = {};
      if (fromDate) where.issuedAt.gte = new Date(fromDate);
      if (toDate) {
        const t = new Date(toDate);
        t.setDate(t.getDate() + 1);
        where.issuedAt.lt = t;
      }
    }

    const invoices = await prisma.invoice.findMany({
      where,
      include: {
        items: true,
        customer: true,
      },
      orderBy: { issuedAt: "desc" },
    });

    return NextResponse.json(invoices);
  } catch (error) {
    console.error("[Invoices API GET Error]:", error);
    return NextResponse.json({ error: "Failed to fetch invoices" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      customerName,
      customerPhone,
      customerEmail,
      billingAddress,
      type = "STANDARD",
      paymentMethod = "CASH",
      items = [],
      deliveryFee = 0,
      paidAmount = 0,
    } = body;

    if (!customerName || !items || items.length === 0) {
      return NextResponse.json(
        { error: "Customer name and at least one item required" },
        { status: 400 }
      );
    }

    const randomSuffix = Math.floor(100000 + Math.random() * 900000);
    const invoiceNumber = `INV-${randomSuffix}`;

    let subtotal = 0;
    let totalDiscount = 0;
    const lineItems = items.map((it: any) => {
      const qty = Number(it.quantity) || 1;
      const price = Number(it.unitPrice) || 0;
      const disc = Number(it.discount) || 0;
      const lineTotal = Math.max(0, qty * price - disc);
      subtotal += qty * price;
      totalDiscount += disc;
      return {
        description: it.description,
        unit: it.unit || "Pcs",
        quantity: qty,
        unitPrice: price,
        discount: disc,
        totalPrice: lineTotal,
      };
    });

    const totalAmount = Math.max(0, subtotal - totalDiscount + Number(deliveryFee));
    const paid = Number(paidAmount) || 0;
    const balance = Math.max(0, totalAmount - paid);
    const status = balance <= 0 ? "PAID" : paid > 0 ? "PARTIAL" : "UNPAID";

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        type: type as any,
        status: status as any,
        customerName,
        customerPhone,
        customerEmail,
        billingAddress,
        currency: "LKR",
        subtotal,
        discountAmount: totalDiscount,
        deliveryFee: Number(deliveryFee),
        totalAmount,
        paidAmount: paid,
        creditBilled: balance,
        balance,
        returnValue: 0,
        paymentMethod,
        items: {
          create: lineItems,
        },
      },
      include: {
        items: true,
      },
    });

    return NextResponse.json({ success: true, invoice });
  } catch (error: any) {
    console.error("[Invoices API POST Error]:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to create invoice" },
      { status: 500 }
    );
  }
}
