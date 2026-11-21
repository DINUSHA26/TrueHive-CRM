"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";
import {
  FileText,
  Plus,
  Search,
  Eye,
  Edit2,
  Trash2,
  Printer,
  Download,
  CheckCircle2,
  X,
  ArrowLeft,
  Receipt,
  Building2,
  Phone,
  Mail,
  MapPin,
  Calendar,
  DollarSign,
  User,
  Layers,
  ChevronDown,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import type { CustomerRecord } from "./CrmView";
import type { ProductItem, QuotationRecord, QuotationItemRecord, OrderRecord } from "@/lib/store";

interface Props {
  products?: ProductItem[];
  customers?: CustomerRecord[];
  onRefresh?: () => void;
  onOpenA4Invoice?: (order: OrderRecord) => void;
}

// Convert numbers into Sri Lankan Rupees words
export function convertNumberToWords(num: number): string {
  if (isNaN(num) || num === 0) return "Zero Rupees Only";
  const a = [
    "", "One ", "Two ", "Three ", "Four ", "Five ", "Six ", "Seven ", "Eight ", "Nine ", "Ten ",
    "Eleven ", "Twelve ", "Thirteen ", "Fourteen ", "Fifteen ", "Sixteen ", "Seventeen ", "Eighteen ", "Nineteen "
  ];
  const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  function inWords(n: number): string {
    if (n < 20) return a[n];
    const digit = n % 10;
    if (n < 100) return b[Math.floor(n / 10)] + (digit ? " " + a[digit] : " ");
    if (n < 1000) return inWords(Math.floor(n / 100)) + "Hundred " + (n % 100 ? "and " + inWords(n % 100) : "");
    if (n < 100000) return inWords(Math.floor(n / 1000)) + "Thousand " + (n % 1000 ? inWords(n % 1000) : "");
    if (n < 10000000) return inWords(Math.floor(n / 100000)) + "Lakh " + (n % 100000 ? inWords(n % 100000) : "");
    return inWords(Math.floor(n / 10000000)) + "Crore " + (n % 10000000 ? inWords(n % 10000000) : "");
  }

  const rounded = Math.floor(num);
  const cents = Math.round((num - rounded) * 100);
  let result = inWords(rounded).trim() + " Rupees";
  if (cents > 0) {
    result += " and " + inWords(cents).trim() + " Cents";
  }
  return result + " Only";
}

const COMMON_UNITS = [
  "Pcs",
  "Set",
  "kg",
  "g",
  "mg",
  "ml",
  "ltr",
  "m",
  "cm",
  "Box",
  "Bottle",
  "Pack",
  "Pair",
  "Custom",
];

// Initial default sample matching user's LKpos Quotation #QT-1001
const INITIAL_QUOTES: QuotationRecord[] = [
  {
    id: "qt-1001",
    quoteNumber: "QT-1001",
    date: "2026-11-19",
    status: "DRAFT",
    clientName: "buddhika",
    clientPhone: "0714510772",
    clientEmail: "manidudinusha@gmail.com",
    clientAddress: "391/1A, Waiddy Mawatha, Pitipana North,",
    projectTitle: "Custom Polo Shirt Order",
    projectDesc: "Fashion dora apparel custom set order with customized branding",
    preparedBy: "Fashion dora",
    subtotal: 20000,
    discountPercent: 0,
    discountAmount: 0,
    taxPercent: 0,
    taxAmount: 0,
    finalAmount: 20000,
    amountPaid: 20000,
    balance: 0,
    amountInWords: "Twenty Thousand Rupees Only",
    convertedToInvoice: false,
    items: [
      {
        itemIndex: 1,
        description: "polo",
        unit: "Set",
        quantity: 1,
        unitPrice: 20000,
        discount: 0,
        taxPercent: 0,
        amount: 20000,
      },
    ],
    createdAt: "2026-11-19T02:47:00.000Z",
  },
];

export function QuotationsView({
  products = [],
  customers = [],
  onRefresh,
  onOpenA4Invoice,
}: Props) {
  // Quotations List State
  const [quotations, setQuotations] = useState<QuotationRecord[]>(INITIAL_QUOTES);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // View Modes: "LIST" | "CREATE" | "EDIT"
  const [viewMode, setViewMode] = useState<"LIST" | "CREATE" | "EDIT">("LIST");
  const [editingQuoteId, setEditingQuoteId] = useState<string | null>(null);

  // Modals
  const [previewQuote, setPreviewQuote] = useState<QuotationRecord | null>(null);
  const [invoiceModalQuote, setInvoiceModalQuote] = useState<QuotationRecord | null>(null);
  const [createdInvoiceData, setCreatedInvoiceData] = useState<{
    invoiceNumber: string;
    invoicedDate: string;
    paymentMethod: string;
    amountPaid: number;
    balance: number;
  } | null>(null);

  // Lock body scroll when quotation preview or invoice modal is open
  useBodyScrollLock(Boolean(previewQuote || invoiceModalQuote));

  // Company Details (Matching User's LKpos Print Header)
  const [companyInfo, setCompanyInfo] = useState({
    name: "Fashion dora",
    address: "Bandaranayake Mawatha",
    email: "manisprout822@gmail.com",
    phone: "+94765731249",
    logoUrl: "/logo.png",
  });

  // Quotation Form State
  const [formData, setFormData] = useState({
    quoteNumber: "QT-1002",
    date: new Date().toISOString().split("T")[0],
    validUntil: "",
    projectTitle: "",
    projectDesc: "",
    clientName: "",
    clientAddress: "",
    clientPhone: "",
    clientEmail: "",
    preparedBy: "Fashion dora",
    notes: "",
    discountAmount: 0,
    taxPercent: 0,
    amountPaid: 0,
    items: [
      {
        itemIndex: 1,
        description: "",
        unit: "Set",
        quantity: 1,
        unitPrice: 0,
        discount: 0,
        taxPercent: 0,
        amount: 0,
      },
    ] as QuotationItemRecord[],
  });

  // Printable Reference for Quotation
  const printDocumentRef = useRef<HTMLDivElement | null>(null);
  const thermalReceiptRef = useRef<HTMLDivElement | null>(null);

  // Fetch quotations from backend with localStorage fallback
  const fetchQuotations = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/quotations");
      if (res.ok) {
        const json = await res.json();
        if (json.data && Array.isArray(json.data) && json.data.length > 0) {
          setQuotations(json.data);
          return;
        }
      }
    } catch (err) {
      console.warn("Backend API not reachable, using local storage state:", err);
    } finally {
      setLoading(false);
    }

    // Local fallback
    try {
      const saved = localStorage.getItem("truehive_quotations");
      if (saved) {
        setQuotations(JSON.parse(saved));
      }
    } catch {}
  };

  useEffect(() => {
    fetchQuotations();
  }, []);

  // Save to local storage whenever quotations change
  const persistQuotations = (newList: QuotationRecord[]) => {
    setQuotations(newList);
    try {
      localStorage.setItem("truehive_quotations", JSON.stringify(newList));
    } catch {}
  };

  // Generate next sequential quote number
  const getNextQuoteNumber = () => {
    if (quotations.length === 0) return "QT-1001";
    const nums = quotations
      .map((q) => {
        const match = q.quoteNumber.match(/QT-(\d+)/i);
        return match ? parseInt(match[1], 10) : 1000;
      })
      .filter((n) => !isNaN(n));
    const max = nums.length > 0 ? Math.max(...nums) : 1000;
    return `QT-${max + 1}`;
  };

  // Filtered quotations list
  const filteredQuotations = useMemo(() => {
    if (!searchQuery.trim()) return quotations;
    const q = searchQuery.toLowerCase().trim();
    return quotations.filter(
      (item) =>
        item.quoteNumber.toLowerCase().includes(q) ||
        item.clientName.toLowerCase().includes(q) ||
        (item.clientPhone && item.clientPhone.includes(q)) ||
        (item.projectTitle && item.projectTitle.toLowerCase().includes(q)) ||
        (item.projectDesc && item.projectDesc.toLowerCase().includes(q))
    );
  }, [quotations, searchQuery]);

  // Form Calculations
  const calculatedTotals = useMemo(() => {
    let subtotal = 0;
    formData.items.forEach((item) => {
      const rowAmt = (item.quantity || 1) * (item.unitPrice || 0);
      const discAmt = rowAmt * ((item.discount || 0) / 100);
      const rowTotal = (rowAmt - discAmt) * (1 + (item.taxPercent || 0) / 100);
      subtotal += rowTotal;
    });

    const discountAmount = Number(formData.discountAmount) || 0;
    const taxPercent = Number(formData.taxPercent) || 0;
    const taxAmount = (subtotal - discountAmount) * (taxPercent / 100);
    const finalAmount = Math.max(0, subtotal - discountAmount + taxAmount);
    const amountPaid = Number(formData.amountPaid) || 0;
    const balance = Math.max(0, finalAmount - amountPaid);
    const amountInWords = convertNumberToWords(finalAmount);

    return {
      subtotal: Math.round(subtotal * 100) / 100,
      taxAmount: Math.round(taxAmount * 100) / 100,
      finalAmount: Math.round(finalAmount * 100) / 100,
      balance: Math.round(balance * 100) / 100,
      amountInWords,
    };
  }, [formData]);

  // Start Create New Quotation
  const handleOpenCreate = () => {
    setFormData({
      quoteNumber: getNextQuoteNumber(),
      date: new Date().toISOString().split("T")[0],
      validUntil: "",
      projectTitle: "",
      projectDesc: "",
      clientName: "",
      clientAddress: "",
      clientPhone: "",
      clientEmail: "",
      preparedBy: companyInfo.name,
      notes: "",
      discountAmount: 0,
      taxPercent: 0,
      amountPaid: 0,
      items: [
        {
          itemIndex: 1,
          description: "",
          unit: "Set",
          quantity: 1,
          unitPrice: 0,
          discount: 0,
          taxPercent: 0,
          amount: 0,
        },
      ],
    });
    setEditingQuoteId(null);
    setViewMode("CREATE");
  };

  // Start Edit Quotation
  const handleOpenEdit = (quote: QuotationRecord) => {
    setFormData({
      quoteNumber: quote.quoteNumber,
      date: quote.date,
      validUntil: quote.validUntil || "",
      projectTitle: quote.projectTitle || "",
      projectDesc: quote.projectDesc || "",
      clientName: quote.clientName,
      clientAddress: quote.clientAddress || "",
      clientPhone: quote.clientPhone || "",
      clientEmail: quote.clientEmail || "",
      preparedBy: quote.preparedBy || companyInfo.name,
      notes: quote.notes || "",
      discountAmount: quote.discountAmount,
      taxPercent: quote.taxPercent || 0,
      amountPaid: quote.amountPaid,
      items: quote.items.map((it, idx) => ({
        ...it,
        itemIndex: idx + 1,
      })),
    });
    setEditingQuoteId(quote.id);
    setViewMode("EDIT");
  };

  // Handle Form Item Changes
  const handleItemChange = (index: number, field: keyof QuotationItemRecord, value: any) => {
    setFormData((prev) => {
      const nextItems = [...prev.items];
      const target = { ...nextItems[index], [field]: value };

      if (field === "quantity" || field === "unitPrice" || field === "discount" || field === "taxPercent") {
        const qty = Number(field === "quantity" ? value : target.quantity) || 1;
        const price = Number(field === "unitPrice" ? value : target.unitPrice) || 0;
        const disc = Number(field === "discount" ? value : target.discount) || 0;
        const tax = Number(field === "taxPercent" ? value : target.taxPercent) || 0;
        const base = qty * price;
        const discAmt = base * (disc / 100);
        target.amount = Math.round((base - discAmt) * (1 + tax / 100) * 100) / 100;
      }

      nextItems[index] = target;
      return { ...prev, items: nextItems };
    });
  };

  // Add Item Row
  const handleAddRow = () => {
    setFormData((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          itemIndex: prev.items.length + 1,
          description: "",
          unit: "Set",
          quantity: 1,
          unitPrice: 0,
          discount: 0,
          taxPercent: 0,
          amount: 0,
        },
      ],
    }));
  };

  // Remove Item Row
  const handleRemoveRow = (index: number) => {
    if (formData.items.length <= 1) return;
    setFormData((prev) => ({
      ...prev,
      items: prev.items
        .filter((_, i) => i !== index)
        .map((it, idx) => ({ ...it, itemIndex: idx + 1 })),
    }));
  };

  // Save Quotation (Create or Update)
  const handleSaveQuotation = async (andPrint = false) => {
    if (!formData.clientName.trim()) {
      alert("Please enter Client Name");
      return;
    }

    const payload: QuotationRecord = {
      id: editingQuoteId || `qt-${Date.now()}`,
      quoteNumber: formData.quoteNumber,
      date: formData.date,
      validUntil: formData.validUntil,
      status: "DRAFT",
      clientName: formData.clientName,
      clientAddress: formData.clientAddress,
      clientPhone: formData.clientPhone,
      clientEmail: formData.clientEmail,
      projectTitle: formData.projectTitle,
      projectDesc: formData.projectDesc,
      preparedBy: formData.preparedBy,
      notes: formData.notes,
      subtotal: calculatedTotals.subtotal,
      discountAmount: Number(formData.discountAmount) || 0,
      taxPercent: Number(formData.taxPercent) || 0,
      taxAmount: calculatedTotals.taxAmount,
      finalAmount: calculatedTotals.finalAmount,
      amountPaid: Number(formData.amountPaid) || 0,
      balance: calculatedTotals.balance,
      amountInWords: calculatedTotals.amountInWords,
      convertedToInvoice: false,
      items: formData.items,
      createdAt: new Date().toISOString(),
    };

    // Try API POST / PUT
    try {
      if (editingQuoteId) {
        await fetch(`/api/quotations/${editingQuoteId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        await fetch("/api/quotations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }
    } catch (e) {
      console.warn("Backend save failed, saved locally:", e);
    }

    // Update local state
    let updatedList: QuotationRecord[];
    if (editingQuoteId) {
      updatedList = quotations.map((q) => (q.id === editingQuoteId ? payload : q));
    } else {
      updatedList = [payload, ...quotations];
    }

    persistQuotations(updatedList);
    setViewMode("LIST");

    if (andPrint) {
      setPreviewQuote(payload);
    }
  };

  // Delete Quotation
  const handleDeleteQuote = async (id: string) => {
    if (!confirm("Are you sure you want to delete this quotation?")) return;

    try {
      await fetch(`/api/quotations/${id}`, { method: "DELETE" });
    } catch {}

    const updated = quotations.filter((q) => q.id !== id);
    persistQuotations(updated);
    setSelectedIds((prev) => prev.filter((i) => i !== id));
  };

  // Bulk Delete
  const handleBulkDelete = () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Delete ${selectedIds.length} selected quotations?`)) return;

    const updated = quotations.filter((q) => !selectedIds.includes(q.id));
    persistQuotations(updated);
    setSelectedIds([]);
  };

  // Open "Make Invoice" Flow
  const handleOpenMakeInvoice = async (quote: QuotationRecord) => {
    const invNum = quote.invoiceNumber || `INV-${Math.floor(100000 + Math.random() * 900000)}`;
    const now = new Date();
    const invoicedDate = `${now.toISOString().split("T")[0]} ${now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;

    setInvoiceModalQuote(quote);
    setCreatedInvoiceData({
      invoiceNumber: invNum,
      invoicedDate,
      paymentMethod: quote.paymentMethod || "Cash",
      amountPaid: quote.amountPaid > 0 ? quote.amountPaid : quote.finalAmount,
      balance: Math.max(0, quote.finalAmount - (quote.amountPaid > 0 ? quote.amountPaid : quote.finalAmount)),
    });

    // Mark quotation as INVOICED
    const updated = quotations.map((q) => {
      if (q.id === quote.id) {
        return {
          ...q,
          convertedToInvoice: true,
          status: "INVOICED" as const,
          invoiceNumber: invNum,
          invoicedAt: now.toISOString(),
          paymentMethod: quote.paymentMethod || "Cash",
        };
      }
      return q;
    });

    persistQuotations(updated);

    // Try backend call
    try {
      await fetch(`/api/quotations/${quote.id}/convert-to-invoice`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoiceNumber: invNum,
          paymentMethod: "Cash",
          amountPaid: quote.finalAmount,
        }),
      });
    } catch {}
  };

  // Quick select customer to fill form
  const handleSelectCustomer = (custName: string) => {
    const found = customers.find((c) => c.name.toLowerCase() === custName.toLowerCase());
    if (found) {
      setFormData((prev) => ({
        ...prev,
        clientName: found.name,
        clientPhone: found.phone || prev.clientPhone,
        clientEmail: found.email || prev.clientEmail,
        clientAddress: found.address || prev.clientAddress,
      }));
    } else {
      setFormData((prev) => ({ ...prev, clientName: custName }));
    }
  };

  // Quick select product to fill row
  const handleSelectProduct = (index: number, prodName: string) => {
    const found = products.find((p) => p.name.toLowerCase() === prodName.toLowerCase());
    if (found) {
      handleItemChange(index, "description", found.name);
      handleItemChange(index, "unitPrice", found.sellingPrice);
      if (found.unit) {
        handleItemChange(index, "unit", found.unit);
      }
    } else {
      handleItemChange(index, "description", prodName);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* ========================================================================= */}
      {/* 1. LIST VIEW (Matching Screenshots 4 & 6) */}
      {/* ========================================================================= */}
      {viewMode === "LIST" && (
        <div className="space-y-5">
          {/* Top Bar with Title & Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Quotations
              </h1>
              <p className="text-xs text-slate-400">
                Manage, issue pro-forma quotations and convert directly into invoices.
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              {selectedIds.length > 0 && (
                <Button
                  variant="danger"
                  size="sm"
                  onClick={handleBulkDelete}
                  className="bg-red-600 hover:bg-red-500 text-white font-medium text-xs shadow-sm"
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                  Delete Selected ({selectedIds.length})
                </Button>
              )}

              <Button
                variant="primary"
                onClick={handleOpenCreate}
                className="bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs px-4 py-2 rounded-xl shadow-md shadow-blue-500/20"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                New Quotation
              </Button>
            </div>
          </div>

          {/* Search Box */}
          <div className="bg-[#0a1120] border border-slate-800/80 rounded-2xl p-3.5 flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Quotes..."
                className="w-full bg-slate-900/60 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50 transition"
              />
            </div>
            <div className="text-xs text-slate-400 font-mono">
              Total: <span className="text-white font-bold">{filteredQuotations.length}</span> Quotes
            </div>
          </div>

          {/* Quotations Table */}
          <div className="bg-[#0a1120] border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800/80 bg-slate-900/40 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="py-3 px-4 w-10">
                      <input
                        type="checkbox"
                        checked={
                          filteredQuotations.length > 0 &&
                          selectedIds.length === filteredQuotations.length
                        }
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedIds(filteredQuotations.map((q) => q.id));
                          } else {
                            setSelectedIds([]);
                          }
                        }}
                        className="rounded border-slate-700 bg-slate-800 text-blue-600 focus:ring-0 cursor-pointer"
                      />
                    </th>
                    <th className="py-3 px-4">QUOTE NUMBER</th>
                    <th className="py-3 px-4">DATE</th>
                    <th className="py-3 px-4">CLIENT NAME</th>
                    <th className="py-3 px-4">STATUS</th>
                    <th className="py-3 px-4 text-right">FINAL AMOUNT</th>
                    <th className="py-3 px-4 text-center">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredQuotations.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        <FileText className="w-8 h-8 mx-auto text-slate-600 mb-2 opacity-50" />
                        <p className="font-medium text-slate-300">No quotations found</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Click &quot;+ New Quotation&quot; to issue your first formal estimate.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredQuotations.map((quote) => {
                      const isSelected = selectedIds.includes(quote.id);
                      return (
                        <tr
                          key={quote.id}
                          className={`hover:bg-slate-800/30 transition-colors ${
                            isSelected ? "bg-blue-950/20" : ""
                          }`}
                        >
                          <td className="py-3 px-4">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedIds((prev) => [...prev, quote.id]);
                                } else {
                                  setSelectedIds((prev) => prev.filter((i) => i !== quote.id));
                                }
                              }}
                              className="rounded border-slate-700 bg-slate-800 text-blue-600 focus:ring-0 cursor-pointer"
                            />
                          </td>
                          <td className="py-3 px-4 font-mono font-bold text-white">
                            {quote.quoteNumber}
                          </td>
                          <td className="py-3 px-4 text-slate-300">{quote.date}</td>
                          <td className="py-3 px-4 font-medium text-slate-200">
                            {quote.clientName}
                            {quote.clientPhone && (
                              <span className="block text-[10px] text-slate-400 font-mono">
                                {quote.clientPhone}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            {quote.convertedToInvoice || quote.status === "INVOICED" ? (
                              <Badge variant="success" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px]">
                                Invoiced ({quote.invoiceNumber || "INV"})
                              </Badge>
                            ) : (
                              <Badge variant="default" className="bg-blue-500/10 text-blue-400 border-blue-500/20 text-[10px]">
                                Draft Quote
                              </Badge>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-white font-mono">
                            Rs.{quote.finalAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center justify-center gap-1.5">
                              {/* View Action (Eye) */}
                              <button
                                onClick={() => setPreviewQuote(quote)}
                                title="View Quotation Document"
                                className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>

                              {/* Edit Action (Pencil) */}
                              <button
                                onClick={() => handleOpenEdit(quote)}
                                title="Edit Quotation"
                                className="p-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 hover:text-indigo-300 transition"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>

                              {/* Make Invoice Action (Receipt / File Icon) */}
                              <button
                                onClick={() => handleOpenMakeInvoice(quote)}
                                title="Make Invoice"
                                className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium shadow-sm transition group relative"
                              >
                                <Receipt className="w-3.5 h-3.5" />
                              </button>

                              {/* Delete Action (Trash) */}
                              <button
                                onClick={() => handleDeleteQuote(quote.id)}
                                title="Delete Quotation"
                                className="p-1.5 rounded-lg bg-red-600/20 hover:bg-red-600/30 text-red-400 hover:text-red-300 transition"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. CREATE / EDIT FORM (Matching Screenshots 2 & 3) */}
      {/* ========================================================================= */}
      {(viewMode === "CREATE" || viewMode === "EDIT") && (
        <div className="space-y-6">
          {/* Header Bar */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setViewMode("LIST")}
                className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-white tracking-tight">
                  {viewMode === "CREATE" ? "Create New Quotation" : `Edit Quotation (${formData.quoteNumber})`}
                </h1>
                <p className="text-xs text-slate-400">
                  Fill in customer info, measured units (ml, kg, pcs, etc.) and line pricing.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                onClick={() => setViewMode("LIST")}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={() => handleSaveQuotation(true)}
                className="bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs px-4 py-2 rounded-xl shadow-md"
              >
                <Printer className="w-4 h-4 mr-1.5" />
                Save & Print
              </Button>
              <Button
                variant="primary"
                onClick={() => handleSaveQuotation(false)}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs px-4 py-2 rounded-xl shadow-md"
              >
                Save Quotation
              </Button>
            </div>
          </div>

          {/* Two-Column Grid: Basic Info & Client Info */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Quote Basic Info Card */}
            <div className="bg-[#0a1120] border border-slate-800/80 rounded-2xl p-5 space-y-4">
              <h3 className="text-sm font-bold text-blue-400 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Quote Basic Info
              </h3>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Quote Number</label>
                  <input
                    type="text"
                    value={formData.quoteNumber}
                    onChange={(e) => setFormData({ ...formData, quoteNumber: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-blue-500/50"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-medium mb-1">Date</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500/50"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-medium mb-1">Project Title</label>
                  <input
                    type="text"
                    value={formData.projectTitle}
                    onChange={(e) => setFormData({ ...formData, projectTitle: e.target.value })}
                    placeholder="Project Title (e.g. Custom Polo Shirt Order)"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-medium mb-1">Project Description</label>
                  <textarea
                    rows={3}
                    value={formData.projectDesc}
                    onChange={(e) => setFormData({ ...formData, projectDesc: e.target.value })}
                    placeholder="Brief project overview / Scope of work..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50 resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Quotation To (Client) Card */}
            <div className="bg-[#0a1120] border border-slate-800/80 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-blue-400 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Quotation To (Client)
                </h3>

                {customers.length > 0 && (
                  <select
                    onChange={(e) => handleSelectCustomer(e.target.value)}
                    defaultValue=""
                    className="text-[11px] bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-slate-300 focus:outline-none focus:border-blue-500"
                  >
                    <option value="" disabled>Select Existing Client...</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name} ({c.phone || "No phone"})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Client Name *</label>
                  <input
                    type="text"
                    value={formData.clientName}
                    onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                    placeholder="Client Name"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-medium mb-1">Client Address</label>
                  <input
                    type="text"
                    value={formData.clientAddress}
                    onChange={(e) => setFormData({ ...formData, clientAddress: e.target.value })}
                    placeholder="Client Address"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 font-medium mb-1">Client Phone</label>
                    <input
                      type="text"
                      value={formData.clientPhone}
                      onChange={(e) => setFormData({ ...formData, clientPhone: e.target.value })}
                      placeholder="07XXXXXXXX"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 font-medium mb-1">Client Email</label>
                    <input
                      type="email"
                      value={formData.clientEmail}
                      onChange={(e) => setFormData({ ...formData, clientEmail: e.target.value })}
                      placeholder="name@domain.com"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 font-medium mb-1">Prepared By (Our Company / Staff)</label>
                  <input
                    type="text"
                    value={formData.preparedBy}
                    onChange={(e) => setFormData({ ...formData, preparedBy: e.target.value })}
                    placeholder="Fashion dora"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Items & Pricing Table Card (With units: ml, kg, pcs, etc.) */}
          <div className="bg-[#0a1120] border border-slate-800/80 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-400" />
                Items & Pricing
              </h3>

              <span className="text-[11px] text-slate-400">
                Supports measured units: <strong className="text-amber-400">Pcs, Set, kg, g, ml, ltr, Box, Custom</strong>
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/50 text-slate-400 text-[11px] font-bold">
                    <th className="py-2.5 px-3 w-12 text-center">SL.</th>
                    <th className="py-2.5 px-3 min-w-[200px]">DESCRIPTION</th>
                    <th className="py-2.5 px-3 w-28">UNIT</th>
                    <th className="py-2.5 px-3 w-24 text-right">QTY</th>
                    <th className="py-2.5 px-3 w-28 text-right">PRICE/UNIT</th>
                    <th className="py-2.5 px-3 w-20 text-right">GST (%)</th>
                    <th className="py-2.5 px-3 w-28 text-right">AMOUNT</th>
                    <th className="py-2.5 px-3 w-12 text-center">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {formData.items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-900/30">
                      <td className="py-2.5 px-3 text-center text-slate-400 font-mono">
                        {idx + 1}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="space-y-1">
                          <input
                            type="text"
                            value={item.description}
                            onChange={(e) => handleItemChange(idx, "description", e.target.value)}
                            placeholder="Item Name / Service / Material"
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500"
                          />
                          {products.length > 0 && (
                            <select
                              onChange={(e) => handleSelectProduct(idx, e.target.value)}
                              defaultValue=""
                              className="text-[10px] bg-slate-950 border border-slate-800 rounded px-1.5 py-0.5 text-slate-400 focus:outline-none"
                            >
                              <option value="" disabled>Pick from inventory...</option>
                              {products.map((p) => (
                                <option key={p.id} value={p.name}>
                                  {p.name} (Rs.{p.sellingPrice} / {p.unit})
                                </option>
                              ))}
                            </select>
                          )}
                        </div>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-1">
                          <select
                            value={item.unit}
                            onChange={(e) => handleItemChange(idx, "unit", e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-white text-xs font-medium focus:outline-none focus:border-blue-500"
                          >
                            {COMMON_UNITS.map((u) => (
                              <option key={u} value={u}>
                                {u}
                              </option>
                            ))}
                          </select>
                        </div>
                      </td>
                      <td className="py-2.5 px-3">
                        <input
                          type="number"
                          step="any"
                          min="0"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(idx, "quantity", parseFloat(e.target.value) || 0)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-right text-white font-mono focus:outline-none focus:border-blue-500"
                        />
                      </td>
                      <td className="py-2.5 px-3">
                        <input
                          type="number"
                          step="any"
                          min="0"
                          value={item.unitPrice}
                          onChange={(e) => handleItemChange(idx, "unitPrice", parseFloat(e.target.value) || 0)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-right text-white font-mono focus:outline-none focus:border-blue-500"
                        />
                      </td>
                      <td className="py-2.5 px-3">
                        <input
                          type="number"
                          step="any"
                          min="0"
                          value={item.taxPercent || 0}
                          onChange={(e) => handleItemChange(idx, "taxPercent", parseFloat(e.target.value) || 0)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-right text-white font-mono focus:outline-none focus:border-blue-500"
                        />
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-white">
                        {item.amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <button
                          onClick={() => handleRemoveRow(idx)}
                          disabled={formData.items.length <= 1}
                          className="p-1.5 rounded-lg bg-red-600/80 hover:bg-red-600 disabled:opacity-30 disabled:hover:bg-red-600/80 text-white transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleAddRow}
              className="border-dashed border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 text-xs mt-2"
            >
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              Add Row
            </Button>
          </div>

          {/* Amount In Words & Financial Summary (Matching Screenshot 3) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* Left: Amount In Words */}
            <div className="lg:col-span-7 bg-[#0a1120] border border-slate-800/80 rounded-2xl p-5 space-y-2">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                Amount In Words
              </label>
              <div className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-xl">
                <p className="text-sm font-semibold text-amber-400 italic font-serif">
                  {calculatedTotals.amountInWords}
                </p>
              </div>
              <p className="text-[11px] text-slate-500">
                Auto-calculated in Sri Lankan Rupees for formal quotation presentation.
              </p>
            </div>

            {/* Right: Subtotal, Discount, Final Amount, Paid, Balance */}
            <div className="lg:col-span-5 bg-[#0a1120] border border-slate-800/80 rounded-2xl p-5 space-y-3 text-xs">
              <div className="flex items-center justify-between text-slate-300">
                <span>Sub Total:</span>
                <span className="font-mono font-bold text-white text-sm">
                  Rs.{calculatedTotals.subtotal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>

              <div className="flex items-center justify-between text-slate-300">
                <span>Discount (Rs.):</span>
                <input
                  type="number"
                  min="0"
                  value={formData.discountAmount}
                  onChange={(e) => setFormData({ ...formData, discountAmount: parseFloat(e.target.value) || 0 })}
                  className="w-28 bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-right text-white font-mono focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="border-t border-slate-800 pt-2 flex items-center justify-between text-white font-bold text-sm">
                <span>Final Amount:</span>
                <span className="font-mono text-emerald-400 text-base">
                  Rs.{calculatedTotals.finalAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>

              <div className="flex items-center justify-between text-slate-300 pt-1">
                <span>Amount Paid (Rs.):</span>
                <input
                  type="number"
                  min="0"
                  value={formData.amountPaid}
                  onChange={(e) => setFormData({ ...formData, amountPaid: parseFloat(e.target.value) || 0 })}
                  className="w-28 bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-right text-white font-mono focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="border-t border-slate-800 pt-2 flex items-center justify-between text-slate-300 font-bold">
                <span>Balance:</span>
                <span className={`font-mono ${calculatedTotals.balance > 0 ? "text-rose-400" : "text-slate-400"}`}>
                  Rs.{calculatedTotals.balance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. PRINT PREVIEW MODAL (Matching Screenshot 1 & Enhanced for Scrolling) */}
      {/* ========================================================================= */}
      {previewQuote && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-sm p-2 sm:p-6 flex items-start justify-center overscroll-contain">
          <div className="relative w-full max-w-3xl bg-white text-slate-950 rounded-2xl shadow-2xl my-2 sm:my-6 overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[92vh] overscroll-contain">
            {/* Sticky Modal Header Controls (Cannot scroll away, Always Visible) */}
            <div className="sticky top-0 bg-white/95 backdrop-blur-md z-30 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 px-4 sm:px-6 py-3 border-b border-slate-200 shrink-0 no-print shadow-sm">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-tight">
                    Quotation Print Preview ({previewQuote.quoteNumber})
                  </h3>
                  <p className="text-[10px] sm:text-[11px] text-slate-500">
                    Review quotation below or print to paper / PDF.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => window.print()}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-sm px-3.5 py-2 rounded-xl"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print / Save as PDF</span>
                </Button>

                {/* Highly Visible Cut / Close Button */}
                <button
                  onClick={() => setPreviewQuote(null)}
                  title="Close Preview (Cut)"
                  aria-label="Close"
                  className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-700 border border-slate-200 transition flex items-center gap-1.5 text-xs font-bold"
                >
                  <X className="w-4 h-4 text-slate-700 hover:text-rose-600" />
                  <span>Close</span>
                </button>
              </div>
            </div>

            {/* Scrollable Document Area (Custom Scrollbar) */}
            <div className="overflow-y-auto p-5 sm:p-8 space-y-6 flex-1 custom-scrollbar">
              <div
                id="quotation-print-area"
                ref={printDocumentRef}
                className="space-y-5 text-slate-950 font-mono text-xs bg-white"
              >
                {/* Top Company Header (Bordered Box) */}
                <div className="border border-slate-900 rounded-xl p-4 flex items-center gap-6">
                  <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0 border border-slate-200 p-1 flex items-center justify-center">
                    <img
                      src={companyInfo.logoUrl}
                      alt={companyInfo.name}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="space-y-0.5">
                    <h2 className="text-xl font-bold tracking-tight text-slate-950 font-serif">
                      {companyInfo.name}
                    </h2>
                    <p className="text-[11px] text-slate-800">{companyInfo.address}</p>
                    <p className="text-[11px] text-slate-800">{companyInfo.email}</p>
                    <p className="text-[11px] text-slate-800">{companyInfo.phone}</p>
                  </div>
                </div>

                {/* Two Column Details: Quotation To & Quote Meta (No Vehicle/Model/Insurance) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border border-slate-300 rounded-lg p-3 text-[11px]">
                  <div className="space-y-1 sm:pr-3 sm:border-r border-slate-200">
                    <p className="font-bold uppercase tracking-wider text-slate-900">QUOTATION TO:</p>
                    <p className="font-bold text-slate-950 text-xs">{previewQuote.clientName}</p>
                    {previewQuote.clientAddress && <p className="text-slate-800">{previewQuote.clientAddress}</p>}
                    {previewQuote.clientPhone && <p className="text-slate-800">{previewQuote.clientPhone}</p>}
                    {previewQuote.clientEmail && <p className="text-slate-800">{previewQuote.clientEmail}</p>}
                  </div>

                  <div className="space-y-1.5 sm:pl-1">
                    <div className="flex justify-between">
                      <span className="font-bold text-slate-900">QUOTE NO:</span>
                      <span className="font-bold text-slate-950 font-mono">{previewQuote.quoteNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-bold text-slate-900">DATE:</span>
                      <span className="font-bold text-slate-950">{previewQuote.date}</span>
                    </div>
                    {previewQuote.validUntil && (
                      <div className="flex justify-between">
                        <span className="font-bold text-slate-900">VALID UNTIL:</span>
                        <span className="text-slate-800">{previewQuote.validUntil}</span>
                      </div>
                    )}
                    {previewQuote.preparedBy && (
                      <div className="flex justify-between">
                        <span className="font-bold text-slate-900">PREPARED BY:</span>
                        <span className="text-slate-800">{previewQuote.preparedBy}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Project Title & Project Description Section */}
                {(previewQuote.projectTitle || previewQuote.projectDesc) && (
                  <div className="border border-slate-300 rounded-lg p-3.5 bg-slate-50/70 space-y-1.5">
                    {previewQuote.projectTitle && (
                      <div className="flex items-baseline gap-2">
                        <span className="font-bold text-slate-900 text-xs uppercase tracking-wide">
                          PROJECT TITLE:
                        </span>
                        <span className="font-bold text-slate-950 text-xs">
                          {previewQuote.projectTitle}
                        </span>
                      </div>
                    )}
                    {previewQuote.projectDesc && (
                      <div className="space-y-0.5 pt-0.5">
                        <span className="font-bold text-slate-900 text-[10px] uppercase tracking-wide">
                          PROJECT DESCRIPTION:
                        </span>
                        <p className="text-[11px] text-slate-800 leading-relaxed whitespace-pre-line">
                          {previewQuote.projectDesc}
                        </p>
                      </div>
                    )}
                  </div>
                )}

              {/* Centered Underlined Title */}
              <div className="text-center py-2">
                <h3 className="text-base font-bold tracking-widest uppercase border-b-2 border-slate-950 inline-block pb-1">
                  QUOTATION
                </h3>
              </div>

              {/* Items & Services Section */}
              <div className="space-y-2">
                <div className="border-b border-slate-900 pb-1">
                  <h4 className="font-bold text-xs uppercase tracking-wider">OTHER / SERVICES</h4>
                </div>

                <div className="w-full overflow-x-auto no-scrollbar">
                  <table className="w-full min-w-[500px] text-left text-xs">
                    <tbody className="divide-y divide-slate-100">
                      {previewQuote.items.map((it, idx) => (
                        <tr key={idx} className="py-1">
                          <td className="py-1.5 w-8 font-bold">{idx + 1}.</td>
                          <td className="py-1.5">
                            <span className="font-medium text-slate-900">{it.description}</span>
                            <span className="text-slate-500 text-[10px] ml-2">
                              ({it.quantity} {it.unit || "Set"} @ Rs.{it.unitPrice.toLocaleString()})
                            </span>
                          </td>
                          <td className="py-1.5 text-right font-bold text-slate-950">
                            Rs.{it.amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Bordered Total Box */}
              <div className="flex justify-end pt-4">
                <div className="border border-slate-900 rounded-lg px-6 py-2.5 min-w-[240px] flex items-center justify-between">
                  <span className="font-bold text-sm tracking-wider">TOTAL:</span>
                  <span className="font-bold text-sm">
                    Rs.{previewQuote.finalAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Amount In Words */}
              {previewQuote.amountInWords && (
                <div className="pt-2 text-[11px] text-slate-700 italic">
                  <strong>Amount in words:</strong> {previewQuote.amountInWords}
                </div>
              )}

              {/* Authorized Signature Line */}
              <div className="pt-10 flex flex-col items-center justify-center space-y-1">
                <div className="w-48 border-b border-slate-900" />
                <span className="font-bold text-[10px] tracking-wider uppercase">
                  AUTHORIZED SIGNATURE
                </span>
              </div>

              {/* Footer Notice */}
              <div className="border-t border-dotted border-slate-300 pt-4 text-center text-[10px] text-slate-600 italic">
                This is a computer generated document. For inquiries, please contact our service center.
              </div>
            </div>
          </div>
        </div>
      </div>
    )}

      {/* ========================================================================= */}
      {/* 4. MAKE INVOICE MODAL (Matching Screenshot 5) */}
      {/* ========================================================================= */}
      {invoiceModalQuote && createdInvoiceData && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-sm p-3 sm:p-6 flex items-start justify-center">
          <div className="relative w-full max-w-md bg-white text-slate-950 rounded-3xl shadow-2xl my-2 sm:my-6 overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white/95 backdrop-blur-md z-30 flex items-center justify-between px-6 py-3.5 border-b border-slate-200 shrink-0 no-print shadow-sm">
              <h3 className="text-base font-bold text-slate-900">Invoice Details</h3>
              <button
                onClick={() => setInvoiceModalQuote(null)}
                title="Close"
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-700 transition flex items-center gap-1 text-xs font-semibold"
              >
                <X className="w-4 h-4" />
                <span>Close</span>
              </button>
            </div>

            {/* Printable Thermal Receipt Card (Screenshot 5 Replica) */}
            <div className="overflow-y-auto p-6 space-y-4 flex-1 custom-scrollbar">
              <div
                id="pos-thermal-receipt"
                ref={thermalReceiptRef}
                className="space-y-3 font-mono text-xs text-slate-900 bg-white"
              >
              {/* Business Name */}
              <div className="text-center py-1">
                <h2 className="text-2xl font-black tracking-tight text-slate-950">
                  {companyInfo.name}
                </h2>
                <p className="text-[11px] text-slate-600">{companyInfo.address}</p>
                <p className="text-[11px] text-slate-600">Tel: {companyInfo.phone}</p>
              </div>

              <div className="border-t border-dashed border-slate-400 my-2" />

              {/* Meta Info */}
              <div className="space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span>
                    Invoice number : <strong className="font-bold">{createdInvoiceData.invoiceNumber}</strong>
                  </span>
                  <span>Invoiced date : {createdInvoiceData.invoicedDate}</span>
                </div>
                <div className="flex justify-between">
                  <span>
                    Payment method : <strong>{createdInvoiceData.paymentMethod}</strong>
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Customer Tel : <strong>{invoiceModalQuote.clientPhone || "-"}</strong></span>
                  <span>Customer : <strong>{invoiceModalQuote.clientName}</strong></span>
                </div>
              </div>

              <div className="border-t border-dashed border-slate-400 my-2" />

              {/* Items Table */}
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="font-bold text-slate-950 border-b border-dashed border-slate-400 pb-1">
                    <th className="pb-1">PRODUCT</th>
                    <th className="pb-1 text-center">QTY</th>
                    <th className="pb-1 text-right">TOTAL</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dotted divide-slate-200">
                  {invoiceModalQuote.items.map((item, idx) => (
                    <tr key={idx} className="py-2">
                      <td className="py-1.5 pr-2">
                        <p className="font-bold text-slate-950">
                          {idx + 1}. {item.description} ({item.unit})
                        </p>
                      </td>
                      <td className="py-1.5 text-center text-slate-800">
                        {item.quantity} {item.unit}
                      </td>
                      <td className="py-1.5 text-right font-mono font-bold text-slate-950">
                        Rs.{item.amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="border-t border-dashed border-slate-400 my-2" />

              {/* Financial Totals */}
              <div className="space-y-1 text-xs">
                <div className="flex justify-between text-slate-700">
                  <span>Sub total :</span>
                  <span className="font-mono font-bold text-slate-950">
                    Rs.{invoiceModalQuote.subtotal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>

                {invoiceModalQuote.discountAmount > 0 && (
                  <div className="flex justify-between text-rose-600">
                    <span>Discount :</span>
                    <span className="font-mono font-bold">
                      -Rs.{invoiceModalQuote.discountAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                )}

                <div className="flex justify-between text-sm font-bold text-slate-950 border-t border-dashed border-slate-300 pt-1">
                  <span>Total :</span>
                  <span className="font-mono">
                    Rs.{invoiceModalQuote.finalAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="flex justify-between text-slate-700">
                  <span>Paid amount :</span>
                  <span className="font-mono font-bold text-slate-950">
                    Rs.{createdInvoiceData.amountPaid.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="flex justify-between text-slate-700">
                  <span>Balance :</span>
                  <span className="font-mono font-bold text-slate-950">
                    Rs.{createdInvoiceData.balance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              <div className="border-t border-dashed border-slate-400 my-2" />

              {/* Thank you */}
              <div className="text-center py-2">
                <p className="font-bold text-xs text-slate-950">Thank you! Come again!</p>
              </div>
            </div>

            {/* Print Action Buttons */}
            <div className="pt-2 flex flex-col gap-2 no-print">
              <Button
                variant="primary"
                onClick={() => window.print()}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs py-2.5 rounded-xl shadow-md flex items-center justify-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                Print Receipt
              </Button>

              <Button
                variant="outline"
                onClick={() => setInvoiceModalQuote(null)}
                className="w-full text-xs py-2 rounded-xl border-slate-300 text-slate-700 hover:bg-slate-50"
              >
                Done
              </Button>
            </div>
          </div>
        </div>
      </div>
    )}
  </div>
);
}
