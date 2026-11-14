"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Truck,
  Plus,
  FileCheck,
  Search,
  CheckCircle2,
  DollarSign,
  Package,
  Phone,
  Clock,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import type { SupplierRecord, IngredientItem } from "@/lib/store";

interface PurchaseOrderRecord {
  id: string;
  poNumber: string;
  supplierName: string;
  itemName: string;
  quantityOrdered: number;
  unit: string;
  unitCost: number;
  totalCost: number;
  status: "DRAFT" | "ISSUED" | "RECEIVED_GRN" | "CANCELLED";
  createdAt: string;
}

interface SupplierManagementViewProps {
  suppliers: SupplierRecord[];
  ingredients: IngredientItem[];
  onRefresh: () => void;
}

export function SupplierManagementView({
  suppliers,
  ingredients,
  onRefresh,
}: SupplierManagementViewProps) {
  const [activeTab, setActiveTab] = useState<"SUPPLIERS" | "PURCHASE_ORDERS">("SUPPLIERS");
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrderRecord[]>([]);
  const [search, setSearch] = useState("");
  const [poModalOpen, setPoModalOpen] = useState(false);
  const [supplierModalOpen, setSupplierModalOpen] = useState(false);

  // New PO State
  const [selectedSupplierId, setSelectedSupplierId] = useState(suppliers[0]?.id || "");
  const [selectedIngredientId, setSelectedIngredientId] = useState(ingredients[0]?.id || "");
  const [poQty, setPoQty] = useState(50);
  const [poUnitCost, setPoUnitCost] = useState(250);
  const [creatingPo, setCreatingPo] = useState(false);

  // New Supplier State
  const [supName, setSupName] = useState("");
  const [supPerson, setSupPerson] = useState("");
  const [supPhone, setSupPhone] = useState("947");
  const [creatingSup, setCreatingSup] = useState(false);
  const [banner, setBanner] = useState("");

  const fetchPos = useCallback(async () => {
    try {
      const res = await fetch("/api/suppliers");
      const data = await res.json();
      if (data.purchaseOrders) setPurchaseOrders(data.purchaseOrders);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    fetchPos();
  }, [fetchPos]);

  const handleCreatePo = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingPo(true);
    try {
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
        setBanner(`Purchase Order ${data.purchaseOrder.poNumber} successfully issued!`);
        setPoModalOpen(false);
        fetchPos();
        onRefresh();
        setTimeout(() => setBanner(""), 5000);
      }
    } finally {
      setCreatingPo(false);
    }
  };

  const handleReceiveGrn = async (poId: string) => {
    try {
      const res = await fetch("/api/suppliers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "RECEIVE_PO_GRN", poId }),
      });
      const data = await res.json();
      if (data.success) {
        setBanner(
          `GRN Received for ${data.purchaseOrder.poNumber}: +${data.purchaseOrder.quantityOrdered} ${data.purchaseOrder.unit} added to stock!`
        );
        fetchPos();
        onRefresh();
        setTimeout(() => setBanner(""), 5000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supName.trim()) return;

    setCreatingSup(true);
    try {
      await fetch("/api/suppliers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "CREATE_SUPPLIER",
          name: supName.trim(),
          contactPerson: supPerson.trim(),
          phone: supPhone.trim(),
        }),
      });
      setSupName("");
      setSupPerson("");
      setSupPhone("947");
      setSupplierModalOpen(false);
      onRefresh();
    } finally {
      setCreatingSup(false);
    }
  };

  const filteredSuppliers = suppliers.filter((s) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return s.name.toLowerCase().includes(q) || s.phone.includes(q);
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Truck className="w-5 h-5 text-blue-500" />
            Supplier Management & Purchase Orders (PO)
          </h2>
          <p className="text-xs text-slate-400">
            Manage vendor accounts, issue raw ingredient purchase orders, and accept GRN stock intake.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSupplierModalOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Add Supplier
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setPoModalOpen(true)}
            leftIcon={<FileCheck className="w-4 h-4" />}
          >
            Issue PO
          </Button>
        </div>
      </div>

      {banner && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          {banner}
        </div>
      )}

      {/* Tabs Toolbar */}
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("SUPPLIERS")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              activeTab === "SUPPLIERS"
                ? "bg-blue-600 text-white"
                : "bg-slate-950 border border-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            Supplier Accounts ({suppliers.length})
          </button>
          <button
            onClick={() => setActiveTab("PURCHASE_ORDERS")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              activeTab === "PURCHASE_ORDERS"
                ? "bg-blue-600 text-white"
                : "bg-slate-950 border border-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            Purchase Orders / GRN ({purchaseOrders.length})
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search suppliers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Tab 1: Suppliers Directory */}
      {activeTab === "SUPPLIERS" && (
        <Card>
          <CardContent className="p-0">
            {filteredSuppliers.length === 0 ? (
              <EmptyState
                icon={<Truck className="w-8 h-8" />}
                title="No suppliers found"
                description="Add raw ingredient and packaging suppliers to streamline procurement."
                actionLabel="Add Supplier"
                onAction={() => setSupplierModalOpen(true)}
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Supplier Name</TableHead>
                    <TableHead>Contact Person</TableHead>
                    <TableHead>Phone / WhatsApp</TableHead>
                    <TableHead>Credit Balance</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSuppliers.map((sup) => (
                    <TableRow key={sup.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold text-xs">
                            <Truck className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-semibold text-white">{sup.name}</p>
                            <p className="text-[10px] text-slate-400">ID: {sup.id.slice(0, 8)}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-slate-300">
                        {sup.contactPerson || "Account Manager"}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-slate-300">
                        {sup.phone}
                      </TableCell>
                      <TableCell className="font-bold text-white">
                        LKR {(sup.creditBalance || 0).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant="success" size="sm">
                          Active Partner
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            setSelectedSupplierId(sup.id);
                            setPoModalOpen(true);
                          }}
                          className="text-xs"
                        >
                          Issue PO
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tab 2: Purchase Orders & GRN Intake */}
      {activeTab === "PURCHASE_ORDERS" && (
        <Card>
          <CardContent className="p-0">
            {purchaseOrders.length === 0 ? (
              <EmptyState
                icon={<FileCheck className="w-8 h-8" />}
                title="No purchase orders issued"
                description="Issue purchase orders to suppliers for raw ingredients restock."
                actionLabel="Issue First PO"
                onAction={() => setPoModalOpen(true)}
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>PO Number</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Item Ordered</TableHead>
                    <TableHead>Total Cost</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action (GRN)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {purchaseOrders.map((po) => (
                    <TableRow key={po.id}>
                      <TableCell className="font-mono font-bold text-white">
                        {po.poNumber}
                      </TableCell>
                      <TableCell className="text-xs text-slate-300">{po.supplierName}</TableCell>
                      <TableCell>
                        <span className="font-medium text-white">{po.itemName}</span>{" "}
                        <span className="text-xs text-slate-400">
                          ({po.quantityOrdered} {po.unit})
                        </span>
                      </TableCell>
                      <TableCell className="font-semibold text-white">
                        LKR {po.totalCost.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={po.status === "RECEIVED_GRN" ? "success" : "warning"}
                          size="sm"
                        >
                          {po.status === "RECEIVED_GRN" ? "GRN Received" : "Issued (Pending)"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {po.status !== "RECEIVED_GRN" ? (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleReceiveGrn(po.id)}
                            leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
                          >
                            Receive GRN
                          </Button>
                        ) : (
                          <span className="text-[11px] text-emerald-400 font-semibold">
                            Stock Added
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* Issue PO Modal */}
      <Modal
        isOpen={poModalOpen}
        onClose={() => setPoModalOpen(false)}
        title="Issue Purchase Order (PO)"
        description="Create an official procurement PO for raw ingredients."
        maxWidth="md"
      >
        <form onSubmit={handleCreatePo} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1">
              Select Supplier *
            </label>
            <select
              value={selectedSupplierId}
              onChange={(e) => setSelectedSupplierId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
            >
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.contactPerson || "Primary"})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1">
              Select Raw Ingredient *
            </label>
            <select
              value={selectedIngredientId}
              onChange={(e) => setSelectedIngredientId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
            >
              {ingredients.map((ing) => (
                <option key={ing.id} value={ing.id}>
                  {ing.name} (Current Stock: {ing.currentStock} {ing.unit})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">
                Quantity to Order
              </label>
              <input
                type="number"
                min="1"
                required
                value={poQty}
                onChange={(e) => setPoQty(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">
                Agreed Unit Cost (LKR)
              </label>
              <input
                type="number"
                min="0"
                required
                value={poUnitCost}
                onChange={(e) => setPoUnitCost(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-400">Total Purchase Order Value:</span>
            <span className="text-base font-bold text-blue-400">
              LKR {(poQty * poUnitCost).toLocaleString()}
            </span>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setPoModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" loading={creatingPo}>
              Issue Purchase Order
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add Supplier Modal */}
      <Modal
        isOpen={supplierModalOpen}
        onClose={() => setSupplierModalOpen(false)}
        title="Add New Supplier"
        description="Register a new procurement partner into the database."
        maxWidth="md"
      >
        <form onSubmit={handleCreateSupplier} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1">
              Company / Supplier Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Ceylon Agro Millers Ltd"
              value={supName}
              onChange={(e) => setSupName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1">
              Contact Person
            </label>
            <input
              type="text"
              placeholder="e.g. Kamal Perera"
              value={supPerson}
              onChange={(e) => setSupPerson(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1">
              Phone / WhatsApp Number
            </label>
            <input
              type="text"
              required
              placeholder="94771234567"
              value={supPhone}
              onChange={(e) => setSupPhone(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setSupplierModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" loading={creatingSup}>
              Save Supplier
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
