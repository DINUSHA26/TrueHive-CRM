"use client";

import React, { useState } from "react";
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  Plus,
  DollarSign,
  Search,
  Filter,
  CheckCircle2,
  Calendar,
  FileText,
  Printer,
  RefreshCw,
  Coins,
  Receipt,
  ArrowRightLeft,
  Check,
  Clock,
  TrendingUp,
  Layers,
  CheckCheck,
  XCircle,
  Building2,
  ShieldCheck,
  AlertTriangle,
  FileSpreadsheet,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";

interface CashFlowViewProps {
  overviewData?: any;
  cashflow?: any[];
  onRefresh: () => void;
}

type FinanceTab = "CASH_BOOK" | "PETTY_CASH" | "STATEMENT" | "FORECAST";

export function CashFlowView({ overviewData, cashflow = [], onRefresh }: CashFlowViewProps) {
  const [activeTab, setActiveTab] = useState<FinanceTab>("CASH_BOOK");

  // Cash Book Filters
  const [sourceFilter, setSourceFilter] = useState<string>("ALL");
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState<string>("TODAY");

  // Modals
  const [recordModalOpen, setRecordModalOpen] = useState(false);
  const [voucherModalOpen, setVoucherModalOpen] = useState(false);
  const [topUpModalOpen, setTopUpModalOpen] = useState(false);
  const [countModalOpen, setCountModalOpen] = useState(false);

  // Form States: Manual Transaction
  const [txType, setTxType] = useState<"INFLOW" | "OUTFLOW">("OUTFLOW");
  const [txCategory, setTxCategory] = useState("RAW_MATERIAL_PO");
  const [txAmount, setTxAmount] = useState<number>(10000);
  const [txMethod, setTxMethod] = useState("CASH");
  const [txDesc, setTxDesc] = useState("");
  const [savingTx, setSavingTx] = useState(false);

  // Form States: Petty Cash Voucher
  const [voucherCategory, setVoucherCategory] = useState("Stationery");
  const [voucherAmount, setVoucherAmount] = useState<number>(500);
  const [voucherPayee, setVoucherPayee] = useState("");
  const [voucherPurpose, setVoucherPurpose] = useState("");
  const [savingVoucher, setSavingVoucher] = useState(false);

  // Form States: Top-up Replenishment
  const [topUpAmount, setTopUpAmount] = useState<number>(3500);
  const [topUpFrom, setTopUpFrom] = useState("Commercial Bank Corporate Account");
  const [topUpRef, setTopUpRef] = useState("CHQ-TOPUP-01");
  const [savingTopUp, setSavingTopUp] = useState(false);

  // Form States: Physical Cash Count (Denominations)
  const [denom5000, setDenom5000] = useState<number>(1);
  const [denom1000, setDenom1000] = useState<number>(1);
  const [denom500, setDenom500] = useState<number>(1);
  const [denom100, setDenom100] = useState<number>(0);
  const [denom50, setDenom50] = useState<number>(0);
  const [denom20, setDenom20] = useState<number>(0);
  const [countNotes, setCountNotes] = useState("");
  const [savingCount, setSavingCount] = useState(false);

  // Action status loader
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Extract synthesized data from API or fallbacks
  const kpis = overviewData?.kpis || {
    openingCashBalance: 0,
    totalCashIn: 37930,
    totalCashOut: 2000,
    netCashBalance: 35930,
    closingBalance: 35930,
  };

  const cashBook: any[] = overviewData?.cashBook || [
    { id: "s-8", dateTime: "2026-11-18 11:00", description: "Credit Payment - malith", source: "Credit", cashIn: 11000, cashOut: 0, runningBalance: 35930, category: "CUSTOMER_AR_COLLECTION", paymentMethod: "CASH", canDelete: false },
    { id: "s-7", dateTime: "2026-11-18 09:51", description: "POS Sale - INV-886000", source: "POS", cashIn: 2950, cashOut: 0, runningBalance: 24930, category: "RETAIL_SALE", paymentMethod: "CASH", canDelete: false },
    { id: "s-6", dateTime: "2026-11-18 09:51", description: "POS Sale - INV-866000", source: "POS", cashIn: 300, cashOut: 0, runningBalance: 21980, category: "RETAIL_SALE", paymentMethod: "CASH", canDelete: false },
    { id: "s-5", dateTime: "2026-11-18 09:50", description: "POS Sale - INV-828000", source: "POS", cashIn: 2980, cashOut: 0, runningBalance: 21680, category: "RETAIL_SALE", paymentMethod: "CASH", canDelete: false },
    { id: "s-4", dateTime: "2026-11-18 09:31", description: "POS Sale - INV-700000", source: "POS", cashIn: 10000, cashOut: 0, runningBalance: 18700, category: "RETAIL_SALE", paymentMethod: "CASH", canDelete: false },
    { id: "s-3", dateTime: "2026-11-18 09:27", description: "food - Refreshments & snacks for meeting", source: "Manual", cashIn: 0, cashOut: 2000, runningBalance: 8700, category: "EXPENSE", paymentMethod: "CASH", canDelete: true },
    { id: "s-2", dateTime: "2026-11-18 08:19", description: "POS Sale - INV-342000 (Walk-in Customer)", source: "POS", cashIn: 5700, cashOut: 0, runningBalance: 10700, category: "RETAIL_SALE", paymentMethod: "CASH", canDelete: false },
    { id: "s-1", dateTime: "2026-11-18 08:18", description: "POS Sale - INV-305000 (Walk-in Customer)", source: "POS", cashIn: 5000, cashOut: 0, runningBalance: 5000, category: "RETAIL_SALE", paymentMethod: "CASH", canDelete: false },
  ];

  const pettyCash = overviewData?.pettyCash || {
    fund: {
      name: "Head Office Petty Cash",
      branch: "Head Office",
      custodian: "Dinusha (Finance Custodian)",
      floatLimit: 10000,
      voucherLimit: 3000,
      currentBalance: 6500,
    },
    authorizedFloat: 10000,
    spent: 3500,
    available: 6500,
    topUpNeeded: 3500,
    vouchers: [
      { id: "v-1", voucherCode: "PC-001", category: "Stationery", amount: 500, payee: "Atlas Stationery Store", purpose: "Office pens, registers and paper slips", status: "PAID", paidAt: "2026-11-18 10:15" },
      { id: "v-2", voucherCode: "PC-002", category: "Refreshments", amount: 300, payee: "Keells Bakery", purpose: "Tea and refreshments for visiting customer", status: "PAID", paidAt: "2026-11-18 11:20" },
      { id: "v-3", voucherCode: "PC-003", category: "Transport", amount: 1200, payee: "Three-Wheel Dispatch", purpose: "Urgent ingredient sample delivery to customer", status: "PAID", paidAt: "2026-11-18 12:45" },
      { id: "v-4", voucherCode: "PC-004", category: "Printing", amount: 500, payee: "Quick Print Solutions", purpose: "Product catalog copies and price list printing", status: "PAID", paidAt: "2026-11-18 13:30" },
      { id: "v-5", voucherCode: "PC-005", category: "Cleaning", amount: 1000, payee: "CleanCo Supplies", purpose: "Floor cleaner, sanitizers and trash bags", status: "PAID", paidAt: "2026-11-18 14:10" },
    ],
    cashCounts: [
      { id: "c-1", expectedBalance: 6500, countedBalance: 6500, variance: 0, notes: "End-of-day physical cash count verified.", status: "VERIFIED", countedBy: "Dinusha (Custodian)", createdAt: "2026-11-18 15:00" },
    ],
    categoryBreakdown: {
      Transport: 1200,
      Cleaning: 1000,
      Stationery: 500,
      Printing: 500,
      Refreshments: 300,
    },
  };

  const cashFlowStatement = overviewData?.cashFlowStatement || {
    operating: { inflow: 37930, outflow: 2000, net: 35930 },
    investing: { inflow: 0, outflow: 0, net: 0 },
    financing: { inflow: 0, outflow: 0, net: 0 },
    internalTransfers: 0,
    netMovement: 35930,
  };

  const forecast = overviewData?.forecast || {
    openingBalance: 35930,
    projection: [
      { period: "W1", expectedReceipts: 45000, expectedPayments: 35000, closing: 45930, delayedClosing: 36430 },
      { period: "W2", expectedReceipts: 30000, expectedPayments: 50000, closing: 25930, delayedClosing: 7430 },
      { period: "W3", expectedReceipts: 60000, expectedPayments: 42000, closing: 43930, delayedClosing: 25430 },
      { period: "W4", expectedReceipts: 40000, expectedPayments: 55000, closing: 28930, delayedClosing: -14570 },
    ],
    outstandingAr: 95000,
    outstandingAp: 78000,
  };

  // Filter Cash Book
  const filteredCashBook = cashBook.filter((row: any) => {
    if (sourceFilter !== "ALL") {
      if (sourceFilter === "POS" && row.source !== "POS") return false;
      if (sourceFilter === "CREDIT" && row.source !== "Credit") return false;
      if (sourceFilter === "PETTY_CASH" && row.source !== "Petty Cash") return false;
      if (sourceFilter === "SUPPLIER_AP" && row.source !== "Supplier AP") return false;
      if (sourceFilter === "MANUAL" && row.source !== "Manual") return false;
    }
    if (search) {
      const q = search.toLowerCase();
      return (
        row.description?.toLowerCase().includes(q) ||
        row.category?.toLowerCase().includes(q) ||
        row.source?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Print Report Handler
  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  // Handlers for Cash Book & Petty Cash Actions
  const handleCreateTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingTx(true);
    try {
      await fetch("/api/finance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "CREATE_TRANSACTION",
          type: txType === "INFLOW" ? "INCOME" : "EXPENSE",
          category: txCategory,
          amount: txAmount,
          paymentMethod: txMethod,
          description: txDesc.trim() || `${txType === "INFLOW" ? "Cash Inflow" : "Cash Outflow"} (${txCategory})`,
        }),
      });
      setTxDesc("");
      setRecordModalOpen(false);
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setSavingTx(false);
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    if (!confirm("Are you sure you want to delete this manual cash transaction?")) return;
    try {
      await fetch("/api/finance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "DELETE_TRANSACTION", id }),
      });
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateVoucher = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingVoucher(true);
    try {
      await fetch("/api/finance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "CREATE_VOUCHER",
          fundId: pettyCash.fund?.id || "default-fund",
          category: voucherCategory,
          amount: voucherAmount,
          payee: voucherPayee.trim(),
          purpose: voucherPurpose.trim(),
        }),
      });
      setVoucherPayee("");
      setVoucherPurpose("");
      setVoucherModalOpen(false);
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setSavingVoucher(false);
    }
  };

  const handleApproveVoucher = async (voucherId: string) => {
    setActionLoadingId(voucherId);
    try {
      await fetch("/api/finance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "APPROVE_VOUCHER", voucherId }),
      });
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handlePayVoucher = async (voucherId: string) => {
    setActionLoadingId(voucherId);
    try {
      const res = await fetch("/api/finance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "PAY_VOUCHER", voucherId }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.message || "Failed to disburse voucher. Check fund balance.");
      }
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRejectVoucher = async (voucherId: string) => {
    const reason = prompt("Enter reason for rejecting this petty cash voucher:");
    if (!reason) return;
    setActionLoadingId(voucherId);
    try {
      await fetch("/api/finance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "REJECT_VOUCHER", voucherId, reason }),
      });
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReplenishPetty = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingTopUp(true);
    try {
      await fetch("/api/finance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "REPLENISH_PETTY",
          fundId: pettyCash.fund?.id || "default-fund",
          amount: topUpAmount,
          fromAccount: topUpFrom,
          reference: topUpRef,
        }),
      });
      setTopUpModalOpen(false);
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setSavingTopUp(false);
    }
  };

  const calculatedCountTotal =
    denom5000 * 5000 +
    denom1000 * 1000 +
    denom500 * 500 +
    denom100 * 100 +
    denom50 * 50 +
    denom20 * 20;

  const countVariance = calculatedCountTotal - (pettyCash.available || 6500);

  const handleRecordCashCount = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingCount(true);
    try {
      await fetch("/api/finance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "RECORD_CASH_COUNT",
          fundId: pettyCash.fund?.id || "default-fund",
          countedBalance: calculatedCountTotal,
          denominations: {
            note5000: denom5000,
            note1000: denom1000,
            note500: denom500,
            note100: denom100,
            note50: denom50,
            note20: denom20,
          },
          notes: countNotes.trim(),
          countedBy: "Petty Cashier",
        }),
      });
      setCountModalOpen(false);
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setSavingCount(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* ========================================================
          TOP HEADER & GLOBAL ACTIONS
          ======================================================== */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400">
              <Wallet className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-white tracking-tight">
              Finance & Accounting Hub
            </h2>
            <Badge variant="primary" className="text-[10px]">
              Double-Entry Ledger
            </Badge>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Reconciled Daily Cash Book, Dedicated Petty Cash Imprest Fund & Direct Cash Flow Statement.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            leftIcon={<Printer className="w-4 h-4" />}
            className="text-xs"
          >
            Export / Print PDF
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => setVoucherModalOpen(true)}
            leftIcon={<Receipt className="w-4 h-4 text-emerald-400" />}
            className="text-xs"
          >
            New Petty Voucher
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setRecordModalOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
            className="text-xs"
          >
            Record Cash In/Out
          </Button>

          <button
            onClick={onRefresh}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-white transition"
            title="Refresh Ledger"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ========================================================
          NAVIGATION TABS (4 Sections matching PDF Specification)
          ======================================================== */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar whitespace-nowrap border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab("CASH_BOOK")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === "CASH_BOOK"
              ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
              : "bg-slate-900/60 text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          <Wallet className="w-4 h-4" />
          <span>Daily Cash Book</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-blue-500/20 text-blue-300">
            {cashBook.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("PETTY_CASH")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === "PETTY_CASH"
              ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30"
              : "bg-slate-900/60 text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          <Coins className="w-4 h-4" />
          <span>Petty Cash (Imprest Fund)</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300">
            Rs. {pettyCash.available?.toLocaleString()}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("STATEMENT")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === "STATEMENT"
              ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
              : "bg-slate-900/60 text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Direct Cash Flow</span>
        </button>

        <button
          onClick={() => setActiveTab("FORECAST")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === "FORECAST"
              ? "bg-amber-600 text-white shadow-md shadow-amber-600/30"
              : "bg-slate-900/60 text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>4-Week Forecast & Scenarios</span>
        </button>
      </div>

      {/* ========================================================
          TAB 1: DAILY CASH BOOK LEDGER (Matching Page 3 & 4 of PDF)
          ======================================================== */}
      {activeTab === "CASH_BOOK" && (
        <div className="space-y-5">
          {/* 4 Summary KPI Cards (Figure 1: Opening, Total In, Total Out, Net Balance) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-sm">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                Opening Cash Balance
              </span>
              <p className="text-2xl font-black text-white">
                Rs. {kpis.openingCashBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">Carried into selected period</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-sm">
              <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                <span>Total Cash In</span>
                <ArrowDownLeft className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-2xl font-black text-emerald-400">
                + Rs. {kpis.totalCashIn.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">POS Sales & Customer AR</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-sm">
              <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                <span>Total Cash Out</span>
                <ArrowUpRight className="w-4 h-4 text-rose-400" />
              </div>
              <p className="text-2xl font-black text-rose-400">
                - Rs. {kpis.totalCashOut.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">Petty cash & manual expenses</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/90 border border-blue-500/30 shadow-sm bg-gradient-to-br from-slate-900 to-blue-950/20">
              <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-blue-300 mb-1">
                <span>Petty Cash / Net Balance</span>
                <Wallet className="w-4 h-4 text-blue-400" />
              </div>
              <p className="text-2xl font-black text-blue-400">
                Rs. {kpis.netCashBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">Reconciled Closing Position</p>
            </div>
          </div>

          {/* Cash Book Toolbar & Filters */}
          <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Source Filters (All, POS, Credit, Petty Cash, Supplier AP, Manual) */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar whitespace-nowrap">
              {["ALL", "POS", "CREDIT", "PETTY_CASH", "SUPPLIER_AP", "MANUAL"].map((src) => (
                <button
                  key={src}
                  onClick={() => setSourceFilter(src)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                    sourceFilter === src
                      ? "bg-blue-600 text-white"
                      : "bg-slate-950/80 border border-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  {src === "PETTY_CASH" ? "Petty Cash" : src === "SUPPLIER_AP" ? "Supplier AP" : src}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative w-full md:w-72">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search description, reference, source..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Cash Book Ledger Table (Exact structure of Figure 1) */}
          <Card>
            <CardHeader className="border-b border-slate-800 pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-blue-400" />
                <span>Cash Book Ledger (Chronological Running Balance)</span>
              </CardTitle>
              <span className="text-xs text-slate-400">
                {filteredCashBook.length} recorded movements
              </span>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>DATE & TIME</TableHead>
                      <TableHead>DESCRIPTION</TableHead>
                      <TableHead>SOURCE</TableHead>
                      <TableHead className="text-right">CASH IN (+)</TableHead>
                      <TableHead className="text-right">CASH OUT (-)</TableHead>
                      <TableHead className="text-right">RUNNING BALANCE</TableHead>
                      <TableHead className="text-center">ACTIONS</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCashBook.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-slate-400 text-xs">
                          No cash book entries match your filter.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredCashBook.map((row: any) => {
                        const isPos = row.source === "POS";
                        const isCredit = row.source === "Credit";
                        const isPetty = row.source === "Petty Cash";
                        const isSupplier = row.source === "Supplier AP";

                        return (
                          <TableRow key={row.id}>
                            <TableCell className="text-xs text-slate-400 font-mono whitespace-nowrap">
                              {row.dateTime ? new Date(row.dateTime).toLocaleString() : "Today"}
                            </TableCell>

                            <TableCell className="font-semibold text-white max-w-xs truncate">
                              {row.description}
                            </TableCell>

                            <TableCell>
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                  isPos
                                    ? "bg-teal-500/20 text-teal-300 border-teal-500/30"
                                    : isCredit
                                    ? "bg-blue-500/20 text-blue-300 border-blue-500/30"
                                    : isPetty
                                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                                    : isSupplier
                                    ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
                                    : "bg-purple-500/20 text-purple-300 border-purple-500/30"
                                }`}
                              >
                                {row.source}
                              </span>
                            </TableCell>

                            <TableCell className="text-right font-bold text-sm text-emerald-400 font-mono">
                              {row.cashIn > 0 ? `+ Rs. ${row.cashIn.toLocaleString()}` : "—"}
                            </TableCell>

                            <TableCell className="text-right font-bold text-sm text-rose-400 font-mono">
                              {row.cashOut > 0 ? `- Rs. ${row.cashOut.toLocaleString()}` : "—"}
                            </TableCell>

                            <TableCell className="text-right font-black text-sm text-white font-mono bg-slate-900/30">
                              Rs. {row.runningBalance?.toLocaleString() || "0.00"}
                            </TableCell>

                            <TableCell className="text-center">
                              {row.canDelete ? (
                                <button
                                  onClick={() => handleDeleteTransaction(row.id)}
                                  className="text-xs text-rose-400 hover:text-rose-300 hover:underline font-semibold"
                                >
                                  Delete
                                </button>
                              ) : (
                                <span className="text-[10px] text-slate-500 font-medium">
                                  Auto
                                </span>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ========================================================
          TAB 2: PETTY CASH (IMPREST MODEL - Pages 7-10 of PDF)
          ======================================================== */}
      {activeTab === "PETTY_CASH" && (
        <div className="space-y-5">
          {/* Fund Details Banner */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/30 via-slate-900 to-slate-900 border border-emerald-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shrink-0">
                <Coins className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-white">
                    {pettyCash.fund?.name || "Head Office Petty Cash Fund"}
                  </h3>
                  <Badge variant="success" dot className="text-[10px]">
                    Imprest Active
                  </Badge>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Custodian: <strong className="text-white">{pettyCash.fund?.custodian}</strong> • Branch: {pettyCash.fund?.branch} • Single Voucher Limit: <span className="text-emerald-400 font-bold">Rs. {pettyCash.fund?.voucherLimit?.toLocaleString()}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setCountModalOpen(true)}
                leftIcon={<ShieldCheck className="w-4 h-4 text-emerald-400" />}
                className="text-xs"
              >
                Count Physical Cash
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setTopUpModalOpen(true)}
                leftIcon={<ArrowRightLeft className="w-4 h-4" />}
                className="bg-emerald-600 hover:bg-emerald-500 border-none text-white text-xs font-bold"
              >
                Replenish / Top-Up Float
              </Button>
            </div>
          </div>

          {/* 4 Imprest KPI Cards (Page 9 of PDF) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                Authorized Float
              </span>
              <p className="text-2xl font-black text-white">
                Rs. {pettyCash.authorizedFloat?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || "10,000.00"}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">Fixed Imprest Ceiling</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-rose-400 block mb-1">
                Spent (Current Cycle)
              </span>
              <p className="text-2xl font-black text-rose-400">
                Rs. {pettyCash.spent?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || "3,500.00"}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">Approved & Paid Vouchers</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/90 border border-emerald-500/30 bg-emerald-950/10">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-400 block mb-1">
                Available Cash
              </span>
              <p className="text-2xl font-black text-emerald-400">
                Rs. {pettyCash.available?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || "6,500.00"}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">Physical Cash Remaining in Box</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/90 border border-amber-500/30 bg-amber-950/10">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-400 block mb-1">
                Top-up Needed
              </span>
              <p className="text-2xl font-black text-amber-400">
                Rs. {pettyCash.topUpNeeded?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || "3,500.00"}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">Amount to restore full float</p>
            </div>
          </div>

          {/* Expense Category Breakdown Chart (Figure 3 in PDF Page 9) */}
          <Card>
            <CardHeader className="border-b border-slate-800 pb-3">
              <CardTitle className="text-sm font-bold text-white flex items-center justify-between">
                <span>Petty Cash Expense Category Breakdown (Current Cycle)</span>
                <span className="text-xs text-slate-400 font-normal">
                  Total Disbursed: Rs. {pettyCash.spent?.toLocaleString()}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              {Object.entries(pettyCash.categoryBreakdown || {}).map(([cat, amt]: [string, any]) => {
                const percentage = Math.round((amt / (pettyCash.spent || 3500)) * 100);
                return (
                  <div key={cat} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-white">{cat}</span>
                      <span className="font-mono text-emerald-400 font-bold">
                        Rs. {amt.toLocaleString()} ({percentage}%)
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-teal-500 transition-all duration-500"
                        style={{ width: `${Math.min(100, Math.max(8, percentage))}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Petty Cash Voucher Register Table (Page 9) */}
          <Card>
            <CardHeader className="border-b border-slate-800 pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
                <Receipt className="w-4 h-4 text-emerald-400" />
                <span>Voucher Register & Approvals</span>
              </CardTitle>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setVoucherModalOpen(true)}
                leftIcon={<Plus className="w-3.5 h-3.5" />}
                className="bg-emerald-600 hover:bg-emerald-500 text-xs"
              >
                Submit Voucher
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>VOUCHER #</TableHead>
                      <TableHead>CATEGORY</TableHead>
                      <TableHead>PAYEE</TableHead>
                      <TableHead>PURPOSE / MEMO</TableHead>
                      <TableHead className="text-right">AMOUNT</TableHead>
                      <TableHead>STATUS</TableHead>
                      <TableHead className="text-center">ACTIONS</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pettyCash.vouchers?.map((v: any) => {
                      const isPaid = v.status === "PAID";
                      const isApproved = v.status === "APPROVED";
                      const isSubmitted = v.status === "SUBMITTED";
                      const isRejected = v.status === "REJECTED";

                      return (
                        <TableRow key={v.id}>
                          <TableCell className="font-bold text-xs font-mono text-emerald-400">
                            {v.voucherCode}
                          </TableCell>
                          <TableCell>
                            <Badge variant="neutral" size="sm">
                              {v.category}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-semibold text-white">
                            {v.payee}
                          </TableCell>
                          <TableCell className="text-xs text-slate-300 max-w-xs truncate">
                            {v.purpose}
                          </TableCell>
                          <TableCell className="text-right font-black font-mono text-sm text-white">
                            Rs. {v.amount?.toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                isPaid
                                  ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                                  : isApproved
                                  ? "bg-blue-500/20 text-blue-300 border-blue-500/30"
                                  : isSubmitted
                                  ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
                                  : "bg-rose-500/20 text-rose-300 border-rose-500/30"
                              }`}
                            >
                              {v.status}
                            </span>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              {isSubmitted && (
                                <>
                                  <button
                                    onClick={() => handleApproveVoucher(v.id)}
                                    disabled={actionLoadingId === v.id}
                                    className="px-2 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold transition"
                                  >
                                    Approve
                                  </button>
                                  <button
                                    onClick={() => handleRejectVoucher(v.id)}
                                    disabled={actionLoadingId === v.id}
                                    className="px-2 py-1 rounded bg-slate-800 hover:bg-rose-900/60 text-rose-400 text-[10px] font-bold transition"
                                  >
                                    Reject
                                  </button>
                                </>
                              )}

                              {isApproved && (
                                <button
                                  onClick={() => handlePayVoucher(v.id)}
                                  disabled={actionLoadingId === v.id}
                                  className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold transition shadow"
                                >
                                  Disburse / Pay
                                </button>
                              )}

                              {isPaid && (
                                <span className="text-[10px] text-slate-400 flex items-center gap-1 font-mono">
                                  <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
                                  <span>Paid</span>
                                </span>
                              )}

                              {isRejected && (
                                <span className="text-[10px] text-rose-400">
                                  {v.rejectionReason || "Disallowed"}
                                </span>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Physical Cash Count History (Page 7 & 10) */}
          <Card>
            <CardHeader className="border-b border-slate-800 pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-400" />
                <span>Physical Cash Counts & Variance Audit</span>
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCountModalOpen(true)}
                className="text-xs"
              >
                Perform Cash Count
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>DATE & TIME</TableHead>
                    <TableHead className="text-right">EXPECTED BALANCE</TableHead>
                    <TableHead className="text-right">COUNTED BALANCE</TableHead>
                    <TableHead className="text-right">VARIANCE</TableHead>
                    <TableHead>STATUS</TableHead>
                    <TableHead>COUNTED BY</TableHead>
                    <TableHead>NOTES</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pettyCash.cashCounts?.map((c: any) => (
                    <TableRow key={c.id}>
                      <TableCell className="text-xs text-slate-400 font-mono">
                        {c.createdAt ? new Date(c.createdAt).toLocaleString() : "Today"}
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs text-white">
                        Rs. {c.expectedBalance?.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs font-bold text-white">
                        Rs. {c.countedBalance?.toLocaleString()}
                      </TableCell>
                      <TableCell
                        className={`text-right font-mono text-xs font-bold ${
                          c.variance === 0
                            ? "text-emerald-400"
                            : c.variance < 0
                            ? "text-rose-400"
                            : "text-amber-400"
                        }`}
                      >
                        {c.variance === 0
                          ? "Rs. 0.00 (Balanced)"
                          : `${c.variance < 0 ? "-" : "+"} Rs. ${Math.abs(c.variance).toLocaleString()}`}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={c.status === "VERIFIED" ? "success" : "danger"}
                          size="sm"
                        >
                          {c.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-slate-300">
                        {c.countedBy}
                      </TableCell>
                      <TableCell className="text-xs text-slate-400 max-w-xs truncate">
                        {c.notes || "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ========================================================
          TAB 3: DIRECT CASH FLOW STATEMENT (Page 13 of PDF)
          ======================================================== */}
      {activeTab === "STATEMENT" && (
        <div className="space-y-5">
          <Card>
            <CardHeader className="border-b border-slate-800 pb-3">
              <CardTitle className="text-base font-bold text-white flex items-center justify-between">
                <span>Statement of Cash Flows (Direct Method)</span>
                <span className="text-xs text-slate-400 font-normal">
                  Excludes Non-Cash & Internal Transfers
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-6">
              {/* 1. Operating Activities */}
              <div className="space-y-2">
                <div className="flex items-center justify-between pb-1 border-b border-slate-800">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-blue-400">
                    1. Cash Flows from Operating Activities
                  </h4>
                  <span className="text-xs font-mono font-bold text-white">
                    Rs. {cashFlowStatement.operating.net?.toLocaleString()}
                  </span>
                </div>
                <div className="pl-4 space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-300">
                    <span>Cash receipts from customers & POS sales</span>
                    <span className="font-mono text-emerald-400 font-semibold">
                      + Rs. {cashFlowStatement.operating.inflow?.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Cash paid to suppliers & operational expenses</span>
                    <span className="font-mono text-rose-400 font-semibold">
                      - Rs. {cashFlowStatement.operating.outflow?.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* 2. Investing Activities */}
              <div className="space-y-2">
                <div className="flex items-center justify-between pb-1 border-b border-slate-800">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-purple-400">
                    2. Cash Flows from Investing Activities
                  </h4>
                  <span className="text-xs font-mono font-bold text-white">
                    Rs. {cashFlowStatement.investing.net?.toLocaleString()}
                  </span>
                </div>
                <div className="pl-4 space-y-1.5 text-xs text-slate-400">
                  <div className="flex justify-between">
                    <span>Capital expenditure & machinery purchases</span>
                    <span className="font-mono text-slate-400">Rs. 0.00</span>
                  </div>
                </div>
              </div>

              {/* 3. Financing Activities */}
              <div className="space-y-2">
                <div className="flex items-center justify-between pb-1 border-b border-slate-800">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400">
                    3. Cash Flows from Financing Activities
                  </h4>
                  <span className="text-xs font-mono font-bold text-white">
                    Rs. {cashFlowStatement.financing.net?.toLocaleString()}
                  </span>
                </div>
                <div className="pl-4 space-y-1.5 text-xs text-slate-400">
                  <div className="flex justify-between">
                    <span>Owner capital injections / loans received</span>
                    <span className="font-mono text-slate-400">Rs. 0.00</span>
                  </div>
                </div>
              </div>

              {/* Net Increase in Cash */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <span className="text-sm font-bold text-white">
                  Net Increase / (Decrease) in Cash & Cash Equivalents
                </span>
                <span className="text-lg font-black font-mono text-emerald-400">
                  Rs. {cashFlowStatement.netMovement?.toLocaleString()}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ========================================================
          TAB 4: 4-WEEK ROLLING FORECAST & SCENARIOS (Page 14 of PDF)
          ======================================================== */}
      {activeTab === "FORECAST" && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                Outstanding Customer AR (Receivable)
              </span>
              <p className="text-2xl font-black text-blue-400">
                Rs. {forecast.outstandingAr?.toLocaleString()}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Expected to convert into cash inflows over W1–W4.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                Outstanding Supplier AP (Payables)
              </span>
              <p className="text-2xl font-black text-rose-400">
                Rs. {forecast.outstandingAp?.toLocaleString()}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Required disbursements scheduled over W1–W4.
              </p>
            </div>
          </div>

          {/* Forecast Table (Figure 5: W1, W2, W3, W4) */}
          <Card>
            <CardHeader className="border-b border-slate-800 pb-3">
              <CardTitle className="text-sm font-bold text-white flex items-center justify-between">
                <span>4-Week Cash Flow Projection (Base vs 70% Delayed Receipts Scenario)</span>
                <span className="text-xs text-slate-400 font-normal">
                  Opening Balance: Rs. {forecast.openingBalance?.toLocaleString()}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>PERIOD</TableHead>
                    <TableHead className="text-right">EXPECTED RECEIPTS</TableHead>
                    <TableHead className="text-right">EXPECTED PAYMENTS</TableHead>
                    <TableHead className="text-right">BASE CLOSING BALANCE</TableHead>
                    <TableHead className="text-right">DELAYED SCENARIO (70%)</TableHead>
                    <TableHead>STATUS</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {forecast.projection?.map((item: any) => {
                    const isHealthy = item.closing > 0;
                    const isDelayedWarning = item.delayedClosing < 0;

                    return (
                      <TableRow key={item.period}>
                        <TableCell className="font-bold text-white font-mono">
                          {item.period}
                        </TableCell>
                        <TableCell className="text-right font-mono text-emerald-400 font-bold">
                          + Rs. {item.expectedReceipts?.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right font-mono text-rose-400 font-bold">
                          - Rs. {item.expectedPayments?.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right font-mono text-white font-bold">
                          Rs. {item.closing?.toLocaleString()}
                        </TableCell>
                        <TableCell
                          className={`text-right font-mono font-bold ${
                            isDelayedWarning ? "text-rose-400" : "text-amber-400"
                          }`}
                        >
                          Rs. {item.delayedClosing?.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={isDelayedWarning ? "danger" : isHealthy ? "success" : "warning"}
                            size="sm"
                          >
                            {isDelayedWarning ? "Deficit Risk" : "Surplus Liquid"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ========================================================
          MODAL 1: RECORD MANUAL TRANSACTION (Cash Book)
          ======================================================== */}
      <Modal
        isOpen={recordModalOpen}
        onClose={() => setRecordModalOpen(false)}
        title="Record Cash Movement"
        description="Record manual cash inflow or outflow into the Daily Cash Book."
        maxWidth="md"
      >
        <form onSubmit={handleCreateTransaction} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">
                Movement Direction
              </label>
              <select
                value={txType}
                onChange={(e) => setTxType(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none"
              >
                <option value="INFLOW">Cash Inflow (Receipt +)</option>
                <option value="OUTFLOW">Cash Outflow (Payment -)</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">
                Category
              </label>
              <select
                value={txCategory}
                onChange={(e) => setTxCategory(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none"
              >
                <option value="RETAIL_SALE">Direct Retail Sale</option>
                <option value="CUSTOMER_PAYMENT">Customer Credit Collection</option>
                <option value="RAW_MATERIAL_PO">Raw Material / Supplier PO</option>
                <option value="UTILITIES">Electricity, Water & Internet</option>
                <option value="RENT">Shop / Facility Rent</option>
                <option value="SALARY">Staff Salaries</option>
                <option value="FOOD_EXPENSE">Food & Meeting Refreshments</option>
                <option value="OTHER">Other Miscellaneous</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">
                Amount (Rs.) *
              </label>
              <input
                type="number"
                min="1"
                required
                value={txAmount}
                onChange={(e) => setTxAmount(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">
                Payment Channel
              </label>
              <select
                value={txMethod}
                onChange={(e) => setTxMethod(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none"
              >
                <option value="CASH">Cash Drawer / Till</option>
                <option value="BANK_TRANSFER">Bank Transfer</option>
                <option value="CARD">Card POS</option>
                <option value="CHEQUE">Cheque</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1">
              Description / Memo *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Food - Snacks and refreshments for visiting buyer"
              value={txDesc}
              onChange={(e) => setTxDesc(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setRecordModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" loading={savingTx}>
              Record Movement
            </Button>
          </div>
        </form>
      </Modal>

      {/* ========================================================
          MODAL 2: NEW PETTY CASH VOUCHER (Imprest System)
          ======================================================== */}
      <Modal
        isOpen={voucherModalOpen}
        onClose={() => setVoucherModalOpen(false)}
        title="Submit Petty Cash Voucher"
        description="Request small-expense disbursement from authorized float."
        maxWidth="md"
      >
        <form onSubmit={handleCreateVoucher} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">
                Expense Category
              </label>
              <select
                value={voucherCategory}
                onChange={(e) => setVoucherCategory(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none"
              >
                <option value="Stationery">Stationery</option>
                <option value="Refreshments">Refreshments & Food</option>
                <option value="Transport">Transport & Courier</option>
                <option value="Printing">Printing & Supplies</option>
                <option value="Cleaning">Cleaning & Maintenance</option>
                <option value="Repairs">Emergency Repairs</option>
                <option value="Other">Other Operational</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">
                Voucher Amount (Max Rs. {pettyCash.fund?.voucherLimit?.toLocaleString()}) *
              </label>
              <input
                type="number"
                min="1"
                max={pettyCash.fund?.voucherLimit || 3000}
                required
                value={voucherAmount}
                onChange={(e) => setVoucherAmount(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1">
              Payee / Vendor Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Atlas Stationery Store or Three-Wheel Hire"
              value={voucherPayee}
              onChange={(e) => setVoucherPayee(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1">
              Business Purpose / Description *
            </label>
            <textarea
              rows={2}
              required
              placeholder="e.g. Purchased receipt book and stamps for delivery courier"
              value={voucherPurpose}
              onChange={(e) => setVoucherPurpose(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setVoucherModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              loading={savingVoucher}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
            >
              Submit for Approval
            </Button>
          </div>
        </form>
      </Modal>

      {/* ========================================================
          MODAL 3: REPLENISH / TOP-UP FLOAT
          ======================================================== */}
      <Modal
        isOpen={topUpModalOpen}
        onClose={() => setTopUpModalOpen(false)}
        title="Replenish Petty Cash Float"
        description="Transfer funds from Commercial Bank Account to restore authorized float."
        maxWidth="md"
      >
        <form onSubmit={handleReplenishPetty} className="space-y-4">
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Authorized Float Ceiling:</span>
              <span className="text-white font-bold">Rs. {pettyCash.authorizedFloat?.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Current Available Cash:</span>
              <span className="text-emerald-400 font-bold">Rs. {pettyCash.available?.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-xs border-t border-slate-800/80 pt-1">
              <span className="text-slate-300 font-semibold">Recommended Replenishment:</span>
              <span className="text-amber-400 font-black">Rs. {pettyCash.topUpNeeded?.toLocaleString()}</span>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1">
              Transfer From Account
            </label>
            <select
              value={topUpFrom}
              onChange={(e) => setTopUpFrom(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none"
            >
              <option value="Commercial Bank Corporate Account">Commercial Bank Corporate Account (8001294821)</option>
              <option value="Main Cash Drawer (POS Till)">Main Cash Drawer (POS Till)</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">
                Top-up Amount (Rs.) *
              </label>
              <input
                type="number"
                min="100"
                required
                value={topUpAmount}
                onChange={(e) => setTopUpAmount(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none font-mono font-bold text-emerald-400"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">
                Cheque / Reference #
              </label>
              <input
                type="text"
                value={topUpRef}
                onChange={(e) => setTopUpRef(e.target.value)}
                placeholder="e.g. CHQ-99120"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setTopUpModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              loading={savingTopUp}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
            >
              Disburse Top-up Transfer
            </Button>
          </div>
        </form>
      </Modal>

      {/* ========================================================
          MODAL 4: PHYSICAL CASH COUNT & DENOMINATIONS (Page 7)
          ======================================================== */}
      <Modal
        isOpen={countModalOpen}
        onClose={() => setCountModalOpen(false)}
        title="Physical Cash Count & Variance Verification"
        description="Count physical currency notes and calculate variance against book balance."
        maxWidth="md"
      >
        <form onSubmit={handleRecordCashCount} className="space-y-4">
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div>
              <label className="text-slate-400 block mb-1">Rs. 5,000 Notes</label>
              <input
                type="number"
                min="0"
                value={denom5000}
                onChange={(e) => setDenom5000(Number(e.target.value))}
                className="w-full px-2 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Rs. 1,000 Notes</label>
              <input
                type="number"
                min="0"
                value={denom1000}
                onChange={(e) => setDenom1000(Number(e.target.value))}
                className="w-full px-2 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Rs. 500 Notes</label>
              <input
                type="number"
                min="0"
                value={denom500}
                onChange={(e) => setDenom500(Number(e.target.value))}
                className="w-full px-2 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Rs. 100 Notes</label>
              <input
                type="number"
                min="0"
                value={denom100}
                onChange={(e) => setDenom100(Number(e.target.value))}
                className="w-full px-2 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Rs. 50 Notes</label>
              <input
                type="number"
                min="0"
                value={denom50}
                onChange={(e) => setDenom50(Number(e.target.value))}
                className="w-full px-2 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Rs. 20 Notes/Coins</label>
              <input
                type="number"
                min="0"
                value={denom20}
                onChange={(e) => setDenom20(Number(e.target.value))}
                className="w-full px-2 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono"
              />
            </div>
          </div>

          {/* Variance Box */}
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Total Counted Balance:</span>
              <span className="text-white font-bold font-mono">Rs. {calculatedCountTotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Expected Book Balance:</span>
              <span className="text-slate-300 font-mono">Rs. {pettyCash.available?.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-xs border-t border-slate-800 pt-1">
              <span className="font-bold text-slate-200">Reconciliation Variance:</span>
              <span
                className={`font-black font-mono ${
                  countVariance === 0
                    ? "text-emerald-400"
                    : countVariance < 0
                    ? "text-rose-400"
                    : "text-amber-400"
                }`}
              >
                {countVariance === 0 ? "Rs. 0.00 (Zero Variance)" : `${countVariance < 0 ? "Shortage: -" : "Overage: +"} Rs. ${Math.abs(countVariance).toLocaleString()}`}
              </span>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1">
              Count Remarks / Auditor Notes
            </label>
            <input
              type="text"
              placeholder="e.g. End-of-day physical count verified by Dinusha"
              value={countNotes}
              onChange={(e) => setCountNotes(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setCountModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              loading={savingCount}
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold"
            >
              Confirm & Save Count
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
