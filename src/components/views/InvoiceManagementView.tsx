"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  Receipt,
  Search,
  Plus,
  RefreshCw,
  Calendar,
  Filter,
  Download,
  Printer,
  Eye,
  CheckCircle2,
  AlertCircle,
  Clock,
  Ban,
  ArrowUpDown,
  CreditCard,
  FileSpreadsheet,
  X,
  FileText,
  DollarSign,
  User,
  Phone,
  MapPin,
  Building2,
  Trash2,
  SlidersHorizontal,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { BarcodeDisplay } from "@/components/BarcodeDisplay";
import type { CustomerRecord } from "./CrmView";
import type {
  ProductItem,
  OrderRecord,
  InvoiceRecord,
  InvoiceItemRecord,
  InvoiceStatusType,
  InvoiceTypeEnum,
} from "@/lib/store";
import { convertNumberToWords } from "./QuotationsView";

interface Props {
  orders?: OrderRecord[];
  products?: ProductItem[];
  customers?: CustomerRecord[];
  creditBills?: any[];
  supplierBills?: any[];
  purchaseOrders?: any[];
  onRefresh?: () => void;
  onOpenA4Invoice?: (order: OrderRecord) => void;
}

// Initial sample invoices matching LKpos ERP Invoice Management Report (Page 2, Figure 1)
const INITIAL_LKPOS_INVOICES: InvoiceRecord[] = [];
const OLD_MOCK_INVOICES: InvoiceRecord[] = [
  {
    id: "inv-858000",
    invoiceNumber: "INV-858000",
    type: "STANDARD",
    status: "PAID",
    issuedAt: "2024-04-01T10:14:00Z",
    date: "2024-04-01",
    time: "10:14:00 AM",
    customerName: "D.B.K (Pvt) Ltd",
    customerPhone: "0771234567",
    customerEmail: "info@dbk.lk",
    billingAddress: "45 Lotus Road, Colombo 01",
    currency: "LKR",
    subtotal: 5000.0,
    discountAmount: 0.0,
    taxAmount: 0.0,
    deliveryFee: 0.0,
    totalAmount: 5000.0,
    paidAmount: 5000.0,
    creditBilled: 0.0,
    balance: 0.0,
    returnValue: 0.0,
    paymentMethod: "CASH",
    paymentStatus: "PAID",
    items: [
      {
        description: "Industrial Heavy Duty Bearing 6205",
        quantity: 2,
        unit: "Pcs",
        unitPrice: 2500.0,
        discount: 0,
        totalPrice: 5000.0,
      },
    ],
    createdAt: "2024-04-01T10:14:00Z",
  },
  {
    id: "inv-439000",
    invoiceNumber: "INV-439000",
    type: "POS_RECEIPT",
    status: "PAID",
    issuedAt: "2024-04-01T10:16:00Z",
    date: "2024-04-01",
    time: "10:16:00 AM",
    customerName: "Walk-in Customer",
    customerPhone: "0719876543",
    billingAddress: "Colombo Outlet Counter",
    currency: "LKR",
    subtotal: 4800.0,
    discountAmount: 0.0,
    taxAmount: 0.0,
    deliveryFee: 0.0,
    totalAmount: 4800.0,
    paidAmount: 4800.0,
    creditBilled: 0.0,
    balance: 0.0,
    returnValue: 0.0,
    paymentMethod: "CARD",
    paymentStatus: "PAID",
    items: [
      {
        description: "Hydraulic Seal Kit A-400",
        quantity: 1,
        unit: "Set",
        unitPrice: 4800.0,
        discount: 0,
        totalPrice: 4800.0,
      },
    ],
    createdAt: "2024-04-01T10:16:00Z",
  },
  {
    id: "inv-866000",
    invoiceNumber: "INV-866000",
    type: "STANDARD",
    status: "PAID",
    issuedAt: "2024-04-01T10:18:00Z",
    date: "2024-04-01",
    time: "10:18:00 AM",
    customerName: "Manidu Dinusha",
    customerPhone: "0784837096",
    customerEmail: "manidudinusha@gmail.com",
    billingAddress: "644/B Kajuhena Road, Heiyanthuduwa",
    currency: "LKR",
    subtotal: 2650.0,
    discountAmount: 150.0,
    taxAmount: 0.0,
    deliveryFee: 0.0,
    totalAmount: 2500.0,
    paidAmount: 2500.0,
    creditBilled: 0.0,
    balance: 0.0,
    returnValue: 0.0,
    paymentMethod: "CASH",
    paymentStatus: "PAID",
    items: [
      {
        description: "Polo Premium T-Shirt (Black/L)",
        quantity: 1,
        unit: "Pcs",
        unitPrice: 2650.0,
        discount: 150.0,
        totalPrice: 2500.0,
      },
    ],
    createdAt: "2024-04-01T10:18:00Z",
  },
  {
    id: "inv-828000",
    invoiceNumber: "INV-828000",
    type: "TAX_INVOICE",
    status: "PARTIAL",
    issuedAt: "2024-04-01T10:20:00Z",
    date: "2024-04-01",
    time: "10:20:00 AM",
    customerName: "Dinuka Perera",
    customerPhone: "0761529557",
    customerEmail: "dinuka@truehive.lk",
    billingAddress: "391/1A Waidya Mawatha, Pitipana",
    currency: "LKR",
    subtotal: 13000.0,
    discountAmount: 500.0,
    taxAmount: 0.0,
    deliveryFee: 0.0,
    totalAmount: 12500.0,
    paidAmount: 10000.0,
    creditBilled: 2500.0,
    balance: 2500.0,
    returnValue: 0.0,
    paymentMethod: "SPLIT",
    paymentStatus: "PARTIAL",
    items: [
      {
        description: "Commercial Grade Filter Mesh (10m Roll)",
        quantity: 2,
        unit: "Roll",
        unitPrice: 6500.0,
        discount: 500.0,
        totalPrice: 12500.0,
      },
    ],
    createdAt: "2024-04-01T10:20:00Z",
  },
  {
    id: "inv-700000",
    invoiceNumber: "INV-700000",
    type: "STANDARD",
    status: "UNPAID",
    issuedAt: "2024-03-31T16:45:00Z",
    date: "2024-03-31",
    time: "04:45:00 PM",
    customerName: "Buddhika Auto Works",
    customerPhone: "0714510772",
    customerEmail: "buddhika@autoworks.lk",
    billingAddress: "128 Kandy Road, Kadawatha",
    currency: "LKR",
    subtotal: 18500.0,
    discountAmount: 0.0,
    taxAmount: 0.0,
    deliveryFee: 0.0,
    totalAmount: 18500.0,
    paidAmount: 0.0,
    creditBilled: 18500.0,
    balance: 18500.0,
    returnValue: 0.0,
    paymentMethod: "CREDIT",
    paymentStatus: "UNPAID",
    items: [
      {
        description: "Synthetic Engine Lubricant 20W-50 (20L Drum)",
        quantity: 1,
        unit: "Drum",
        unitPrice: 18500.0,
        discount: 0,
        totalPrice: 18500.0,
      },
    ],
    createdAt: "2024-03-31T16:45:00Z",
  },
  {
    id: "inv-342000",
    invoiceNumber: "INV-342000",
    type: "STANDARD",
    status: "VOID",
    issuedAt: "2024-03-30T14:15:00Z",
    date: "2024-03-30",
    time: "02:15:00 PM",
    customerName: "Test User",
    customerPhone: "0751112233",
    billingAddress: "Nugegoda, Colombo",
    currency: "LKR",
    subtotal: 3200.0,
    discountAmount: 0.0,
    taxAmount: 0.0,
    deliveryFee: 0.0,
    totalAmount: 3200.0,
    paidAmount: 0.0,
    creditBilled: 0.0,
    balance: 0.0,
    returnValue: 3200.0,
    paymentMethod: "CASH",
    paymentStatus: "VOID",
    isVoided: true,
    voidReason: "Customer canceled order at checkout due to duplicate entry",
    voidedAt: "2024-03-30T14:30:00Z",
    items: [
      {
        description: "Ceramic Spark Plug Set (4pcs)",
        quantity: 1,
        unit: "Set",
        unitPrice: 3200.0,
        discount: 0,
        totalPrice: 3200.0,
      },
    ],
    createdAt: "2024-03-30T14:15:00Z",
  },
];

const isMockInvoice = (inv: InvoiceRecord): boolean =>
  inv.id === "inv-858000" ||
  inv.id === "inv-439000" ||
  inv.id === "inv-612000" ||
  inv.id === "inv-994000" ||
  inv.id === "inv-700000" ||
  inv.id === "inv-342000" ||
  inv.invoiceNumber === "INV-858000" ||
  inv.invoiceNumber === "INV-439000" ||
  inv.invoiceNumber === "INV-612000" ||
  inv.invoiceNumber === "INV-994000" ||
  inv.invoiceNumber === "INV-700000" ||
  inv.invoiceNumber === "INV-342000" ||
  inv.customerName === "D.B.K (Pvt) Ltd" ||
  inv.customerName === "Buddhika Auto Works" ||
  (typeof inv.date === "string" && (inv.date.startsWith("2024-03") || inv.date.startsWith("2024-04")));

