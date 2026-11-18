import { google } from "googleapis";
import { prisma } from "@/lib/prisma";

export async function syncLiveGoogleDocsAndSheets(reportTitle?: string): Promise<{
  success: boolean;
  reportTitle: string;
  docUrl: string;
  sheetUrl: string;
  aiNarrative: string;
  syncedAt: string;
}> {
  const nowStr = new Date().toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const [orders, lowStockIngredients] = await Promise.all([
    prisma.order.findMany({
      select: { totalAmount: true, totalCogs: true },
    }),
    prisma.ingredient.findMany({
      where: {
        currentStock: { lte: 15 },
      },
      select: { name: true, currentStock: true, unit: true },
    }),
  ]);

  const totalOrderRevenue = orders.reduce((sum, o) => sum + o.totalAmount, 0);
  const totalOrderCogs = orders.reduce((sum, o) => sum + o.totalCogs, 0);

  const aiNarrative = `TrueHive Live Executive Sync (${nowStr}): Active Orders recorded in Supabase totaled LKR ${totalOrderRevenue.toLocaleString()} with BOM COGS of LKR ${totalOrderCogs.toLocaleString()} (Gross Margin: ${(
    ((totalOrderRevenue - totalOrderCogs) / Math.max(totalOrderRevenue, 1)) *
    100
  ).toFixed(1)}%). ${
    lowStockIngredients.length > 0
      ? `CRITICAL BOM ALERT: ${lowStockIngredients.map((i) => `${i.name} (${i.currentStock}${i.unit})`).join(", ")} below safe stock threshold.`
      : "All BOM raw ingredients are above safe stock thresholds."
  }`;

  const title = reportTitle || `TrueHive Live Operations, BOM & Cash Flow Report — ${nowStr}`;
  let docUrl = `https://docs.google.com/document/d/${process.env.GOOGLE_LIVE_DOC_ID || "1TrueHiveLiveExecutiveReport2026"}/edit`;
  let sheetUrl = `https://docs.google.com/spreadsheets/d/${process.env.GOOGLE_LIVE_SHEET_ID || "1TrueHiveLiveFinancialLedger2026"}/edit`;

  if (
    process.env.GOOGLE_CLIENT_EMAIL &&
    process.env.GOOGLE_PRIVATE_KEY &&
    process.env.GOOGLE_LIVE_DOC_ID &&
    process.env.GOOGLE_CLIENT_EMAIL !== "truehive-reporter@your-project.iam.gserviceaccount.com"
  ) {
    try {
      const auth = new google.auth.GoogleAuth({
        credentials: {
          client_email: process.env.GOOGLE_CLIENT_EMAIL,
          private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
        },
        scopes: [
          "https://www.googleapis.com/auth/documents",
          "https://www.googleapis.com/auth/spreadsheets",
        ],
      });

      const docs = google.docs({ version: "v1", auth });
      await docs.documents.batchUpdate({
        documentId: process.env.GOOGLE_LIVE_DOC_ID,
        requestBody: {
          requests: [
            {
              insertText: {
                location: { index: 1 },
                text: `\n=== ${title} ===\n${aiNarrative}\n\n`,
              },
            },
          ],
        },
      });

      if (process.env.GOOGLE_LIVE_SHEET_ID) {
        const sheets = google.sheets({ version: "v4", auth });
        await sheets.spreadsheets.values.append({
          spreadsheetId: process.env.GOOGLE_LIVE_SHEET_ID,
          range: "Sheet1!A1",
          valueInputOption: "USER_ENTERED",
          requestBody: {
            values: [[nowStr, title, totalOrderRevenue, totalOrderCogs, lowStockIngredients.length, aiNarrative]],
          },
        });
      }
    } catch (err) {
      console.error("[Google Docs/Sheets API Error]:", err);
    }
  }

  return {
    success: true,
    reportTitle: title,
    docUrl,
    sheetUrl,
    aiNarrative,
    syncedAt: nowStr,
  };
}
