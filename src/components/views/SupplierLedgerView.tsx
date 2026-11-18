"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Truck,
  DollarSign,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Search,
  Plus,
  Trash2,
  Eye,
  RefreshCw,
  ShoppingBag,
  Package,
  Layers,
  Upload,
  Download,
  FileSpreadsheet,
  Receipt,
  ArrowUpRight,
} from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatCard } from "@/components/ui/StatCard";
import type { NavKey } from "@/components/layout/Sidebar";

export interface SupplierBillRecord {
  id: string;
  billNumber: string;
  supplierId: string;
  supplierName: string;
  poGrnNumber?: string;
  invoiceNumber?: string;
  receivedDate: string;
  invoiceDate: string;
  creditDays: number;
  dueDate: string;
  totalAmount: number;
  paidAmount: number;
  balance: number;
  status: "DUE" | "PARTIAL" | "PAID" | "OVERDUE";
  itemType: "PRODUCT" | "INGREDIENT" | "GENERAL";
  items?: string;
  notes?: string;
  supplier?: {
    id: string;
    supplierCode?: string;
    name: string;
    phone: string;
    contactPerson?: string;
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

interface SupplierLedgerViewProps {
  suppliers: any[];
  products: any[];
  ingredients: any[];
  onRefresh: () => void;
  onNavigate: (key: NavKey) => void;
}

export function SupplierLedgerView({
  suppliers,
  products,
  ingredients,
  onRefresh,
  onNavigate,
}: SupplierLedgerViewProps) {
  const [bills, setBills] = useState<SupplierBillRecord[]>([]);
  const [stats, setStats] = useState({
    totalOwed: 0,
    totalPaid: 0,
    totalOverdue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [itemTypeFilter, setItemTypeFilter] = useState("ALL");

  // Record Purchase Modal (Products & Ingredients)
  const [purchaseModalOpen, setPurchaseModalOpen] = useState(false);
  const [purSupplierId, setPurSupplierId] = useState("");
  const [purItemType, setPurItemType] = useState<"PRODUCT" | "INGREDIENT">("PRODUCT");
  const [purItemId, setPurItemId] = useState("");
  const [purCostPrice, setPurCostPrice] = useState<number | "">("");
  const [purSellingPrice, setPurSellingPrice] = useState<number | "">("");
  const [purOfferPrice, setPurOfferPrice] = useState<number | "">("");
  const [purQuantity, setPurQuantity] = useState<number | "">(10);
  const [purCreditDays, setPurCreditDays] = useState(30);
  const [purPoGrn, setPurPoGrn] = useState("");
  const [purInvoiceNo, setPurInvoiceNo] = useState("");
  const [purPaymentOption, setPurPaymentOption] = useState<"CREDIT" | "CASH">("CREDIT");
  const [purNotes, setPurNotes] = useState("");
  const [recordingPur, setRecordingPur] = useState(false);

  // Manual Bill Modal
  const [billModalOpen, setBillModalOpen] = useState(false);
  const [billSupplierId, setBillSupplierId] = useState("");
  const [billNumber, setBillNumber] = useState("");
  const [billPoGrn, setBillPoGrn] = useState("");
  const [billInvoiceNo, setBillInvoiceNo] = useState("");
  const [billAmount, setBillAmount] = useState<number | "">("");
  const [billCreditDays, setBillCreditDays] = useState(30);
  const [billNotes, setBillNotes] = useState("");
  const [savingBill, setSavingBill] = useState(false);

  // Settle Payment Modal
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [selectedBill, setSelectedBill] = useState<SupplierBillRecord | null>(null);
  const [payAmount, setPayAmount] = useState<number | "">("");
  const [payMethod, setPayMethod] = useState("BANK_TRANSFER");
  const [payRef, setPayRef] = useState("");
  const [payNotes, setPayNotes] = useState("");
  const [settling, setSettling] = useState(false);

  // View Bill Modal
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [viewBill, setViewBill] = useState<SupplierBillRecord | null>(null);

  // CSV Import Modal
  const [csvModalOpen, setCsvModalOpen] = useState(false);
  const [csvContent, setCsvContent] = useState("");
  const [importingCsv, setImportingCsv] = useState(false);

  const fetchSupplierBills = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/credit/supplier-bills");
      const data = await res.json();
      if (data.success) {
        setBills(data.bills || []);
        if (data.stats) setStats(data.stats);
      }
    } catch (err) {
      console.error("Failed to load supplier bills:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSupplierBills();
  }, [fetchSupplierBills]);

  // Filter bills
  const filteredBills = bills.filter((b) => {
    const q = search.toLowerCase();
    const matchesSearch =
      b.billNumber.toLowerCase().includes(q) ||
      b.supplierName.toLowerCase().includes(q) ||
      (b.poGrnNumber && b.poGrnNumber.toLowerCase().includes(q)) ||
      (b.invoiceNumber && b.invoiceNumber.toLowerCase().includes(q)) ||
      (b.supplier?.phone && b.supplier.phone.includes(q)) ||
      (b.supplier?.supplierCode && b.supplier.supplierCode.toLowerCase().includes(q));

    const matchesStatus =
      statusFilter === "ALL" || b.status.toUpperCase() === statusFilter.toUpperCase();

    const matchesItemType =
      itemTypeFilter === "ALL" || b.itemType.toUpperCase() === itemTypeFilter.toUpperCase();

    return matchesSearch && matchesStatus && matchesItemType;
  });

  // Handle Record Purchase (Products & Ingredients)
  const handleRecordPurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!purSupplierId) {
      alert("Please select a supplier.");
      return;
    }
    if (!purItemId) {
      alert("Please select an item.");
      return;
    }
    if (!purCostPrice || Number(purCostPrice) <= 0 || !purQuantity || Number(purQuantity) <= 0) {
      alert("Please enter a valid cost price and quantity.");
      return;
    }

    let itemName = "";
    if (purItemType === "PRODUCT") {
      const p = products.find((x) => x.id === purItemId);
      itemName = p?.name || "Product Item";
    } else {
      const ing = ingredients.find((x) => x.id === purItemId);
      itemName = ing?.name || "Ingredient Item";
    }

    setRecordingPur(true);
    try {
      const res = await fetch("/api/credit/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supplierId: purSupplierId,
          itemType: purItemType,
          itemId: purItemId,
          itemName,
          costPrice: Number(purCostPrice),
          sellingPrice: purItemType === "PRODUCT" && purSellingPrice ? Number(purSellingPrice) : undefined,
          offerPrice: purItemType === "PRODUCT" && purOfferPrice ? Number(purOfferPrice) : undefined,
          quantity: Number(purQuantity),
          creditDays: Number(purCreditDays),
          poGrnNumber: purPoGrn.trim() || undefined,
          invoiceNumber: purInvoiceNo.trim() || undefined,
          paymentOption: purPaymentOption,
          notes: purNotes.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setPurchaseModalOpen(false);
        setPurCostPrice("");
        setPurSellingPrice("");
        setPurOfferPrice("");
        setPurPoGrn("");
        setPurInvoiceNo("");
        setPurNotes("");
        fetchSupplierBills();
        onRefresh();
        alert(`Purchase recorded successfully! Stock incremented for "${itemName}".`);
      } else {
        alert(data.message || data.error || "Failed to record purchase");
      }
    } catch (err) {
      console.error(err);
      alert("Connection error recording purchase.");
    } finally {
      setRecordingPur(false);
    }
  };

  // Handle Manual Bill Creation
  const handleCreateManualBill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!billSupplierId || !billAmount || Number(billAmount) <= 0) {
      alert("Please select a supplier and enter a valid bill amount.");
      return;
    }

