"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  CreditCard,
  DollarSign,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle2,
  Search,
  Plus,
  Trash2,
  Eye,
  RefreshCw,
  UserCheck,
  Receipt,
  ArrowDownLeft,
  FileText,
} from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatCard } from "@/components/ui/StatCard";
import type { NavKey } from "@/components/layout/Sidebar";

export interface CustomerCreditBillRecord {
  id: string;
  billNumber: string;
  customerId: string;
  customerName: string;
  orderId?: string;
  creditType: string;
  bankCheque?: string;
  chequeDate?: string;
  totalAmount: number;
  paidAmount: number;
  balance: number;
  dateGiven: string;
  dueDate?: string;
  status: "PENDING" | "PARTIAL" | "PAID" | "OVERDUE" | "DUE";
  notes?: string;
  customer?: {
    id: string;
    customerCode?: string;
    name: string;
    phone: string;
    creditLimit?: number;
    creditBalance?: number;
  };
  payments?: {
    id: string;
    amount: number;
    paymentDate: string;
    paymentMethod: string;
    reference?: string;
    notes?: string;
  }[];
}

interface CustomerCreditViewProps {
  customers: any[];
  onRefresh: () => void;
  onNavigate: (key: NavKey) => void;
}

export function CustomerCreditView({ customers, onRefresh, onNavigate }: CustomerCreditViewProps) {
  const [bills, setBills] = useState<CustomerCreditBillRecord[]>([]);
  const [stats, setStats] = useState({
    todayCreditGiven: 0,
    todayPaymentsReceived: 0,
    thisMonthCredit: 0,
    totalRemainingBalance: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Create Bill Modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [customBillNumber, setCustomBillNumber] = useState("");
  const [creditType, setCreditType] = useState("Credit");
  const [billAmount, setBillAmount] = useState<number | "">("");
  const [creditDays, setCreditDays] = useState(30);
  const [billNotes, setBillNotes] = useState("");
  const [savingBill, setSavingBill] = useState(false);

  // Payment Settlement Modal
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [selectedBill, setSelectedBill] = useState<CustomerCreditBillRecord | null>(null);
  const [payAmount, setPayAmount] = useState<number | "">("");
  const [payMethod, setPayMethod] = useState("CASH");
  const [payRef, setPayRef] = useState("");
  const [payNotes, setPayNotes] = useState("");
  const [savingPayment, setSavingPayment] = useState(false);

  // View Bill Details Modal
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [viewBill, setViewBill] = useState<CustomerCreditBillRecord | null>(null);

  const fetchCreditData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/credit/customer-bills");
      const data = await res.json();
      if (data.success) {
        setBills(data.bills || []);
        if (data.stats) setStats(data.stats);
      }
    } catch (err) {
      console.error("Failed to load customer credit data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCreditData();
  }, [fetchCreditData]);

  // Filter bills
  const filteredBills = bills.filter((b) => {
    const matchesSearch =
      b.billNumber.toLowerCase().includes(search.toLowerCase()) ||
      b.customerName.toLowerCase().includes(search.toLowerCase()) ||
      (b.customer?.phone && b.customer.phone.includes(search)) ||
      (b.customer?.customerCode && b.customer.customerCode.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus =
      statusFilter === "ALL" ||
      b.status.toUpperCase() === statusFilter.toUpperCase() ||
      (statusFilter === "DUE" && (b.status === "PENDING" || b.status === "DUE"));

    return matchesSearch && matchesStatus;
  });

  const handleCreateBill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId || !billAmount || Number(billAmount) <= 0) {
      alert("Please select a customer and enter a valid bill amount.");
      return;
    }

    setSavingBill(true);
    try {
      const res = await fetch("/api/credit/customer-bills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: selectedCustomerId,
          billNumber: customBillNumber.trim() || undefined,
          creditType,
          totalAmount: Number(billAmount),
          creditDays: Number(creditDays),
          notes: billNotes.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setCreateModalOpen(false);
        setBillAmount("");
        setBillNotes("");
        setCustomBillNumber("");
        fetchCreditData();
        onRefresh();
      } else {
        alert(data.message || data.error || "Failed to create credit bill");
      }
    } catch (err) {
      console.error(err);
      alert("Connection error while creating credit bill.");
    } finally {
      setSavingBill(false);
    }
  };

  const handleSettlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBill || !payAmount || Number(payAmount) <= 0) {
      alert("Please enter a valid payment amount.");
      return;
    }

    if (Number(payAmount) > selectedBill.balance) {
      alert(`Amount cannot exceed the remaining balance of Rs. ${selectedBill.balance.toLocaleString()}`);
      return;
    }

    setSavingPayment(true);
    try {
      const res = await fetch(`/api/credit/customer-bills/${selectedBill.id}/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: Number(payAmount),
          paymentMethod: payMethod,
          reference: payRef.trim() || undefined,
          notes: payNotes.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setPayModalOpen(false);
        setSelectedBill(null);
        setPayAmount("");
        setPayRef("");
        setPayNotes("");
        fetchCreditData();
        onRefresh();
      } else {
        alert(data.message || data.error || "Failed to record payment");
      }
    } catch (err) {
      console.error(err);
      alert("Error submitting payment.");
    } finally {
      setSavingPayment(false);
    }
  };

  const handleDeleteBill = async (billId: string) => {
    if (!confirm("Are you sure you want to delete this credit bill? Unpaid balance will be deducted from customer debt.")) {
      return;
    }

    try {
      const res = await fetch(`/api/credit/customer-bills/${billId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        fetchCreditData();
        onRefresh();
      } else {
        alert(data.message || "Failed to delete bill");
      }
    } catch (err) {
      console.error(err);
      alert("Error deleting bill.");
    }
  };

  const openPayModal = (bill: CustomerCreditBillRecord) => {
    setSelectedBill(bill);
    setPayAmount(bill.balance);
    setPayModalOpen(true);
  };

  const openViewModal = (bill: CustomerCreditBillRecord) => {
    setViewBill(bill);
    setViewModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-indigo-400" />
            Customer Credit Bills (AR Center)
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage customer credit sales, outstanding balances, and payment settlements.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchCreditData}
            leftIcon={<RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />}
          >
            Refresh
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setCreateModalOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Add Credit Bill
          </Button>
        </div>
      </div>

      {/* 4 KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="TODAY'S CREDIT GIVEN"
          value={`Rs. ${(stats.todayCreditGiven || 0).toLocaleString()}`}
          subtitle="Issued today"
          icon={<ArrowDownLeft className="w-5 h-5" />}
          iconBg="bg-blue-600/20 text-blue-400 border border-blue-500/20"
        />
        <StatCard
          title="TODAY'S PAYMENTS RECEIVED"
          value={`Rs. ${(stats.todayPaymentsReceived || 0).toLocaleString()}`}
          subtitle="Collected today"
          icon={<CheckCircle2 className="w-5 h-5" />}
          iconBg="bg-emerald-600/20 text-emerald-400 border border-emerald-500/20"
        />
        <StatCard
          title="THIS MONTH'S CREDIT"
          value={`Rs. ${(stats.thisMonthCredit || 0).toLocaleString()}`}
          subtitle="Total credit this month"
          icon={<Calendar className="w-5 h-5" />}
          iconBg="bg-purple-600/20 text-purple-400 border border-purple-500/20"
        />
        <StatCard
          title="TOTAL REMAINING BALANCE"
          value={`Rs. ${(stats.totalRemainingBalance || 0).toLocaleString()}`}
          subtitle="Active customer debt"
          icon={<AlertCircle className="w-5 h-5" />}
          iconBg="bg-rose-600/20 text-rose-400 border border-rose-500/20"
        />
      </div>

      {/* Filter and Table Card */}
      <Card>
        <CardHeader className="border-b border-slate-800/80 pb-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Search */}
            <div className="relative w-full max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search by Bill #, Customer name, Phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Credit Bill Status Dropdown */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-medium text-slate-400 shrink-0">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer shadow-sm"
              >
                <option value="ALL">All Credit Bills</option>
                <option value="DUE">Due (Unsettled Invoices)</option>
                <option value="PARTIAL">Partially Settled</option>
                <option value="PAID">Fully Settled</option>
                <option value="OVERDUE">Overdue (Past Credit Term)</option>
              </select>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <div className="py-16 text-center text-slate-400 text-sm">
              Loading credit bills...
            </div>
          ) : filteredBills.length === 0 ? (
            <EmptyState
              icon={<CreditCard className="w-8 h-8" />}
              title="No credit bills found"
              description="Record a manual credit bill or checkout with Credit payment in POS."
              actionLabel="Add Credit Bill"
              onAction={() => setCreateModalOpen(true)}
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Bill / Invoice #</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Date Given</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Total Amount</TableHead>
                    <TableHead>Paid Amount</TableHead>
                    <TableHead>Balance</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBills.map((b) => {
                    const isOverdue = b.status === "OVERDUE";
                    return (
                      <TableRow key={b.id}>
                        <TableCell>
                          <div className="font-mono font-semibold text-white flex items-center gap-1.5">
                            <Receipt className="w-3.5 h-3.5 text-indigo-400" />
                            {b.billNumber}
                          </div>
                          {b.creditType && (
                            <span className="text-[10px] text-slate-400">{b.creditType}</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-semibold text-white text-xs">{b.customerName}</p>
                            <p className="text-[11px] text-slate-400 font-mono">
                              {b.customer?.customerCode || "CUST"} • {b.customer?.phone || "-"}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs text-slate-300">
                            {new Date(b.dateGiven).toLocaleDateString()}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span
                            className={`text-xs font-medium ${
                              isOverdue ? "text-rose-400 font-bold" : "text-slate-300"
                            }`}
                          >
                            {b.dueDate ? new Date(b.dueDate).toLocaleDateString() : "30 Days"}
                          </span>
                        </TableCell>
                        <TableCell className="font-semibold text-white">
                          Rs. {b.totalAmount.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-emerald-400 font-medium">
                          Rs. {b.paidAmount.toLocaleString()}
                        </TableCell>
                        <TableCell className="font-bold text-rose-400">
                          Rs. {b.balance.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              b.status === "PAID"
                                ? "success"
                                : b.status === "PARTIAL"
                                ? "warning"
                                : b.status === "OVERDUE"
                                ? "danger"
                                : "primary"
                            }
                            size="sm"
                          >
                            {b.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {b.balance > 0 && (
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={() => openPayModal(b)}
                                className="text-xs py-1 px-2.5 bg-emerald-600 hover:bg-emerald-500"
                                leftIcon={<DollarSign className="w-3.5 h-3.5" />}
                              >
                                Settle
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openViewModal(b)}
                              className="text-xs py-1 px-2 text-slate-300"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteBill(b.id)}
                              className="text-xs py-1 px-2 text-rose-400 hover:bg-rose-500/10 border-rose-500/30"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Settle Payment Modal */}
      <Modal
        isOpen={payModalOpen}
        onClose={() => setPayModalOpen(false)}
        title="Settle Customer Credit Payment"
        description={selectedBill ? `Bill #${selectedBill.billNumber} for ${selectedBill.customerName}` : ""}
        maxWidth="md"
      >
        {selectedBill && (
          <form onSubmit={handleSettlePayment} className="space-y-4">
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex justify-between items-center text-xs">
              <div>
                <p className="text-slate-400">Total Bill Amount</p>
                <p className="text-sm font-bold text-white">Rs. {selectedBill.totalAmount.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-slate-400">Already Paid</p>
                <p className="text-sm font-bold text-emerald-400">Rs. {selectedBill.paidAmount.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-slate-400">Outstanding Balance</p>
                <p className="text-base font-extrabold text-rose-400">Rs. {selectedBill.balance.toLocaleString()}</p>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-slate-300">Payment Amount (Rs.) *</label>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => setPayAmount(selectedBill.balance)}
                    className="text-[11px] text-indigo-400 hover:underline"
                  >
                    Full Balance
                  </button>
                  <span className="text-slate-600">|</span>
                  <button
                    type="button"
                    onClick={() => setPayAmount(Math.round(selectedBill.balance / 2))}
                    className="text-[11px] text-indigo-400 hover:underline"
                  >
                    50%
                  </button>
                </div>
              </div>
              <input
                type="number"
                required
                min={1}
                max={selectedBill.balance}
                step="any"
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value === "" ? "" : Number(e.target.value))}
                placeholder={`Max Rs. ${selectedBill.balance}`}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm font-mono text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Payment Method</label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="CASH">Cash</option>
                  <option value="CARD">Card</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                  <option value="CHEQUE">Cheque</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Ref / Cheque #</label>
                <input
                  type="text"
                  placeholder="e.g. CHQ-99120"
                  value={payRef}
                  onChange={(e) => setPayRef(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">Notes / Remarks</label>
              <input
                type="text"
                placeholder="Optional payment notes"
                value={payNotes}
                onChange={(e) => setPayNotes(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Payment history on this bill */}
            {selectedBill.payments && selectedBill.payments.length > 0 && (
              <div className="pt-2 border-t border-slate-800">
                <p className="text-xs font-semibold text-slate-400 mb-1.5">Previous Payments on this Bill:</p>
                <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                  {selectedBill.payments.map((p) => (
                    <div
                      key={p.id}
                      className="flex justify-between items-center text-[11px] p-2 rounded-lg bg-slate-950/70 border border-slate-800/80"
                    >
                      <span className="text-slate-300">
                        {new Date(p.paymentDate).toLocaleDateString()} • {p.paymentMethod}
                        {p.reference ? ` (${p.reference})` : ""}
                      </span>
                      <span className="font-bold text-emerald-400">Rs. {p.amount.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <Button type="button" variant="outline" size="sm" onClick={() => setPayModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" loading={savingPayment}>
                Confirm Payment
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Manual Credit Bill Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Create Customer Credit Bill"
        description="Issue a new credit invoice directly to a registered customer."
        maxWidth="md"
      >
        <form onSubmit={handleCreateBill} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1">Select Customer *</label>
            <select
              required
              value={selectedCustomerId}
              onChange={(e) => {
                setSelectedCustomerId(e.target.value);
                const cust = customers.find((c) => c.id === e.target.value);
                if (cust?.creditDays) setCreditDays(cust.creditDays);
              }}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="">-- Choose Customer --</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.customerCode || "CUST"} • {c.phone}) - Bal: Rs. {(c.creditBalance || 0).toLocaleString()} / Limit: Rs. {(c.creditLimit || 0).toLocaleString()}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">Bill / Invoice # (Optional)</label>
              <input
                type="text"
                placeholder="Auto-generated if blank"
                value={customBillNumber}
                onChange={(e) => setCustomBillNumber(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">Credit Type</label>
              <select
                value={creditType}
                onChange={(e) => setCreditType(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="Credit">Credit</option>
                <option value="Cheque">Cheque</option>
                <option value="Cash">Cash Advance</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">Total Amount (Rs.) *</label>
              <input
                type="number"
                required
                min={1}
                step="any"
                placeholder="e.g. 15000"
                value={billAmount}
                onChange={(e) => setBillAmount(e.target.value === "" ? "" : Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">Credit Days Term</label>
              <input
                type="number"
                min={1}
                value={creditDays}
                onChange={(e) => setCreditDays(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1">Notes / Item Details</label>
            <textarea
              rows={2}
              placeholder="e.g. Wholesale order 10 items"
              value={billNotes}
              onChange={(e) => setBillNotes(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
            <Button type="button" variant="outline" size="sm" onClick={() => setCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" loading={savingBill}>
              Save Credit Bill
            </Button>
          </div>
        </form>
      </Modal>

      {/* View Bill Details Modal */}
      <Modal
        isOpen={viewModalOpen}
        onClose={() => setViewModalOpen(false)}
        title="Credit Bill Details"
        description={viewBill ? `Invoice #${viewBill.billNumber}` : ""}
        maxWidth="lg"
      >
        {viewBill && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 rounded-xl bg-slate-900 border border-slate-800">
              <div>
                <p className="text-slate-400">Customer</p>
                <p className="font-bold text-white text-sm">{viewBill.customerName}</p>
                <p className="text-[11px] text-slate-400">{viewBill.customer?.phone}</p>
              </div>
              <div>
                <p className="text-slate-400">Total Amount</p>
                <p className="font-bold text-white text-sm">Rs. {viewBill.totalAmount.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-slate-400">Paid Amount</p>
                <p className="font-bold text-emerald-400 text-sm">Rs. {viewBill.paidAmount.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-slate-400">Remaining</p>
                <p className="font-bold text-rose-400 text-sm">Rs. {viewBill.balance.toLocaleString()}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-slate-300">
              <div>
                <span className="text-slate-500">Date Given: </span>
                {new Date(viewBill.dateGiven).toLocaleString()}
              </div>
              <div>
                <span className="text-slate-500">Due Date: </span>
                {viewBill.dueDate ? new Date(viewBill.dueDate).toLocaleDateString() : "30 Days"}
              </div>
              <div>
                <span className="text-slate-500">Credit Type: </span>
                {viewBill.creditType}
              </div>
              <div>
                <span className="text-slate-500">Status: </span>
                <span className="font-semibold text-indigo-400">{viewBill.status}</span>
              </div>
            </div>

            {viewBill.notes && (
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-300">
                <span className="text-slate-500 block mb-1">Notes:</span>
                {viewBill.notes}
              </div>
            )}

            {/* Payments */}
            <div className="pt-2 border-t border-slate-800">
              <h4 className="font-bold text-white mb-2 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-indigo-400" />
                Payment Audit Trail ({viewBill.payments?.length || 0})
              </h4>
              {!viewBill.payments || viewBill.payments.length === 0 ? (
                <p className="text-slate-500 italic">No payments recorded yet.</p>
              ) : (
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {viewBill.payments.map((p) => (
                    <div
                      key={p.id}
                      className="flex justify-between items-center p-2 rounded-lg bg-slate-900 border border-slate-800"
                    >
                      <div>
                        <p className="font-medium text-white">
                          {p.paymentMethod} {p.reference ? `• ${p.reference}` : ""}
                        </p>
                        <p className="text-[10px] text-slate-400">{new Date(p.paymentDate).toLocaleString()}</p>
                      </div>
                      <p className="font-bold text-emerald-400 text-sm">Rs. {p.amount.toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-800">
              <Button variant="outline" size="sm" onClick={() => setViewModalOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
