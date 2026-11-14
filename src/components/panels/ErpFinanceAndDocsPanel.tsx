"use client";

import React, { useState } from "react";
import { OfficialA4InvoiceModal } from "@/components/OfficialA4InvoiceModal";
import {
  PackageCheck,
  ChefHat,
  Truck,
  Wallet,
  FileSpreadsheet,
  FileText,
  RefreshCw,
  AlertCircle,
  Plus,
  ExternalLink,
  CheckCircle2,
  Flame,
  Landmark,
} from "lucide-react";
import type {
  OrderRecord,
  IngredientItem,
  ProductItem,
  SupplierRecord,
  CashFlowRecord,
} from "@/lib/store";

interface Props {
  activeView: "ORDERS" | "INGREDIENTS_BOM" | "CASHFLOW_REPORTS";
  orders: OrderRecord[];
  ingredients: IngredientItem[];
  products: ProductItem[];
  suppliers: SupplierRecord[];
  cashflow: CashFlowRecord[];
  googleSyncHistory: {
    id: string;
    reportTitle: string;
    docUrl: string;
    sheetUrl: string;
    aiNarrative: string;
    lastSyncedAt: string;
  }[];
  onRefresh: () => void;
}

export function ErpFinanceAndDocsPanel({
  activeView,
  orders,
  ingredients,
  products,
  suppliers,
  cashflow,
  googleSyncHistory,
  onRefresh,
}: Props) {
  const [statusFeedback, setStatusFeedback] = useState<{
    whatsappMessage: string;
    bomDeductions: string[];
  } | null>(null);
  const [selectedA4Order, setSelectedA4Order] = useState<OrderRecord | null>(null);

  // Restock GRN & Wastage state
  const [restockIngId, setRestockIngId] = useState(ingredients[0]?.id || "");
  const [restockQty, setRestockQty] = useState(25);
  const [wastageIngId, setWastageIngId] = useState(ingredients[0]?.id || "");
  const [wastageQty, setWastageQty] = useState(0.5);
  const [wastageReason, setWastageReason] = useState("Production spillage / quality check");

  // BOM Recipe Builder state
  const [bomProdId, setBomProdId] = useState(products[0]?.id || "");
  const [bomIngId, setBomIngId] = useState(ingredients[0]?.id || "");
  const [bomQtyReq, setBomQtyReq] = useState(0.2);

  // New Expense/Transaction state
  const [txType, setTxType] = useState<
    "EXPENSE" | "SUPPLIER_PAYMENT" | "SALARY" | "MARKETING" | "INCOME"
  >("SUPPLIER_PAYMENT");
  const [txCategory, setTxCategory] = useState("RAW_MATERIAL_PO");
  const [txAmount, setTxAmount] = useState(15000);
  const [txDesc, setTxDesc] = useState("");
  const [syncingGoogle, setSyncingGoogle] = useState(false);

  const handleOrderStatusChange = async (orderId: string, newStatus: string) => {
    const res = await fetch("/api/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, newStatus }),
    });
    const data = await res.json();
    if (data.success) {
      setStatusFeedback({
        whatsappMessage: data.whatsappMessageSent,
        bomDeductions: data.bomDeductions || [],
      });
      onRefresh();
    }
  };

  const handleGrnRestock = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch("/api/inventory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "RESTOCK_INGREDIENT",
        ingredientId: restockIngId,
        quantity: restockQty,
      }),
    });
    onRefresh();
  };

  const handleRecordWastage = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch("/api/inventory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "RECORD_WASTAGE",
        ingredientId: wastageIngId,
        quantity: wastageQty,
        reason: wastageReason,
      }),
    });
    onRefresh();
  };

  const handleAddBomRecipeItem = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch("/api/inventory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "ADD_BOM_ITEM",
        productId: bomProdId,
        ingredientId: bomIngId,
        quantityRequired: bomQtyReq,
      }),
    });
    onRefresh();
  };

  const handleAddCashFlow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!txDesc) return;
    await fetch("/api/finance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "ADD_TRANSACTION",
        type: txType,
        category: txCategory,
        amount: txAmount,
        description: txDesc,
      }),
    });
    setTxDesc("");
    onRefresh();
  };

  const handleSyncGoogleDocs = async () => {
    setSyncingGoogle(true);
    try {
      await fetch("/api/finance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "SYNC_GOOGLE_DOCS" }),
      });
      onRefresh();
    } finally {
      setSyncingGoogle(false);
    }
  };

  // 1. ORDERS MANAGEMENT VIEW (BuildStart Style + BOM Deduction on PROCESSING)
  if (activeView === "ORDERS") {
    return (
      <div className="space-y-5">
        <OfficialA4InvoiceModal
          order={selectedA4Order}
          onClose={() => setSelectedA4Order(null)}
        />

        <div className="bg-[#111827] border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <PackageCheck className="w-5 h-5 text-emerald-400" />
              Unified Orders & Automated WhatsApp Status Notifications
            </h2>
            <p className="text-xs text-slate-400">
              Changing an order status automatically sends a WhatsApp Cloud API message. Moving to{" "}
              <strong className="text-emerald-400">PROCESSING</strong> automatically deducts BOM Ingredients!
            </p>
          </div>
        </div>

        {statusFeedback && (
          <div className="p-4 rounded-xl bg-emerald-950/50 border border-emerald-500/50 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-emerald-300 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> WhatsApp Cloud API Notification Dispatched:
              </span>
              <button
                onClick={() => setStatusFeedback(null)}
                className="text-slate-400 hover:text-white"
              >
                Dismiss
              </button>
            </div>
            <p className="text-slate-200 bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
              {statusFeedback.whatsappMessage}
            </p>
            {statusFeedback.bomDeductions.length > 0 && (
              <div className="p-2.5 rounded-lg bg-amber-500/15 border border-amber-500/40 text-amber-300 font-semibold">
                👨‍🍳 BOM Raw Ingredients Auto-Deducted on PROCESSING:{" "}
                {statusFeedback.bomDeductions.join(" • ")}
              </div>
            )}
          </div>
        )}

        <div className="space-y-3">
          {orders.map((ord) => (
            <div
              key={ord.id}
              className="bg-[#111827] border border-slate-800 rounded-xl p-5 flex flex-wrap items-center justify-between gap-4"
            >
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="text-sm font-extrabold text-white">{ord.orderNumber}</span>
                  <span className="text-xs font-semibold text-emerald-400">{ord.customerName}</span>
                  <span className="text-xs font-mono text-slate-400">{ord.customerPhone}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-bold">
                    {ord.source}
                  </span>
                  <span
                    className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold ${
                      ord.bomDeducted
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                        : "bg-amber-500/15 text-amber-300 border border-amber-500/30"
                    }`}
                  >
                    {ord.bomDeducted
                      ? "✓ BOM Ingredients Deducted"
                      : "⏳ BOM Pending (Deducts on PROCESSING)"}
                  </span>
                </div>
                <p className="text-xs text-slate-300">
                  {ord.items.map((i) => `${i.productName} × ${i.quantity}`).join(", ")}
                </p>
                <p className="text-[11px] text-slate-400">
                  Address: {ord.shippingAddress} • Created: {ord.createdAt} • COGS: LKR{" "}
                  {ord.totalCogs.toLocaleString()}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="text-right">
                  <p className="text-base font-extrabold text-white">
                    LKR {ord.totalAmount.toLocaleString()}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    {ord.paymentMethod} • {ord.paymentStatus}
                  </p>
                </div>

                <button
                  onClick={() => setSelectedA4Order(ord)}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-slate-700"
                >
                  <FileText className="w-3.5 h-3.5 text-emerald-400" /> A4 Invoice
                </button>

                <select
                  value={ord.status}
                  onChange={(e) => handleOrderStatusChange(ord.id, e.target.value)}
                  className="px-3 py-2 bg-slate-900 border border-emerald-500/50 rounded-xl text-xs font-bold text-white focus:outline-none"
                >
                  <option value="PENDING">PENDING</option>
                  <option value="CONFIRMED">CONFIRMED (Send WA)</option>
                  <option value="PROCESSING">PROCESSING (Deduct BOM + Send WA)</option>
                  <option value="READY_TO_SHIP">READY TO SHIP (Send WA)</option>
                  <option value="SHIPPED">SHIPPED (Send WA)</option>
                  <option value="DELIVERED">DELIVERED (Send WA)</option>
                  <option value="CANCELLED">CANCELLED</option>
                </select>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 2. INGREDIENTS (BOM), COSTING & WASTAGE VIEW
  if (activeView === "INGREDIENTS_BOM") {
    return (
      <div className="space-y-6">
        <div className="grid lg:grid-cols-12 gap-6">
          {/* Raw Ingredients Table */}
          <div className="lg:col-span-8 bg-[#111827] border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <ChefHat className="w-4 h-4 text-emerald-400" />
                  Raw Ingredients & Packaging Stock (Auto-Deducted on PROCESSING)
                </h3>
                <p className="text-xs text-slate-400">
                  Real-time raw material balances linked to product Bill of Materials (BOM)
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="py-2.5 px-2">Ingredient</th>
                    <th className="py-2.5 px-2">SKU / Barcode</th>
                    <th className="py-2.5 px-2">Live Stock</th>
                    <th className="py-2.5 px-2">Unit Cost</th>
                    <th className="py-2.5 px-2">Supplier</th>
                    <th className="py-2.5 px-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70">
                  {ingredients.map((ing) => {
                    const isLow = ing.currentStock <= ing.reorderLevel;
                    return (
                      <tr key={ing.id} className="hover:bg-slate-900/50">
                        <td className="py-2.5 px-2 font-bold text-white">{ing.name}</td>
                        <td className="py-2.5 px-2 font-mono text-slate-400">
                          {ing.sku} ({ing.barcode})
                        </td>
                        <td className="py-2.5 px-2 font-extrabold text-emerald-400">
                          {ing.currentStock} {ing.unit}
                        </td>
                        <td className="py-2.5 px-2 text-slate-200">
                          LKR {ing.unitCost.toLocaleString()} / {ing.unit}
                        </td>
                        <td className="py-2.5 px-2 text-slate-300">{ing.supplierName}</td>
                        <td className="py-2.5 px-2">
                          {isLow ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-red-500/20 text-red-300 font-bold text-[10px]">
                              <AlertCircle className="w-3 h-3" /> Low Stock (&le;{ing.reorderLevel})
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 font-bold text-[10px]">
                              Healthy
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* GRN Restock + Wastage Forms */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-[#111827] border border-slate-800 rounded-xl p-5 space-y-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Truck className="w-4 h-4 text-emerald-400" />
                Quick GRN Ingredient Restock
              </h3>
              <form onSubmit={handleGrnRestock} className="space-y-2.5 text-xs">
                <select
                  value={restockIngId}
                  onChange={(e) => setRestockIngId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                >
                  {ingredients.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.name} ({i.currentStock} {i.unit})
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  step="0.1"
                  value={restockQty}
                  onChange={(e) => setRestockQty(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                />
                <button
                  type="submit"
                  className="w-full py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl transition"
                >
                  + Add GRN Stock
                </button>
              </form>
            </div>

            {/* Record Wastage / Spillage */}
            <div className="bg-[#111827] border border-slate-800 rounded-xl p-5 space-y-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Flame className="w-4 h-4 text-rose-400" />
                Record Ingredient Wastage / Spillage
              </h3>
              <form onSubmit={handleRecordWastage} className="space-y-2.5 text-xs">
                <select
                  value={wastageIngId}
                  onChange={(e) => setWastageIngId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                >
                  {ingredients.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.name}
                    </option>
                  ))}
                </select>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    step="0.1"
                    value={wastageQty}
                    onChange={(e) => setWastageQty(Number(e.target.value))}
                    placeholder="Wasted Qty"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                  />
                  <input
                    type="text"
                    value={wastageReason}
                    onChange={(e) => setWastageReason(e.target.value)}
                    placeholder="Reason"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 font-bold rounded-xl transition"
                >
                  Deduct Wastage & Log Expense
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Interactive Bill of Materials (BOM) Builder & Unit Costing */}
        <div className="bg-[#111827] border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-sm font-bold text-white">
                Interactive Product Bill of Materials (BOM Recipe Builder) & Exact COGS
              </h3>
              <p className="text-xs text-slate-400">
                Link raw ingredients to any product to automatically calculate unit COGS and gross profit margin
              </p>
            </div>

            <form onSubmit={handleAddBomRecipeItem} className="flex flex-wrap items-center gap-2 text-xs">
              <select
                value={bomProdId}
                onChange={(e) => setBomProdId(e.target.value)}
                className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <select
                value={bomIngId}
                onChange={(e) => setBomIngId(e.target.value)}
                className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white"
              >
                {ingredients.map((i) => (
                  <option key={i.id} value={i.id}>
                    + {i.name} ({i.unit})
                  </option>
                ))}
              </select>
              <input
                type="number"
                step="0.05"
                value={bomQtyReq}
                onChange={(e) => setBomQtyReq(Number(e.target.value))}
                className="w-20 px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white"
              />
              <button
                type="submit"
                className="px-3 py-1.5 bg-emerald-500 text-slate-950 font-bold rounded-lg"
              >
                Update Recipe BOM
              </button>
            </form>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {products
              .filter((p) => p.trackBom && p.bom.length > 0)
              .map((prod) => {
                const profit = prod.sellingPrice - prod.calculatedCogs;
                const marginPct = ((profit / prod.sellingPrice) * 100).toFixed(1);
                return (
                  <div
                    key={prod.id}
                    className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-3 text-xs"
                  >
                    <div>
                      <h4 className="font-bold text-white text-sm">{prod.name}</h4>
                      <div className="flex justify-between mt-1 text-[11px]">
                        <span className="text-slate-400">
                          Price: <strong className="text-white">LKR {prod.sellingPrice}</strong>
                        </span>
                        <span className="text-amber-400">
                          BOM COGS: <strong>LKR {prod.calculatedCogs}</strong>
                        </span>
                        <span className="text-emerald-400 font-bold">{marginPct}% Margin</span>
                      </div>
                    </div>
                    <div className="border-t border-slate-800 pt-2 space-y-1">
                      <p className="text-[10px] font-bold uppercase text-slate-400">
                        Recipe / BOM per 1 {prod.unit}:
                      </p>
                      {prod.bom.map((b, idx) => (
                        <div key={idx} className="flex justify-between text-[11px] text-slate-300">
                          <span>• {b.ingredientName}</span>
                          <span className="font-mono">
                            {b.quantityRequired} {b.unit} (LKR{" "}
                            {Math.round(b.quantityRequired * b.unitCost)})
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    );
  }

  // 3. CASH FLOW MANAGEMENT, FINANCIAL ACCOUNTS & LIVE GOOGLE DOCS / SHEETS REPORTING
  const totalInflows = cashflow
    .filter((c) => c.type === "INCOME")
    .reduce((s, c) => s + c.amount, 0);
  const totalCogs = cashflow
    .filter((c) => c.type === "COGS_RECOGNITION")
    .reduce((s, c) => s + c.amount, 0);
  const totalExpenses = cashflow
    .filter((c) => c.type !== "INCOME" && c.type !== "COGS_RECOGNITION")
    .reduce((s, c) => s + c.amount, 0);
  const totalOrderRevenue = orders.reduce((s, o) => s + o.totalAmount, 0);
  const netProfit = totalOrderRevenue - totalCogs - totalExpenses;
  void suppliers;

  return (
    <div className="space-y-6">
      {/* Live Google Docs & Google Sheets Sync Banner */}
      <div className="bg-gradient-to-r from-emerald-950/60 via-[#111827] to-indigo-950/50 border border-emerald-500/40 rounded-xl p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300">
              Live Google Workspace Integration
            </span>
            <h2 className="text-lg font-bold text-white mt-2">
              Live Google Docs Executive Report & Google Sheets Financial Ledger
            </h2>
            <p className="text-xs text-slate-300">
              Automatically pushes real-time Sales, BOM Ingredient Alerts, COGS, and Cash Flow summaries directly into your connected Google Doc & Sheet.
            </p>
          </div>

          <button
            onClick={handleSyncGoogleDocs}
            disabled={syncingGoogle}
            className="px-5 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs rounded-xl flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition"
          >
            <RefreshCw className={`w-4 h-4 ${syncingGoogle ? "animate-spin" : ""}`} />
            {syncingGoogle ? "Updating Live Google Doc & Sheet..." : "Sync Live Google Docs & Sheets Now"}
          </button>
        </div>

        {googleSyncHistory[0] && (
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-2.5 text-xs">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-bold text-emerald-400">
                Latest Synced Document: {googleSyncHistory[0].reportTitle}
              </span>
              <span className="text-slate-400 text-[11px]">
                Synced: {googleSyncHistory[0].lastSyncedAt}
              </span>
            </div>
            <p className="text-slate-300 leading-relaxed">{googleSyncHistory[0].aiNarrative}</p>
            <div className="flex flex-wrap gap-3 pt-1">
              <a
                href={googleSyncHistory[0].docUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/20 border border-blue-500/40 text-blue-300 font-semibold"
              >
                <FileText className="w-3.5 h-3.5" /> Open Live Google Doc Report
                <ExternalLink className="w-3 h-3" />
              </a>
              <a
                href={googleSyncHistory[0].sheetUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-semibold"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" /> Open Live Google Sheet Ledger
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Financial Accounts & Real-Time P&L Summary */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#111827] border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Main POS Cash Drawer</span>
            <Landmark className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-xl font-black text-white mt-1">
            LKR {(145000 + totalInflows).toLocaleString()}
          </p>
          <p className="text-[11px] text-emerald-400 mt-0.5">Live Cash in Hand</p>
        </div>

        <div className="bg-[#111827] border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Commercial Bank Account</span>
            <Landmark className="w-4 h-4 text-indigo-400" />
          </div>
          <p className="text-xl font-black text-white mt-1">LKR 1,420,500</p>
          <p className="text-[11px] text-indigo-300 mt-0.5">Verified WhatsApp Slip Transfers</p>
        </div>

        <div className="bg-[#111827] border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>COD Pending Courier Wallet</span>
            <Truck className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-xl font-black text-amber-400 mt-1">LKR 184,250</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Awaiting Courier Settlement</p>
        </div>

        <div className="bg-[#111827] border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Real-Time Net Cash Position</span>
            <Wallet className="w-4 h-4 text-emerald-400" />
          </div>
          <p
            className={`text-xl font-black mt-1 ${
              netProfit >= 0 ? "text-emerald-400" : "text-rose-400"
            }`}
          >
            LKR {(totalInflows - totalCogs).toLocaleString()}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            BOM COGS Deducted: LKR {totalCogs.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Cash Flow Ledger & Record Expense Form */}
      <div className="grid lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4 bg-[#111827] border border-slate-800 rounded-xl p-5 space-y-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Wallet className="w-4 h-4 text-emerald-400" />
            Record Cash Flow Transaction
          </h3>
          <form onSubmit={handleAddCashFlow} className="space-y-3 text-xs">
            <div>
              <label className="text-slate-400 block mb-1">Transaction Type</label>
              <select
                value={txType}
                onChange={(e) =>
                  setTxType(
                    e.target.value as
                      | "EXPENSE"
                      | "SUPPLIER_PAYMENT"
                      | "SALARY"
                      | "MARKETING"
                      | "INCOME"
                  )
                }
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
              >
                <option value="SUPPLIER_PAYMENT">Supplier PO Payment (Outflow)</option>
                <option value="EXPENSE">Operating Expense / Utility (Outflow)</option>
                <option value="SALARY">Staff Salary (Outflow)</option>
                <option value="MARKETING">WhatsApp / Zoho Marketing Spend</option>
                <option value="INCOME">Direct Cash Inflow</option>
              </select>
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Category</label>
              <input
                type="text"
                value={txCategory}
                onChange={(e) => setTxCategory(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Amount (LKR)</label>
              <input
                type="number"
                value={txAmount}
                onChange={(e) => setTxAmount(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Description / Reference</label>
              <input
                type="text"
                value={txDesc}
                onChange={(e) => setTxDesc(e.target.value)}
                placeholder="e.g. Paid Ceylon Agro Mills for 50kg Prima Flour"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Save Cash Flow Entry
            </button>
          </form>
        </div>

        <div className="lg:col-span-8 bg-[#111827] border border-slate-800 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">Real-Time Cash Flow & COGS Ledger</h3>
            <span className="text-xs text-slate-400">
              Outflows: LKR {totalExpenses.toLocaleString()}
            </span>
          </div>
          <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
            {cashflow.map((tx) => (
              <div
                key={tx.id}
                className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      {tx.transactionCode}
                    </span>
                    <span className="font-bold text-white">{tx.description}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {tx.type} • {tx.category} • {tx.paymentMethod} • {tx.date}
                  </p>
                </div>
                <span
                  className={`text-sm font-extrabold ${
                    tx.type === "INCOME"
                      ? "text-emerald-400"
                      : tx.type === "COGS_RECOGNITION"
                      ? "text-amber-400"
                      : "text-rose-400"
                  }`}
                >
                  {tx.type === "INCOME" ? "+" : "-"} LKR {tx.amount.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
