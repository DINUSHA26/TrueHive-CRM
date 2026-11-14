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
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import type { CashFlowRecord } from "@/lib/store";

interface CashFlowViewProps {
  cashflow: CashFlowRecord[];
  onRefresh: () => void;
}

export function CashFlowView({ cashflow, onRefresh }: CashFlowViewProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [filterType, setFilterType] = useState<string>("ALL");
  const [search, setSearch] = useState("");

  // New Transaction State
  const [txType, setTxType] = useState<"INFLOW" | "OUTFLOW">("OUTFLOW");
  const [category, setCategory] = useState("RAW_MATERIAL_PO");
  const [amount, setAmount] = useState<number>(10000);
  const [paymentMethod, setPaymentMethod] = useState("BANK_TRANSFER");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  // Dynamic calculations
  const totalInflow = cashflow
    .filter((c) => c.type === "INCOME" || (c as any).type === "INFLOW")
    .reduce((sum, c) => sum + c.amount, 0);

  const totalOutflow = cashflow
    .filter((c) => c.type !== "INCOME" && (c as any).type !== "INFLOW")
    .reduce((sum, c) => sum + c.amount, 0);

  const netBalance = totalInflow - totalOutflow;

  const filtered = cashflow.filter((c) => {
    if (filterType === "INFLOW" && c.type !== "INCOME" && (c as any).type !== "INFLOW") return false;
    if (filterType === "OUTFLOW" && (c.type === "INCOME" || (c as any).type === "INFLOW")) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        c.description?.toLowerCase().includes(q) ||
        c.category?.toLowerCase().includes(q) ||
        c.paymentMethod?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleCreateTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await fetch("/api/finance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "CREATE_TRANSACTION",
          type: txType === "INFLOW" ? "INCOME" : "EXPENSE",
          category,
          amount,
          paymentMethod,
          description: notes.trim(),
        }),
      });
      setNotes("");
      setModalOpen(false);
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Wallet className="w-5 h-5 text-emerald-400" />
            Cash Flow & Financial Ledger
          </h2>
          <p className="text-xs text-slate-400">
            Real-time accounting ledger recording retail POS cash, customer transfers, and supplier expenses.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => setModalOpen(true)}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Record Transaction
        </Button>
      </div>

      {/* 3 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-semibold uppercase">TOTAL CASH INFLOW</span>
            <ArrowDownLeft className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-emerald-400">
            LKR {totalInflow.toLocaleString()}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">POS Sales & Customer Payments</p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-semibold uppercase">TOTAL OUTFLOW</span>
            <ArrowUpRight className="w-4 h-4 text-rose-400" />
          </div>
          <p className="text-2xl font-bold text-rose-400">
            LKR {totalOutflow.toLocaleString()}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Suppliers, Utilities & Operational</p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-semibold uppercase">NET CASH POSITION</span>
            <Wallet className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-2xl font-bold text-white">
            LKR {netBalance.toLocaleString()}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Available Liquidity</p>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {["ALL", "INFLOW", "OUTFLOW"].map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                filterType === t
                  ? "bg-blue-600 text-white"
                  : "bg-slate-950 border border-slate-800 text-slate-400 hover:text-white"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search transactions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Ledger Table */}
      <Card>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <EmptyState
              icon={<Wallet className="w-8 h-8" />}
              title="No cash flow records"
              description="Record income, retail sales, or business expenses to maintain live financial accounts."
              actionLabel="Record Transaction"
              onAction={() => setModalOpen(true)}
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Payment Method</TableHead>
                  <TableHead className="text-right">Amount (LKR)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((record) => {
                  const isInflow =
                    record.type === "INCOME" || (record as any).type === "INFLOW";
                  return (
                    <TableRow key={record.id}>
                      <TableCell className="text-xs text-slate-400 font-mono">
                        {(record as any).createdAt
                          ? new Date((record as any).createdAt).toLocaleString()
                          : "Today"}
                      </TableCell>
                      <TableCell className="font-medium text-white">
                        {record.description || "General Cash Flow Entry"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="neutral" size="sm">
                          {record.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-slate-300 font-medium">
                        {record.paymentMethod}
                      </TableCell>
                      <TableCell className="text-right font-bold text-sm">
                        <span className={isInflow ? "text-emerald-400" : "text-rose-400"}>
                          {isInflow ? "+" : "-"} LKR {record.amount.toLocaleString()}
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Record Transaction Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Record Cash Flow Transaction"
        description="Manually record income or expense into the general ledger."
        maxWidth="md"
      >
        <form onSubmit={handleCreateTransaction} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">
                Transaction Direction
              </label>
              <select
                value={txType}
                onChange={(e) => setTxType(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none"
              >
                <option value="OUTFLOW">Expense (Outflow)</option>
                <option value="INFLOW">Income (Inflow)</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none"
              >
                <option value="RAW_MATERIAL_PO">Raw Material / Supplier PO</option>
                <option value="UTILITIES">Electricity & Utilities</option>
                <option value="SALARY">Staff Salaries</option>
                <option value="MARKETING">Marketing & Advertising</option>
                <option value="RETAIL_SALE">Direct Retail Sale</option>
                <option value="OTHER">Other Operational</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">
                Amount (LKR) *
              </label>
              <input
                type="number"
                min="1"
                required
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">
                Payment Method
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none"
              >
                <option value="CASH">Cash Counter</option>
                <option value="BANK_TRANSFER">Bank Transfer</option>
                <option value="CARD">Debit / Credit Card</option>
                <option value="CHEQUE">Cheque</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1">
              Description / Memo
            </label>
            <input
              type="text"
              placeholder="e.g. Paid supplier invoice for flour restock"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" loading={saving}>
              Record Entry
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