const convertOrderToInvoice = (ord: OrderRecord): InvoiceRecord => {
  const isPos =
    ord.source === "POS_TERMINAL" ||
    (ord as any).channel === "POS" ||
    Boolean(ord.orderNumber?.startsWith("INV-")) ||
    Boolean(ord.deliveryCity?.toLowerCase().includes("pos"));

  const isImmediate =
    ord.paymentMethod === "CASH" ||
    ord.paymentMethod === "CARD" ||
    ord.paymentMethod === "QR_PAY" ||
    ord.paymentMethod === "QR" ||
    ord.paymentMethod === "ONLINE_BANK" ||
    ord.paymentMethod === "BANK_TRANSFER";

  const effectiveStatus: InvoiceStatusType =
    ord.paymentStatus === "PAID"
      ? "PAID"
      : isPos && isImmediate && ord.paymentMethod !== "SPLIT" && ord.paymentMethod !== "CREDIT" && ord.paymentMethod !== "COD"
      ? "PAID"
      : ord.paymentStatus === "PARTIAL"
      ? "PARTIAL"
      : "UNPAID";

  const issued = ord.createdAt ? new Date(ord.createdAt) : new Date();
  const invDate = issued.toISOString().split("T")[0];
  const invTime = issued.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const rawNum = ord.orderNumber || ord.id || "";
  const invNum = rawNum.startsWith("INV-")
    ? rawNum
    : `INV-${rawNum.replace(/[^0-9]/g, "").padStart(6, "0").slice(-6)}`;

  const total = Number(ord.totalAmount) || 0;
  const paid = effectiveStatus === "PAID" ? total : Number(ord.cashReceived) || 0;
  const balance = effectiveStatus === "PAID" ? 0 : Math.max(0, total - paid);
  const creditBilled =
    ord.paymentMethod === "CREDIT" || ord.paymentMethod === "SPLIT"
      ? total
      : effectiveStatus === "UNPAID"
      ? total
      : 0;

  return {
    id: `inv-ord-${ord.id}`,
    invoiceNumber: invNum,
    type: isPos ? "POS_RECEIPT" : "STANDARD",
    status: effectiveStatus,
    issuedAt: ord.createdAt || new Date().toISOString(),
    date: invDate,
    time: invTime,
    orderId: ord.id,
    customerId: (ord as unknown as { customerId?: string }).customerId,
    customerName: ord.customerName || "Walk-in Customer",
    customerPhone: ord.customerPhone || "POS-Counter",
    billingAddress: ord.shippingAddress || (isPos ? "In-Store POS Counter" : undefined),
    currency: "LKR",
    subtotal: ord.subtotal || total,
    discountAmount: ord.discountAmount || 0,
    taxAmount: ord.taxAmount || 0,
    deliveryFee: ord.deliveryFee || 0,
    totalAmount: total,
    paidAmount: paid,
    creditBilled,
    balance,
    returnValue: 0,
    paymentMethod: ord.paymentMethod,
    paymentStatus: effectiveStatus,
    items: (ord.items || []).map((it) => ({
      productId: it.productId,
      sku: it.sku,
      description: it.productName,
      quantity: it.quantity,
      unit: "Pcs",
      unitPrice: it.unitPrice,
      discount: it.discount || 0,
      totalPrice: it.totalPrice,
    })),
    createdAt: ord.createdAt || new Date().toISOString(),
  };
};

