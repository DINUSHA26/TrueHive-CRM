"use client";

import React, { useState } from "react";
import { BarcodeDisplay } from "@/components/BarcodeDisplay";
import { CameraBarcodeScannerModal } from "@/components/CameraBarcodeScannerModal";
import { OfficialA4InvoiceModal } from "@/components/OfficialA4InvoiceModal";
import { useHardwareBarcodeScanner } from "@/lib/barcode/useBarcodeScanner";
import {
  ScanBarcode,
  ShoppingCart,
  Printer,
  Plus,
  Minus,
  Trash2,
  CheckCircle2,
  PackagePlus,
  Send,
  Receipt,
  Sparkles,
  Camera,
  PauseCircle,
  PlayCircle,
  FileText,
} from "lucide-react";
import type { ProductItem, IngredientItem, OrderRecord } from "@/lib/store";

interface HeldBill {
  id: string;
  customerName: string;
  items: { product: ProductItem; quantity: number }[];
  heldAt: string;
}

interface Props {
  products: ProductItem[];
  ingredients: IngredientItem[];
  onRefresh: () => void;
}

export function PosAndBarcodePanel({ products, ingredients, onRefresh }: Props) {
  const [subTab, setSubTab] = useState<"POS_TERMINAL" | "PRODUCTS_BARCODE">("POS_TERMINAL");
  const [barcodeInput, setBarcodeInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState<{ product: ProductItem; quantity: number }[]>([]);
  const [heldBills, setHeldBills] = useState<HeldBill[]>([]);
  const [customerName, setCustomerName] = useState("Walk-in Customer");
  const [customerPhone, setCustomerPhone] = useState("94765557890");
  const [customerEmail, setCustomerEmail] = useState("");
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "CARD" | "BANK_TRANSFER" | "SPLIT">(
    "CASH"
  );
  const [cashReceived, setCashReceived] = useState<number>(0);
  const [splitCardAmount, setSplitCardAmount] = useState<number>(0);
  const [checkingOut, setCheckingOut] = useState(false);
  const [cameraModalOpen, setCameraModalOpen] = useState(false);
  const [a4InvoiceOrder, setA4InvoiceOrder] = useState<OrderRecord | null>(null);
  const [lastReceipt, setLastReceipt] = useState<{
    order: OrderRecord;
    bomDeductionsLog: string[];
  } | null>(null);
  const [scanBanner, setScanBanner] = useState<string>("");

  // New Product Form State
  const [newProdName, setNewProdName] = useState("");
  const [newProdCategory, setNewProdCategory] = useState("Cakes & Bakery");
  const [newProdPrice, setNewProdPrice] = useState(3200);
  const [newProdStock, setNewProdStock] = useState(20);
  const [newProdBarcode, setNewProdBarcode] = useState("479202600991");

  const handleScanBarcode = (code: string) => {
    const clean = code.trim();
    const found = products.find(
      (p) =>
        p.barcode.toLowerCase() === clean.toLowerCase() ||
        p.sku.toLowerCase() === clean.toLowerCase()
    );
    if (found) {
      addToCart(found);
      setScanBanner(`Scanned [${found.barcode}] -> Added "${found.name}" to POS Cart!`);
    } else {
      setScanBanner(`Barcode [${clean}] not found in catalog.`);
    }
    setTimeout(() => setScanBanner(""), 4000);
  };

  useHardwareBarcodeScanner(handleScanBarcode, subTab === "POS_TERMINAL");

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
        customerName: customerName || "Held Customer",
        items: cart,
        heldAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
      ...prev,
    ]);
    setCart([]);
    setScanBanner("Current bill parked / held! You can serve the next customer.");
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
          customerEmail,
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
        setSplitCardAmount(0);
        onRefresh();
      }
    } finally {
      setCheckingOut(false);
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdName) return;
    await fetch("/api/inventory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "CREATE_PRODUCT",
        name: newProdName,
        category: newProdCategory,
        sellingPrice: newProdPrice,
        currentStock: newProdStock,
        barcode: newProdBarcode,
        trackBom: true,
        bom: ingredients.slice(0, 2).map((ing) => ({
          ingredientId: ing.id,
          ingredientName: ing.name,
          quantityRequired: 0.25,
          unit: ing.unit,
          unitCost: ing.unitCost,
        })),
      }),
    });
    setNewProdName("");
    setNewProdBarcode(`4792026${Math.floor(10000 + Math.random() * 90000)}`);
    onRefresh();
  };

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.barcode.includes(searchQuery)
  );

  return (
    <div className="space-y-6">
      <CameraBarcodeScannerModal
        isOpen={cameraModalOpen}
        onClose={() => setCameraModalOpen(false)}
        onDetected={handleScanBarcode}
        products={products}
      />

      <OfficialA4InvoiceModal
        order={a4InvoiceOrder}
        onClose={() => setA4InvoiceOrder(null)}
      />

      {/* Sub-Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-[#111827] p-3 rounded-xl border border-slate-800">
        <div className="flex gap-2">
          <button
            onClick={() => setSubTab("POS_TERMINAL")}
            className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition ${
              subTab === "POS_TERMINAL"
                ? "bg-emerald-500 text-slate-950"
                : "bg-slate-800/70 text-slate-300 hover:bg-slate-800"
            }`}
          >
            <ShoppingCart className="w-4 h-4" />
            Live POS Terminal (Barcode + Thermal & A4 Invoice)
          </button>
          <button
            onClick={() => setSubTab("PRODUCTS_BARCODE")}
            className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition ${
              subTab === "PRODUCTS_BARCODE"
                ? "bg-emerald-500 text-slate-950"
                : "bg-slate-800/70 text-slate-300 hover:bg-slate-800"
            }`}
          >
            <ScanBarcode className="w-4 h-4" />
            Product Catalog & Barcode Label Printer
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 rounded-lg">
          <Sparkles className="w-3.5 h-3.5" />
          Live Stock Sync Active (POS ⇄ WhatsApp AI Bot)
        </div>
      </div>

      {scanBanner && (
        <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-2">
          <ScanBarcode className="w-4 h-4" />
          {scanBanner}
        </div>
      )}

      {subTab === "POS_TERMINAL" ? (
        <div className="grid lg:grid-cols-12 gap-6">
          {/* Left: Product Grid & Barcode Scanner Input */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-[#111827] border border-slate-800 rounded-xl p-4 space-y-3">
              <div className="flex flex-col sm:flex-row gap-2.5">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (barcodeInput) {
                      handleScanBarcode(barcodeInput);
                      setBarcodeInput("");
                    }
                  }}
                  className="flex-1 flex gap-2"
                >
                  <div className="relative flex-1">
                    <ScanBarcode className="w-4 h-4 text-emerald-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={barcodeInput}
                      onChange={(e) => setBarcodeInput(e.target.value)}
                      placeholder="USB Barcode Scanner active or type code..."
                      className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-emerald-500/40 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-400"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-3 py-2 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 rounded-lg text-xs font-semibold hover:bg-emerald-500/30"
                  >
                    Scan
                  </button>
                  <button
                    type="button"
                    onClick={() => setCameraModalOpen(true)}
                    className="px-3 py-2 bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 rounded-lg text-xs font-semibold flex items-center gap-1 hover:bg-indigo-500/30"
                  >
                    <Camera className="w-3.5 h-3.5" /> Camera
                  </button>
                </form>

                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search product or SKU..."
                  className="sm:w-44 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none"
                />
              </div>

              {/* Held / Parked Bills Bar */}
              {heldBills.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800">
                  <span className="text-[11px] font-bold text-amber-400">
                    Held Bills ({heldBills.length}):
                  </span>
                  {heldBills.map((hb) => (
                    <button
                      key={hb.id}
                      onClick={() => handleResumeHeldBill(hb)}
                      className="px-2.5 py-1 rounded-lg bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs font-semibold flex items-center gap-1"
                    >
                      <PlayCircle className="w-3.5 h-3.5" /> Resume {hb.customerName} (
                      {hb.items.length} items • {hb.heldAt})
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              {filteredProducts.map((prod) => (
                <div
                  key={prod.id}
                  onClick={() => addToCart(prod)}
                  className="bg-[#111827] hover:bg-slate-800/80 border border-slate-800 hover:border-emerald-500/40 rounded-xl p-4 cursor-pointer transition flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                        {prod.sku}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          prod.currentStock <= prod.reorderLevel
                            ? "bg-red-500/20 text-red-400"
                            : "bg-emerald-500/15 text-emerald-400"
                        }`}
                      >
                        Stock: {prod.currentStock} {prod.unit}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-white mt-1">{prod.name}</h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Barcode: <span className="font-mono text-slate-300">{prod.barcode}</span> • BOM COGS: LKR{" "}
                      {prod.calculatedCogs.toLocaleString()}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                    <span className="text-base font-extrabold text-emerald-400">
                      LKR {prod.sellingPrice.toLocaleString()}
                    </span>
                    <span className="text-xs px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-300 font-semibold">
                      + Add to Bill
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Live POS Cart & Checkout */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-[#111827] border border-slate-800 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-sm font-bold text-white">POS Billing Counter</h3>
                </div>
                <div className="flex items-center gap-2">
                  {cart.length > 0 && (
                    <button
                      type="button"
                      onClick={handleHoldBill}
                      className="px-2.5 py-1 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold flex items-center gap-1"
                    >
                      <PauseCircle className="w-3.5 h-3.5" /> Hold Bill
                    </button>
                  )}
                  <span className="text-xs text-slate-400">{cart.length} items</span>
                </div>
              </div>

              {/* Customer Info for WhatsApp & Email Digital Invoice */}
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Customer Name</label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">
                    WhatsApp (E-Receipt)
                  </label>
                  <input
                    type="text"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="947XXXXXXXX"
                    className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">
                    Email (Resend PDF)
                  </label>
                  <input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="client@mail.lk"
                    className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                  />
                </div>
              </div>

              {/* Cart Items */}
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {cart.length === 0 ? (
                  <div className="text-center py-8 text-xs text-slate-500 border border-dashed border-slate-800 rounded-xl">
                    Scan a product barcode (USB or Camera) or click any item to start billing
                  </div>
                ) : (
                  cart.map((item) => (
                    <div
                      key={item.product.id}
                      className="flex items-center justify-between bg-slate-900/80 border border-slate-800 px-3 py-2 rounded-lg"
                    >
                      <div className="min-w-0 flex-1 pr-2">
                        <p className="text-xs font-semibold text-white truncate">
                          {item.product.name}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          LKR {item.product.sellingPrice.toLocaleString()} × {item.quantity} ={" "}
                          <span className="text-emerald-400 font-bold">
                            LKR {(item.product.sellingPrice * item.quantity).toLocaleString()}
                          </span>
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => updateQty(item.product.id, -1)}
                          className="p-1 rounded bg-slate-800 text-slate-300 hover:bg-slate-700"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-bold w-6 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateQty(item.product.id, 1)}
                          className="p-1 rounded bg-slate-800 text-slate-300 hover:bg-slate-700"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => updateQty(item.product.id, -item.quantity)}
                          className="p-1 rounded bg-red-500/15 text-red-400 hover:bg-red-500/25 ml-1"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Payment & Totals */}
              <div className="pt-3 border-t border-slate-800 space-y-2.5 text-xs">
                <div className="flex justify-between text-slate-300">
                  <span>Subtotal</span>
                  <span>LKR {subtotal.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span>Discount (LKR)</span>
                  <input
                    type="number"
                    value={discountAmount}
                    onChange={(e) => setDiscountAmount(Number(e.target.value || 0))}
                    className="w-24 px-2 py-1 bg-slate-900 border border-slate-700 rounded text-right text-white"
                  />
                </div>
                <div className="flex justify-between text-base font-extrabold text-white pt-1 border-t border-slate-800">
                  <span>Grand Total</span>
                  <span className="text-emerald-400">LKR {grandTotal.toLocaleString()}</span>
                </div>

                <div className="grid grid-cols-4 gap-1.5 pt-2">
                  {(["CASH", "CARD", "BANK_TRANSFER", "SPLIT"] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setPaymentMethod(m)}
                      className={`py-1.5 rounded-lg font-bold text-[10px] border transition ${
                        paymentMethod === m
                          ? "bg-emerald-500/20 border-emerald-500 text-emerald-300"
                          : "bg-slate-900 border-slate-800 text-slate-400"
                      }`}
                    >
                      {m.replace("_", " ")}
                    </button>
                  ))}
                </div>

                {paymentMethod === "CASH" && (
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-slate-400">Cash Tendered (LKR)</span>
                    <input
                      type="number"
                      value={cashReceived || ""}
                      onChange={(e) => setCashReceived(Number(e.target.value || 0))}
                      placeholder={String(grandTotal)}
                      className="w-28 px-2 py-1 bg-slate-900 border border-slate-700 rounded text-right text-white"
                    />
                  </div>
                )}
                {paymentMethod === "CASH" && cashReceived > grandTotal && (
                  <div className="flex justify-between text-amber-400 font-bold">
                    <span>Balance / Change Due</span>
                    <span>LKR {changeAmount.toLocaleString()}</span>
                  </div>
                )}

                {paymentMethod === "SPLIT" && (
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Card Portion (LKR)</span>
                      <input
                        type="number"
                        value={splitCardAmount || ""}
                        onChange={(e) => setSplitCardAmount(Number(e.target.value || 0))}
                        className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded text-white"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Cash Portion (LKR)</span>
                      <input
                        type="number"
                        value={Math.max(0, grandTotal - splitCardAmount)}
                        readOnly
                        className="w-full px-2 py-1 bg-slate-950 border border-slate-800 rounded text-emerald-400 font-bold"
                      />
                    </div>
                  </div>
                )}

                <button
                  onClick={handleCheckout}
                  disabled={cart.length === 0 || checkingOut}
                  className="w-full mt-3 py-3 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-slate-950 font-extrabold rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
                >
                  <Printer className="w-4 h-4" />
                  {checkingOut
                    ? "Processing Sale & Syncing Stock..."
                    : "Complete Sale + Print Invoice + WhatsApp Bill"}
                </button>
              </div>
            </div>

            {/* Thermal Receipt & A4 Invoice Preview after Checkout */}
            {lastReceipt && (
              <div className="bg-white text-slate-900 rounded-xl p-5 border-2 border-emerald-500 shadow-xl space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2">
                  <div className="flex items-center gap-1.5 text-emerald-700 font-bold text-xs">
                    <CheckCircle2 className="w-4 h-4" />
                    Invoice {lastReceipt.order.orderNumber} Generated
                  </div>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => setA4InvoiceOrder(lastReceipt.order)}
                      className="px-2.5 py-1 bg-indigo-600 text-white rounded text-xs font-semibold flex items-center gap-1"
                    >
                      <FileText className="w-3.5 h-3.5" /> A4 PDF Invoice
                    </button>
                    <button
                      onClick={() => window.print()}
                      className="px-2.5 py-1 bg-slate-900 text-white rounded text-xs font-semibold flex items-center gap-1"
                    >
                      <Printer className="w-3.5 h-3.5" /> 80mm Receipt
                    </button>
                  </div>
                </div>

                <div className="text-center border-b border-dashed border-slate-300 pb-2">
                  <h4 className="font-extrabold text-sm uppercase">TRUEHIVE ENTERPRISE</h4>
                  <p className="text-[11px] text-slate-600">
                    Invoice: {lastReceipt.order.orderNumber} • {lastReceipt.order.createdAt}
                  </p>
                  <p className="text-[11px] text-slate-600">
                    Customer: {lastReceipt.order.customerName} ({lastReceipt.order.customerPhone})
                  </p>
                </div>

                <div className="space-y-1 text-xs border-b border-dashed border-slate-300 pb-2">
                  {lastReceipt.order.items.map((i, idx) => (
                    <div key={idx} className="flex justify-between">
                      <span>
                        {i.productName} x{i.quantity}
                      </span>
                      <span className="font-semibold">LKR {i.totalPrice.toLocaleString()}</span>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between font-extrabold text-sm">
                  <span>TOTAL PAID ({lastReceipt.order.paymentMethod})</span>
                  <span>LKR {lastReceipt.order.totalAmount.toLocaleString()}</span>
                </div>

                {lastReceipt.bomDeductionsLog.length > 0 && (
                  <div className="p-2 rounded bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-900">
                    <strong>Auto BOM Ingredients Deducted:</strong>{" "}
                    {lastReceipt.bomDeductionsLog.join(" • ")}
                  </div>
                )}

                <div className="flex justify-center pt-1">
                  <BarcodeDisplay value={lastReceipt.order.barcode} height={34} width={1.4} />
                </div>
                <p className="text-center text-[10px] text-slate-500 flex items-center justify-center gap-1">
                  <Send className="w-3 h-3 text-emerald-600" /> Digital Invoice sent via WhatsApp Cloud API
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Barcode Generator & Sticker Sheet View */
        <div className="grid lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 bg-[#111827] border border-slate-800 rounded-xl p-5">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-4">
              <PackagePlus className="w-4 h-4 text-emerald-400" />
              Create Product & Generate Barcode
            </h3>
            <form onSubmit={handleCreateProduct} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Product Name</label>
                <input
                  type="text"
                  value={newProdName}
                  onChange={(e) => setNewProdName(e.target.value)}
                  placeholder="e.g. Red Velvet Cream Cheese Cake (1kg)"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-400 block mb-1">Selling Price (LKR)</label>
                  <input
                    type="number"
                    value={newProdPrice}
                    onChange={(e) => setNewProdPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Opening Stock</label>
                  <input
                    type="number"
                    value={newProdStock}
                    onChange={(e) => setNewProdStock(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                  />
                </div>
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Barcode Number (CODE128)</label>
                <input
                  type="text"
                  value={newProdBarcode}
                  onChange={(e) => setNewProdBarcode(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono"
                />
              </div>
              <div className="pt-2 flex justify-center">
                <BarcodeDisplay
                  value={newProdBarcode || "479202600991"}
                  label={newProdName || "Preview Barcode Label"}
                  priceLkr={newProdPrice}
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl transition"
              >
                Save Product & Sync Barcode
              </button>
            </form>
          </div>

          <div className="lg:col-span-8 bg-[#111827] border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">
                  Printable Barcode Sticker Sheet ({products.length} Products)
                </h3>
                <p className="text-xs text-slate-400">
                  Ready for Thermal Barcode Sticker Printers or A4 Adhesive Sheets
                </p>
              </div>
              <button
                onClick={() => window.print()}
                className="px-3 py-2 bg-emerald-500 text-slate-950 rounded-lg text-xs font-bold flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" /> Print Barcode Labels
              </button>
            </div>

            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
              {products.map((p) => (
                <div
                  key={p.id}
                  className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 flex flex-col items-center space-y-2"
                >
                  <BarcodeDisplay value={p.barcode} label={p.name} priceLkr={p.sellingPrice} />
                  <div className="text-[11px] text-slate-400 flex justify-between w-full px-1">
                    <span>SKU: {p.sku}</span>
                    <span className="text-emerald-400 font-semibold">Stock: {p.currentStock}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
