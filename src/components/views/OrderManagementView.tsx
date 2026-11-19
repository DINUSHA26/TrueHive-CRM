"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  ClipboardList,
  Search,
  FileText,
  Printer,
  Sparkles,
  CheckCircle2,
  Clock,
  Send,
  ChevronDown,
  ArrowRight,
  Truck,
  DollarSign,
  Package,
  Plus,
  RefreshCw,
  AlertCircle,
  Eye,
  Trash2,
  MapPin,
  Phone,
  MessageSquare,
  Bot,
  ExternalLink,
  Receipt,
  Calendar,
  Layers,
  Check,
  X,
  CreditCard,
  Download,
  Store,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatCard } from "@/components/ui/StatCard";
import type { OrderRecord } from "@/lib/store";

interface OrderManagementViewProps {
  orders: OrderRecord[];
  products?: any[];
  onRefresh: () => void;
  onOpenA4Invoice: (order: OrderRecord) => void;
}

const STATUS_ORDER = [
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "READY_TO_SHIP",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
] as const;

const COURIER_PARTNERS = [
  "Prompt Express",
  "Koombiyo Delivery",
  "Standard Courier",
  "Domex Courier",
  "Pronto Lanka",
  "Certis Lanka",
  "Speedy Express",
  "Store Pickup / Direct",
];