export function InvoiceManagementView({
  orders = [],
  products = [],
  customers = [],
  creditBills: propCreditBills = [],
  supplierBills: propSupplierBills = [],
  purchaseOrders: propPurchaseOrders = [],
  onRefresh,
}: Props) {
  // State
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // LKpos Filter Controls
  const [searchQuery, setSearchQuery] = useState("");
  const [singleDate, setSingleDate] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [viewInvoice, setViewInvoice] = useState<InvoiceRecord | null>(null);
  const [printA4Invoice, setPrintA4Invoice] = useState<InvoiceRecord | null>(null);
  const [printThermalInvoice, setPrintThermalInvoice] = useState<InvoiceRecord | null>(null);
  const [paymentInvoice, setPaymentInvoice] = useState<InvoiceRecord | null>(null);
  const [voidInvoice, setVoidInvoice] = useState<InvoiceRecord | null>(null);

  // Form State for Payment Modal
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<string>("CASH");
  const [paymentRef, setPaymentRef] = useState<string>("");

  // Form State for Void Modal
  const [voidReasonText, setVoidReasonText] = useState<string>("");

  // Live collections for auto-refresh
  const [creditBills, setCreditBills] = useState<any[]>(propCreditBills);
  const [supplierBills, setSupplierBills] = useState<any[]>(propSupplierBills);
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>(propPurchaseOrders);

  useEffect(() => {
    if (propCreditBills.length > 0) setCreditBills(propCreditBills);
    if (propSupplierBills.length > 0) setSupplierBills(propSupplierBills);
    if (propPurchaseOrders.length > 0) setPurchaseOrders(propPurchaseOrders);
  }, [propCreditBills, propSupplierBills, propPurchaseOrders]);

  // Save changes locally and to backend if possible
  const saveInvoicesState = (newInvoices: InvoiceRecord[]) => {
    setInvoices(newInvoices);
    try {
      localStorage.setItem("truehive_invoices_cache", JSON.stringify(newInvoices));
    } catch {}
  };

  // Helper to merge live orders, customer credit settlements, and supplier POs into the invoices ledger seamlessly
  const mergeAllLedgerData = useCallback(
    (
      baseInvoices: InvoiceRecord[],
      orderList: OrderRecord[],
      cBills: any[],
      sBills: any[],
      pOrders: any[]
    ): InvoiceRecord[] => {
      const cleanBase = baseInvoices.filter((inv) => !isMockInvoice(inv));
      const existingKeys = new Set<string>();

      cleanBase.forEach((inv) => {
        if (inv.orderId) existingKeys.add(`ord-${inv.orderId}`);
        if (inv.invoiceNumber) existingKeys.add(inv.invoiceNumber.toLowerCase());
      });

      // 1. Synthesize from Orders
      const orderInvoices: InvoiceRecord[] = [];
      orderList.forEach((ord) => {
        const rawNum = ord.orderNumber || ord.id || "";
        const invNum = rawNum.startsWith("INV-")
          ? rawNum
          : `INV-${rawNum.replace(/[^0-9]/g, "").padStart(6, "0").slice(-6)}`;

        const keyById = `ord-${ord.id}`;
        const keyByNum = invNum.toLowerCase();

        if (!existingKeys.has(keyById) && !existingKeys.has(keyByNum)) {
          orderInvoices.push(convertOrderToInvoice(ord));
          existingKeys.add(keyById);
          existingKeys.add(keyByNum);
        }
      });

      let allInvoices = [...cleanBase, ...orderInvoices];

      // 2. Apply Customer Credit Settlements (AR payments) to matching invoices
      const creditBillMap = new Map<string, any>();
      cBills.forEach((cb) => {
        if (cb.billNumber) creditBillMap.set(cb.billNumber.toLowerCase(), cb);
        if (cb.orderId) creditBillMap.set(`ord-${cb.orderId}`, cb);
      });

      allInvoices = allInvoices.map((inv) => {
        const cb =
          creditBillMap.get(inv.invoiceNumber.toLowerCase()) ||
          (inv.orderId ? creditBillMap.get(`ord-${inv.orderId}`) : undefined);
        if (cb) {
          const paid = Number(cb.paidAmount) || 0;
          const balance = Number(cb.balance);
          const isSettledPaid = cb.status === "PAID" || balance <= 0;
          const status: InvoiceStatusType = isSettledPaid ? "PAID" : paid > 0 ? "PARTIAL" : "UNPAID";

          return {
            ...inv,
            paidAmount: paid,
            balance: balance >= 0 ? balance : 0,
            creditBilled: Number(cb.totalAmount) || inv.totalAmount,
            status,
            paymentStatus: status,
          };
        }
        return inv;
      });

      // Also if a customer credit bill is not yet represented in allInvoices, add it
      cBills.forEach((cb) => {
        const billNum = cb.billNumber || `INV-${cb.id.slice(-6)}`;
        if (!existingKeys.has(billNum.toLowerCase())) {
          const paid = Number(cb.paidAmount) || 0;
          const balance = Number(cb.balance);
          const isSettledPaid = cb.status === "PAID" || balance <= 0;
          const status: InvoiceStatusType = isSettledPaid ? "PAID" : paid > 0 ? "PARTIAL" : "UNPAID";
          const issued = cb.dateGiven ? new Date(cb.dateGiven) : new Date();

          allInvoices.push({
            id: `inv-credit-${cb.id}`,
            invoiceNumber: billNum,
            type: "STANDARD",
            status,
            issuedAt: cb.dateGiven || new Date().toISOString(),
            date: issued.toISOString().split("T")[0],
            time: issued.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
            orderId: cb.orderId,
            customerId: cb.customerId,
            customerName: cb.customerName || cb.customer?.name || "Credit Customer",
            customerPhone: cb.customer?.phone || "",
            currency: "LKR",
            subtotal: cb.totalAmount,
            discountAmount: 0,
            taxAmount: 0,
            deliveryFee: 0,
            totalAmount: cb.totalAmount,
            paidAmount: paid,
            creditBilled: cb.totalAmount,
            balance: balance >= 0 ? balance : 0,
            returnValue: 0,
            paymentMethod: "CREDIT",
            paymentStatus: status,
            items: [
              {
                description: `Customer Credit Sale #${billNum}`,
                quantity: 1,
                unit: "pcs",
                unitPrice: cb.totalAmount,
                totalPrice: cb.totalAmount,
              },
            ],
            createdAt: cb.createdAt || new Date().toISOString(),
          });
          existingKeys.add(billNum.toLowerCase());
        }
      });

      // 3. Synthesize Supplier Purchase Orders (PO) and Supplier Bills (AP)
      const supplierBillMap = new Map<string, any>();
      sBills.forEach((sb) => {
        if (sb.poGrnNumber) supplierBillMap.set(sb.poGrnNumber.toLowerCase(), sb);
        if (sb.billNumber) supplierBillMap.set(sb.billNumber.toLowerCase(), sb);
      });

      pOrders.forEach((po) => {
        const poNum = po.poNumber?.startsWith("PO-") ? po.poNumber : `PO-${po.poNumber}`;
        const key = poNum.toLowerCase();

        if (!existingKeys.has(key)) {
          const sb = supplierBillMap.get(key) || supplierBillMap.get(po.poNumber?.toLowerCase());
          const totalCost = Number(po.totalCost) || 0;
          const paidAmount = sb ? Number(sb.paidAmount) || 0 : (po.status === "COMPLETED" && sb?.status === "PAID" ? totalCost : 0);
          const balance = sb ? Number(sb.balance) : Math.max(0, totalCost - paidAmount);
          const isPaid = (paidAmount >= totalCost && totalCost > 0) || sb?.status === "PAID";
          const status: InvoiceStatusType = isPaid ? "PAID" : paidAmount > 0 ? "PARTIAL" : (po.status === "ISSUED" ? "DRAFT" : "UNPAID");

          const issued = po.createdAt ? new Date(po.createdAt) : new Date();

          allInvoices.push({
            id: `inv-po-${po.id}`,
            invoiceNumber: poNum,
            type: "PURCHASE_PO",
            status,
            issuedAt: po.createdAt || new Date().toISOString(),
            date: issued.toISOString().split("T")[0],
            time: issued.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
            customerName: `${po.supplierName || "Supplier"} (Supplier)`,
            customerPhone: po.supplier?.phone || "",
            billingAddress: po.supplier?.address || "Supplier Procurement",
            currency: "LKR",
            subtotal: totalCost,
            discountAmount: 0,
            taxAmount: 0,
            deliveryFee: 0,
            totalAmount: totalCost,
            paidAmount,
            creditBilled: totalCost,
            balance: balance >= 0 ? balance : 0,
            returnValue: 0,
            paymentMethod: "SUPPLIER_PO",
            paymentStatus: status,
            items: [
              {
                description: po.itemName || "Procurement Goods",
                quantity: Number(po.quantityOrdered) || 1,
                unit: po.unit || "pcs",
                unitPrice: Number(po.unitCost) || 0,
                totalPrice: totalCost,
              },
            ],
            createdAt: po.createdAt || new Date().toISOString(),
          });
          existingKeys.add(key);
        }
      });

      // 4. Also add any direct Supplier Bills from sBills not covered by POs
      sBills.forEach((sb) => {
        const sbNum = sb.billNumber || `SUP-${sb.id.slice(-6)}`;
        if (!existingKeys.has(sbNum.toLowerCase())) {
          const total = Number(sb.totalAmount) || 0;
          const paid = Number(sb.paidAmount) || 0;
          const balance = Number(sb.balance);
          const isPaid = sb.status === "PAID" || balance <= 0;
          const status: InvoiceStatusType = isPaid ? "PAID" : paid > 0 ? "PARTIAL" : "UNPAID";
          const issued = sb.invoiceDate || sb.receivedDate ? new Date(sb.invoiceDate || sb.receivedDate) : new Date();

          allInvoices.push({
            id: `inv-supbill-${sb.id}`,
            invoiceNumber: sbNum,
            type: "PURCHASE_PO",
            status,
            issuedAt: sb.invoiceDate || sb.receivedDate || new Date().toISOString(),
            date: issued.toISOString().split("T")[0],
            time: issued.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
            customerName: `${sb.supplierName || "Supplier"} (Supplier)`,
            customerPhone: sb.supplier?.phone || "",
            currency: "LKR",
            subtotal: total,
            discountAmount: 0,
            taxAmount: 0,
            deliveryFee: 0,
            totalAmount: total,
            paidAmount: paid,
            creditBilled: total,
            balance: balance >= 0 ? balance : 0,
            returnValue: 0,
            paymentMethod: "SUPPLIER_CREDIT",
            paymentStatus: status,
            items: [
              {
                description: sb.items || `Supplier Purchase #${sbNum}`,
                quantity: 1,
                unit: "lot",
                unitPrice: total,
                totalPrice: total,
              },
            ],
            createdAt: sb.createdAt || new Date().toISOString(),
          });
          existingKeys.add(sbNum.toLowerCase());
        }
      });

      allInvoices.sort((a, b) => {
        const timeA = new Date(a.issuedAt || a.createdAt || 0).getTime();
        const timeB = new Date(b.issuedAt || b.createdAt || 0).getTime();
        return timeB - timeA;
      });

      return allInvoices;
    },
    []
  );

  // Load Invoices from API or LocalStorage with automatic credit bills & PO sync
  const loadInvoices = useCallback(async () => {
    setIsLoading(true);
    let loadedFromApi: InvoiceRecord[] = [];
    let activeCBills = creditBills;
    let activeSBills = supplierBills;
    let activePOrders = purchaseOrders;

    try {
      const [invRes, cbRes, sbRes, poRes] = await Promise.allSettled([
        fetch("/api/invoices"),
        fetch("/api/credit/customer-bills"),
        fetch("/api/credit/supplier-bills"),
        fetch("/api/suppliers"),
      ]);

      if (invRes.status === "fulfilled" && invRes.value.ok) {
        const data = await invRes.value.json();
        const list = Array.isArray(data) ? data : (data.data || data.invoices || []);
        if (Array.isArray(list)) {
          loadedFromApi = list.filter((inv: InvoiceRecord) => !isMockInvoice(inv));
        }
      }

      if (cbRes.status === "fulfilled" && cbRes.value.ok) {
        const d = await cbRes.value.json();
        if (d.bills && Array.isArray(d.bills)) {
          activeCBills = d.bills;
          setCreditBills(d.bills);
        }
      }

      if (sbRes.status === "fulfilled" && sbRes.value.ok) {
        const d = await sbRes.value.json();
        if (d.bills && Array.isArray(d.bills)) {
          activeSBills = d.bills;
          setSupplierBills(d.bills);
        }
      }

      if (poRes.status === "fulfilled" && poRes.value.ok) {
        const d = await poRes.value.json();
        if (d.purchaseOrders && Array.isArray(d.purchaseOrders)) {
          activePOrders = d.purchaseOrders;
          setPurchaseOrders(d.purchaseOrders);
        }
      }
    } catch {
      // Backend not yet reachable, fallback
    }

    if (loadedFromApi.length === 0) {
      try {
        const saved = localStorage.getItem("truehive_invoices_cache");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            loadedFromApi = parsed.filter((inv: InvoiceRecord) => !isMockInvoice(inv));
          }
        }
      } catch {}
    }

    const merged = mergeAllLedgerData(
      loadedFromApi,
      orders,
      activeCBills,
      activeSBills,
      activePOrders
    );
    setInvoices(merged);
    try {
      localStorage.setItem("truehive_invoices_cache", JSON.stringify(merged));
    } catch {}
    setIsLoading(false);
  }, [orders, creditBills, supplierBills, purchaseOrders, mergeAllLedgerData]);

  useEffect(() => {
    loadInvoices();
  }, [loadInvoices]);

  useEffect(() => {
    if (orders.length > 0 || creditBills.length > 0 || supplierBills.length > 0 || purchaseOrders.length > 0) {
      setInvoices((prev) => {
        const merged = mergeAllLedgerData(
          prev,
          orders,
          creditBills,
          supplierBills,
          purchaseOrders
        );
        try {
          localStorage.setItem("truehive_invoices_cache", JSON.stringify(merged));
        } catch {}
        return merged;
      });
    }
  }, [orders, creditBills, supplierBills, purchaseOrders, mergeAllLedgerData]);

  // Sync Orders into Invoices (triggers backend sync and re-merges)
  const handleSyncOrders = async () => {
    setIsLoading(true);
    try {
      await fetch("/api/invoices/sync-orders", { method: "POST" });
    } catch {}

    if (onRefresh) {
      onRefresh();
    }
    await loadInvoices();
    setIsLoading(false);
  };

  // Filter Logic matching LKpos
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchNumber = inv.invoiceNumber.toLowerCase().includes(q);
        const matchCustomer = inv.customerName.toLowerCase().includes(q);
        const matchPhone = inv.customerPhone?.toLowerCase().includes(q) ?? false;
        const matchAddress = inv.billingAddress?.toLowerCase().includes(q) ?? false;
        if (!matchNumber && !matchCustomer && !matchPhone && !matchAddress) return false;
      }

      // Single Date
      if (singleDate) {
        const invDate = inv.date || inv.issuedAt.split("T")[0];
        if (invDate !== singleDate) return false;
      }

      // Month
      if (selectedMonth) {
        const invDate = inv.date || inv.issuedAt.split("T")[0];
        if (!invDate.startsWith(selectedMonth)) return false;
      }

      // Date Range
      if (fromDate) {
        const invDate = inv.date || inv.issuedAt.split("T")[0];
        if (invDate < fromDate) return false;
      }
      if (toDate) {
        const invDate = inv.date || inv.issuedAt.split("T")[0];
        if (invDate > toDate) return false;
      }

      // Status
      if (statusFilter !== "ALL") {
        if (inv.status !== statusFilter) return false;
      }

      // Type / Category
      if (typeFilter !== "ALL") {
        if (typeFilter === "SALES" && inv.type === "PURCHASE_PO") return false;
        if (typeFilter === "PURCHASE_PO" && inv.type !== "PURCHASE_PO") return false;
      }

      return true;
    });
  }, [invoices, searchQuery, singleDate, selectedMonth, fromDate, toDate, statusFilter, typeFilter]);

  // Executive LKpos KPIs calculated dynamically over filtered set
  const kpiStats = useMemo(() => {
    let totalOffers = 0;
    let totalReturnValue = 0;
    let totalAmount = 0;
    let totalPaid = 0;
    let totalOutstanding = 0;

    filteredInvoices.forEach((inv) => {
      if (inv.status !== "VOID") {
        totalOffers += Number(inv.discountAmount) || 0;
        totalReturnValue += Number(inv.returnValue) || 0;
        totalAmount += Number(inv.totalAmount) || 0;
        totalPaid += Number(inv.paidAmount) || 0;
        totalOutstanding += Number(inv.balance) || 0;
      } else {
        totalReturnValue += Number(inv.returnValue || inv.totalAmount) || 0;
      }
    });

    return {
      totalOffers,
      totalReturnValue,
      totalAmount,
      totalPaid,
      totalOutstanding,
      count: filteredInvoices.length,
    };
  }, [filteredInvoices]);

  // Clear filters
  const handleClearFilters = () => {
    setSearchQuery("");
    setSingleDate("");
    setSelectedMonth("");
    setFromDate("");
    setToDate("");
    setStatusFilter("ALL");
    setTypeFilter("ALL");
  };

  // Export to CSV
  const handleExportCsv = () => {
    const headers = [
      "Invoice Number",
      "Date",
      "Time",
      "Customer",
      "Phone",
      "Subtotal (LKR)",
      "Offers / Discount",
      "Total Amount",
      "Paid Amount",
      "Credit Billed",
      "Outstanding Balance",
      "Return Value",
      "Status",
      "Payment Method",
    ];

    const rows = filteredInvoices.map((inv) => [
      inv.invoiceNumber,
      inv.date || inv.issuedAt.split("T")[0],
      inv.time || "",
      `"${inv.customerName.replace(/"/g, '""')}"`,
      inv.customerPhone || "",
      inv.subtotal.toFixed(2),
      inv.discountAmount.toFixed(2),
      inv.totalAmount.toFixed(2),
      inv.paidAmount.toFixed(2),
      inv.creditBilled.toFixed(2),
      inv.balance.toFixed(2),
      inv.returnValue.toFixed(2),
      inv.status,
      inv.paymentMethod || "CASH",
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Invoices_Export_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Record Payment Handler
  const handleRecordPaymentSubmit = async () => {
    if (!paymentInvoice || paymentAmount <= 0) return;
    const newPaid = Number(paymentInvoice.paidAmount) + Number(paymentAmount);
    const newBal = Math.max(0, Number(paymentInvoice.totalAmount) - newPaid);
    const newStatus: InvoiceStatusType = newBal <= 0 ? "PAID" : "PARTIAL";

    try {
      await fetch(`/api/invoices/${paymentInvoice.id}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: paymentAmount,
          method: paymentMethod,
          reference: paymentRef,
        }),
      });
    } catch {}

    const updated = invoices.map((inv) => {
      if (inv.id === paymentInvoice.id) {
        return {
          ...inv,
          paidAmount: newPaid,
          balance: newBal,
          status: newStatus,
        };
      }
      return inv;
    });

    saveInvoicesState(updated);
    setPaymentInvoice(null);
    setPaymentAmount(0);
    setPaymentRef("");
  };

  // Void Invoice Handler (Controlled Reversal)
  const handleVoidInvoiceSubmit = async () => {
    if (!voidInvoice || !voidReasonText.trim()) return;

    try {
      await fetch(`/api/invoices/${voidInvoice.id}/void`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reason: voidReasonText,
        }),
      });
    } catch {}

    const updated = invoices.map((inv) => {
      if (inv.id === voidInvoice.id) {
        return {
          ...inv,
          status: "VOID" as InvoiceStatusType,
          isVoided: true,
          voidReason: voidReasonText,
          voidedAt: new Date().toISOString(),
          returnValue: inv.totalAmount,
          balance: 0,
        };
      }
      return inv;
    });

    saveInvoicesState(updated);
    setVoidInvoice(null);
    setVoidReasonText("");
  };

  // Select all toggle
  const handleToggleSelectAll = () => {
    if (selectedIds.length === filteredInvoices.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredInvoices.map((inv) => inv.id));
    }
  };

  const handleToggleSelectOne = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto min-h-screen">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Receipt className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">
                Invoice Management & Billing
              </h1>
              <p className="text-sm text-slate-400 mt-0.5">
                Centralized ERP sales invoicing, payment allocations, credit tracking, and thermal/A4 tax printing.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={loadInvoices}
            disabled={isLoading}
            className="border-slate-700 hover:bg-slate-800 text-slate-300"
          >
            <RefreshCw className={`w-4 h-4 mr-1.5 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleSyncOrders}
            className="border-blue-500/30 hover:bg-blue-500/10 text-blue-400"
          >
            <Sparkles className="w-4 h-4 mr-1.5" />
            Sync Orders
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            className="border-emerald-500/30 hover:bg-emerald-500/10 text-emerald-400"
          >
            <Download className="w-4 h-4 mr-1.5" />
            Export CSV
          </Button>

          <Button
            size="sm"
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow-lg shadow-blue-600/25"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            New Invoice
          </Button>
        </div>
      </div>

      {/* 5 LKpos KPI Executive Metric Cards (Figure 1 in ERP Invoice Management Report) */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
        {/* Total Offers */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm relative overflow-hidden">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Total Offers
          </div>
          <div className="text-xl sm:text-2xl font-bold text-white mt-1.5">
            Rs. {kpiStats.totalOffers.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Discounts & promotions applied</div>
          <div className="absolute right-3 top-3 w-2 h-2 rounded-full bg-cyan-400/50" />
        </div>

        {/* Total Return Value */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm relative overflow-hidden">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Total Return Value
          </div>
          <div className="text-xl sm:text-2xl font-bold text-amber-400 mt-1.5">
            Rs. {kpiStats.totalReturnValue.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Returned merchandise / Credit notes</div>
          <div className="absolute right-3 top-3 w-2 h-2 rounded-full bg-amber-400/50" />
        </div>

        {/* Total Amount */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm relative overflow-hidden">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Total Amount
          </div>
          <div className="text-xl sm:text-2xl font-bold text-blue-400 mt-1.5">
            Rs. {kpiStats.totalAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Gross sales & billing ledger</div>
          <div className="absolute right-3 top-3 w-2 h-2 rounded-full bg-blue-400/50" />
        </div>

        {/* Total Paid */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm relative overflow-hidden">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Total Paid
          </div>
          <div className="text-xl sm:text-2xl font-bold text-emerald-400 mt-1.5">
            Rs. {kpiStats.totalPaid.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Settled cash, card & bank receipts</div>
          <div className="absolute right-3 top-3 w-2 h-2 rounded-full bg-emerald-400/50" />
        </div>

        {/* Total Outstanding */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm relative overflow-hidden">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Total Outstanding
          </div>
          <div className="text-xl sm:text-2xl font-bold text-rose-400 mt-1.5">
            Rs. {kpiStats.totalOutstanding.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Customer credit receivable balance</div>
          <div className="absolute right-3 top-3 w-2 h-2 rounded-full bg-rose-400/50" />
        </div>
      </div>

      {/* Filter Toolbar (LKpos Standard: Search, Single Date, Month, Range, Clear) */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm space-y-3.5">
        <div className="flex items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-wider">
            <SlidersHorizontal className="w-3.5 h-3.5 text-blue-400" />
            Filter & Search Invoices
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">
              Showing <span className="font-bold text-white">{filteredInvoices.length}</span> of{" "}
              {invoices.length} invoices
            </span>
            {(searchQuery || singleDate || selectedMonth || fromDate || toDate || statusFilter !== "ALL") && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearFilters}
                className="text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 h-7 px-2"
              >
                <X className="w-3.5 h-3.5 mr-1" />
                Clear
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          {/* Search Query */}
          <div className="lg:col-span-2 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Invoice #, Customer, Phone..."
              className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700/80 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Single Date */}
          <div>
            <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
              Select Date
            </label>
            <input
              type="date"
              value={singleDate}
              onChange={(e) => {
                setSingleDate(e.target.value);
                setSelectedMonth("");
                setFromDate("");
                setToDate("");
              }}
              className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700/80 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Month Picker */}
          <div>
            <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
              Select Month
            </label>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => {
                setSelectedMonth(e.target.value);
                setSingleDate("");
              }}
              className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700/80 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Date Range: From */}
          <div>
            <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
              From Date
            </label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => {
                setFromDate(e.target.value);
                setSingleDate("");
              }}
              className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700/80 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Date Range: To */}
          <div>
            <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
              To Date
            </label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => {
                setToDate(e.target.value);
                setSingleDate("");
              }}
              className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700/80 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Status & Category Pills */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/60 mt-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-400 mr-1.5">Status:</span>
            {["ALL", "PAID", "PARTIAL", "UNPAID", "VOID", "DRAFT"].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                  statusFilter === st
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-slate-950 text-slate-400 hover:text-white border border-slate-800"
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-400 mr-1.5">Category:</span>
            {[
              { id: "ALL", label: "All Records" },
              { id: "SALES", label: "Sales & POS Invoices" },
              { id: "PURCHASE_PO", label: "Supplier PO / AP" },
            ].map((tp) => (
              <button
                key={tp.id}
                onClick={() => setTypeFilter(tp.id)}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                  typeFilter === tp.id
                    ? "bg-purple-600 text-white shadow-sm"
                    : "bg-slate-950 text-slate-400 hover:text-white border border-slate-800"
                }`}
              >
                {tp.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Invoices Table (LKpos UI Reference Page 2) */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-3 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={
                      filteredInvoices.length > 0 &&
                      selectedIds.length === filteredInvoices.length
                    }
                    onChange={handleToggleSelectAll}
                    className="rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-0 cursor-pointer"
                  />
                </th>
                <th className="py-3.5 px-4 font-bold text-slate-300">Invoice Number</th>
                <th className="py-3.5 px-3">Date</th>
                <th className="py-3.5 px-3">Time</th>
                <th className="py-3.5 px-4 font-bold text-slate-300 text-right">Total Amount</th>
                <th className="py-3.5 px-3 text-right">Credit Billed</th>
                <th className="py-3.5 px-4">Customer</th>
                <th className="py-3.5 px-3 text-right">Offers</th>
                <th className="py-3.5 px-3 text-right">Return Value</th>
                <th className="py-3.5 px-3 text-center">Status</th>
                <th className="py-3.5 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-500 font-sans">
                    <Receipt className="w-10 h-10 mx-auto text-slate-600 mb-2 opacity-50" />
                    No invoices matching your active filters.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => {
                  const isVoid = inv.status === "VOID" || inv.isVoided;
                  return (
                    <tr
                      key={inv.id}
                      className={`hover:bg-slate-800/40 transition-colors ${
                        isVoid ? "opacity-60 bg-slate-950/40" : ""
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-3 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(inv.id)}
                          onChange={() => handleToggleSelectOne(inv.id)}
                          className="rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-0 cursor-pointer"
                        />
                      </td>

                      {/* Invoice Number */}
                      <td className="py-3 px-4 font-bold text-blue-400 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setViewInvoice(inv)}
                            className="hover:underline flex items-center gap-1 text-left"
                          >
                            {inv.invoiceNumber}
                          </button>
                          {inv.type === "PURCHASE_PO" && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wider uppercase bg-purple-500/15 text-purple-300 border border-purple-500/30">
                              PO / AP
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Date */}
                      <td className="py-3 px-3 text-slate-300 whitespace-nowrap">
                        {inv.date || inv.issuedAt.split("T")[0]}
                      </td>

                      {/* Time */}
                      <td className="py-3 px-3 text-slate-400 whitespace-nowrap">
                        {inv.time ||
                          new Date(inv.issuedAt).toLocaleTimeString("en-US", {
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                          })}
                      </td>

                      {/* Total Amount */}
                      <td className="py-3 px-4 font-bold text-white text-right whitespace-nowrap">
                        {inv.totalAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </td>

                      {/* Credit Billed */}
                      <td className="py-3 px-3 text-slate-300 text-right whitespace-nowrap">
                        {inv.creditBilled.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </td>

                      {/* Customer / Vendor */}
                      <td className="py-3 px-4 text-slate-200 font-sans whitespace-nowrap max-w-[220px] truncate">
                        <div className="flex items-center gap-1.5">
                          <div className="font-semibold text-white truncate">{inv.customerName}</div>
                          {inv.type === "PURCHASE_PO" && (
                            <span className="shrink-0 text-[9px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 font-bold uppercase tracking-wide">
                              Supplier
                            </span>
                          )}
                        </div>
                        {inv.customerPhone && (
                          <div className="text-[11px] text-slate-500 font-mono">
                            {inv.customerPhone}
                          </div>
                        )}
                      </td>

                      {/* Offers */}
                      <td className="py-3 px-3 text-slate-400 text-right whitespace-nowrap">
                        {inv.discountAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </td>

                      {/* Return Value */}
                      <td className="py-3 px-3 text-amber-400/90 text-right whitespace-nowrap">
                        {inv.returnValue.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3 text-center whitespace-nowrap font-sans">
                        {inv.status === "PAID" && (
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            PAID
                          </span>
                        )}
                        {inv.status === "PARTIAL" && (
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            PARTIAL
                          </span>
                        )}
                        {inv.status === "UNPAID" && (
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                            UNPAID
                          </span>
                        )}
                        {inv.status === "VOID" && (
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-800 text-slate-400 line-through border border-slate-700">
                            VOID
                          </span>
                        )}
                        {inv.status === "DRAFT" && (
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                            DRAFT
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-center whitespace-nowrap font-sans">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Quick View */}
                          <button
                            title="View Invoice Details"
                            onClick={() => setViewInvoice(inv)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Print A4 */}
                          <button
                            title="Official A4 Tax Invoice"
                            onClick={() => setPrintA4Invoice(inv)}
                            className="p-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 hover:text-blue-300 border border-blue-500/20 transition-colors"
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </button>

                          {/* Print Thermal 80mm */}
                          <button
                            title="Thermal POS Receipt (80mm)"
                            onClick={() => setPrintThermalInvoice(inv)}
                            className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 hover:text-emerald-300 border border-emerald-500/20 transition-colors"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>

                          {/* Record Payment */}
                          {!isVoid && inv.balance > 0 && (
                            <button
                              title="Record Payment"
                              onClick={() => {
                                setPaymentInvoice(inv);
                                setPaymentAmount(inv.balance);
                              }}
                              className="p-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 hover:text-amber-300 border border-amber-500/20 transition-colors"
                            >
                              <CreditCard className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Void / Controlled Reversal */}
                          {!isVoid && (
                            <button
                              title="Controlled Reversal / Void"
                              onClick={() => setVoidInvoice(inv)}
                              className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 border border-rose-500/20 transition-colors"
                            >
                              <Ban className="w-3.5 h-3.5" />
                            </button>
                          )}
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

      {/* ========================================================= */}
      {/* 1. VIEW INVOICE DETAILS MODAL */}
      {/* ========================================================= */}
      {viewInvoice && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full p-6 space-y-5 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-blue-400" />
                <h3 className="text-lg font-bold text-white">
                  Invoice {viewInvoice.invoiceNumber}
                </h3>
                <span
                  className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                    viewInvoice.status === "PAID"
                      ? "bg-emerald-500/20 text-emerald-400"
                      : viewInvoice.status === "PARTIAL"
                      ? "bg-amber-500/20 text-amber-400"
                      : viewInvoice.status === "VOID"
                      ? "bg-slate-800 text-slate-400 line-through"
                      : "bg-rose-500/20 text-rose-400"
                  }`}
                >
                  {viewInvoice.status}
                </span>
              </div>
              <button
                onClick={() => setViewInvoice(null)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Summary Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs">
              <div>
                <span className="text-slate-500 block">Date & Time</span>
                <span className="font-semibold text-white">
                  {viewInvoice.date} {viewInvoice.time}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Customer</span>
                <span className="font-semibold text-white">{viewInvoice.customerName}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Contact</span>
                <span className="font-semibold text-white">
                  {viewInvoice.customerPhone || "N/A"}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Payment Mode</span>
                <span className="font-semibold text-white">
                  {viewInvoice.paymentMethod || "CASH"}
                </span>
              </div>
            </div>

            {/* Items */}
            <div className="border border-slate-800 rounded-xl overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-950 text-slate-400 uppercase font-bold text-[10px]">
                  <tr>
                    <th className="p-2.5">Item Description</th>
                    <th className="p-2.5 text-center">Unit</th>
                    <th className="p-2.5 text-center">Qty</th>
                    <th className="p-2.5 text-right">Unit Price</th>
                    <th className="p-2.5 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 font-mono text-slate-300">
                  {viewInvoice.items.map((it, idx) => (
                    <tr key={idx}>
                      <td className="p-2.5 font-sans font-medium text-white">
                        {it.description}
                      </td>
                      <td className="p-2.5 text-center">{it.unit || "Pcs"}</td>
                      <td className="p-2.5 text-center">{it.quantity}</td>
                      <td className="p-2.5 text-right">{it.unitPrice.toFixed(2)}</td>
                      <td className="p-2.5 text-right font-bold text-white">
                        {it.totalPrice.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Financials */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Subtotal</span>
                <span>Rs. {viewInvoice.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Total Offers (Discounts)</span>
                <span>- Rs. {viewInvoice.discountAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Tax Amount</span>
                <span>Rs. {viewInvoice.taxAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-base font-bold text-white border-t border-slate-800 pt-2">
                <span>Total Billed Amount</span>
                <span className="text-blue-400">Rs. {viewInvoice.totalAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-emerald-400">
                <span>Total Paid</span>
                <span>Rs. {viewInvoice.paidAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-rose-400 font-bold">
                <span>Outstanding Balance</span>
                <span>Rs. {viewInvoice.balance.toFixed(2)}</span>
              </div>
            </div>

            {/* Void Details if any */}
            {viewInvoice.isVoided && (
              <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-3 text-xs text-rose-300 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <Ban className="w-4 h-4" /> This Invoice was Voided / Reversed
                </div>
                <div>Reason: {viewInvoice.voidReason}</div>
                <div className="text-[10px] text-rose-400">
                  Voided at: {viewInvoice.voidedAt}
                </div>
              </div>
            )}

            {/* Footer Buttons */}
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setPrintThermalInvoice(viewInvoice);
                  setViewInvoice(null);
                }}
                className="text-xs"
              >
                <Printer className="w-3.5 h-3.5 mr-1.5" /> Thermal Receipt
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  setPrintA4Invoice(viewInvoice);
                  setViewInvoice(null);
                }}
                className="bg-blue-600 hover:bg-blue-500 text-xs text-white"
              >
                <FileText className="w-3.5 h-3.5 mr-1.5" /> A4 Tax Invoice
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. OFFICIAL A4 TAX INVOICE PREVIEW MODAL */}
      {/* ========================================================= */}
      {printA4Invoice && (
        <A4InvoicePrintModal
          invoice={printA4Invoice}
          onClose={() => setPrintA4Invoice(null)}
        />
      )}

      {/* ========================================================= */}
      {/* 3. THERMAL 80MM POS RECEIPT PREVIEW MODAL */}
      {/* ========================================================= */}
      {printThermalInvoice && (
        <ThermalReceiptModal
          invoice={printThermalInvoice}
          onClose={() => setPrintThermalInvoice(null)}
        />
      )}

      {/* ========================================================= */}
      {/* 4. RECORD PAYMENT MODAL */}
      {/* ========================================================= */}
      {paymentInvoice && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-emerald-400" />
                <h3 className="text-lg font-bold text-white">Record Invoice Payment</h3>
              </div>
              <button
                onClick={() => setPaymentInvoice(null)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-400">Invoice:</span>
                <span className="font-bold text-white">{paymentInvoice.invoiceNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Customer:</span>
                <span className="font-semibold text-white">{paymentInvoice.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Total Billed:</span>
                <span className="font-mono text-white">
                  Rs. {paymentInvoice.totalAmount.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-rose-400 font-bold border-t border-slate-800/80 pt-1">
                <span>Remaining Balance Due:</span>
                <span className="font-mono">Rs. {paymentInvoice.balance.toFixed(2)}</span>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Payment Amount (LKR)
                </label>
                <input
                  type="number"
                  min="1"
                  max={paymentInvoice.balance}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm font-bold text-emerald-400 focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Payment Method
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="CASH">Cash</option>
                  <option value="CARD">Credit / Debit Card</option>
                  <option value="BANK_TRANSFER">Bank Transfer (Commercial Bank)</option>
                  <option value="CHEQUE">Cheque</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Reference Note / Receipt #
                </label>
                <input
                  type="text"
                  placeholder="e.g. Bank ref #98213 / Counter receipt"
                  value={paymentRef}
                  onChange={(e) => setPaymentRef(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPaymentInvoice(null)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleRecordPaymentSubmit}
                disabled={paymentAmount <= 0}
                className="bg-emerald-600 hover:bg-emerald-500 text-xs text-white font-semibold"
              >
                Confirm Payment
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 5. CONTROLLED VOID / REVERSAL MODAL */}
      {/* ========================================================= */}
      {voidInvoice && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-rose-900/60 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Ban className="w-5 h-5 text-rose-400" />
                <h3 className="text-lg font-bold text-white">Controlled Void / Reversal</h3>
              </div>
              <button
                onClick={() => setVoidInvoice(null)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-3 text-xs text-rose-300 space-y-1">
              <p className="font-semibold">Compliance Note (ERP Accounting Standards):</p>
              <p className="text-[11px] text-rose-200/80">
                Issued invoices cannot be deleted to preserve the audit trail. This will flag{" "}
                <span className="font-bold text-white">{voidInvoice.invoiceNumber}</span> as VOID,
                reverse outstanding balances into Return Value, and record an audit log.
              </p>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Mandatory Reversal Reason <span className="text-rose-400">*</span>
              </label>
              <textarea
                rows={3}
                required
                value={voidReasonText}
                onChange={(e) => setVoidReasonText(e.target.value)}
                placeholder="State the commercial or operational reason for voiding this invoice..."
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setVoidInvoice(null)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleVoidInvoiceSubmit}
                disabled={!voidReasonText.trim()}
                className="bg-rose-600 hover:bg-rose-500 text-xs text-white font-semibold"
              >
                Confirm Controlled Void
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 6. CREATE NEW INVOICE MODAL */}
      {/* ========================================================= */}
      {showCreateModal && (
        <CreateInvoiceModal
          products={products}
          customers={customers}
          onClose={() => setShowCreateModal(false)}
          onCreate={(newInv) => {
            saveInvoicesState([newInv, ...invoices]);
            setShowCreateModal(false);
          }}
        />
      )}
    </div>
  );
}

// =========================================================================
// SUBCOMPONENT: A4 TAX INVOICE PRINT MODAL
// =========================================================================
function A4InvoicePrintModal({
  invoice,
  onClose,
}: {
  invoice: InvoiceRecord;
  onClose: () => void;
}) {
  const invoiceRef = useRef<HTMLDivElement | null>(null);

  const handleDownloadPdf = async () => {
    if (!invoiceRef.current) return;
    try {
      const html2pdfModule = (await import("html2pdf.js")).default;
      html2pdfModule()
        .set({
          margin: 10,
          filename: `Invoice_${invoice.invoiceNumber}.pdf`,
          image: { type: "jpeg", quality: 0.98 },
          html2canvas: { scale: 2 },
          jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
        })
        .from(invoiceRef.current)
        .save();
    } catch {
      window.print();
    }
  };

  const amountInWords = convertNumberToWords(invoice.totalAmount);

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-start justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-3xl w-full p-4 sm:p-6 space-y-4 shadow-2xl my-8">
        {/* Top Header Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3 no-print">
          <div className="flex items-center gap-2 text-sm font-bold text-white">
            <FileText className="w-4 h-4 text-blue-400" />
            Official A4 Tax & Commercial Invoice ({invoice.invoiceNumber})
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPdf}
              className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md"
            >
              <Download className="w-3.5 h-3.5" /> Download PDF
            </button>
            <button
              onClick={() => window.print()}
              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md"
            >
              <Printer className="w-3.5 h-3.5" /> Print A4
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable A4 Sheet Layout */}
        <div
          ref={invoiceRef}
          className="bg-white text-slate-900 p-8 sm:p-10 rounded-xl shadow-lg border border-slate-200 font-sans space-y-6 text-sm"
        >
          {/* Header Row */}
          <div className="flex justify-between items-start border-b border-slate-200 pb-6">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center p-2">
                <img src="/truehive-logo.png" alt="TrueHive Logo" className="w-full h-full object-contain" />
              </div>
              <div>
                <h2 className="text-2xl font-black tracking-tight text-slate-900">
                  TrueHive (Pvt) Ltd
                </h2>
                <p className="text-xs text-slate-600">Enterprise Solutions & Industrial Commerce</p>
                <p className="text-xs text-slate-500 mt-1">Bandaranayake Mawatha, Colombo, Sri Lanka</p>
                <p className="text-xs text-slate-500">Tel: +94 76 573 1249 | Email: contact@truehive.lk</p>
                <p className="text-xs font-mono text-slate-500">VAT/SVAT Reg: #102938475-7000</p>
              </div>
            </div>

            <div className="text-right">
              <span
                className={`inline-block px-3 py-1 rounded text-white text-xs font-black uppercase tracking-wider ${
                  invoice.type === "PURCHASE_PO" ? "bg-purple-900" : "bg-slate-900"
                }`}
              >
                {invoice.type === "PURCHASE_PO" ? "PURCHASE ORDER INVOICE" : "TAX INVOICE"}
              </span>
              <div className="mt-3 text-xs space-y-1 font-mono">
                <div>
                  <span className="text-slate-500">{invoice.type === "PURCHASE_PO" ? "PO / Bill No: " : "Invoice No: "}</span>
                  <span className="font-bold text-slate-900">{invoice.invoiceNumber}</span>
                </div>
                <div>
                  <span className="text-slate-500">Date: </span>
                  <span className="text-slate-900">{invoice.date || invoice.issuedAt.split("T")[0]}</span>
                </div>
                <div>
                  <span className="text-slate-500">Status: </span>
                  <span
                    className={`font-bold ${
                      invoice.status === "PAID"
                        ? "text-emerald-700"
                        : invoice.status === "PARTIAL"
                        ? "text-amber-700"
                        : "text-rose-700"
                    }`}
                  >
                    {invoice.status}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Bill To Section */}
          <div className="grid grid-cols-2 gap-6 bg-slate-50 p-4 rounded-lg border border-slate-200">
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                {invoice.type === "PURCHASE_PO" ? "SUPPLIER / VENDOR DETAILS" : "INVOICE TO (CLIENT)"}
              </span>
              <h3 className="font-bold text-base text-slate-900">{invoice.customerName}</h3>
              {invoice.billingAddress && (
                <p className="text-xs text-slate-600 mt-0.5">{invoice.billingAddress}</p>
              )}
              {invoice.customerPhone && (
                <p className="text-xs text-slate-600">Phone: {invoice.customerPhone}</p>
              )}
              {invoice.customerEmail && (
                <p className="text-xs text-slate-600">Email: {invoice.customerEmail}</p>
              )}
            </div>

            <div className="text-right">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                PAYMENT TERMS & METHOD
              </span>
              <p className="text-xs font-semibold text-slate-900">
                Method: {invoice.paymentMethod || "CASH / BANK"}
              </p>
              <p className="text-xs text-slate-600 mt-0.5">
                Currency: <span className="font-mono font-bold">LKR (Sri Lankan Rupees)</span>
              </p>
              {invoice.dueDate && (
                <p className="text-xs text-slate-600">Due Date: {invoice.dueDate}</p>
              )}
            </div>
          </div>

          {/* Line Items Table */}
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold uppercase text-[10px]">
                <tr>
                  <th className="py-2.5 px-3 w-8 text-center">#</th>
                  <th className="py-2.5 px-3">Item Description</th>
                  <th className="py-2.5 px-3 text-center">Unit</th>
                  <th className="py-2.5 px-3 text-center">Qty</th>
                  <th className="py-2.5 px-3 text-right">Unit Price</th>
                  <th className="py-2.5 px-3 text-right">Offers / Disc</th>
                  <th className="py-2.5 px-3 text-right">Total (LKR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-mono">
                {invoice.items.map((it, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-3 text-center text-slate-500">{idx + 1}</td>
                    <td className="py-2.5 px-3 font-sans font-semibold text-slate-900">
                      {it.description}
                    </td>
                    <td className="py-2.5 px-3 text-center text-slate-600 font-sans">
                      {it.unit || "Pcs"}
                    </td>
                    <td className="py-2.5 px-3 text-center text-slate-900">{it.quantity}</td>
                    <td className="py-2.5 px-3 text-right text-slate-700">
                      {it.unitPrice.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-500">
                      {(it.discount || 0).toFixed(2)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                      {it.totalPrice.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Financial Breakdown & Totals */}
          <div className="flex justify-between items-start gap-6 pt-2">
            {/* Amount In Words & Bank Details */}
            <div className="w-7/12 space-y-3">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs">
                <span className="font-bold text-slate-700 block mb-0.5">Amount in Words:</span>
                <p className="italic text-slate-800">{amountInWords}</p>
              </div>

              <div className="text-[11px] text-slate-600 space-y-0.5">
                <span className="font-bold text-slate-900 block">Bank Settlement Account:</span>
                <div>Bank: Commercial Bank of Ceylon | Branch: Colombo 03</div>
                <div>Account Name: TrueHive (Pvt) Ltd</div>
                <div>Account No: 8001928374 | Swift: CCEYLKLX</div>
              </div>
            </div>

            {/* Totals Table */}
            <div className="w-5/12 bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-1.5 text-xs font-mono">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span>Rs. {invoice.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Total Offers:</span>
                <span>- Rs. {invoice.discountAmount.toFixed(2)}</span>
              </div>
              {invoice.taxAmount > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>Tax Amount:</span>
                  <span>Rs. {invoice.taxAmount.toFixed(2)}</span>
                </div>
              )}
              {invoice.deliveryFee > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>Delivery / Shipping:</span>
                  <span>Rs. {invoice.deliveryFee.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-bold text-slate-900 border-t border-slate-300 pt-2 font-sans">
                <span>Total Billed:</span>
                <span>Rs. {invoice.totalAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-emerald-700 font-semibold border-t border-slate-200 pt-1">
                <span>Amount Paid:</span>
                <span>Rs. {invoice.paidAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-rose-700 font-bold">
                <span>Balance Due:</span>
                <span>Rs. {invoice.balance.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Barcode & Signature */}
          <div className="flex justify-between items-end border-t border-slate-200 pt-6">
            <div className="space-y-1">
              <BarcodeDisplay value={invoice.invoiceNumber} height={36} width={1.4} fontSize={11} />
              <p className="text-[10px] text-slate-500 font-sans">
                Official computer-generated invoice. No physical seal required.
              </p>
            </div>

            <div className="text-center w-52 space-y-2">
              <div className="border-b border-slate-400 w-full h-12" />
              <span className="text-xs font-bold text-slate-900 block uppercase tracking-wider">
                Authorized Signature
              </span>
              <span className="text-[10px] text-slate-500">TrueHive Accounts Department</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// =========================================================================
// SUBCOMPONENT: THERMAL 80MM POS RECEIPT PREVIEW MODAL
// =========================================================================
function ThermalReceiptModal({
  invoice,
  onClose,
}: {
  invoice: InvoiceRecord;
  onClose: () => void;
}) {
  const receiptRef = useRef<HTMLDivElement | null>(null);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-start justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-sm w-full p-4 space-y-4 shadow-2xl my-8">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 no-print">
          <div className="flex items-center gap-2 text-sm font-bold text-white">
            <Printer className="w-4 h-4 text-emerald-400" />
            Thermal POS Receipt (80mm)
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" /> Print
            </button>
            <button onClick={onClose} className="p-1 text-slate-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 80mm POS Thermal Slip */}
        <div
          ref={receiptRef}
          className="bg-white text-slate-950 p-5 rounded-lg shadow-inner font-mono text-[12px] leading-relaxed space-y-3 border border-slate-200"
        >
          {/* Header */}
          <div className="text-center space-y-1">
            <h3 className="font-extrabold text-base tracking-wide">TRUEHIVE ERP</h3>
            <p className="text-[11px] text-slate-700">BUSINESS HUB & POINT OF SALE</p>
            <p className="text-[10px] text-slate-600">Bandaranayake Mawatha, Colombo</p>
            <p className="text-[10px] text-slate-600">Tel: +94 76 573 1249</p>
          </div>

          <div className="border-t border-dashed border-slate-400 my-2" />

          {/* Receipt Info */}
          <div className="text-[11px] space-y-0.5">
            <div className="flex justify-between">
              <span>Receipt #:</span>
              <span className="font-bold">{invoice.invoiceNumber}</span>
            </div>
            <div className="flex justify-between">
              <span>Date:</span>
              <span>{invoice.date || invoice.issuedAt.split("T")[0]}</span>
            </div>
            <div className="flex justify-between">
              <span>Time:</span>
              <span>{invoice.time || "10:14:00 AM"}</span>
            </div>
            <div className="flex justify-between">
              <span>Customer:</span>
              <span className="truncate max-w-[140px] font-semibold">{invoice.customerName}</span>
            </div>
          </div>

          <div className="border-t border-dashed border-slate-400 my-2" />

          {/* Items Header */}
          <div className="text-[11px] font-bold grid grid-cols-12 gap-1 pb-1">
            <span className="col-span-6">ITEM</span>
            <span className="col-span-2 text-center">QTY</span>
            <span className="col-span-4 text-right">PRICE</span>
          </div>

          {/* Items List */}
          <div className="space-y-1.5 text-[11px]">
            {invoice.items.map((it, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-1">
                <span className="col-span-6 truncate font-medium">{it.description}</span>
                <span className="col-span-2 text-center">{it.quantity}</span>
                <span className="col-span-4 text-right font-bold">{it.totalPrice.toFixed(2)}</span>
              </div>
            ))}
          </div>

          <div className="border-t border-dashed border-slate-400 my-2" />

          {/* Totals */}
          <div className="space-y-1 text-[11px]">
            <div className="flex justify-between">
              <span>SUBTOTAL:</span>
              <span>Rs. {invoice.subtotal.toFixed(2)}</span>
            </div>
            {invoice.discountAmount > 0 && (
              <div className="flex justify-between">
                <span>OFFERS/DISCOUNT:</span>
                <span>- Rs. {invoice.discountAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-extrabold border-t border-slate-300 pt-1">
              <span>NET TOTAL:</span>
              <span>Rs. {invoice.totalAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>PAID ({invoice.paymentMethod || "CASH"}):</span>
              <span>Rs. {invoice.paidAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold">
              <span>BALANCE:</span>
              <span>Rs. {invoice.balance.toFixed(2)}</span>
            </div>
          </div>

          <div className="border-t border-dashed border-slate-400 my-2" />

          {/* Barcode representation */}
          <div className="flex justify-center pt-1">
            <BarcodeDisplay value={invoice.invoiceNumber} height={32} width={1.2} fontSize={10} />
          </div>

          {/* Footer */}
          <div className="text-center text-[10px] text-slate-600 pt-2 space-y-0.5">
            <p className="font-bold text-slate-800">THANK YOU FOR YOUR BUSINESS!</p>
            <p>Please retain this receipt for warranty and returns.</p>
            <p>TrueHive ERP Systems</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// =========================================================================
// SUBCOMPONENT: CREATE INVOICE MODAL
// =========================================================================
function CreateInvoiceModal({
  products,
  customers,
  onClose,
  onCreate,
}: {
  products: ProductItem[];
  customers: CustomerRecord[];
  onClose: () => void;
  onCreate: (invoice: InvoiceRecord) => void;
}) {
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [billingAddress, setBillingAddress] = useState("");
  const [invoiceType, setInvoiceType] = useState<InvoiceTypeEnum>("STANDARD");
  const [paymentMethod, setPaymentMethod] = useState("CASH");

  // Items
  const [items, setItems] = useState<
    {
      description: string;
      quantity: number;
      unit: string;
      unitPrice: number;
      discount: number;
      totalPrice: number;
    }[]
  >([
    {
      description: "",
      quantity: 1,
      unit: "Pcs",
      unitPrice: 0,
      discount: 0,
      totalPrice: 0,
    },
  ]);

  const [deliveryFee, setDeliveryFee] = useState<number>(0);
  const [taxPercent, setTaxPercent] = useState<number>(0);
  const [paidAmount, setPaidAmount] = useState<number>(0);

  // Auto-fill customer details
  const handleSelectCustomer = (cName: string) => {
    setCustomerName(cName);
    const found = customers.find((c) => c.name === cName);
    if (found) {
      setCustomerPhone(found.phone || "");
      setCustomerEmail(found.email || "");
      setBillingAddress(found.address || "");
    }
  };

  // Add Item Line
  const handleAddItem = () => {
    setItems([
      ...items,
      {
        description: "",
        quantity: 1,
        unit: "Pcs",
        unitPrice: 0,
        discount: 0,
        totalPrice: 0,
      },
    ]);
  };

  // Remove Item Line
  const handleRemoveItem = (index: number) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  // Update Item Line
  const handleUpdateItem = (
    index: number,
    field: string,
    value: string | number
  ) => {
    const updated = [...items];
    const row = { ...updated[index], [field]: value };
    const qty = Number(row.quantity) || 0;
    const price = Number(row.unitPrice) || 0;
    const disc = Number(row.discount) || 0;
    row.totalPrice = Math.max(0, qty * price - disc);
    updated[index] = row;
    setItems(updated);
  };

  // Select catalog product
  const handleSelectProduct = (index: number, prodName: string) => {
    const prod = products.find((p) => p.name === prodName);
    if (prod) {
      handleUpdateItem(index, "description", prod.name);
      handleUpdateItem(index, "unitPrice", prod.sellingPrice || 0);
    } else {
      handleUpdateItem(index, "description", prodName);
    }
  };

  // Calculation
  const subtotal = useMemo(() => {
    return items.reduce((acc, it) => acc + (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0), 0);
  }, [items]);

  const totalDiscount = useMemo(() => {
    return items.reduce((acc, it) => acc + (Number(it.discount) || 0), 0);
  }, [items]);

  const taxAmount = useMemo(() => {
    const net = Math.max(0, subtotal - totalDiscount);
    return (net * taxPercent) / 100;
  }, [subtotal, totalDiscount, taxPercent]);

  const grandTotal = useMemo(() => {
    return Math.max(0, subtotal - totalDiscount + taxAmount + Number(deliveryFee));
  }, [subtotal, totalDiscount, taxAmount, deliveryFee]);

  const balance = useMemo(() => {
    return Math.max(0, grandTotal - Number(paidAmount));
  }, [grandTotal, paidAmount]);

  const handleSaveInvoice = () => {
    if (!customerName.trim()) {
      alert("Please enter customer name.");
      return;
    }
    if (items.length === 0 || !items[0].description.trim()) {
      alert("Please enter at least one invoice line item.");
      return;
    }

    const randomSuffix = Math.floor(100000 + Math.random() * 900000);
    const invNum = `INV-${randomSuffix}`;
    const now = new Date();
    const dateStr = now.toISOString().split("T")[0];
    const timeStr = now.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

    const status: InvoiceStatusType =
      balance <= 0 ? "PAID" : paidAmount > 0 ? "PARTIAL" : "UNPAID";

    const newInvoice: InvoiceRecord = {
      id: `inv-${Date.now()}`,
      invoiceNumber: invNum,
      type: invoiceType,
      status,
      issuedAt: now.toISOString(),
      date: dateStr,
      time: timeStr,
      customerName,
      customerPhone,
      customerEmail,
      billingAddress,
      currency: "LKR",
      subtotal,
      discountAmount: totalDiscount,
      taxAmount,
      deliveryFee: Number(deliveryFee),
      totalAmount: grandTotal,
      paidAmount: Number(paidAmount),
      creditBilled: balance,
      balance,
      returnValue: 0,
      paymentMethod,
      paymentStatus: status,
      items: items.map((it) => ({
        description: it.description,
        unit: it.unit,
        quantity: Number(it.quantity),
        unitPrice: Number(it.unitPrice),
        discount: Number(it.discount),
        totalPrice: Number(it.totalPrice),
      })),
      createdAt: now.toISOString(),
    };

    onCreate(newInvoice);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-start justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-4xl w-full p-6 space-y-5 shadow-2xl my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-blue-400" />
            <h3 className="text-lg font-bold text-white">Create New Official Invoice</h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Customer Information */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
            Client / Customer Details
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="text-[10px] font-bold text-slate-400 block mb-1">
                Customer Name <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                list="customer-list"
                value={customerName}
                onChange={(e) => handleSelectCustomer(e.target.value)}
                placeholder="Select or enter customer..."
                className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500"
              />
              <datalist id="customer-list">
                {customers.map((c) => (
                  <option key={c.id} value={c.name} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 block mb-1">
                Phone Number
              </label>
              <input
                type="text"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="07X XXX XXXX"
                className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 block mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                placeholder="client@mail.com"
                className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 block mb-1">
                Invoice Type
              </label>
              <select
                value={invoiceType}
                onChange={(e) => setInvoiceType(e.target.value as InvoiceTypeEnum)}
                className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500"
              >
                <option value="STANDARD">Standard Commercial</option>
                <option value="TAX_INVOICE">Tax Invoice (Official)</option>
                <option value="POS_RECEIPT">POS Thermal Receipt</option>
                <option value="PROFORMA">Proforma Invoice</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 block mb-1">
              Billing Address / Street
            </label>
            <input
              type="text"
              value={billingAddress}
              onChange={(e) => setBillingAddress(e.target.value)}
              placeholder="e.g. 45 Lotus Road, Colombo 01"
              className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Line Items Editor */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Itemized Line Items
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddItem}
              className="text-xs border-slate-700 text-blue-400 hover:bg-slate-800"
            >
              <Plus className="w-3.5 h-3.5 mr-1" /> Add Line Item
            </Button>
          </div>

          <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-900 text-slate-400 uppercase font-bold text-[10px]">
                <tr>
                  <th className="p-2.5">Product / Item Description</th>
                  <th className="p-2.5 w-24">Unit</th>
                  <th className="p-2.5 w-20 text-center">Qty</th>
                  <th className="p-2.5 w-28 text-right">Unit Price</th>
                  <th className="p-2.5 w-24 text-right">Discount</th>
                  <th className="p-2.5 w-28 text-right">Total (LKR)</th>
                  <th className="p-2.5 w-10 text-center"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {items.map((row, idx) => (
                  <tr key={idx}>
                    <td className="p-2">
                      <input
                        type="text"
                        list={`prod-list-${idx}`}
                        value={row.description}
                        onChange={(e) => handleSelectProduct(idx, e.target.value)}
                        placeholder="Item name or SKU..."
                        className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded text-xs text-white"
                      />
                      <datalist id={`prod-list-${idx}`}>
                        {products.map((p) => (
                          <option key={p.id} value={p.name} />
                        ))}
                      </datalist>
                    </td>
                    <td className="p-2">
                      <select
                        value={row.unit}
                        onChange={(e) => handleUpdateItem(idx, "unit", e.target.value)}
                        className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded text-xs text-white"
                      >
                        <option value="Pcs">Pcs</option>
                        <option value="Set">Set</option>
                        <option value="kg">kg</option>
                        <option value="g">g</option>
                        <option value="ml">ml</option>
                        <option value="ltr">ltr</option>
                        <option value="Box">Box</option>
                        <option value="Bottle">Bottle</option>
                        <option value="Roll">Roll</option>
                      </select>
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        min="1"
                        value={row.quantity}
                        onChange={(e) => handleUpdateItem(idx, "quantity", e.target.value)}
                        className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded text-xs text-white text-center font-mono"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        min="0"
                        value={row.unitPrice}
                        onChange={(e) => handleUpdateItem(idx, "unitPrice", e.target.value)}
                        className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded text-xs text-white text-right font-mono"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        min="0"
                        value={row.discount}
                        onChange={(e) => handleUpdateItem(idx, "discount", e.target.value)}
                        className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded text-xs text-white text-right font-mono"
                      />
                    </td>
                    <td className="p-2 text-right font-bold text-white font-mono">
                      {row.totalPrice.toFixed(2)}
                    </td>
                    <td className="p-2 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        className="text-slate-500 hover:text-rose-400"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Financial Settlement Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-950 p-4 rounded-xl border border-slate-800">
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Payment Method
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
              >
                <option value="CASH">Cash</option>
                <option value="CARD">Credit / Debit Card</option>
                <option value="BANK_TRANSFER">Bank Transfer</option>
                <option value="CREDIT">Credit Bill (AR)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Paid Amount (LKR)
              </label>
              <input
                type="number"
                min="0"
                value={paidAmount}
                onChange={(e) => setPaidAmount(Number(e.target.value))}
                placeholder="Enter amount paid now..."
                className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-emerald-400 font-mono font-bold"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1">
                  Tax Rate (%)
                </label>
                <input
                  type="number"
                  min="0"
                  value={taxPercent}
                  onChange={(e) => setTaxPercent(Number(e.target.value))}
                  className="w-full px-2 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1">
                  Delivery Fee (LKR)
                </label>
                <input
                  type="number"
                  min="0"
                  value={deliveryFee}
                  onChange={(e) => setDeliveryFee(Number(e.target.value))}
                  className="w-full px-2 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2 text-xs font-mono justify-self-end w-full max-w-xs">
            <div className="flex justify-between text-slate-400">
              <span>Subtotal:</span>
              <span>Rs. {subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Total Offers:</span>
              <span>- Rs. {totalDiscount.toFixed(2)}</span>
            </div>
            {taxAmount > 0 && (
              <div className="flex justify-between text-slate-400">
                <span>Tax ({taxPercent}%):</span>
                <span>Rs. {taxAmount.toFixed(2)}</span>
              </div>
            )}
            {deliveryFee > 0 && (
              <div className="flex justify-between text-slate-400">
                <span>Delivery:</span>
                <span>Rs. {deliveryFee.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-bold text-white border-t border-slate-800 pt-2 font-sans">
              <span>Grand Total:</span>
              <span className="text-blue-400">Rs. {grandTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-emerald-400">
              <span>Paid Amount:</span>
              <span>Rs. {Number(paidAmount).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-rose-400 font-bold border-t border-slate-800 pt-1">
              <span>Balance Due:</span>
              <span>Rs. {balance.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
          <Button variant="outline" size="sm" onClick={onClose} className="text-xs">
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSaveInvoice}
            className="bg-blue-600 hover:bg-blue-500 text-xs text-white font-semibold shadow-lg shadow-blue-600/20"
          >
            Generate & Issue Invoice
          </Button>
        </div>
      </div>
    </div>
  );
}
