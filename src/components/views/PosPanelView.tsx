"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  ShoppingCart,
  ScanBarcode,
  Camera,
  Plus,
  Minus,
  Trash2,
  CheckCircle2,
  PauseCircle,
  PlayCircle,
  Printer,
  Search,
  Eye,
  X,
  Gift,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { CameraBarcodeScannerModal } from "@/components/CameraBarcodeScannerModal";
import { useHardwareBarcodeScanner } from "@/lib/barcode/useBarcodeScanner";
import type { ProductItem, IngredientItem, OrderRecord } from "@/lib/store";

export interface PosCartItem {
  product: ProductItem;
  quantity: number;
  unitOffer: number; // Offer per unit (Rs.)
  offers: number;    // Flat item offer (Rs.)
}

interface HeldBill {
  id: string;
  customerName: string;
  customerPhone: string;
  items: PosCartItem[];
  heldAt: string;
}

export type PosPaymentMethod = "Cash" | "Card" | "QR Pay" | "Online Bank" | "Credit" | "COD";

interface PosPanelViewProps {
  products: ProductItem[];
  ingredients: IngredientItem[];
  orders?: OrderRecord[];
  onRefresh: () => void;
  onOpenA4Invoice?: (order: OrderRecord) => void;
}

export function PosPanelView({
  products,
  ingredients,
  orders: initialOrders,
  onRefresh,
  onOpenA4Invoice,
}: PosPanelViewProps) {
  // Barcode & Product Catalog
  const [barcodeInput, setBarcodeInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [cameraModalOpen, setCameraModalOpen] = useState(false);
  const [scanBanner, setScanBanner] = useState("");

  // Cart & Customer Inputs
  const [cart, setCart] = useState<PosCartItem[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [heldBills, setHeldBills] = useState<HeldBill[]>([]);

  // Charges, Discounts, Taxes
  const [billDiscountInput, setBillDiscountInput] = useState<number>(0);
  const [vatInput, setVatInput] = useState<number>(0);
  const [serviceChargesInput, setServiceChargesInput] = useState<number>(0);
  const [deliveryChargesInput, setDeliveryChargesInput] = useState<number>(0);
  const [isFreeValue, setIsFreeValue] = useState<boolean>(false);

  // Payment
  const [paymentMethod, setPaymentMethod] = useState<PosPaymentMethod>("Cash");
  const [paidAmount, setPaidAmount] = useState<string>("");
  const [checkingOut, setCheckingOut] = useState(false);

  // Recent Orders State & View Modal
  const [recentOrders, setRecentOrders] = useState<OrderRecord[]>(initialOrders || []);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [viewingInvoice, setViewingInvoice] = useState<any | null>(null);
  const [businessName, setBusinessName] = useState("Fashion dora");

  // Fetch recent orders from backend
  const fetchRecentOrders = useCallback(async () => {
    setLoadingOrders(true);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("truehive_token") : null;
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch("/api/orders", { headers });
      if (res.ok) {
        const data = await res.json();
        if (data.orders) setRecentOrders(data.orders);
      }
    } catch (e) {
      console.warn("Failed to fetch recent orders:", e);
    } finally {
      setLoadingOrders(false);
    }
  }, []);

  useEffect(() => {
    fetchRecentOrders();
  }, [fetchRecentOrders]);

  // Load business name from settings if available
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch("/api/settings");
        if (res.ok) {
          const data = await res.json();
          if (data.settings?.companyName) {
            setBusinessName(data.settings.companyName);
          }
        }
      } catch {}
    };
    fetchSettings();
  }, []);

  // Hardware Barcode Scanner integration
  const handleScanBarcode = (code: string) => {
    const clean = code.trim();
    const found = products.find(
      (p) =>
        p.barcode.toLowerCase() === clean.toLowerCase() ||
        p.sku.toLowerCase() === clean.toLowerCase()
    );
    if (found) {
      addToCart(found);
      setScanBanner(`Scanned [${found.barcode}] -> Added "${found.name}" to bill!`);
    } else {
      setScanBanner(`Barcode [${clean}] not recognized.`);
    }
    setTimeout(() => setScanBanner(""), 4000);
  };

  useHardwareBarcodeScanner(handleScanBarcode, true);

  // Cart operations
  const addToCart = (product: ProductItem) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [
        ...prev,
        {
          product,
          quantity: 1,
          unitOffer: 0,
          offers: 0,
        },
      ];
    });
  };

  const updateQty = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((i) => (i.product.id === productId ? { ...i, quantity: i.quantity + delta } : i))
        .filter((i) => i.quantity > 0)
    );
  };

  const removeItem = (productId: string) => {
    setCart((prev) => prev.filter((i) => i.product.id !== productId));
  };

  const updateUnitOffer = (productId: string, val: number) => {
    setCart((prev) =>
      prev.map((i) => (i.product.id === productId ? { ...i, unitOffer: Math.max(0, val) } : i))
    );
  };

  const updateItemOffer = (productId: string, val: number) => {
    setCart((prev) =>
      prev.map((i) => (i.product.id === productId ? { ...i, offers: Math.max(0, val) } : i))
    );
  };

  // Calculations
  const calculateItemTotal = (item: PosCartItem) => {
    const gross = item.product.sellingPrice * item.quantity;
    const itemDiscount = (item.unitOffer || 0) * item.quantity + (item.offers || 0);
    return Math.max(0, gross - itemDiscount);
  };

  const subtotal = cart.reduce((sum, item) => sum + item.product.sellingPrice * item.quantity, 0);

  const totalItemOffers = cart.reduce(
    (sum, item) => sum + (item.unitOffer || 0) * item.quantity + (item.offers || 0),
    0
  );

  const totalDiscount = totalItemOffers + (billDiscountInput || 0);

  const calculatedGrandTotal = Math.max(
    0,
    subtotal - totalDiscount + (vatInput || 0) + (serviceChargesInput || 0) + (deliveryChargesInput || 0)
  );

  const grandTotal = isFreeValue ? 0 : calculatedGrandTotal;

  const paidNum = paidAmount === "" ? 0 : Number(paidAmount);
  const balance = Math.max(0, paidNum - grandTotal);

  // Hold / Resume bill
  const handleHoldBill = () => {
    if (cart.length === 0) return;
    setHeldBills((prev) => [
      {
        id: `hold-${Date.now()}`,
        customerName: customerName || "Walk-in Customer",
        customerPhone: customerPhone || "",
        items: cart,
        heldAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
      ...prev,
    ]);
    setCart([]);
    setScanBanner("Bill held. Ready for next customer.");
    setTimeout(() => setScanBanner(""), 3500);
  };

  const handleResumeHeldBill = (bill: HeldBill) => {
    setCart(bill.items);
    setCustomerName(bill.customerName);
    setCustomerPhone(bill.customerPhone);
    setHeldBills((prev) => prev.filter((b) => b.id !== bill.id));
  };

  // Checkout
  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setCheckingOut(true);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("truehive_token") : null;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const backendMethodMap: Record<PosPaymentMethod, string> = {
        Cash: "CASH",
        Card: "CARD",
        "QR Pay": "QR_PAY",
        "Online Bank": "ONLINE_BANK",
        Credit: "CREDIT",
        COD: "COD",
      };

      const payload = {
        customerName: customerName.trim() || "Walk-in Customer",
        customerPhone: customerPhone.trim() || "POS-Counter",
        paymentMethod: backendMethodMap[paymentMethod],
        items: cart.map((i) => ({
          productId: i.product.id,
          quantity: i.quantity,
          unitOffer: i.unitOffer,
          offers: i.offers,
          itemTotal: calculateItemTotal(i),
        })),
        subtotal,
        totalDiscount,
        vat: vatInput,
        serviceCharges: serviceChargesInput,
        deliveryCharges: deliveryChargesInput,
        isFreeValue,
        grandTotal,
        paidAmount: paidNum,
        balance,
      };

      const res = await fetch("/api/pos/checkout", {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success && data.order) {
        // Prepare data for the Invoice Details Modal
        const invoiceData = {
          orderNumber: data.orderNumber || data.order.orderNumber,
          createdAt: data.order.createdAt || new Date().toISOString(),
          paymentMethod: paymentMethod,
          items: cart.map((item, idx) => ({
            index: idx + 1,
            name: item.product.name,
            sku: item.product.sku,
            quantity: item.quantity,
            unitPrice: item.product.sellingPrice,
            unitOffer: item.unitOffer,
            offers: item.offers,
            totalPrice: calculateItemTotal(item),
          })),
          subtotal,
          totalDiscount,
          vat: vatInput,
          serviceCharges: serviceChargesInput,
          deliveryCharges: deliveryChargesInput,
          grandTotal,
          paidAmount: paidNum || grandTotal,
          balance,
          isFreeValue,
        };

        setViewingInvoice(invoiceData);

        // Reset Cart and Form
        setCart([]);
        setCustomerName("");
        setCustomerPhone("");
        setBillDiscountInput(0);
        setVatInput(0);
        setServiceChargesInput(0);
        setDeliveryChargesInput(0);
        setIsFreeValue(false);
        setPaidAmount("");
        onRefresh();
        fetchRecentOrders();
      } else {
        alert(data.message || data.error || "POS Checkout failed");
      }
    } catch (err) {
      console.error("Checkout failed:", err);
      alert("Checkout connection failed. Please check backend connection.");
    } finally {
      setCheckingOut(false);
    }
  };

  // Delete Order
  const handleDeleteOrder = async (orderId: string, orderNumber: string) => {
    if (!confirm(`Are you sure you want to delete invoice ${orderNumber}? Stock will be restored to inventory.`)) {
      return;
    }

    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("truehive_token") : null;
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`/api/orders/${orderId}`, {
        method: "DELETE",
        headers,
      });

      if (res.ok) {
        setRecentOrders((prev) => prev.filter((o) => o.id !== orderId));
        onRefresh();
      } else {
        alert("Failed to delete order");
      }
    } catch (err) {
      console.error("Delete order error:", err);
      alert("Error deleting order");
    }
  };

  // View existing order receipt in modal
  const handleViewOrder = (order: OrderRecord) => {
    let notesData: any = {};
    try {
      if (order.notes) notesData = JSON.parse(order.notes);
    } catch {}

    const invoiceData = {
      orderNumber: order.orderNumber,
      createdAt: order.createdAt,
      paymentMethod: notesData.exactPaymentMethod || order.paymentMethod,
      items: (order.items || []).map((item, idx) => ({
        index: idx + 1,
        name: item.productName,
        sku: item.sku,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        unitOffer: 0,
        offers: (item as any).discount || 0,
        totalPrice: item.totalPrice,
      })),
      subtotal: order.subtotal,
      totalDiscount: order.discountAmount || 0,
      vat: order.taxAmount || 0,
      serviceCharges: notesData.serviceCharges || 0,
      deliveryCharges: order.deliveryFee || 0,
      grandTotal: order.totalAmount,
      paidAmount: order.cashReceived || order.totalAmount,
      balance: order.changeGiven || 0,
      isFreeValue: Boolean(notesData.isFreeValue),
    };

    setViewingInvoice(invoiceData);
  };

  // Categories extraction
  const getCategoryName = (cat: any): string => {
    if (!cat) return "General";
    if (typeof cat === "string") return cat;
    if (typeof cat === "object" && cat.name) return String(cat.name);
    return "General";
  };

  const categories = [
    "ALL",
    ...Array.from(new Set(products.map((p) => getCategoryName(p.category)).filter(Boolean))),
  ];

  const filteredProducts = products.filter((p) => {
    const matchCat =
      selectedCategory === "ALL" || getCategoryName(p.category) === selectedCategory;
    const matchQuery =
      searchQuery.trim() === "" ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.barcode.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchQuery;
  });

  return (
    <div className="space-y-6 pb-12 selection:bg-blue-600 selection:text-white">
      {/* Scan Banner notification */}
      {scanBanner && (
        <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-xl text-blue-300 text-xs font-semibold flex items-center gap-2">
          <ScanBarcode className="w-4 h-4 text-blue-400" />
          {scanBanner}
        </div>
      )}

      {/* Held Bills Notification */}
      {heldBills.length > 0 && (
        <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-amber-300 font-semibold">
            <PauseCircle className="w-4 h-4 text-amber-400" />
            {heldBills.length} Held Bill(s) Parked
          </div>
          <div className="flex items-center gap-2 overflow-x-auto">
            {heldBills.map((b) => (
              <Button
                key={b.id}
                variant="secondary"
                size="sm"
                onClick={() => handleResumeHeldBill(b)}
                leftIcon={<PlayCircle className="w-3.5 h-3.5 text-amber-400" />}
                className="text-xs shrink-0"
              >
                Resume {b.customerName} ({b.heldAt})
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Main Grid: Left Catalog Picker (5 cols on Desktop) & Right Current Bill Panel (7 cols on Desktop) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Product Catalog & Search (Collapsible / Responsive) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Barcode & Search Tools */}
          <div className="p-4 rounded-2xl bg-[#0b1329] border border-slate-800 space-y-3">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <ScanBarcode className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Scan or type barcode / SKU..."
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && barcodeInput.trim()) {
                      handleScanBarcode(barcodeInput);
                      setBarcodeInput("");
                    }
                  }}
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:border-blue-500"
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCameraModalOpen(true)}
                leftIcon={<Camera className="w-4 h-4 text-emerald-400" />}
                className="shrink-0"
              >
                Camera
              </Button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search products by title, SKU..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Category Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition ${
                    selectedCategory === cat
                      ? "bg-blue-600 text-white"
                      : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Product Items Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-[520px] overflow-y-auto pr-1 custom-scrollbar">
            {filteredProducts.map((p) => {
              const inCart = cart.find((c) => c.product.id === p.id);
              return (
                <button
                  key={p.id}
                  onClick={() => addToCart(p)}
                  className={`p-3 rounded-xl border text-left transition flex flex-col justify-between group ${
                    inCart
                      ? "border-blue-500/60 bg-blue-950/20"
                      : "border-slate-800/80 bg-[#0b1329] hover:border-slate-700"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="text-[10px] font-mono text-slate-400">{p.sku}</span>
                      {inCart && (
                        <span className="w-4 h-4 rounded-full bg-blue-600 text-white font-bold text-[9px] flex items-center justify-center">
                          {inCart.quantity}
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-semibold text-white group-hover:text-blue-400 transition line-clamp-2">
                      {p.name}
                    </p>
                  </div>
                  <div className="mt-2 pt-2 border-t border-slate-800/60 flex items-center justify-between">
                    <span className="text-xs font-bold text-white">
                      Rs.{p.sellingPrice.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Stk: {p.currentStock}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Current Bill (Full Interactive Panel matching User Screenshot) */}
        <div className="lg:col-span-7 bg-[#0b1329] border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-5">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-800">
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">Current Bill</h2>
              <p className="text-xs text-slate-400">Auto Generate</p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setCart([]);
                  setCustomerName("");
                  setCustomerPhone("");
                  setBillDiscountInput(0);
                  setVatInput(0);
                  setServiceChargesInput(0);
                  setDeliveryChargesInput(0);
                  setIsFreeValue(false);
                  setPaidAmount("");
                }}
                className="text-xs text-slate-400 hover:text-rose-400"
              >
                Clear Bill
              </Button>
              {cart.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleHoldBill}
                  leftIcon={<PauseCircle className="w-3.5 h-3.5 text-amber-400" />}
                  className="text-xs"
                >
                  Hold Bill
                </Button>
              )}
            </div>
          </div>

          {/* Customer Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <input
                type="text"
                placeholder="Customer Name (Company/Mr/Mrs)"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <input
                type="text"
                placeholder="Contact Number (Tel No)"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Cart Items Table (Horizontal scrolling on mobile) */}
          <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-950/40">
            <div className="overflow-x-auto min-w-[540px]">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/80 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    <th className="py-2.5 px-3">Product</th>
                    <th className="py-2.5 px-2 text-center">Unit</th>
                    <th className="py-2.5 px-2 text-center">QTY</th>
                    <th className="py-2.5 px-2 text-center">Unit Offer</th>
                    <th className="py-2.5 px-2 text-center">Offers</th>
                    <th className="py-2.5 px-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {cart.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-500 text-xs">
                        No products added yet. Select products from the left or scan a barcode.
                      </td>
                    </tr>
                  ) : (
                    cart.map((item) => {
                      const itemTotal = calculateItemTotal(item);
                      return (
                        <tr key={item.product.id} className="hover:bg-slate-900/40 transition">
                          <td className="py-3 px-3">
                            <p className="font-bold text-white line-clamp-1">{item.product.name}</p>
                            <p className="text-[11px] text-slate-400">
                              Rs.{item.product.sellingPrice.toLocaleString()}
                            </p>
                          </td>
                          <td className="py-3 px-2 text-center">
                            <span className="px-2 py-0.5 rounded-md bg-slate-800 text-[10px] font-semibold text-slate-300">
                              QTY
                            </span>
                          </td>
                          <td className="py-3 px-2">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => removeItem(item.product.id)}
                                title="Remove item"
                                className="text-rose-400 hover:text-rose-300 p-1 mr-0.5"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => updateQty(item.product.id, -1)}
                                className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-200 text-xs font-bold"
                              >
                                -
                              </button>
                              <span className="w-6 text-center font-bold text-white text-xs">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => updateQty(item.product.id, 1)}
                                className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-200 text-xs font-bold"
                              >
                                +
                              </button>
                            </div>
                          </td>
                          <td className="py-3 px-2 text-center">
                            <input
                              type="number"
                              min="0"
                              value={item.unitOffer === 0 ? "" : item.unitOffer}
                              placeholder="0"
                              onChange={(e) =>
                                updateUnitOffer(item.product.id, Number(e.target.value))
                              }
                              className="w-16 px-1.5 py-1 bg-slate-900 border border-slate-700 rounded-lg text-center text-xs text-white focus:outline-none focus:border-blue-500"
                            />
                          </td>
                          <td className="py-3 px-2 text-center">
                            <input
                              type="number"
                              min="0"
                              value={item.offers === 0 ? "" : item.offers}
                              placeholder="0"
                              onChange={(e) =>
                                updateItemOffer(item.product.id, Number(e.target.value))
                              }
                              className="w-16 px-1.5 py-1 bg-slate-900 border border-slate-700 rounded-lg text-center text-xs text-white focus:outline-none focus:border-blue-500"
                            />
                          </td>
                          <td className="py-3 px-3 text-right font-black text-white whitespace-nowrap">
                            Rs. {itemTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pricing Adjustments Section (Image 1 & 2) */}
          <div className="space-y-2.5 pt-2 border-t border-slate-800 text-xs">
            {/* Sub Total */}
            <div className="flex items-center justify-between text-slate-300">
              <span className="font-semibold">Sub Total</span>
              <span className="font-bold text-white text-sm">
                Rs.{subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>

            {/* Total Discount */}
            <div className="flex items-center justify-between gap-3">
              <span className="text-slate-400">Total Discount</span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  value={billDiscountInput === 0 ? "" : billDiscountInput}
                  placeholder="0"
                  onChange={(e) => setBillDiscountInput(Number(e.target.value))}
                  className="w-20 px-2 py-1 bg-slate-950 border border-slate-800 rounded-lg text-right text-xs text-white focus:outline-none focus:border-blue-500"
                />
                <span className="w-24 text-right font-semibold text-rose-400">
                  Rs.{totalDiscount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* VAT */}
            <div className="flex items-center justify-between gap-3">
              <span className="text-slate-400">VAT</span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  value={vatInput === 0 ? "" : vatInput}
                  placeholder="0"
                  onChange={(e) => setVatInput(Number(e.target.value))}
                  className="w-20 px-2 py-1 bg-slate-950 border border-slate-800 rounded-lg text-right text-xs text-white focus:outline-none focus:border-blue-500"
                />
                <span className="w-24 text-right font-semibold text-white">
                  Rs.{(vatInput || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Service Charges */}
            <div className="flex items-center justify-between gap-3">
              <span className="text-slate-400">Service Charges</span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  value={serviceChargesInput === 0 ? "" : serviceChargesInput}
                  placeholder="0"
                  onChange={(e) => setServiceChargesInput(Number(e.target.value))}
                  className="w-20 px-2 py-1 bg-slate-950 border border-slate-800 rounded-lg text-right text-xs text-white focus:outline-none focus:border-blue-500"
                />
                <span className="w-24 text-right font-semibold text-white">
                  Rs.{(serviceChargesInput || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Delivery Charges */}
            <div className="flex items-center justify-between gap-3">
              <span className="text-slate-400">Delivery Charges</span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  value={deliveryChargesInput === 0 ? "" : deliveryChargesInput}
                  placeholder="0"
                  onChange={(e) => setDeliveryChargesInput(Number(e.target.value))}
                  className="w-20 px-2 py-1 bg-slate-950 border border-slate-800 rounded-lg text-right text-xs text-white focus:outline-none focus:border-blue-500"
                />
                <span className="w-24 text-right font-semibold text-white">
                  Rs.{(deliveryChargesInput || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Free Value (0 Value Bill) Checkbox Banner */}
            <label className="flex items-center gap-2.5 p-3 rounded-xl border border-amber-500/40 bg-amber-500/5 cursor-pointer hover:bg-amber-500/10 transition mt-2">
              <input
                type="checkbox"
                checked={isFreeValue}
                onChange={(e) => setIsFreeValue(e.target.checked)}
                className="w-4 h-4 rounded text-amber-500 focus:ring-0 cursor-pointer"
              />
              <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                <Gift className="w-4 h-4" />
                Free Value (0 Value Bill)
              </span>
            </label>

            {/* GRAND TOTAL */}
            <div className="flex items-center justify-between pt-3 pb-1 border-t border-slate-800">
              <span className="text-sm font-black text-white uppercase tracking-wider">GRAND TOTAL</span>
              <span className="text-2xl font-black text-white">
                Rs.{grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>

            {/* Paid Amount */}
            <div className="flex items-center justify-between gap-3 pt-1">
              <span className="text-slate-400 font-medium">Paid Amount</span>
              <input
                type="number"
                min="0"
                value={paidAmount}
                placeholder="0.00"
                onChange={(e) => setPaidAmount(e.target.value)}
                className="w-32 px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-right text-sm font-bold text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Balance */}
            <div className="flex items-center justify-between pt-1">
              <span className="font-semibold text-blue-400">Balance</span>
              <span className="text-base font-black text-blue-400">
                Rs.{balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Payment Method Radio Selection Cards (Image 2) */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <p className="text-xs font-semibold text-slate-400">Payment Method</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              {(["Cash", "Card", "QR Pay", "Online Bank", "Credit", "COD"] as PosPaymentMethod[]).map(
                (method) => {
                  const isSelected = paymentMethod === method;
                  return (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setPaymentMethod(method)}
                      className={`p-2.5 rounded-xl border text-center transition flex items-center justify-center gap-2 ${
                        isSelected
                          ? "border-blue-500 bg-blue-600/10 text-white font-bold"
                          : "border-slate-800 bg-slate-950 text-slate-400 hover:text-white hover:border-slate-700"
                      }`}
                    >
                      <span
                        className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                          isSelected ? "border-blue-500" : "border-slate-600"
                        }`}
                      >
                        {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />}
                      </span>
                      <span className="text-xs">{method}</span>
                    </button>
                  );
                }
              )}
            </div>
          </div>

          {/* Big Action Button (Image 2) */}
          <Button
            variant="primary"
            size="lg"
            className="w-full py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-xl shadow-indigo-600/20 flex items-center justify-center gap-2"
            loading={checkingOut}
            disabled={cart.length === 0}
            onClick={handleCheckout}
          >
            <Printer className="w-4 h-4" />
            Submit Bill & Print
          </Button>
        </div>
      </div>

      {/* RECENT ORDERS TABLE SECTION (Image 3) */}
      <div className="bg-[#0b1329] border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">Recent Orders</h3>
            <p className="text-xs text-slate-400">All registered POS Counter & WhatsApp sales</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchRecentOrders}
            loading={loadingOrders}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
            className="text-xs text-slate-400 hover:text-white"
          >
            Refresh
          </Button>
        </div>

        <div className="overflow-x-auto min-w-[550px]">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">INV #</th>
                <th className="py-3 px-4">DATE</th>
                <th className="py-3 px-4">TIME</th>
                <th className="py-3 px-4">TOTAL</th>
                <th className="py-3 px-4 text-center">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">
                    No recent orders recorded yet.
                  </td>
                </tr>
              ) : (
                recentOrders.slice(0, 15).map((order) => {
                  const dateObj = new Date(order.createdAt);
                  const dateStr = dateObj.toLocaleDateString("en-CA"); // YYYY-MM-DD
                  const timeStr = dateObj.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

                  return (
                    <tr key={order.id} className="hover:bg-slate-900/40 transition">
                      <td className="py-3.5 px-4 font-mono font-bold text-white">
                        {order.orderNumber}
                      </td>
                      <td className="py-3.5 px-4 text-slate-300">{dateStr}</td>
                      <td className="py-3.5 px-4 text-slate-400">{timeStr}</td>
                      <td className="py-3.5 px-4 font-black text-white">
                        Rs.{order.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleViewOrder(order)}
                            title="View Invoice Receipt"
                            className="p-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 hover:text-white hover:border-slate-500 transition"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteOrder(order.id, order.orderNumber)}
                            title="Delete Order & Restore Stock"
                            className="p-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white transition shadow-sm"
                          >
                            <Trash2 className="w-4 h-4" />
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

      {/* INVOICE DETAILS MODAL (Image 4 - Receipt Layout) */}
      {viewingInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-md bg-white text-slate-950 rounded-3xl shadow-2xl p-6 sm:p-7 space-y-4 my-8 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900">Invoice Details</h3>
              <button
                onClick={() => setViewingInvoice(null)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Printable Thermal Receipt Card */}
            <div id="pos-thermal-receipt" className="space-y-3 font-mono text-xs text-slate-900">
              {/* Business Name */}
              <div className="text-center py-1">
                <h2 className="text-2xl font-black tracking-tight text-slate-950">
                  {businessName}
                </h2>
              </div>

              <div className="border-t border-dashed border-slate-400 my-2" />

              {/* Meta Info */}
              <div className="space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span>Invoice number : <strong className="font-bold">{viewingInvoice.orderNumber}</strong></span>
                  <span>Invoiced date : {new Date(viewingInvoice.createdAt).toLocaleDateString("en-CA")} {new Date(viewingInvoice.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                </div>
                <div>
                  <span>Payment method : <strong>{viewingInvoice.paymentMethod}</strong></span>
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
                  {viewingInvoice.items?.map((item: any) => (
                    <tr key={item.index || item.name} className="py-2">
                      <td className="py-1.5 pr-2">
                        <p className="font-bold text-slate-950">
                          {item.index}. {item.name}
                        </p>
                        {item.sku && <p className="text-[10px] text-slate-500">{item.sku}</p>}
                        {(item.offers > 0 || item.unitOffer > 0) && (
                          <p className="text-[10px] text-rose-600 font-bold">
                            Offer: -Rs.{(item.offers || (item.unitOffer * item.quantity)).toLocaleString()}
                          </p>
                        )}
                      </td>
                      <td className="py-1.5 text-center whitespace-nowrap text-slate-800">
                        {item.quantity} QTY
                      </td>
                      <td className="py-1.5 text-right font-bold text-slate-950 whitespace-nowrap">
                        Rs.{item.totalPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="border-t border-dashed border-slate-400 my-2" />

              {/* Breakdown */}
              <div className="space-y-1 text-xs pt-1">
                <div className="flex justify-between">
                  <span>Sub total :</span>
                  <span className="font-bold">
                    Rs.{viewingInvoice.subtotal?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
                {viewingInvoice.totalDiscount > 0 && (
                  <div className="flex justify-between text-rose-600 font-semibold">
                    <span>Discount total (Rs.) :</span>
                    <span>
                      -Rs.{viewingInvoice.totalDiscount?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                )}
                {viewingInvoice.vat > 0 && (
                  <div className="flex justify-between">
                    <span>VAT :</span>
                    <span>Rs.{viewingInvoice.vat?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                )}
                {viewingInvoice.serviceCharges > 0 && (
                  <div className="flex justify-between">
                    <span>Service Charge :</span>
                    <span>Rs.{viewingInvoice.serviceCharges?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                )}
                {viewingInvoice.deliveryCharges > 0 && (
                  <div className="flex justify-between">
                    <span>Delivery Fee :</span>
                    <span>Rs.{viewingInvoice.deliveryCharges?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                )}
                <div className="flex justify-between font-black text-sm pt-1 border-t border-slate-300">
                  <span>Total :</span>
                  <span>Rs.{viewingInvoice.grandTotal?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between">
                  <span>Paid amount :</span>
                  <span>Rs.{viewingInvoice.paidAmount?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-blue-700 font-bold">
                  <span>Balance :</span>
                  <span>Rs.{viewingInvoice.balance?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
              </div>

              <div className="border-t border-dashed border-slate-400 my-2" />

              <div className="text-center py-2 text-slate-800 font-bold text-xs">
                Thank you! Come again!
              </div>
            </div>

            {/* Print Button */}
            <div className="pt-2">
              <Button
                variant="primary"
                size="lg"
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-2xl flex items-center justify-center gap-2"
                onClick={() => window.print()}
              >
                <Printer className="w-4 h-4" />
                Print Receipt
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Camera scanner modal */}
      <CameraBarcodeScannerModal
        isOpen={cameraModalOpen}
        onClose={() => setCameraModalOpen(false)}
        products={products}
        onDetected={(code) => {
          handleScanBarcode(code);
          setCameraModalOpen(false);
        }}
      />
    </div>
  );
}