export function OrderManagementView({
  orders,
  products = [],
  onRefresh,
  onOpenA4Invoice,
}: OrderManagementViewProps) {
  const [search, setSearch] = useState("");
  const [channelTab, setChannelTab] = useState<
    "ALL" | "WHATSAPP_AI" | "COD" | "BANK_TRANSFER" | "CREDIT" | "POS"
  >("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Available Products state
  const [availProducts, setAvailProducts] = useState<any[]>(products);

  // Add Order / COD Registration Modal
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [custName, setCustName] = useState("");
  const [custPhone, setCustPhone] = useState("947");
  const [custPhone2, setCustPhone2] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryCity, setDeliveryCity] = useState("");
  const [orderPaymentMethod, setOrderPaymentMethod] = useState<
    "COD" | "BANK_TRANSFER" | "CREDIT" | "CASH" | "CARD"
  >("COD");
  const [courierPartner, setCourierPartner] = useState("Prompt Express");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState("");
  const [deliveryFee, setDeliveryFee] = useState<number | "">(350);
  const [orderNotes, setOrderNotes] = useState("");
  const [orderItems, setOrderItems] = useState<
    { productId: string; quantity: number; unitPrice: number }[]
  >([]);
  const [submittingOrder, setSubmittingOrder] = useState(false);

  // Waybill / Courier Modal
  const [waybillModalOpen, setWaybillModalOpen] = useState(false);
  const [selectedWaybillOrder, setSelectedWaybillOrder] = useState<OrderRecord | null>(null);
  const [wbCourier, setWbCourier] = useState("Prompt Express");
  const [wbTracking, setWbTracking] = useState("");
  const [wbExpectedDate, setWbExpectedDate] = useState("");
  const [wbSaving, setWbSaving] = useState(false);

  // Settle COD Remittance Modal
  const [settleModalOpen, setSettleModalOpen] = useState(false);
  const [selectedSettleOrder, setSelectedSettleOrder] = useState<OrderRecord | null>(null);
  const [codCollected, setCodCollected] = useState<number | "">("");
  const [courierFee, setCourierFee] = useState<number | "">(350);
  const [remitRef, setRemitRef] = useState("");
  const [settleSaving, setSettleSaving] = useState(false);

  // Order Details Modal
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedDetailOrder, setSelectedDetailOrder] = useState<OrderRecord | null>(null);

  // Load products if not supplied
  useEffect(() => {
    if (products.length > 0) {
      setAvailProducts(products);
    } else {
      fetch("/api/inventory")
        .then((r) => r.json())
        .then((d) => {
          if (d.products) setAvailProducts(d.products);
        })
        .catch(() => null);
    }
  }, [products]);

  // Compute live KPI stats
  const totalOrdersCount = orders.length;
  const totalOrderValue = orders.reduce((acc, o) => acc + (o.totalAmount || 0), 0);
  const totalReceived = orders.reduce((acc, o) => {
    const isPos =
      o.source === "POS_TERMINAL" ||
      o.orderNumber?.startsWith("INV-") ||
      o.deliveryCity?.toLowerCase().includes("pos");

    const isImmediate =
      o.paymentMethod === "CASH" ||
      o.paymentMethod === "CARD" ||
      o.paymentMethod === "QR_PAY" ||
      o.paymentMethod === "QR" ||
      o.paymentMethod === "ONLINE_BANK" ||
      o.paymentMethod === "BANK_TRANSFER";

    const isPaid =
      o.paymentStatus === "PAID" ||
      o.settlementStatus === "SETTLED" ||
      (isPos && isImmediate && o.paymentMethod !== "SPLIT" && o.paymentMethod !== "CREDIT" && o.paymentMethod !== "COD");

    if (isPaid) {
      return acc + (o.totalAmount || 0);
    }
    return acc + (o.cashReceived || 0);
  }, 0);
  const totalUnpaid = Math.max(0, totalOrderValue - totalReceived);

  // COD Specific Stats (Page 3 of Report)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

  const codOrders = orders.filter((o) => o.paymentMethod === "COD");
  const todayCodOrdersVal = codOrders
    .filter((o) => o.createdAt && new Date(o.createdAt) >= today)
    .reduce((acc, o) => acc + (o.totalAmount || 0), 0);
  const todayCodCollectedVal = codOrders
    .filter(
      (o) =>
        (o.settlementStatus === "SETTLED" || o.paymentStatus === "PAID") &&
        o.remittedAt &&
        new Date(o.remittedAt) >= today
    )
    .reduce((acc, o) => acc + (o.remittedAmount || o.totalAmount || 0), 0);
  const thisMonthCodVal = codOrders
    .filter((o) => o.createdAt && new Date(o.createdAt) >= monthStart)
    .reduce((acc, o) => acc + (o.totalAmount || 0), 0);
  const totalOutstandingCodVal = codOrders
    .filter((o) => o.settlementStatus !== "SETTLED" && o.paymentStatus !== "PAID")
    .reduce((acc, o) => acc + (o.codAmount || o.totalAmount || 0), 0);

  // Filtered Orders
  const filtered = orders.filter((o) => {
    // Channel filter
    if (channelTab === "WHATSAPP_AI" && o.source !== "WHATSAPP_AI") return false;
    if (channelTab === "COD" && o.paymentMethod !== "COD") return false;
    if (channelTab === "BANK_TRANSFER" && o.paymentMethod !== "BANK_TRANSFER" && o.paymentMethod !== "ONLINE_BANK" && o.paymentMethod !== "QR_PAY") return false;
    if (channelTab === "CREDIT" && o.paymentMethod !== "SPLIT" && o.paymentMethod !== "CREDIT") return false;
    if (channelTab === "POS" && o.source !== "POS_TERMINAL" && !o.orderNumber?.startsWith("INV-") && !o.deliveryCity?.toLowerCase().includes("pos")) return false;

    // Status filter
    if (statusFilter !== "ALL" && o.status !== statusFilter) return false;

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchesNum = o.orderNumber.toLowerCase().includes(q);
      const matchesCust = o.customerName.toLowerCase().includes(q);
      const matchesPhone = o.customerPhone.includes(q) || (o.secondaryPhone && o.secondaryPhone.includes(q));
      const matchesTracking = o.trackingNumber && o.trackingNumber.toLowerCase().includes(q);
      const matchesCourier = o.courierPartner && o.courierPartner.toLowerCase().includes(q);
      const matchesBarcode = o.barcode && o.barcode.toLowerCase().includes(q);
      return matchesNum || matchesCust || matchesPhone || matchesTracking || matchesCourier || matchesBarcode;
    }

    return true;
  });

  // Handle Order Status Transition
  const handleStatusChange = async (orderId: string, newStatus: string) => {
    setUpdatingId(orderId);
    try {
      const res = await fetch("/api/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        onRefresh();
      } else {
        alert(data.message || "Failed to update order status");
      }
    } catch (err) {
      console.error("Order status update failed:", err);
      alert("Error updating order status.");
    } finally {
      setUpdatingId(null);
    }
  };

  // Handle Toggle Payment Status (e.g. Mark Cash/Card as PAID)
  const handleTogglePaymentStatus = async (order: OrderRecord) => {
    const isPos =
      order.source === "POS_TERMINAL" ||
      order.orderNumber?.startsWith("INV-") ||
      order.deliveryCity?.toLowerCase().includes("pos");

    const isImmediate =
      order.paymentMethod === "CASH" ||
      order.paymentMethod === "CARD" ||
      order.paymentMethod === "QR_PAY" ||
      order.paymentMethod === "QR" ||
      order.paymentMethod === "ONLINE_BANK" ||
      order.paymentMethod === "BANK_TRANSFER";

    const currentEffective =
      order.paymentStatus === "PAID"
        ? "PAID"
        : isPos && isImmediate && order.paymentMethod !== "SPLIT" && order.paymentMethod !== "CREDIT" && order.paymentMethod !== "COD"
        ? "PAID"
        : order.paymentStatus;

    const newPaymentStatus = currentEffective === "PAID" ? "UNPAID" : "PAID";
    try {
      const res = await fetch(`/api/orders/${order.id}/payment-status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentStatus: newPaymentStatus }),
      });
      if (res.ok) {
        onRefresh();
      }
    } catch (err) {
      console.error("Toggle payment status error:", err);
    }
  };

  // Handle Delete / Cancel Order
  const handleDeleteOrder = async (orderId: string, orderNumber: string) => {
    if (!confirm(`Are you sure you want to cancel and delete Order #${orderNumber}? Reserved product inventory will be restored.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        onRefresh();
      } else {
        alert(data.message || "Failed to cancel order");
      }
    } catch (err) {
      console.error(err);
      alert("Error deleting order.");
    }
  };

  // Open Waybill Modal
  const openWaybillModal = (order: OrderRecord) => {
    setSelectedWaybillOrder(order);
    setWbCourier(order.courierPartner || "Prompt Express");
    setWbTracking(order.trackingNumber || "");
    setWbExpectedDate(order.expectedDeliveryDate ? order.expectedDeliveryDate.slice(0, 10) : "");
    setWaybillModalOpen(true);
  };

  // Submit Waybill
  const handleSaveWaybill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWaybillOrder) return;
    if (!wbTracking.trim()) {
      alert("Please enter a tracking / waybill number.");
      return;
    }

    setWbSaving(true);
    try {
      const res = await fetch(`/api/orders/${selectedWaybillOrder.id}/shipment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courierPartner: wbCourier,
          trackingNumber: wbTracking.trim(),
          expectedDeliveryDate: wbExpectedDate || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setWaybillModalOpen(false);
        onRefresh();
      } else {
        alert(data.message || "Failed to update waybill");
      }
    } catch (err) {
      console.error(err);
      alert("Error saving shipment details.");
    } finally {
      setWbSaving(false);
    }
  };

  // Open Settle COD Remittance Modal
  const openSettleModal = (order: OrderRecord) => {
    setSelectedSettleOrder(order);
    setCodCollected(order.codAmount || order.totalAmount);
    setCourierFee(order.courierFee || 350);
    setRemitRef(order.remittanceRef || "");
    setSettleModalOpen(true);
  };

  // Submit COD Settlement
  const handleSettleCod = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSettleOrder) return;

    setSettleSaving(true);
    try {
      const res = await fetch(`/api/orders/${selectedSettleOrder.id}/cod-settle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          collectedAmount: Number(codCollected) || selectedSettleOrder.totalAmount,
          courierFee: Number(courierFee) || 0,
          remittanceRef: remitRef.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSettleModalOpen(false);
        onRefresh();
        alert(`COD Remittance of Rs. ${data.netRemitted.toLocaleString()} settled and recorded to Cash Flow!`);
      } else {
        alert(data.message || "Failed to settle COD");
      }
    } catch (err) {
      console.error(err);
      alert("Error settling COD.");
    } finally {
      setSettleSaving(false);
    }
  };

  // Verify Bank Slip
  const handleVerifyBankSlip = async (orderId: string) => {
    if (!confirm("Confirm and verify this bank transfer payment receipt?")) return;
    try {
      const res = await fetch(`/api/orders/${orderId}/verify-payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (data.success) {
        onRefresh();
      } else {
        alert(data.message || "Failed to verify bank slip");
      }
    } catch (err) {
      console.error(err);
      alert("Error verifying payment.");
    }
  };

  // Add Item to new order form
  const addItemToNewOrder = (productId: string) => {
    const prod = availProducts.find((p) => p.id === productId);
    if (!prod) return;
    setOrderItems((prev) => {
      const existing = prev.find((it) => it.productId === productId);
      if (existing) {
        return prev.map((it) =>
          it.productId === productId ? { ...it, quantity: it.quantity + 1 } : it
        );
      }
      return [...prev, { productId: prod.id, quantity: 1, unitPrice: prod.sellingPrice }];
    });
  };

  // Submit New Order (Manual / COD Registration from Page 4)
  const handleCreateNewOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!custName.trim() || !custPhone.trim()) {
      alert("Customer name and primary phone number are required.");
      return;
    }
    if (orderItems.length === 0) {
      alert("Please add at least one product to the order.");
      return;
    }

    setSubmittingOrder(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: custName.trim(),
          customerPhone: custPhone.trim(),
          secondaryPhone: custPhone2.trim() || undefined,
          deliveryCity: deliveryCity.trim() || undefined,
          shippingAddress: deliveryAddress.trim() || undefined,
          paymentMethod: orderPaymentMethod,
          courierPartner: orderPaymentMethod === "COD" ? courierPartner : undefined,
          trackingNumber: trackingNumber.trim() || undefined,
          expectedDeliveryDate: expectedDeliveryDate || undefined,
          deliveryFee: deliveryFee === "" ? 0 : Number(deliveryFee),
          notes: orderNotes.trim() || undefined,
          source: "MANUAL_DASHBOARD",
          items: orderItems,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setAddModalOpen(false);
        setCustName("");
        setCustPhone("947");
        setCustPhone2("");
        setDeliveryAddress("");
        setDeliveryCity("");
        setTrackingNumber("");
        setOrderNotes("");
        setOrderItems([]);
        onRefresh();
        alert(`Order #${data.order.orderNumber} successfully created!`);
      } else {
        alert(data.message || data.error || "Failed to create order");
      }
    } catch (err) {
      console.error(err);
      alert("Error creating order.");
    } finally {
      setSubmittingOrder(false);
    }
  };

  // Export to CSV
  const handleExportCsv = () => {
    if (filtered.length === 0) {
      alert("No orders to export.");
      return;
    }
    const headers = [
      "OrderNumber",
      "Date",
      "Channel",
      "Customer",
      "Phone",
      "City",
      "Courier",
      "Tracking",
      "TotalAmount",
      "PaymentMethod",
      "FulfillmentStatus",
      "PaymentStatus",
    ];
    const rows = filtered.map((o) => [
      o.orderNumber,
      o.createdAt ? new Date(o.createdAt).toLocaleDateString() : "",
      o.source,
      `"${o.customerName.replace(/"/g, '""')}"`,
      o.customerPhone,
      `"${(o.deliveryCity || "").replace(/"/g, '""')}"`,
      `"${(o.courierPartner || "").replace(/"/g, '""')}"`,
      o.trackingNumber || "",
      o.totalAmount,
      o.paymentMethod,
      o.status,
      o.paymentStatus,
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `truehive_orders_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const calculatedItemsSubtotal = orderItems.reduce(
    (sum, it) => sum + it.quantity * it.unitPrice,
    0
  );
  const calculatedGrandTotal = calculatedItemsSubtotal + (Number(deliveryFee) || 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-blue-500" />
            Order Management & Fulfillment
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Unified multi-channel order processing (WhatsApp AI, POS & COD), courier waybills, and financial settlements.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            leftIcon={<RefreshCw className="w-4 h-4" />}
          >
            Refresh
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            leftIcon={<Download className="w-4 h-4 text-emerald-400" />}
          >
            Export CSV
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setAddModalOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
            className="bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-600/20"
          >
            Add Order (COD)
          </Button>
        </div>
      </div>

      {/* Dynamic 4 KPI Stat Cards */}
      {channelTab === "COD" ? (
        // LKpos COD Center KPIs (Page 3 of report)
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="TODAY'S COD ORDERS"
            value={`Rs. ${todayCodOrdersVal.toLocaleString()}`}
            subtitle="Booked today"
            icon={<Truck className="w-5 h-5" />}
            iconBg="bg-blue-600/20 text-blue-400 border border-blue-500/20"
          />
          <StatCard
            title="TODAY'S COD COLLECTED"
            value={`Rs. ${todayCodCollectedVal.toLocaleString()}`}
            subtitle="Remitted by couriers today"
            icon={<CheckCircle2 className="w-5 h-5" />}
            iconBg="bg-emerald-600/20 text-emerald-400 border border-emerald-500/20"
          />
          <StatCard
            title="THIS MONTH'S COD"
            value={`Rs. ${thisMonthCodVal.toLocaleString()}`}
            subtitle="Total COD shipments this month"
            icon={<Calendar className="w-5 h-5" />}
            iconBg="bg-purple-600/20 text-purple-400 border border-purple-500/20"
          />
          <StatCard
            title="TOTAL OUTSTANDING COD"
            value={`Rs. ${totalOutstandingCodVal.toLocaleString()}`}
            subtitle="In-transit & pending remittance"
            icon={<AlertCircle className="w-5 h-5" />}
            iconBg="bg-amber-600/20 text-amber-400 border border-amber-500/20"
          />
        </div>
      ) : (
        // Unified Multi-Channel KPIs (Page 12 of report)
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="TOTAL ORDERS"
            value={totalOrdersCount}
            subtitle="Across all sales channels"
            icon={<ClipboardList className="w-5 h-5" />}
            iconBg="bg-blue-600/20 text-blue-400 border border-blue-500/20"
          />
          <StatCard
            title="TOTAL ORDER VALUE"
            value={`Rs. ${totalOrderValue.toLocaleString()}`}
            subtitle="Gross bookings"
            icon={<DollarSign className="w-5 h-5" />}
            iconBg="bg-purple-600/20 text-purple-400 border border-purple-500/20"
          />
          <StatCard
            title="PAYMENTS COLLECTED"
            value={`Rs. ${totalReceived.toLocaleString()}`}
            subtitle="Cleared revenue"
            icon={<CheckCircle2 className="w-5 h-5" />}
            iconBg="bg-emerald-600/20 text-emerald-400 border border-emerald-500/20"
          />
          <StatCard
            title="UNPAID / PENDING"
            value={`Rs. ${totalUnpaid.toLocaleString()}`}
            subtitle="COD & Credit balance"
            icon={<Clock className="w-5 h-5" />}
            iconBg="bg-rose-600/20 text-rose-400 border border-rose-500/20"
          />
        </div>
      )}

      {/* Channel Tabs Toolbar (Page 12) */}
      <div className="flex flex-wrap items-center gap-1.5 pb-1 border-b border-slate-800 no-scrollbar">
        {[
          { key: "ALL", label: "All Orders", icon: Layers },
          { key: "WHATSAPP_AI", label: "WhatsApp AI Orders", icon: Bot, badge: orders.filter((o) => o.source === "WHATSAPP_AI").length },
          { key: "COD", label: "Cash On Delivery (COD)", icon: Truck, badge: codOrders.length },
          { key: "BANK_TRANSFER", label: "Bank Transfer", icon: DollarSign, badge: orders.filter((o) => o.paymentMethod === "BANK_TRANSFER" || o.paymentMethod === "ONLINE_BANK" || o.paymentMethod === "QR_PAY").length },
          { key: "CREDIT", label: "Customer Credit (AR)", icon: CreditCard, badge: orders.filter((o) => o.paymentMethod === "SPLIT" || o.paymentMethod === "CREDIT").length },
          { key: "POS", label: "POS Counter", icon: Package, badge: orders.filter((o) => o.source === "POS_TERMINAL" || o.orderNumber?.startsWith("INV-") || o.deliveryCity?.toLowerCase().includes("pos")).length },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = channelTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setChannelTab(tab.key as any)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition duration-150 ${
                isActive
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                  : "bg-slate-900/60 text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.badge !== undefined && tab.badge > 0 && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  isActive ? "bg-white text-blue-600" : "bg-blue-500/20 text-blue-400"
                }`}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Filter and Table Card */}
      <Card>
        <CardHeader className="border-b border-slate-800/80 pb-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative w-full max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search Order #, Customer, Phone, Tracking, Courier..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Fulfillment Status Dropdown */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-medium text-slate-400 shrink-0">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 cursor-pointer shadow-sm"
              >
                <option value="ALL">All Order Statuses</option>
                <option value="PENDING">Pending (Awaiting Confirmation)</option>
                <option value="PROCESSING">Processing (Preparation & Packing)</option>
                <option value="READY_TO_SHIP">Ready to Ship (Waybill Generated)</option>
                <option value="SHIPPED">Shipped (Dispatched with Courier)</option>
                <option value="DELIVERED">Delivered (Completed)</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <EmptyState
              icon={<ClipboardList className="w-8 h-8" />}
              title="No orders found"
              description="Orders received via WhatsApp AI, POS retail counter, or manual COD registration will appear here."
              actionLabel="Add COD Order"
              onAction={() => setAddModalOpen(true)}
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order / Channel</TableHead>
                    <TableHead>Customer & Location</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Payment & Terms</TableHead>
                    <TableHead>Courier / Waybill</TableHead>
                    <TableHead>Fulfillment Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((order) => {
                    const isWhatsApp = order.source === "WHATSAPP_AI";
                    const isPos =
                      order.source === "POS_TERMINAL" ||
                      order.orderNumber?.startsWith("INV-") ||
                      order.deliveryCity?.toLowerCase().includes("pos");
                    const isCod = order.paymentMethod === "COD";
                    const isBankTransfer =
                      order.paymentMethod === "BANK_TRANSFER" ||
                      order.paymentMethod === "ONLINE_BANK";
                    const isStorePickup =
                      order.courierPartner === "STORE_PICKUP" ||
                      order.deliveryCity === "In-Store" ||
                      order.deliveryCity?.toLowerCase().includes("pos") ||
                      order.shippingAddress?.toLowerCase().includes("store pickup") ||
                      order.shippingAddress?.toLowerCase().includes("in-store") ||
                      order.shippingAddress?.toLowerCase().includes("pos") ||
                      (isPos && !order.trackingNumber && (!order.courierPartner || order.courierPartner === "STORE_PICKUP"));

                    const isImmediatePaidMethod =
                      order.paymentMethod === "CASH" ||
                      order.paymentMethod === "CARD" ||
                      order.paymentMethod === "QR_PAY" ||
                      order.paymentMethod === "QR" ||
                      order.paymentMethod === "ONLINE_BANK" ||
                      order.paymentMethod === "BANK_TRANSFER";

                    const effectivePaymentStatus =
                      order.paymentStatus === "PAID"
                        ? "PAID"
                        : isPos && isImmediatePaidMethod && order.paymentMethod !== "SPLIT" && order.paymentMethod !== "CREDIT" && order.paymentMethod !== "COD"
                        ? "PAID"
                        : order.paymentStatus;

                    const effectiveFulfillmentStatus =
                      isStorePickup && (order.status === "PENDING" || order.status === "CONFIRMED" || !order.status)
                        ? "DELIVERED"
                        : order.status;

                    return (
                      <TableRow key={order.id}>
                        {/* Order # / Date / Channel */}
                        <TableCell>
                          <div className="space-y-1">
                            <span className="font-mono font-bold text-white text-xs block">
                              {order.orderNumber}
                            </span>
                            <span className="text-[10px] text-slate-500 block">
                              {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : "Today"}
                            </span>
                            <span
                              className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                                isWhatsApp
                                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                  : isPos
                                  ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                                  : "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                              }`}
                            >
                              {isWhatsApp && <Bot className="w-3 h-3" />}
                              {isPos && <Package className="w-3 h-3" />}
                              {isWhatsApp ? "WhatsApp AI" : isPos ? "POS Counter" : "Manual"}
                            </span>
                          </div>
                        </TableCell>

                        {/* Customer & Location */}
                        <TableCell>
                          <div className="space-y-0.5">
                            <p className="font-semibold text-white text-xs">{order.customerName}</p>
                            <p className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                              <Phone className="w-3 h-3 text-slate-500" />
                              {order.customerPhone}
                            </p>
                            {order.deliveryCity && (
                              <p className="text-[10px] text-slate-400 flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-slate-500" />
                                {order.deliveryCity}
                              </p>
                            )}
                          </div>
                        </TableCell>

                        {/* Items */}
                        <TableCell>
                          <div className="space-y-0.5 max-w-[180px]">
                            {order.items.slice(0, 2).map((item, idx) => (
                              <p key={idx} className="text-xs text-slate-300 truncate">
                                {item.productName} <span className="text-slate-500 font-mono">×{item.quantity}</span>
                              </p>
                            ))}
                            {order.items.length > 2 && (
                              <p className="text-[10px] text-blue-400 font-medium">
                                +{order.items.length - 2} more item(s)
                              </p>
                            )}
                          </div>
                        </TableCell>

                        {/* Payment & Terms */}
                        <TableCell>
                          <div className="space-y-1">
                            <p className="font-bold text-white text-xs font-mono">
                              Rs. {order.totalAmount.toLocaleString()}
                            </p>
                            <div className="flex flex-wrap items-center gap-1">
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                isCod
                                  ? "bg-amber-500/20 text-amber-400"
                                  : isBankTransfer
                                  ? "bg-blue-500/20 text-blue-400"
                                  : "bg-slate-800 text-slate-300"
                              }`}>
                                {order.paymentMethod === "SPLIT" ? "CREDIT" : order.paymentMethod}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleTogglePaymentStatus(order)}
                                title="Click to toggle Paid/Unpaid"
                                className={`px-1.5 py-0.5 rounded text-[10px] font-semibold cursor-pointer transition ${
                                  effectivePaymentStatus === "PAID"
                                    ? "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
                                    : effectivePaymentStatus === "VERIFYING_SLIP"
                                    ? "bg-amber-500/20 text-amber-400 hover:bg-amber-500/30"
                                    : "bg-rose-500/20 text-rose-400 hover:bg-rose-500/30"
                                }`}
                              >
                                {effectivePaymentStatus}
                              </button>
                            </div>
                          </div>
                        </TableCell>

                        {/* Courier / Waybill */}
                        <TableCell>
                          {isStorePickup ? (
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-semibold text-xs whitespace-nowrap">
                              <Store className="w-3.5 h-3.5" />
                              Store Pickup
                            </div>
                          ) : order.trackingNumber ? (
                            <div className="space-y-0.5">
                              <p className="font-mono text-xs text-white font-bold flex items-center gap-1">
                                <Truck className="w-3.5 h-3.5 text-blue-400" />
                                {order.trackingNumber}
                              </p>
                              <p className="text-[10px] text-slate-400">{order.courierPartner || "Courier"}</p>
                              {isCod && (
                                <span className={`text-[9px] font-bold px-1 py-0.2 rounded ${
                                  order.settlementStatus === "SETTLED"
                                    ? "bg-emerald-500/20 text-emerald-400"
                                    : "bg-amber-500/20 text-amber-400"
                                }`}>
                                  {order.settlementStatus === "SETTLED" ? "Remitted" : "Pending Remittance"}
                                </span>
                              )}
                            </div>
                          ) : (
                            <button
                              onClick={() => openWaybillModal(order)}
                              className="text-[11px] text-blue-400 hover:text-blue-300 flex items-center gap-1 py-1 px-2 rounded-lg bg-blue-600/10 border border-blue-500/20"
                            >
                              <Truck className="w-3 h-3" />
                              Assign Waybill
                            </button>
                          )}
                        </TableCell>

                        {/* Fulfillment Status */}
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <select
                              disabled={updatingId === order.id}
                              value={effectiveFulfillmentStatus}
                              onChange={(e) => handleStatusChange(order.id, e.target.value)}
                              className="px-2 py-1 bg-slate-950 border border-slate-800 rounded-lg text-xs font-semibold text-white focus:outline-none focus:border-blue-500"
                            >
                              {STATUS_ORDER.map((s) => (
                                <option key={s} value={s}>
                                  {s}
                                </option>
                              ))}
                            </select>
                          </div>
                        </TableCell>

                        {/* Actions */}
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            {/* COD Settle action if COD and not settled */}
                            {isCod && order.settlementStatus !== "SETTLED" && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openSettleModal(order)}
                                className="text-xs py-1 px-2 bg-emerald-600/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-600/20"
                                title="Settle COD Remittance"
                              >
                                <DollarSign className="w-3.5 h-3.5" />
                              </Button>
                            )}

                            {/* Bank Slip Verify if verifying */}
                            {isBankTransfer && order.paymentStatus === "VERIFYING_SLIP" && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleVerifyBankSlip(order.id)}
                                className="text-xs py-1 px-2 bg-blue-600/10 border-blue-500/30 text-blue-400"
                                title="Verify Bank Slip"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </Button>
                            )}

                            {/* Waybill edit button */}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openWaybillModal(order)}
                              className="text-xs py-1 px-2 text-slate-300"
                              title="Courier & Waybill"
                            >
                              <Truck className="w-3.5 h-3.5" />
                            </Button>

                            {/* View details */}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedDetailOrder(order);
                                setDetailModalOpen(true);
                              }}
                              className="text-xs py-1 px-2 text-slate-300"
                              title="View Order Details"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </Button>

                            {/* A4 Tax Invoice */}
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => onOpenA4Invoice(order)}
                              className="text-xs py-1 px-2.5"
                              title="Print A4 Tax Invoice"
                            >
                              <FileText className="w-3.5 h-3.5 text-blue-400" />
                              A4
                            </Button>

                            {/* Delete / Cancel Order */}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteOrder(order.id, order.orderNumber)}
                              className="text-xs py-1 px-2 text-rose-400 hover:bg-rose-500/10 border-rose-500/30"
                              title="Cancel & Delete Order"
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

      {/* Add COD Order Registration Modal (Matching Page 4 of Report) */}
      <Modal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="Register New Order (COD / Multi-Channel)"
        description="Book a new customer order, allocate stock, and issue delivery instructions."
        maxWidth="2xl"
      >
        <form onSubmit={handleCreateNewOrder} className="space-y-4 text-xs">
          {/* Customer Info row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-medium text-slate-300 block mb-1">Customer Name *</label>
              <input
                type="text"
                required
                placeholder="Enter customer name"
                value={custName}
                onChange={(e) => setCustName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="font-medium text-slate-300 block mb-1">Contact Number 1 (Primary WhatsApp) *</label>
              <input
                type="text"
                required
                placeholder="07xxxxxxxx / 947xxxxxxxxx"
                value={custPhone}
                onChange={(e) => setCustPhone(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-medium text-slate-300 block mb-1">Contact Number 2 (Secondary Phone)</label>
              <input
                type="text"
                placeholder="07xxxxxxxx / 011xxxxxxx"
                value={custPhone2}
                onChange={(e) => setCustPhone2(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="font-medium text-slate-300 block mb-1">Delivery City / District</label>
              <input
                type="text"
                placeholder="e.g. Colombo, Kandy, Gampaha"
                value={deliveryCity}
                onChange={(e) => setDeliveryCity(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="font-medium text-slate-300 block mb-1">Customer Delivery Address *</label>
            <input
              type="text"
              required
              placeholder="Street address, City, District"
              value={deliveryAddress}
              onChange={(e) => setDeliveryAddress(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Product Items Selection */}
          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-white">Order Products</span>
              <span className="text-slate-400 text-[11px]">{orderItems.length} product(s) added</span>
            </div>

            <div className="flex gap-2">
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    addItemToNewOrder(e.target.value);
                    e.target.value = "";
                  }
                }}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-blue-500"
              >
                <option value="">-- Add product to cart --</option>
                {availProducts.map((p) => (
                  <option key={p.id} value={p.id} disabled={p.currentStock <= 0}>
                    {p.name} (Stock: {p.currentStock}) - Rs. {p.sellingPrice.toLocaleString()}
                  </option>
                ))}
              </select>
            </div>

            {orderItems.length > 0 && (
              <div className="space-y-1.5 max-h-36 overflow-y-auto">
                {orderItems.map((it, idx) => {
                  const p = availProducts.find((x) => x.id === it.productId);
                  return (
                    <div
                      key={idx}
                      className="flex justify-between items-center p-2 rounded-lg bg-slate-950 border border-slate-850"
                    >
                      <span className="font-medium text-white">{p?.name || "Product"}</span>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={1}
                          value={it.quantity}
                          onChange={(e) => {
                            const val = Number(e.target.value) || 1;
                            setOrderItems((prev) =>
                              prev.map((x, i) => (i === idx ? { ...x, quantity: val } : x))
                            );
                          }}
                          className="w-16 px-2 py-1 bg-slate-900 border border-slate-700 rounded text-center text-white"
                        />
                        <span className="font-mono text-emerald-400">
                          Rs. {(it.quantity * it.unitPrice).toLocaleString()}
                        </span>
                        <button
                          type="button"
                          onClick={() => setOrderItems((prev) => prev.filter((_, i) => i !== idx))}
                          className="text-rose-400 hover:text-rose-300 p-1"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Payment & Courier info */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="font-medium text-slate-300 block mb-1">Payment Method *</label>
              <select
                value={orderPaymentMethod}
                onChange={(e) => setOrderPaymentMethod(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-blue-500"
              >
                <option value="COD">Cash on Delivery (COD)</option>
                <option value="BANK_TRANSFER">Bank Transfer</option>
                <option value="CREDIT">Customer Credit (AR)</option>
                <option value="CASH">Cash in Advance</option>
                <option value="CARD">Card / Payment Gateway</option>
              </select>
            </div>

            <div>
              <label className="font-medium text-slate-300 block mb-1">Delivery Fee (Rs.)</label>
              <input
                type="number"
                min={0}
                value={deliveryFee}
                onChange={(e) => setDeliveryFee(e.target.value === "" ? "" : Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="font-medium text-slate-300 block mb-1">Expected Delivery Date</label>
              <input
                type="date"
                value={expectedDeliveryDate}
                onChange={(e) => setExpectedDeliveryDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Courier Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-medium text-slate-300 block mb-1">Courier / Delivery Partner</label>
              <select
                value={courierPartner}
                onChange={(e) => setCourierPartner(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-blue-500"
              >
                {COURIER_PARTNERS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-medium text-slate-300 block mb-1">Tracking / Waybill Number</label>
              <input
                type="text"
                placeholder="e.g. TRK-12345"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="font-medium text-slate-300 block mb-1">Notes / Delivery Instructions</label>
            <input
              type="text"
              placeholder="e.g. Call before delivery, deliver in afternoon"
              value={orderNotes}
              onChange={(e) => setOrderNotes(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Grand total calculation */}
          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex justify-between items-center text-xs">
            <div>
              <span className="text-slate-400">Subtotal: Rs. {calculatedItemsSubtotal.toLocaleString()}</span>
              <span className="text-slate-400 ml-3">Delivery: Rs. {(Number(deliveryFee) || 0).toLocaleString()}</span>
            </div>
            <div className="text-right">
              <span className="text-slate-400 block text-[10px]">TOTAL TO COLLECT</span>
              <span className="text-base font-extrabold text-blue-400 font-mono">
                Rs. {calculatedGrandTotal.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
            <Button type="button" variant="outline" size="sm" onClick={() => setAddModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" loading={submittingOrder} className="bg-blue-600 hover:bg-blue-500">
              Save & Confirm Order
            </Button>
          </div>
        </form>
      </Modal>

      {/* Assign Courier & Waybill Modal */}
      <Modal
        isOpen={waybillModalOpen}
        onClose={() => setWaybillModalOpen(false)}
        title="Assign Courier Partner & Waybill"
        description={selectedWaybillOrder ? `Order #${selectedWaybillOrder.orderNumber}` : ""}
        maxWidth="md"
      >
        {selectedWaybillOrder && (
          <form onSubmit={handleSaveWaybill} className="space-y-4 text-xs">
            <div>
              <label className="font-medium text-slate-300 block mb-1">Select Courier Partner *</label>
              <select
                value={wbCourier}
                onChange={(e) => setWbCourier(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-blue-500"
              >
                {COURIER_PARTNERS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-medium text-slate-300 block mb-1">Waybill / Tracking Number *</label>
              <input
                type="text"
                required
                placeholder="e.g. TRK-778899"
                value={wbTracking}
                onChange={(e) => setWbTracking(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="font-medium text-slate-300 block mb-1">Expected Delivery Date</label>
              <input
                type="date"
                value={wbExpectedDate}
                onChange={(e) => setWbExpectedDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <Button type="button" variant="outline" size="sm" onClick={() => setWaybillModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" loading={wbSaving} className="bg-blue-600 hover:bg-blue-500">
                Update Waybill & Advance
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Settle COD Courier Remittance Modal (Pages 8-9) */}
      <Modal
        isOpen={settleModalOpen}
        onClose={() => setSettleModalOpen(false)}
        title="Settle Courier COD Remittance"
        description={selectedSettleOrder ? `Order #${selectedSettleOrder.orderNumber} via ${selectedSettleOrder.courierPartner || "Courier"}` : ""}
        maxWidth="md"
      >
        {selectedSettleOrder && (
          <form onSubmit={handleSettleCod} className="space-y-4 text-xs">
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-400">Customer:</span>
                <span className="font-semibold text-white">{selectedSettleOrder.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Waybill #:</span>
                <span className="font-mono text-white">{selectedSettleOrder.trackingNumber || "N/A"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Total COD to Collect:</span>
                <span className="font-mono font-bold text-amber-400">Rs. {selectedSettleOrder.totalAmount.toLocaleString()}</span>
              </div>
            </div>

            <div>
              <label className="font-medium text-slate-300 block mb-1">Gross Amount Collected by Courier (Rs.) *</label>
              <input
                type="number"
                required
                min={1}
                value={codCollected}
                onChange={(e) => setCodCollected(e.target.value === "" ? "" : Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="font-medium text-slate-300 block mb-1">Courier Delivery Fee Deduction (Rs.)</label>
              <input
                type="number"
                min={0}
                value={courierFee}
                onChange={(e) => setCourierFee(e.target.value === "" ? "" : Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="font-medium text-slate-300 block mb-1">Bank Remittance Reference #</label>
              <input
                type="text"
                placeholder="e.g. TXN-994401 or Courier Statement Ref"
                value={remitRef}
                onChange={(e) => setRemitRef(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex justify-between items-center text-xs">
              <span className="text-slate-400">Net Bank Receipt Amount:</span>
              <span className="text-base font-extrabold text-emerald-400 font-mono">
                Rs. {Math.max(0, (Number(codCollected) || 0) - (Number(courierFee) || 0)).toLocaleString()}
              </span>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <Button type="button" variant="outline" size="sm" onClick={() => setSettleModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" loading={settleSaving} className="bg-emerald-600 hover:bg-emerald-500">
                Confirm Remittance & Post
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Order Details & Audit Trail Modal */}
      <Modal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        title="Order Details & Lifecycle Audit"
        description={selectedDetailOrder ? `Order #${selectedDetailOrder.orderNumber}` : ""}
        maxWidth="2xl"
      >
        {selectedDetailOrder && (
          <div className="space-y-4 text-xs">
            {/* Customer & Courier Header */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 rounded-xl bg-slate-900 border border-slate-800">
              <div>
                <p className="text-slate-400">Customer</p>
                <p className="font-bold text-white text-sm">{selectedDetailOrder.customerName}</p>
                <p className="text-slate-400">{selectedDetailOrder.customerPhone}</p>
              </div>
              <div>
                <p className="text-slate-400">Channel</p>
                <p className="font-bold text-blue-400 text-sm">{selectedDetailOrder.source}</p>
                <p className="text-slate-400">{selectedDetailOrder.createdAt ? new Date(selectedDetailOrder.createdAt).toLocaleDateString() : "Today"}</p>
              </div>
              <div>
                <p className="text-slate-400">Courier Partner</p>
                <p className="font-bold text-white text-sm">{selectedDetailOrder.courierPartner || "Not assigned"}</p>
                <p className="text-slate-400 font-mono">{selectedDetailOrder.trackingNumber || "Pending waybill"}</p>
              </div>
              <div>
                <p className="text-slate-400">Total Amount</p>
                <p className="font-extrabold text-emerald-400 text-sm font-mono">Rs. {selectedDetailOrder.totalAmount.toLocaleString()}</p>
                <p className="text-slate-400">{selectedDetailOrder.paymentMethod} • {selectedDetailOrder.paymentStatus}</p>
              </div>
            </div>

            {/* Destination Info */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-850 space-y-1">
              <p className="font-semibold text-white">Delivery Address:</p>
              <p className="text-slate-300">{selectedDetailOrder.shippingAddress || "No street address provided"}</p>
              {selectedDetailOrder.deliveryCity && (
                <p className="text-slate-400">City / District: {selectedDetailOrder.deliveryCity}</p>
              )}
              {selectedDetailOrder.secondaryPhone && (
                <p className="text-slate-400">Alternative Tel: {selectedDetailOrder.secondaryPhone}</p>
              )}
            </div>

            {/* Items Table */}
            <div>
              <p className="font-semibold text-white mb-2">Order Line Items ({selectedDetailOrder.items.length}):</p>
              <div className="rounded-xl border border-slate-800 overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-slate-950 text-slate-400 text-[11px]">
                    <tr>
                      <th className="p-2">Item</th>
                      <th className="p-2 text-center">QTY</th>
                      <th className="p-2 text-right">Unit Price</th>
                      <th className="p-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850">
                    {selectedDetailOrder.items.map((it, idx) => (
                      <tr key={idx} className="text-[11px]">
                        <td className="p-2 text-white font-medium">{it.productName}</td>
                        <td className="p-2 text-center text-slate-300 font-mono">{it.quantity}</td>
                        <td className="p-2 text-right text-slate-400 font-mono">Rs. {it.unitPrice.toLocaleString()}</td>
                        <td className="p-2 text-right text-emerald-400 font-mono font-bold">Rs. {it.totalPrice.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Status History Timeline */}
            {selectedDetailOrder.statusHistory && selectedDetailOrder.statusHistory.length > 0 && (
              <div>
                <p className="font-semibold text-white mb-2">Status History & Audit Trail:</p>
                <div className="space-y-1.5 max-h-36 overflow-y-auto">
                  {selectedDetailOrder.statusHistory.map((h: any) => (
                    <div key={h.id} className="flex justify-between items-center p-2 rounded-lg bg-slate-950 border border-slate-850 text-[11px]">
                      <div>
                        <span className="font-bold text-white mr-2">[{h.status}]</span>
                        <span className="text-slate-300">{h.note || "Status updated"}</span>
                      </div>
                      <span className="text-slate-500 text-[10px]">{new Date(h.createdAt).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-between items-center pt-3 border-t border-slate-800">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setDetailModalOpen(false);
                  onOpenA4Invoice(selectedDetailOrder);
                }}
                leftIcon={<FileText className="w-3.5 h-3.5 text-blue-400" />}
              >
                Open A4 Invoice
              </Button>
              <Button variant="outline" size="sm" onClick={() => setDetailModalOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