    setSavingBill(true);
    try {
      const res = await fetch("/api/credit/supplier-bills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supplierId: billSupplierId,
          billNumber: billNumber.trim() || undefined,
          poGrnNumber: billPoGrn.trim() || undefined,
          invoiceNumber: billInvoiceNo.trim() || undefined,
          totalAmount: Number(billAmount),
          creditDays: Number(billCreditDays),
          notes: billNotes.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setBillModalOpen(false);
        setBillAmount("");
        setBillNumber("");
        setBillPoGrn("");
        setBillInvoiceNo("");
        setBillNotes("");
        fetchSupplierBills();
        onRefresh();
      } else {
        alert(data.message || "Failed to create supplier bill");
      }
    } catch (err) {
      console.error(err);
      alert("Error creating bill.");
    } finally {
      setSavingBill(false);
    }
  };

  // Handle Payment Settlement
  const handleSettlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBill || !payAmount || Number(payAmount) <= 0) {
      alert("Please enter a valid payment amount.");
      return;
    }
    if (Number(payAmount) > selectedBill.balance) {
      alert(`Amount cannot exceed outstanding balance of Rs. ${selectedBill.balance.toLocaleString()}`);
      return;
    }

    setSettling(true);
    try {
      const res = await fetch(`/api/credit/supplier-bills/${selectedBill.id}/pay`, {
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
        fetchSupplierBills();
        onRefresh();
      } else {
        alert(data.message || "Failed to record payment");
      }
    } catch (err) {
      console.error(err);
      alert("Error settling supplier payment.");
    } finally {
      setSettling(false);
    }
  };

  // Handle Delete Bill
  const handleDeleteBill = async (billId: string) => {
    if (!confirm("Are you sure you want to delete this supplier bill? Outstanding debt will be reduced.")) {
      return;
    }

    try {
      const res = await fetch(`/api/credit/supplier-bills/${billId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        fetchSupplierBills();
        onRefresh();
      } else {
        alert(data.message || "Failed to delete bill");
      }
    } catch (err) {
      console.error(err);
      alert("Error deleting bill.");
    }
  };

  // CSV Sample Template Download
  const handleDownloadSampleCsv = () => {
    const csvContent =
      "supplierName,phone,contactPerson,creditLimit,creditDays,billNumber,poGrnNumber,invoiceNumber,itemType,totalAmount,paidAmount,dueDate,notes\n" +
      "Ceylon Fabrics Ltd,0112345678,Nimal Perera,250000,30,SB-9901,GRN-4421,INV-1090,PRODUCT,45000,0,2026-12-18,Cotton Fabric Rolls 100m\n" +
      "Lanka Spice Mill,0334567890,Sunil Silva,100000,15,SB-9902,GRN-4422,INV-1091,INGREDIENT,18500,5000,2026-12-05,Black Pepper 50kg\n";

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "truehive_supplier_bills_sample.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // CSV Import Parse & Submit
  const handleImportCsv = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvContent.trim()) {
      alert("Please paste or upload CSV content.");
      return;
    }

    try {
      const lines = csvContent.trim().split("\n");
      if (lines.length < 2) {
        alert("CSV must have a header row and at least one data row.");
        return;
      }

      const headers = lines[0].split(",").map((h) => h.trim());
      const rows = [];

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const values = line.split(",").map((v) => v.trim());
        const row: any = {};
        headers.forEach((h, idx) => {
          row[h] = values[idx] || "";
        });
        rows.push(row);
      }

      setImportingCsv(true);
      const res = await fetch("/api/credit/supplier-bills/bulk-import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(rows),
      });

      const data = await res.json();
      if (data.success) {
        alert(`Successfully imported ${data.importedCount} supplier bills!`);
        setCsvModalOpen(false);
        setCsvContent("");
        fetchSupplierBills();
        onRefresh();
      } else {
        alert(data.message || "Failed to import CSV");
      }
    } catch (err) {
      console.error(err);
      alert("Error parsing CSV.");
    } finally {
      setImportingCsv(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Truck className="w-6 h-6 text-emerald-400" />
            Supplier Ledger & Purchases (AP)
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Purchase products and raw ingredients on credit/cash, track payables, and manage settlements.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchSupplierBills}
            leftIcon={<RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />}
          >
            Refresh
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setCsvModalOpen(true)}
            leftIcon={<Upload className="w-4 h-4 text-indigo-400" />}
          >
            Import CSV
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setBillModalOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Add Bill
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              if (suppliers.length > 0 && !purSupplierId) setPurSupplierId(suppliers[0].id);
              if (purItemType === "PRODUCT" && products.length > 0 && !purItemId) setPurItemId(products[0].id);
              if (purItemType === "INGREDIENT" && ingredients.length > 0 && !purItemId) setPurItemId(ingredients[0].id);
              setPurchaseModalOpen(true);
            }}
            className="bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-600/20"
            leftIcon={<ShoppingBag className="w-4 h-4" />}
          >
            Record Purchase
          </Button>
        </div>
      </div>

      {/* 3 KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="TOTAL OWED"
          value={`Rs. ${(stats.totalOwed || 0).toLocaleString()}`}
          subtitle="Outstanding payables to suppliers"
          icon={<AlertCircle className="w-5 h-5" />}
          iconBg="bg-rose-600/20 text-rose-400 border border-rose-500/20"
        />
        <StatCard
          title="TOTAL PAID"
          value={`Rs. ${(stats.totalPaid || 0).toLocaleString()}`}
          subtitle="All-time settled payments"
          icon={<CheckCircle2 className="w-5 h-5" />}
          iconBg="bg-emerald-600/20 text-emerald-400 border border-emerald-500/20"
        />
        <StatCard
          title="TOTAL OVERDUE"
          value={`Rs. ${(stats.totalOverdue || 0).toLocaleString()}`}
          subtitle="Past due term date"
          icon={<Calendar className="w-5 h-5" />}
          iconBg="bg-amber-600/20 text-amber-400 border border-amber-500/20"
        />
      </div>

      {/* Table & Filter Card */}
      <Card>
        <CardHeader className="border-b border-slate-800/80 pb-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Search */}
            <div className="relative w-full max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search Bill #, Supplier, PO/GRN, Phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Filter Dropdowns with Clear Labels */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Payment Status Dropdown */}
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-medium text-slate-400 shrink-0">Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 cursor-pointer shadow-sm"
                >
                  <option value="ALL">All Payment Statuses</option>
                  <option value="DUE">Due (Unpaid Bills)</option>
                  <option value="PARTIAL">Partially Paid</option>
                  <option value="PAID">Fully Paid</option>
                  <option value="OVERDUE">Overdue (Past Term)</option>
                </select>
              </div>

              {/* Item Type Dropdown */}
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-medium text-slate-400 shrink-0">Item Type:</span>
                <select
                  value={itemTypeFilter}
                  onChange={(e) => setItemTypeFilter(e.target.value)}
                  className="bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 cursor-pointer shadow-sm"
                >
                  <option value="ALL">All Item Categories</option>
                  <option value="PRODUCT">Finished Products</option>
                  <option value="INGREDIENT">Raw Ingredients</option>
                </select>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <div className="py-16 text-center text-slate-400 text-sm">
              Loading supplier ledger bills...
            </div>
          ) : filteredBills.length === 0 ? (
            <EmptyState
              icon={<Truck className="w-8 h-8" />}
              title="No supplier bills found"
              description="Record a product or raw ingredient purchase to automatically track stock and accounts payable."
              actionLabel="Record Purchase"
              onAction={() => setPurchaseModalOpen(true)}
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Bill / Invoice #</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>PO / GRN</TableHead>
                    <TableHead>Item Type</TableHead>
                    <TableHead>Received Date</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Total Amount</TableHead>
                    <TableHead>Paid</TableHead>
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
                            <Receipt className="w-3.5 h-3.5 text-emerald-400" />
                            {b.billNumber}
                          </div>
                          {b.invoiceNumber && (
                            <span className="text-[10px] text-slate-400">Inv: {b.invoiceNumber}</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-semibold text-white text-xs">{b.supplierName}</p>
                            <p className="text-[11px] text-slate-400 font-mono">
                              {b.supplier?.supplierCode || "SUPP"} • {b.supplier?.phone || "-"}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-mono text-xs text-slate-300">
                            {b.poGrnNumber || "-"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              b.itemType === "PRODUCT"
                                ? "success"
                                : b.itemType === "INGREDIENT"
                                ? "primary"
                                : "neutral"
                            }
                            size="sm"
                          >
                            {b.itemType}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs text-slate-300">
                            {new Date(b.receivedDate).toLocaleDateString()}
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
                                onClick={() => {
                                  setSelectedBill(b);
                                  setPayAmount(b.balance);
                                  setPayModalOpen(true);
                                }}
                                className="text-xs py-1 px-2.5 bg-emerald-600 hover:bg-emerald-500"
                                leftIcon={<DollarSign className="w-3.5 h-3.5" />}
                              >
                                Settle
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setViewBill(b);
                                setViewModalOpen(true);
                              }}
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

      {/* Record Purchase Modal (Products & Raw Ingredients) */}
      <Modal
        isOpen={purchaseModalOpen}
        onClose={() => setPurchaseModalOpen(false)}
        title="Record Purchase (Products & Raw Ingredients)"
        description="Receive stock atomically into inventory and record supplier payable debt or cash outlay."
        maxWidth="xl"
      >
        <form onSubmit={handleRecordPurchase} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">Select Supplier *</label>
              <select
                required
                value={purSupplierId}
                onChange={(e) => {
                  setPurSupplierId(e.target.value);
                  const sup = suppliers.find((s) => s.id === e.target.value);
                  if (sup?.creditDays) setPurCreditDays(sup.creditDays);
                }}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="">-- Choose Supplier --</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.supplierCode || "SUPP"}) - Limit: Rs. {(s.creditLimit || 0).toLocaleString()}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">Inventory Item Category *</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setPurItemType("PRODUCT");
                    if (products.length > 0) setPurItemId(products[0].id);
                  }}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border transition ${
                    purItemType === "PRODUCT"
                      ? "bg-emerald-600/20 border-emerald-500 text-emerald-400"
                      : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  <Package className="w-3.5 h-3.5" />
                  Product (Retail)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPurItemType("INGREDIENT");
                    if (ingredients.length > 0) setPurItemId(ingredients[0].id);
                  }}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border transition ${
                    purItemType === "INGREDIENT"
                      ? "bg-blue-600/20 border-blue-500 text-blue-400"
                      : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  Raw Ingredient
                </button>
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1">
              Select {purItemType === "PRODUCT" ? "Retail Product" : "Raw Ingredient"} *
            </label>
            <select
              required
              value={purItemId}
              onChange={(e) => {
                setPurItemId(e.target.value);
                if (purItemType === "PRODUCT") {
                  const p = products.find((x) => x.id === e.target.value);
                  if (p) {
                    if (p.costPrice) setPurCostPrice(p.costPrice);
                    if (p.sellingPrice) setPurSellingPrice(p.sellingPrice);
                    if (p.offerPrice) setPurOfferPrice(p.offerPrice);
                  }
                } else {
                  const ing = ingredients.find((x) => x.id === e.target.value);
                  if (ing?.unitCost) setPurCostPrice(ing.unitCost);
                }
              }}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="">-- Choose Item --</option>
              {purItemType === "PRODUCT"
                ? products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (Stock: {p.currentStock}) - Sell: Rs. {p.sellingPrice} / Cost: Rs. {p.costPrice || 0}
                    </option>
                  ))
                : ingredients.map((ing) => (
                    <option key={ing.id} value={ing.id}>
                      {ing.name} ({ing.unit}) - Stock: {ing.currentStock} / Cost: Rs. {ing.unitCost || 0}
                    </option>
                  ))}
            </select>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">Cost Price (Rs.) *</label>
              <input
                type="number"
                required
                min={0.01}
                step="any"
                placeholder="Buying cost"
                value={purCostPrice}
                onChange={(e) => setPurCostPrice(e.target.value === "" ? "" : Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">Quantity *</label>
              <input
                type="number"
                required
                min={1}
                step="any"
                value={purQuantity}
                onChange={(e) => setPurQuantity(e.target.value === "" ? "" : Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>

            {purItemType === "PRODUCT" && (
              <>
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">Selling Price</label>
                  <input
                    type="number"
                    min={0}
                    step="any"
                    placeholder="Retail price"
                    value={purSellingPrice}
                    onChange={(e) => setPurSellingPrice(e.target.value === "" ? "" : Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">Offer Price</label>
                  <input
                    type="number"
                    min={0}
                    step="any"
                    placeholder="Offer price"
                    value={purOfferPrice}
                    onChange={(e) => setPurOfferPrice(e.target.value === "" ? "" : Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">Payment Method</label>
              <select
                value={purPaymentOption}
                onChange={(e) => setPurPaymentOption(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="CREDIT">Credit (Accounts Payable)</option>
                <option value="CASH">Cash (Immediate Paid Out)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">Credit Days Term</label>
              <input
                type="number"
                min={1}
                disabled={purPaymentOption === "CASH"}
                value={purCreditDays}
                onChange={(e) => setPurCreditDays(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500 disabled:opacity-50"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">PO / GRN Number</label>
              <input
                type="text"
                placeholder="e.g. GRN-2201"
                value={purPoGrn}
                onChange={(e) => setPurPoGrn(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex justify-between items-center text-xs">
            <span className="text-slate-400">Total Purchase Cost:</span>
            <span className="text-base font-extrabold text-emerald-400 font-mono">
              Rs. {((Number(purCostPrice) || 0) * (Number(purQuantity) || 0)).toLocaleString()}
            </span>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
            <Button type="button" variant="outline" size="sm" onClick={() => setPurchaseModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" loading={recordingPur} className="bg-emerald-600 hover:bg-emerald-500">
              Confirm & Receive Stock
            </Button>
          </div>
        </form>
      </Modal>

      {/* Manual Bill Modal */}
      <Modal
        isOpen={billModalOpen}
        onClose={() => setBillModalOpen(false)}
        title="Add Supplier Bill (Invoice Entry)"
        description="Record an existing supplier bill or general operational invoice."
        maxWidth="md"
      >
        <form onSubmit={handleCreateManualBill} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1">Select Supplier *</label>
            <select
              required
              value={billSupplierId}
              onChange={(e) => {
                setBillSupplierId(e.target.value);
                const s = suppliers.find((x) => x.id === e.target.value);
                if (s?.creditDays) setBillCreditDays(s.creditDays);
              }}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="">-- Choose Supplier --</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.supplierCode || "SUPP"})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">Bill / Invoice #</label>
              <input
                type="text"
                placeholder="Auto if blank"
                value={billNumber}
                onChange={(e) => setBillNumber(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">PO / GRN #</label>
              <input
                type="text"
                placeholder="Optional"
                value={billPoGrn}
                onChange={(e) => setBillPoGrn(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
              />
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
                value={billAmount}
                onChange={(e) => setBillAmount(e.target.value === "" ? "" : Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">Credit Days</label>
              <input
                type="number"
                min={1}
                value={billCreditDays}
                onChange={(e) => setBillCreditDays(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1">Notes</label>
            <input
              type="text"
              placeholder="Description or notes"
              value={billNotes}
              onChange={(e) => setBillNotes(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
            <Button type="button" variant="outline" size="sm" onClick={() => setBillModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" loading={savingBill}>
              Save Bill
            </Button>
          </div>
        </form>
      </Modal>

      {/* Settle Payment Modal */}
      <Modal
        isOpen={payModalOpen}
        onClose={() => setPayModalOpen(false)}
        title="Settle Supplier Bill Payment"
        description={selectedBill ? `Bill #${selectedBill.billNumber} (${selectedBill.supplierName})` : ""}
        maxWidth="md"
      >
        {selectedBill && (
          <form onSubmit={handleSettlePayment} className="space-y-4">
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex justify-between items-center text-xs">
              <div>
                <p className="text-slate-400">Total Bill</p>
                <p className="font-bold text-white text-sm">Rs. {selectedBill.totalAmount.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-slate-400">Paid So Far</p>
                <p className="font-bold text-emerald-400 text-sm">Rs. {selectedBill.paidAmount.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-slate-400">Remaining Balance</p>
                <p className="font-extrabold text-rose-400 text-base">Rs. {selectedBill.balance.toLocaleString()}</p>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-medium text-slate-300">Payment Amount (Rs.) *</label>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => setPayAmount(selectedBill.balance)}
                    className="text-[11px] text-emerald-400 hover:underline"
                  >
                    Full Balance
                  </button>
                  <span className="text-slate-600">|</span>
                  <button
                    type="button"
                    onClick={() => setPayAmount(Math.round(selectedBill.balance / 2))}
                    className="text-[11px] text-emerald-400 hover:underline"
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
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm font-mono text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Payment Method</label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                  <option value="CHEQUE">Cheque</option>
                  <option value="CASH">Cash</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Reference / Cheque #</label>
                <input
                  type="text"
                  placeholder="e.g. TX-4920"
                  value={payRef}
                  onChange={(e) => setPayRef(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Payment history */}
            {selectedBill.payments && selectedBill.payments.length > 0 && (
              <div className="pt-2 border-t border-slate-800">
                <p className="text-xs font-semibold text-slate-400 mb-1.5">Payment Trail:</p>
                <div className="space-y-1.5 max-h-32 overflow-y-auto">
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
              <Button type="submit" variant="primary" size="sm" loading={settling} className="bg-emerald-600 hover:bg-emerald-500">
                Confirm Settlement
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* CSV Bulk Import Modal */}
      <Modal
        isOpen={csvModalOpen}
        onClose={() => setCsvModalOpen(false)}
        title="Bulk Import Supplier Bills (CSV)"
        description="Import multiple supplier invoices and bills from a CSV spreadsheet."
        maxWidth="lg"
      >
        <form onSubmit={handleImportCsv} className="space-y-4 text-xs">
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800">
            <div>
              <p className="font-semibold text-white">Need the template format?</p>
              <p className="text-slate-400 text-[11px]">Download our standardized CSV sample.</p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDownloadSampleCsv}
              leftIcon={<Download className="w-3.5 h-3.5" />}
            >
              Download Sample CSV
            </Button>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1">Paste CSV Contents</label>
            <textarea
              rows={8}
              required
              value={csvContent}
              onChange={(e) => setCsvContent(e.target.value)}
              placeholder="supplierName,phone,contactPerson,creditLimit,creditDays,billNumber,poGrnNumber,invoiceNumber,itemType,totalAmount,paidAmount,dueDate,notes&#10;Ceylon Fabrics,0112345678,Nimal,250000,30,SB-101,GRN-01,INV-10,PRODUCT,50000,0,2026-12-18,Fabric roll"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl font-mono text-[11px] text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
            <Button type="button" variant="outline" size="sm" onClick={() => setCsvModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" loading={importingCsv} className="bg-emerald-600 hover:bg-emerald-500">
              Import Bills
            </Button>
          </div>
        </form>
      </Modal>

      {/* View Bill Details Modal */}
      <Modal
        isOpen={viewModalOpen}
        onClose={() => setViewModalOpen(false)}
        title="Supplier Bill Details"
        description={viewBill ? `Bill #${viewBill.billNumber}` : ""}
        maxWidth="lg"
      >
        {viewBill && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 rounded-xl bg-slate-900 border border-slate-800">
              <div>
                <p className="text-slate-400">Supplier</p>
                <p className="font-bold text-white text-sm">{viewBill.supplierName}</p>
                <p className="text-[11px] text-slate-400">{viewBill.supplier?.phone}</p>
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

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-slate-300">
              <div>
                <span className="text-slate-500">PO / GRN: </span>
                <span className="font-mono">{viewBill.poGrnNumber || "-"}</span>
              </div>
              <div>
                <span className="text-slate-500">Invoice #: </span>
                <span className="font-mono">{viewBill.invoiceNumber || "-"}</span>
              </div>
              <div>
                <span className="text-slate-500">Item Type: </span>
                <span>{viewBill.itemType}</span>
              </div>
              <div>
                <span className="text-slate-500">Status: </span>
                <span className="font-semibold text-emerald-400">{viewBill.status}</span>
              </div>
            </div>

            {/* Items detail if JSON */}
            {viewBill.items && (
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <p className="font-semibold text-slate-300 mb-2">Purchased Items Breakdown:</p>
                {(() => {
                  try {
                    const parsed = JSON.parse(viewBill.items);
                    if (Array.isArray(parsed)) {
                      return (
                        <div className="space-y-1">
                          {parsed.map((it, idx) => (
                            <div key={idx} className="flex justify-between items-center text-[11px] py-1 border-b border-slate-900">
                              <span className="text-white font-medium">{it.itemName || it.name} (x{it.quantity})</span>
                              <span className="text-emerald-400 font-mono">Rs. {(it.totalCost || it.costPrice * it.quantity || 0).toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                      );
                    }
                  } catch {
                    return <p className="text-slate-400">{viewBill.items}</p>;
                  }
                })()}
              </div>
            )}

            {/* Payments */}
            <div className="pt-2 border-t border-slate-800">
              <h4 className="font-bold text-white mb-2">Payment Settlements ({viewBill.payments?.length || 0})</h4>
              {!viewBill.payments || viewBill.payments.length === 0 ? (
                <p className="text-slate-500 italic">No payments made yet.</p>
              ) : (
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {viewBill.payments.map((p) => (
                    <div key={p.id} className="flex justify-between items-center p-2 rounded-lg bg-slate-900 border border-slate-800">
                      <div>
                        <p className="font-medium text-white">{p.paymentMethod} {p.reference ? `• ${p.reference}` : ""}</p>
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
