"use client";

import React, { useState } from "react";
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
  FileText,
  Printer,
  Sparkles,
  CreditCard,
  Banknote,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { CameraBarcodeScannerModal } from "@/components/CameraBarcodeScannerModal";
import { OfficialA4InvoiceModal } from "@/components/OfficialA4InvoiceModal";
import { useHardwareBarcodeScanner } from "@/lib/barcode/useBarcodeScanner";
import type { ProductItem, IngredientItem, OrderRecord } from "@/lib/store";

interface HeldBill {
  id: string;
  customerName: string;
  items: { product: ProductItem; quantity: number }[];
  heldAt: string;
}

interface PosPanelViewProps {
  products: ProductItem[];
  ingredients: IngredientItem[];
  onRefresh: () => void;
  onOpenA4Invoice: (order: OrderRecord) => void;
}

export function PosPanelView({
  products,
  ingredients,
  onRefresh,
  onOpenA4Invoice,
}: PosPanelViewProps) {
  const [barcodeInput, setBarcodeInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [cart, setCart] = useState<{ product: ProductItem; quantity: number }[]>([]);
  const [heldBills, setHeldBills] = useState<HeldBill[]>([]);
  const [customerName, setCustomerName] = useState("Walk-in Customer");
  const [customerPhone, setCustomerPhone] = useState("94765557890");
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "CARD" | "BANK_TRANSFER" | "SPLIT">(
    "CASH"
  );
  const [cashReceived, setCashReceived] = useState<number>(0);
  const [checkingOut, setCheckingOut] = useState(false);
  const [cameraModalOpen, setCameraModalOpen] = useState(false);
  const [scanBanner, setScanBanner] = useState<string>("");
  const [lastReceipt, setLastReceipt] = useState<{
    order: OrderRecord;
    bomDeductionsLog: string[];
  } | null>(null);

  // Barcode scanner integration
  const handleScanBarcode = (code: string) => {
    const clean = code.trim();
    const found = products.find(
      (p) =>
        p.barcode.toLowerCase() === clean.toLowerCase() ||
        p.sku.toLowerCase() === clean.toLowerCase()
    );
    if (found) {
      addToCart(found);
      setScanBanner(`Scanned [${found.barcode}] -> Added "${found.name}" to cart!`);
    } else {
      setScanBanner(`Barcode [${clean}] not recognized.`);
    }
    setTimeout(() => setScanBanner(""), 4000);
  };

  useHardwareBarcodeScanner(handleScanBarcode, true);

  const addToCart = (product: ProductItem) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateQty = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((i) => (i.product.id === productId ? { ...i, quantity: i.quantity + delta } : i))
        .filter((i) => i.quantity > 0)
    );
  };

  const handleHoldBill = () => {
    if (cart.length === 0) return;
    setHeldBills((prev) => [
      {
        id: `hold-${Date.now()}`,
        customerName: customerName || "Walk-in",
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
    setHeldBills((prev) => prev.filter((b) => b.id !== bill.id));
  };

  const subtotal = cart.reduce((sum, i) => sum + i.product.sellingPrice * i.quantity, 0);
  const grandTotal = Math.max(0, subtotal - discountAmount);
  const changeAmount = Math.max(0, cashReceived - grandTotal);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setCheckingOut(true);
    try {
      const res = await fetch("/api/pos/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart.map((c) => ({ productId: c.product.id, quantity: c.quantity })),
          customerName,
          customerPhone,
          discountAmount,
          paymentMethod,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setLastReceipt({
          order: data.order,
          bomDeductionsLog: data.bomDeductionsLog || [],
        });
        setCart([]);
        setDiscountAmount(0);
        setCashReceived(0);
        onRefresh();
      }
    } catch (err) {
      console.error("Checkout failed:", err);
    } finally {
      setCheckingOut(false);
    }
  };

  const getCategoryName = (cat: any): string => {
    if (!cat) return "General";
    if (typeof cat === "string") return cat;
    if (typeof cat === "object" && cat.name) return String(cat.name);
    return "General";
  };

  // Categories extraction (safely handles object or string categories)
  const categories = [
    "ALL",
    ...Array.from(new Set(products.map((p) => getCategoryName(p.category)).filter(Boolean))),
  ];

  const filteredProducts = products.filter((p) => {
    const catName = getCategoryName(p.category);
    if (selectedCategory !== "ALL" && catName !== selectedCategory) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.barcode.includes(q) ||
        catName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Scan banner notification */}
      {scanBanner && (
        <div className="p-3 bg-blue-600/20 border border-blue-500/40 text-blue-300 rounded-xl text-xs font-semibold flex items-center gap-2">
          <ScanBarcode className="w-4 h-4 text-blue-400" />
          {scanBanner}
        </div>
      )}

      {/* Main Layout: Catalog on Left (8 Cols), Interactive POS Cart on Right (4 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Catalog Area (8 Cols) */}
        <div className="lg:col-span-8 space-y-4">
          {/* Barcode Scan Toolbar */}
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1 min-w-[240px]">
              <div className="relative flex-1">
                <ScanBarcode className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Scan or type barcode / SKU (Hardware Scanner Active)..."
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
                variant="secondary"
                size="sm"
                onClick={() => {
                  if (barcodeInput.trim()) {
                    handleScanBarcode(barcodeInput);
                    setBarcodeInput("");
                  }
                }}
              >
                Scan
              </Button>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setCameraModalOpen(true)}
              leftIcon={<Camera className="w-4 h-4 text-emerald-400" />}
            >
              Camera Scanner
            </Button>
          </div>

          {/* Category Tabs & Product Search */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                    selectedCategory === cat
                      ? "bg-blue-600 text-white"
                      : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-56">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Product Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 max-h-[calc(100vh-320px)] overflow-y-auto pr-1 custom-scrollbar">
            {filteredProducts.map((p) => {
              const inCartItem = cart.find((c) => c.product.id === p.id);
              const inCartQty = inCartItem ? inCartItem.quantity : 0;
              return (
                <button
                  key={p.id}
                  onClick={() => addToCart(p)}
                  className={`p-3.5 rounded-2xl bg-slate-900/90 border text-left transition hover:border-blue-500/60 flex flex-col justify-between group ${
                    inCartQty > 0 ? "border-blue-500/50 bg-blue-950/20" : "border-slate-800"
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-1 mb-1">
                      <span className="text-[10px] font-mono text-slate-400">{p.sku}</span>
                      {inCartQty > 0 && (
                        <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold text-[10px] flex items-center justify-center">
                          {inCartQty}
                        </span>
                      )}
                    </div>
                    <h5 className="text-xs font-bold text-white group-hover:text-blue-400 transition line-clamp-2">
                      {p.name}
                    </h5>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-center justify-between">
                    <span className="text-xs font-black text-white">
                      LKR {p.sellingPrice.toLocaleString()}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-400">
                      Stock: {p.currentStock}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Held Bills Bar if any exist */}
          {heldBills.length > 0 && (
            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs text-amber-300 font-semibold">
                <PauseCircle className="w-4 h-4 text-amber-400" />
                {heldBills.length} Held Bills Parked
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
        </div>

        {/* Right Cart & Checkout (4 Cols) */}
        <div className="lg:col-span-4 bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between space-y-4">
          <div>
            {/* Cart Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-blue-400" />
                <h4 className="text-sm font-bold text-white">Current Cart</h4>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setCart([]);
                    setDiscountAmount(0);
                    setCustomerName("Walk-in Customer");
                    setCustomerPhone("94765557890");
                    setScanBanner("Started new fresh POS sale.");
                    setTimeout(() => setScanBanner(""), 3000);
                  }}
                  leftIcon={<ShoppingCart className="w-3.5 h-3.5 text-blue-400" />}
                  className="text-xs"
                >
                  New Sale
                </Button>
                {cart.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleHoldBill}
                    leftIcon={<PauseCircle className="w-3.5 h-3.5 text-amber-400" />}
                    className="text-xs"
                  >
                    Hold Bill
                  </Button>
                )}
                {cart.length > 0 && (
                  <button
                    onClick={() => setCart([])}
                    title="Clear cart"
                    className="text-slate-400 hover:text-rose-400 text-xs"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Customer Inputs */}
            <div className="grid grid-cols-2 gap-2 my-3">
              <input
                type="text"
                placeholder="Customer Name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none"
              />
              <input
                type="text"
                placeholder="Phone (WhatsApp)"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white font-mono placeholder-slate-500 focus:outline-none"
              />
            </div>

            {/* Cart Items List */}
            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1 custom-scrollbar">
              {cart.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  Cart is empty. Scan a barcode or click a product.
                </div>
              ) : (
                cart.map((item) => (
                  <div
                    key={item.product.id}
                    className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-white truncate">
                        {item.product.name}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        LKR {item.product.sellingPrice.toLocaleString()} × {item.quantity} ={" "}
                        <span className="text-white font-bold">
                          LKR {(item.product.sellingPrice * item.quantity).toLocaleString()}
                        </span>
                      </p>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => updateQty(item.product.id, -1)}
                        className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 text-xs"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-6 text-center text-xs font-bold text-white">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQty(item.product.id, 1)}
                        className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 text-xs"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Pricing & Payment Section */}
          <div className="space-y-3 pt-3 border-t border-slate-800">
            {/* Subtotal & Discount */}
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center justify-between text-slate-400">
                <span>Subtotal:</span>
                <span className="font-semibold text-white">
                  LKR {subtotal.toLocaleString()}
                </span>
              </div>

              <div className="flex items-center justify-between text-slate-400">
                <span>Discount (LKR):</span>
                <input
                  type="number"
                  min="0"
                  value={discountAmount || ""}
                  onChange={(e) => setDiscountAmount(Number(e.target.value))}
                  placeholder="0"
                  className="w-20 px-2 py-0.5 bg-slate-950 border border-slate-800 rounded text-right text-xs text-white focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-between text-sm font-bold text-white pt-1 border-t border-slate-800/80">
                <span>Grand Total:</span>
                <span className="text-base text-blue-400">
                  LKR {grandTotal.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="grid grid-cols-4 gap-1.5">
              {(["CASH", "CARD", "BANK_TRANSFER", "SPLIT"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setPaymentMethod(m)}
                  className={`py-1.5 rounded-lg text-[10px] font-bold border transition ${
                    paymentMethod === m
                      ? "bg-blue-600 border-blue-500 text-white"
                      : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  {m === "BANK_TRANSFER" ? "BANK" : m}
                </button>
              ))}
            </div>

            {/* Cash Calculator if CASH */}
            {paymentMethod === "CASH" && (
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="text-slate-400">Cash Received:</span>
                <input
                  type="number"
                  min="0"
                  value={cashReceived || ""}
                  onChange={(e) => setCashReceived(Number(e.target.value))}
                  placeholder="Amount"
                  className="w-24 px-2 py-1 bg-slate-950 border border-slate-800 rounded text-right text-xs text-white focus:outline-none"
                />
                {cashReceived > grandTotal && (
                  <span className="text-emerald-400 font-bold">
                    Change: LKR {changeAmount.toLocaleString()}
                  </span>
                )}
              </div>
            )}

            {/* Checkout Action Button */}
            <Button
              variant="primary"
              size="lg"
              className="w-full"
              loading={checkingOut}
              disabled={cart.length === 0}
              onClick={handleCheckout}
            >
              Pay LKR {grandTotal.toLocaleString()} & Complete
            </Button>
          </div>
        </div>
      </div>

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

      {/* Last Receipt Notification & Invoice Access */}
      {lastReceipt && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-emerald-300">
          <div>
            <p className="text-sm font-bold text-white flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Sale Completed ({lastReceipt.order.orderNumber})
            </p>
            <p className="text-xs text-emerald-300/80">
              Total: LKR {lastReceipt.order.totalAmount.toLocaleString()} • Product & BOM stock deducted atomically from PostgreSQL!
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onOpenA4Invoice(lastReceipt.order)}
              leftIcon={<FileText className="w-3.5 h-3.5 text-blue-400" />}
            >
              View A4 Invoice
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLastReceipt(null)}
            >
              Dismiss
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
