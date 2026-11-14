"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Truck,
  FilePlus2,
  CheckCircle2,
  CreditCard,
  PackagePlus,
  Building2,
} from "lucide-react";
import type { SupplierRecord, IngredientItem } from "@/lib/store";

interface PurchaseOrderEntry {
  id: string;
  poNumber: string;
  supplierId: string;
  supplierName: string;
  itemName: string;
  quantityOrdered: number;
  unit: string;
  unitCost: number;
  totalAmount: number;
  status: "SENT" | "COMPLETED_GRN" | "PAID";
  createdAt: string;
}

interface Props {
  suppliers: SupplierRecord[];
  ingredients: IngredientItem[];
  onRefresh: () => void;
}

export function SuppliersAndPoPanel({ suppliers, ingredients, onRefresh }: Props) {
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrderEntry[]>([]);
  const [selectedSupplierId, setSelectedSupplierId] = useState(suppliers[0]?.id || "");
  const [selectedIngredientId, setSelectedIngredientId] = useState(ingredients[0]?.id || "");
  const [poQty, setPoQty] = useState(25);
  const [poUnitCost, setPoUnitCost] = useState(ingredients[0]?.unitCost || 300);

  // New Supplier form
  const [supName, setSupName] = useState("");
  const [supPerson, setSupPerson] = useState("");
  const [supPhone, setSupPhone] = useState("");
  const [banner, setBanner] = useState("");

  const fetchPos = useCallback(async () => {
    const res = await fetch("/api/suppliers");
    const data = await res.json();
    if (data.purchaseOrders) setPurchaseOrders(data.purchaseOrders);
  }, []);

  useEffect(() => {
    fetchPos();
  }, [fetchPos]);

  const handleCreatePo = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/suppliers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "CREATE_PO",
        supplierId: selectedSupplierId,
        ingredientId: selectedIngredientId,
        quantity: poQty,
        unitCost: poUnitCost,
      }),
    });
    const data = await res.json();
    if (data.success) {
      setBanner(`Purchase Order ${data.purchaseOrder.poNumber} issued to ${data.purchaseOrder.supplierName}!`);
      fetchPos();
      onRefresh();
    }
  };

  const handleReceiveGrn = async (poId: string) => {
    const res = await fetch("/api/suppliers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "RECEIVE_PO_GRN", poId }),
    });
    const data = await res.json();
    if (data.success) {
      setBanner(
        `GRN Completed for ${data.purchaseOrder.poNumber}: +${data.purchaseOrder.quantityOrdered} ${data.purchaseOrder.unit} added to "${data.purchaseOrder.itemName}" stock!`
      );
      fetchPos();
      onRefresh();
    }
  };

  const handlePaySupplier = async (supplierId: string, amount: number) => {
    if (amount <= 0) return;
    await fetch("/api/suppliers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "PAY_SUPPLIER", supplierId, amount }),
    });
    setBanner(`Supplier credit balance of LKR ${amount.toLocaleString()} settled & recorded in Cash Flow!`);
    onRefresh();
  };

  const handleCreateSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supName) return;
    await fetch("/api/suppliers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "CREATE_SUPPLIER",
        name: supName,
        contactPerson: supPerson,
        phone: supPhone,
      }),
    });
    setSupName("");
    setSupPerson("");
    setSupPhone("");
    onRefresh();
  };

  return (
    <div className="space-y-6">
      {banner && (
        <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center justify-between">
          <span>✓ {banner}</span>
          <button onClick={() => setBanner("")} className="text-slate-400 hover:text-white">
            Dismiss
          </button>
        </div>
      )}

      <div className="grid lg:grid-cols-12 gap-6">
        {/* Create Purchase Order (PO) */}
        <div className="lg:col-span-4 bg-[#111827] border border-slate-800 rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <FilePlus2 className="w-4 h-4 text-emerald-400" />
            Issue New Purchase Order (PO)
          </h3>
          <form onSubmit={handleCreatePo} className="space-y-3 text-xs">
            <div>
              <label className="text-slate-400 block mb-1">Select Supplier</label>
              <select
                value={selectedSupplierId}
                onChange={(e) => setSelectedSupplierId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
              >
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Raw Ingredient / Material</label>
              <select
                value={selectedIngredientId}
                onChange={(e) => {
                  setSelectedIngredientId(e.target.value);
                  const found = ingredients.find((i) => i.id === e.target.value);
                  if (found) setPoUnitCost(found.unitCost);
                }}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
              >
                {ingredients.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.name} (Stock: {i.currentStock} {i.unit})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-slate-400 block mb-1">Order Quantity</label>
                <input
                  type="number"
                  value={poQty}
                  onChange={(e) => setPoQty(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Unit Cost (LKR)</label>
                <input
                  type="number"
                  value={poUnitCost}
                  onChange={(e) => setPoUnitCost(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                />
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex justify-between font-bold">
              <span className="text-slate-400">PO Total Value:</span>
              <span className="text-emerald-400">LKR {(poQty * poUnitCost).toLocaleString()}</span>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold rounded-xl transition"
            >
              Generate & Send Purchase Order
            </button>
          </form>
        </div>

        {/* Purchase Orders & One-Click GRN Receiving */}
        <div className="lg:col-span-8 bg-[#111827] border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Truck className="w-4 h-4 text-emerald-400" />
                Active Purchase Orders (PO) & Goods Received Note (GRN)
              </h3>
              <p className="text-xs text-slate-400">
                Receiving a PO as GRN automatically increments BOM raw material stock
              </p>
            </div>
          </div>

          <div className="space-y-2.5">
            {purchaseOrders.map((po) => (
              <div
                key={po.id}
                className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-emerald-400">{po.poNumber}</span>
                    <span className="font-bold text-white">{po.supplierName}</span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                        po.status === "COMPLETED_GRN"
                          ? "bg-emerald-500/20 text-emerald-300"
                          : "bg-amber-500/20 text-amber-300"
                      }`}
                    >
                      {po.status}
                    </span>
                  </div>
                  <p className="text-slate-300">
                    Item: <strong>{po.itemName}</strong> • Qty:{" "}
                    <strong>
                      {po.quantityOrdered} {po.unit}
                    </strong>{" "}
                    @ LKR {po.unitCost.toLocaleString()}
                  </p>
                  <p className="text-[11px] text-slate-500">Issued: {po.createdAt}</p>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-sm font-extrabold text-white">
                    LKR {po.totalAmount.toLocaleString()}
                  </span>
                  {po.status !== "COMPLETED_GRN" ? (
                    <button
                      onClick={() => handleReceiveGrn(po.id)}
                      className="px-3 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg flex items-center gap-1.5"
                    >
                      <PackagePlus className="w-3.5 h-3.5" /> Receive Stock (GRN)
                    </button>
                  ) : (
                    <span className="px-3 py-1.5 rounded-lg bg-slate-800 text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Stock Added
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Suppliers Directory & Credit Payables Settlement */}
      <div className="grid lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4 bg-[#111827] border border-slate-800 rounded-xl p-5 space-y-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Building2 className="w-4 h-4 text-emerald-400" />
            Add New Supplier
          </h3>
          <form onSubmit={handleCreateSupplier} className="space-y-3 text-xs">
            <input
              type="text"
              value={supName}
              onChange={(e) => setSupName(e.target.value)}
              placeholder="Supplier Company Name"
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
              required
            />
            <input
              type="text"
              value={supPerson}
              onChange={(e) => setSupPerson(e.target.value)}
              placeholder="Contact Person Name"
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
            />
            <input
              type="text"
              value={supPhone}
              onChange={(e) => setSupPhone(e.target.value)}
              placeholder="Phone Number (+94...)"
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
            />
            <button
              type="submit"
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl border border-slate-700"
            >
              + Register Supplier
            </button>
          </form>
        </div>

        <div className="lg:col-span-8 bg-[#111827] border border-slate-800 rounded-xl p-5 space-y-3">
          <h3 className="text-sm font-bold text-white">
            Supplier Credit Balances (Accounts Payable)
          </h3>
          <div className="space-y-2.5">
            {suppliers.map((s) => (
              <div
                key={s.id}
                className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs"
              >
                <div>
                  <p className="font-bold text-white text-sm">{s.name}</p>
                  <p className="text-slate-400">
                    Contact: {s.contactPerson} • {s.phone} • {s.email}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-[11px] text-slate-400">Credit Payable</p>
                    <p className="text-sm font-extrabold text-amber-400">
                      LKR {s.creditBalance.toLocaleString()}
                    </p>
                  </div>
                  {s.creditBalance > 0 && (
                    <button
                      onClick={() => handlePaySupplier(s.id, s.creditBalance)}
                      className="px-3 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg flex items-center gap-1.5"
                    >
                      <CreditCard className="w-3.5 h-3.5" /> Settle Payable
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
