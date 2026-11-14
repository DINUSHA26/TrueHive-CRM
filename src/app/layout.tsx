import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TrueHive CRM & ERP | AI WhatsApp Automation, POS, BOM & Live Reporting",
  description:
    "Single-Business AI WhatsApp Cloud API CRM, Live POS with Barcode Scanner, BOM Ingredient Costing, Cash Flow & Live Google Docs Sync.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#0b0f19] text-slate-100 antialiased selection:bg-emerald-500/30">
        {children}
      </body>
    </html>
  );
}
