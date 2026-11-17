import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { syncLiveGoogleDocsAndSheets } from "@/lib/google-docs/live-sync";

export async function GET() {
  try {
    const [cashflow, accounts, googleSyncHistory] = await Promise.all([
      prisma.cashFlowTransaction.findMany({
        orderBy: { transactionDate: "desc" },
        take: 50,
      }),
      prisma.financialAccount.findMany({
        orderBy: { name: "asc" },
      }),
      prisma.googleReportSync.findMany({
        orderBy: { lastSyncedAt: "desc" },
        take: 10,
      }),
    ]);

    // Calculate real inflows, cogs and expenses
    const totalInflows = cashflow
      .filter((c) => c.type === "INCOME")
      .reduce((sum, c) => sum + c.amount, 0);

    const totalCogs = cashflow
      .filter((c) => c.type === "COGS_RECOGNITION")
      .reduce((sum, c) => sum + c.amount, 0);

    const totalExpenses = cashflow
      .filter((c) => c.type !== "INCOME" && c.type !== "COGS_RECOGNITION")
      .reduce((sum, c) => sum + c.amount, 0);

    return NextResponse.json({
      success: true,
      cashflow,
      accounts,
      googleSyncHistory,
      summary: {
        totalInflows,
        totalCogs,
        totalExpenses,
        netCash: totalInflows - totalCogs - totalExpenses,
      },
    });
  } catch (error) {
    console.error("[Finance GET Error]:", error);
    return NextResponse.json({ error: "Failed to fetch financial data from database" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (body.action === "ADD_TRANSACTION") {
      const { type, category, amount, description, paymentMethod, accountId } = body;

      const transaction = await prisma.cashFlowTransaction.create({
        data: {
          transactionCode: `TXN-${Date.now().toString().slice(-6)}`,
          type: type as any,
          category: String(category || "GENERAL"),
          amount: Number(amount || 0),
          description: String(description || "Manual transaction"),
          paymentMethod: String(paymentMethod || "CASH"),
          accountId: accountId || undefined,
        },
      });

      return NextResponse.json({ success: true, transaction });
    }

    if (body.action === "SYNC_GOOGLE_DOCS") {
      const syncResult = await syncLiveGoogleDocsAndSheets(body.reportTitle);

      const record = await prisma.googleReportSync.create({
        data: {
          reportTitle: syncResult.reportTitle,
          reportType: "DAILY_SUMMARY",
          googleDocId: process.env.GOOGLE_LIVE_DOC_ID || "1TrueHiveLiveExecutiveReport2026",
          googleSheetId: process.env.GOOGLE_LIVE_SHEET_ID || "1TrueHiveLiveFinancialLedger2026",
          docUrl: syncResult.docUrl,
          sheetUrl: syncResult.sheetUrl,
          aiNarrative: syncResult.aiNarrative,
          syncStatus: "SUCCESS",
        },
      });

      return NextResponse.json({
        success: true,
        syncResult,
        record,
      });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    console.error("[Finance POST Error]:", error);
    return NextResponse.json({ error: "Failed to process finance request in database" }, { status: 500 });
  }
}
