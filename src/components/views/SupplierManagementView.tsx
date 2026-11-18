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
  FileSpreadsheet,
  Pencil,
  Trash2,
  Calendar,
  Layers,
  Sparkles,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import type { SupplierRecord, IngredientItem, ProductItem } from "@/lib/store";
import type { NavKey } from "@/components/layout/Sidebar";

export interface PurchaseOrderRecord {
  id: string;
  poNumber: string;
  supplierId: string;
  supplierName: string;
  itemName: string;
  quantityOrdered: number;
  quantityReceived?: number;
  unit: string;
  itemType?: "PRODUCT" | "INGREDIENT";
  unitCost: number;
  totalCost: number;
  status: "DRAFT" | "ISSUED" | "RECEIVED_GRN" | "COMPLETED" | "CANCELLED";
  expectedDate?: string;
  receivedAt?: string;
  notes?: string;
  createdAt: string;
}

interface SupplierManagementViewProps {
  suppliers: SupplierRecord[];
  ingredients: IngredientItem[];
  products?: ProductItem[];
  onRefresh: () => void;
  onNavigate?: (key: NavKey) => void;
}

const COMMON_UNITS = ["kg", "g", "L", "ml", "pcs", "pack", "box", "m"];

export function SupplierManagementView({
  suppliers,
  ingredients,
  products = [],
  onRefresh,
  onNavigate,
}: SupplierManagementViewProps) {
  const [activeTab, setActiveTab] = useState<"SUPPLIERS" | "PURCHASE_ORDERS">("SUPPLIERS");
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrderRecord[]>([]);
  const [liveProducts, setLiveProducts] = useState<ProductItem[]>(products);
  const [liveIngredients, setLiveIngredients] = useState<IngredientItem[]>(ingredients);
  const [search, setSearch] = useState("");
  const [banner, setBanner] = useState("");

  // Issue PO State
  const [poModalOpen, setPoModalOpen] = useState(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState(suppliers[0]?.id || "");
  const [poItemType, setPoItemType] = useState<"PRODUCT" | "INGREDIENT">("INGREDIENT");
  const [selectedItemId, setSelectedItemId] = useState("");
  const [customItemName, setCustomItemName] = useState("");
  const [poUnit, setPoUnit] = useState("kg");
  const [poQty, setPoQty] = useState<number | "">(10);
  const [poUnitCost, setPoUnitCost] = useState<number | "">(250);
  const [poExpectedDate, setPoExpectedDate] = useState("");
  const [poNotes, setPoNotes] = useState("");
  const [creatingPo, setCreatingPo] = useState(false);

  // New Supplier State
  const [supplierModalOpen, setSupplierModalOpen] = useState(false);
  const [supName, setSupName] = useState("");
  const [supPerson, setSupPerson] = useState("");
  const [supPhone, setSupPhone] = useState("947");
  const [supEmail, setSupEmail] = useState("");
  const [supAddress, setSupAddress] = useState("");
  const [supCreditLimit, setSupCreditLimit] = useState<number | "">(100000);
  const [supCreditDays, setSupCreditDays] = useState<number | "">(30);
  const [supDescription, setSupDescription] = useState("");
  const [creatingSup, setCreatingSup] = useState(false);

  // Edit Supplier State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<SupplierRecord | null>(null);
  const [editName, setEditName] = useState("");
  const [editPerson, setEditPerson] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editCreditLimit, setEditCreditLimit] = useState<number | "">(100000);
  const [editCreditDays, setEditCreditDays] = useState<number | "">(30);
  const [editDescription, setEditDescription] = useState("");
  const [updatingSup, setUpdatingSup] = useState(false);
  const [deletingSupId, setDeletingSupId] = useState<string | null>(null);

  // Actions on PO
  const [receivingPoId, setReceivingPoId] = useState<string | null>(null);
  const [deletingPoId, setDeletingPoId] = useState<string | null>(null);

  // Sync internal products/ingredients with props
  useEffect(() => {
    if (products.length > 0) setLiveProducts(products);
    if (ingredients.length > 0) setLiveIngredients(ingredients);
  }, [products, ingredients]);

  // Set default selection when modal opens or itemType changes
  useEffect(() => {
    if (poItemType === "PRODUCT") {
      if (liveProducts.length > 0) {
        setSelectedItemId(liveProducts[0].id);
        setPoUnit(liveProducts[0].unit || "pcs");
        setPoUnitCost(liveProducts[0].calculatedCogs || 100);
      } else {
        setSelectedItemId("");
        setPoUnit("pcs");
      }
    } else {
      if (liveIngredients.length > 0) {
        setSelectedItemId(liveIngredients[0].id);
        setPoUnit(liveIngredients[0].unit || "kg");
        setPoUnitCost(liveIngredients[0].unitCost || 250);
      } else {
        setSelectedItemId("");
        setPoUnit("kg");
      }
    }
  }, [poItemType, liveProducts, liveIngredients]);

  // Fetch POs and refresh live lists from backend
  const fetchPos = useCallback(async () => {
    try {
      const res = await fetch("/api/suppliers");
      const data = await res.json();
      if (data.purchaseOrders) setPurchaseOrders(data.purchaseOrders);
      if (data.products && data.products.length > 0) setLiveProducts(data.products);
      if (data.ingredients && data.ingredients.length > 0) setLiveIngredients(data.ingredients);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    fetchPos();
  }, [fetchPos]);

  // Handle Item selection change in PO modal
  const handleItemSelectChange = (id: string) => {
    setSelectedItemId(id);
    if (poItemType === "PRODUCT") {
      const prod = liveProducts.find((p) => p.id === id);
      if (prod) {
        setPoUnit(prod.unit || "pcs");
        if (prod.calculatedCogs) setPoUnitCost(prod.calculatedCogs);
      }
    } else {
      const ing = liveIngredients.find((i) => i.id === id);
      if (ing) {
        setPoUnit(ing.unit || "kg");
        if (ing.unitCost) setPoUnitCost(ing.unitCost);
      }
    }
  };

  // 1. Create Purchase Order
  const handleCreatePo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplierId) {
      alert("Please select a supplier");
      return;
    }

    const qty = Number(poQty) || 1;
    const cost = Number(poUnitCost) || 0;

    let itemName = customItemName.trim();
    if (poItemType === "PRODUCT") {
      const p = liveProducts.find((x) => x.id === selectedItemId);
      if (p) itemName = p.name;
    } else {
      const ing = liveIngredients.find((x) => x.id === selectedItemId);
      if (ing) itemName = ing.name;
    }

    if (!itemName) {
      alert("Please select or enter an item name");
      return;
    }

    setCreatingPo(true);
    try {
      const res = await fetch("/api/suppliers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "CREATE_PO",
          supplierId: selectedSupplierId,
          itemType: poItemType,
          itemId: selectedItemId || undefined,
          itemName,
          unit: poUnit,
          quantity: qty,
          unitCost: cost,
          expectedDate: poExpectedDate || undefined,
          notes: poNotes || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setBanner(`Purchase Order #${data.purchaseOrder?.poNumber || "PO"} successfully issued!`);
        setPoModalOpen(false);
        setCustomItemName("");
        setPoNotes("");
        fetchPos();
        onRefresh();
        setTimeout(() => setBanner(""), 5000);
      } else {
        alert(data.error || "Failed to create Purchase Order");
      }
    } catch (err) {
      console.error(err);
      alert("Error issuing Purchase Order.");
    } finally {
      setCreatingPo(false);
    }
  };

  // 2. Receive GRN
  const handleReceiveGrn = async (poId: string) => {
    setReceivingPoId(poId);
    try {
      const res = await fetch("/api/suppliers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "RECEIVE_PO_GRN", poId }),
      });
      const data = await res.json();
      if (data.success) {
        setBanner(
          `GRN Intake Received! Stock balance updated & Supplier Bill created in Ledger.`
        );
        fetchPos();
        onRefresh();
        setTimeout(() => setBanner(""), 6000);
      } else {
        alert(data.error || "Failed to receive GRN");
      }
    } catch (err) {
      console.error(err);
      alert("Error receiving GRN.");
    } finally {
      setReceivingPoId(null);
    }
  };

  // 3. Delete PO
  const handleDeletePo = async (poId: string, poNum: string) => {
    if (!confirm(`Are you sure you want to cancel and delete Purchase Order #${poNum}?`)) {
      return;
    }
    setDeletingPoId(poId);
    try {
      const res = await fetch("/api/suppliers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "DELETE_PO", poId }),
      });
      const data = await res.json();
      if (data.success) {
        fetchPos();
        onRefresh();
      } else {
        alert(data.error || "Failed to delete Purchase Order");
      }
    } catch (err) {
      console.error(err);
      alert("Error deleting Purchase Order.");
    } finally {
      setDeletingPoId(null);
    }
  };

  // 4. Create Supplier
  const handleCreateSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supName.trim() || !supPhone.trim()) return;

    setCreatingSup(true);
    try {
      const res = await fetch("/api/suppliers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "CREATE_SUPPLIER",
          name: supName.trim(),
          contactPerson: supPerson.trim() || undefined,
          phone: supPhone.trim(),
          email: supEmail.trim() || undefined,
          address: supAddress.trim() || undefined,
          creditLimit: supCreditLimit === "" ? 100000 : Number(supCreditLimit),
          creditDays: supCreditDays === "" ? 30 : Number(supCreditDays),
          description: supDescription.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSupName("");
        setSupPerson("");
        setSupPhone("947");
        setSupEmail("");
        setSupAddress("");
        setSupCreditLimit(100000);
        setSupCreditDays(30);
        setSupDescription("");
        setSupplierModalOpen(false);
        onRefresh();
      } else {
        alert(data.error || "Failed to create supplier");
      }
    } catch (err) {
      console.error(err);
      alert("Error saving supplier.");
    } finally {
      setCreatingSup(false);
    }
  };

  // 5. Open Edit Supplier Modal
  const handleOpenEditSupplier = (sup: SupplierRecord) => {
    setEditingSupplier(sup);
    setEditName(sup.name || "");
    setEditPerson(sup.contactPerson || "");
    setEditPhone(sup.phone || "");
    setEditEmail(sup.email || "");
    setEditAddress(sup.address || "");
    setEditCreditLimit(sup.creditLimit !== undefined ? sup.creditLimit : 100000);
    setEditCreditDays(sup.creditDays !== undefined ? sup.creditDays : 30);
    setEditDescription(sup.description || "");
    setEditModalOpen(true);
  };

  // 6. Update Supplier
  const handleUpdateSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSupplier || !editName.trim() || !editPhone.trim()) return;

    setUpdatingSup(true);
    try {
      const res = await fetch("/api/suppliers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "UPDATE_SUPPLIER",
          id: editingSupplier.id,
          name: editName.trim(),
          contactPerson: editPerson.trim() || undefined,
          phone: editPhone.trim(),
          email: editEmail.trim() || undefined,
          address: editAddress.trim() || undefined,
          creditLimit: editCreditLimit === "" ? 100000 : Number(editCreditLimit),
          creditDays: editCreditDays === "" ? 30 : Number(editCreditDays),
          description: editDescription.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setEditModalOpen(false);
        setEditingSupplier(null);
        onRefresh();
      } else {
        alert(data.error || "Failed to update supplier");
      }
    } catch (err) {
      console.error(err);
      alert("Error updating supplier.");
    } finally {
      setUpdatingSup(false);
    }
  };

  // 7. Delete Supplier
  const handleDeleteSupplier = async (sup: SupplierRecord) => {
    if (!confirm(`Are you sure you want to delete supplier "${sup.name}"? Active purchase records will be preserved.`)) {
      return;
    }
    setDeletingSupId(sup.id);
    try {
      const res = await fetch("/api/suppliers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "DELETE_SUPPLIER", id: sup.id }),
      });
      const data = await res.json();
      if (data.success) {
        onRefresh();
      } else {
        alert(data.error || "Failed to delete supplier");
      }
    } catch (err) {
      console.error(err);
      alert("Error deleting supplier.");
    } finally {
      setDeletingSupId(null);
    }
  };

  const filteredSuppliers = suppliers.filter((s) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return s.name.toLowerCase().includes(q) || s.phone.includes(q) || (s.supplierCode && s.supplierCode.toLowerCase().includes(q));
  });

  const filteredPos = purchaseOrders.filter((po) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      po.poNumber.toLowerCase().includes(q) ||
      po.supplierName.toLowerCase().includes(q) ||
      po.itemName.toLowerCase().includes(q)
    );
  });

  const poTotalCalc = (Number(poQty) || 0) * (Number(poUnitCost) || 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Truck className="w-6 h-6 text-blue-500" />
            Supplier Management & Purchase Orders (PO)
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Procure direct finished products or raw BOM ingredients with measurement units and track GRN stock intake.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onNavigate && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onNavigate("SUPPLIER_LEDGER")}
              leftIcon={<FileSpreadsheet className="w-4 h-4 text-emerald-400" />}
            >
              Supplier Ledger (AP)
            </Button>
          )}
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

      {/* Tabs Toolbar - No ugly horizontal scrollbar */}
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 no-scrollbar">
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
            placeholder={activeTab === "SUPPLIERS" ? "Search suppliers..." : "Search POs, items..."}
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
                description="Add finished product and raw ingredient vendors to manage procurement."
                actionLabel="Add Supplier"
                onAction={() => setSupplierModalOpen(true)}
              />
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Supplier Name</TableHead>
                      <TableHead>Contact Person</TableHead>
                      <TableHead>Phone / WhatsApp</TableHead>
                      <TableHead>Credit Terms</TableHead>
                      <TableHead>Credit Balance (AP)</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSuppliers.map((sup) => (
                      <TableRow key={sup.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold text-xs shrink-0">
                              <Truck className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="font-semibold text-white">{sup.name}</p>
                              <p className="text-[10px] text-slate-400 font-mono">
                                {sup.supplierCode || `SUPP-${sup.id.slice(0, 6)}`}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-slate-300">
                          {sup.contactPerson || "Account Manager"}
                        </TableCell>
                        <TableCell className="font-mono text-xs text-slate-300">
                          {sup.phone}
                        </TableCell>
                        <TableCell className="text-xs text-slate-300">
                          <span>{sup.creditDays || 30} Days</span>
                          <span className="text-[10px] text-slate-500 block">
                            Limit: Rs. {(sup.creditLimit || 0).toLocaleString()}
                          </span>
                        </TableCell>
                        <TableCell className="font-bold text-white font-mono">
                          LKR {(sup.creditBalance || 0).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Badge variant="success" size="sm">
                            Active Partner
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => {
                                setSelectedSupplierId(sup.id);
                                setPoModalOpen(true);
                              }}
                              className="text-xs py-1 px-2.5"
                              leftIcon={<FileCheck className="w-3.5 h-3.5 text-blue-400" />}
                            >
                              Issue PO
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenEditSupplier(sup)}
                              className="text-xs py-1 px-2 text-slate-300 hover:text-white hover:border-blue-500"
                              leftIcon={<Pencil className="w-3.5 h-3.5 text-blue-400" />}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteSupplier(sup)}
                              disabled={deletingSupId === sup.id}
                              className="text-xs py-1 px-2 text-slate-300 hover:text-rose-400 hover:border-rose-500/50"
                              leftIcon={<Trash2 className="w-3.5 h-3.5 text-rose-400" />}
                            >
                              Delete
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tab 2: Purchase Orders & GRN Intake */}
      {activeTab === "PURCHASE_ORDERS" && (
        <Card>
          <CardContent className="p-0">
            {filteredPos.length === 0 ? (
              <EmptyState
                icon={<FileCheck className="w-8 h-8" />}
                title="No purchase orders found"
                description="Issue purchase orders for finished goods or raw materials to restock your warehouse."
                actionLabel="Issue Purchase Order"
                onAction={() => setPoModalOpen(true)}
              />
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>PO Number</TableHead>
                      <TableHead>Supplier</TableHead>
                      <TableHead>Item Type</TableHead>
                      <TableHead>Item Ordered & Unit</TableHead>
                      <TableHead>Unit Cost & Total</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Action (GRN)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPos.map((po) => {
                      const isCompleted = po.status === "COMPLETED" || po.status === "RECEIVED_GRN";

                      return (
                        <TableRow key={po.id}>
                          <TableCell className="font-mono text-xs font-semibold text-blue-400">
                            #{po.poNumber}
                            <span className="block text-[10px] text-slate-500 font-sans">
                              {new Date(po.createdAt).toLocaleDateString()}
                            </span>
                          </TableCell>
                          <TableCell className="text-xs text-slate-200 font-medium">
                            {po.supplierName}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={po.itemType === "PRODUCT" ? "primary" : "success"}
                              size="sm"
                            >
                              {po.itemType === "PRODUCT" ? "DIRECT PRODUCT" : "RAW INGREDIENT"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="text-xs">
                              <span className="font-semibold text-white">{po.itemName}</span>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="px-1.5 py-0.2 rounded bg-slate-800 text-[10px] font-mono font-bold text-amber-400">
                                  {po.quantityOrdered} {po.unit}
                                </span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-xs">
                              <span className="font-mono text-slate-400 block text-[11px]">
                                @ Rs. {po.unitCost.toLocaleString()} / {po.unit}
                              </span>
                              <span className="font-bold text-white font-mono">
                                LKR {po.totalCost.toLocaleString()}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={isCompleted ? "success" : "warning"}
                              size="sm"
                            >
                              {isCompleted ? "GRN RECEIVED" : "PO ISSUED"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {!isCompleted ? (
                                <Button
                                  variant="success"
                                  size="sm"
                                  loading={receivingPoId === po.id}
                                  onClick={() => handleReceiveGrn(po.id)}
                                  leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
                                  className="text-xs py-1 px-2.5 font-semibold"
                                >
                                  Receive GRN
                                </Button>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-semibold px-2 py-1 rounded bg-emerald-500/10">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  Stock Added
                                </span>
                              )}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeletePo(po.id, po.poNumber)}
                                disabled={deletingPoId === po.id}
                                className="text-xs py-1 px-2 text-slate-400 hover:text-rose-400 hover:border-rose-500/50"
                                title="Delete PO"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
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
      )}

      {/* =========================================================
          ISSUE PURCHASE ORDER (PO) MODAL
          ========================================================= */}
      <Modal
        isOpen={poModalOpen}
        onClose={() => setPoModalOpen(false)}
        title="Issue Purchase Order (PO)"
        description="Procure finished products or raw materials with specific measurement units (kg, g, L, ml, pcs)."
        maxWidth="lg"
      >
        <form onSubmit={handleCreatePo} className="space-y-4">
          {/* Step 1: Procurement Type (Product vs Ingredient) */}
          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1.5">
              Select What You Are Purchasing *
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPoItemType("PRODUCT")}
                className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-semibold transition ${
                  poItemType === "PRODUCT"
                    ? "bg-blue-600/20 border-blue-500 text-blue-400 shadow-sm"
                    : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"
                }`}
              >
                <Package className="w-4 h-4 text-blue-400" />
                <span>Direct Product (Finished Goods)</span>
              </button>
              <button
                type="button"
                onClick={() => setPoItemType("INGREDIENT")}
                className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-semibold transition ${
                  poItemType === "INGREDIENT"
                    ? "bg-emerald-600/20 border-emerald-500 text-emerald-400 shadow-sm"
                    : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"
                }`}
              >
                <Layers className="w-4 h-4 text-emerald-400" />
                <span>Raw Ingredient (BOM Recipe)</span>
              </button>
            </div>
          </div>

          {/* Supplier Selection */}
          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1">
              Select Supplier *
            </label>
            <select
              value={selectedSupplierId}
              onChange={(e) => setSelectedSupplierId(e.target.value)}
              required
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
            >
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.contactPerson || "Primary Contact"})
                </option>
              ))}
            </select>
          </div>

          {/* Item Selection */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-slate-300">
                {poItemType === "PRODUCT" ? "Select Registered Product *" : "Select Raw Ingredient *"}
              </label>
              <span className="text-[11px] text-slate-500">Or type custom name below</span>
            </div>

            <select
              value={selectedItemId}
              onChange={(e) => handleItemSelectChange(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500 mb-2"
            >
              <option value="">-- Choose from existing catalog --</option>
              {poItemType === "PRODUCT"
                ? liveProducts.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (Stock: {p.currentStock} {p.unit || "pcs"})
                    </option>
                  ))
                : liveIngredients.map((ing) => (
                    <option key={ing.id} value={ing.id}>
                      {ing.name} (Stock: {ing.currentStock} {ing.unit || "kg"})
                    </option>
                  ))}
            </select>

            {/* Custom Item Name fallback */}
            {!selectedItemId && (
              <input
                type="text"
                placeholder={poItemType === "PRODUCT" ? "Enter product name..." : "Enter ingredient name..."}
                value={customItemName}
                onChange={(e) => setCustomItemName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
              />
            )}
          </div>

          {/* Measurement Unit, Quantity and Agreed Unit Cost */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Measurement Unit */}
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">
                Measurement Unit (UOM) *
              </label>
              <div className="space-y-1.5">
                <select
                  value={poUnit}
                  onChange={(e) => setPoUnit(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="kg">kg (Kilograms)</option>
                  <option value="g">g (Grams)</option>
                  <option value="L">L (Liters)</option>
                  <option value="ml">ml (Milliliters)</option>
                  <option value="pcs">pcs (Pieces / Units)</option>
                  <option value="pack">pack (Packs / Bundles)</option>
                  <option value="box">box (Boxes / Cartons)</option>
                  <option value="m">m (Meters)</option>
                </select>
                <div className="flex flex-wrap gap-1">
                  {COMMON_UNITS.map((u) => (
                    <button
                      key={u}
                      type="button"
                      onClick={() => setPoUnit(u)}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold transition ${
                        poUnit === u
                          ? "bg-blue-600 text-white"
                          : "bg-slate-800 text-slate-400 hover:text-white"
                      }`}
                    >
                      {u}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Quantity */}
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">
                Quantity to Order ({poUnit}) *
              </label>
              <input
                type="number"
                min="0.01"
                step="any"
                required
                value={poQty}
                onChange={(e) => setPoQty(e.target.value === "" ? "" : Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Agreed Unit Cost */}
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">
                Unit Cost (LKR / {poUnit}) *
              </label>
              <input
                type="number"
                min="0"
                step="any"
                required
                value={poUnitCost}
                onChange={(e) => setPoUnitCost(e.target.value === "" ? "" : Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Expected Date & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">
                Expected Delivery Date (Optional)
              </label>
              <input
                type="date"
                value={poExpectedDate}
                onChange={(e) => setPoExpectedDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">
                Order Notes / PO Ref
              </label>
              <input
                type="text"
                placeholder="e.g. Urgent production batch 04"
                value={poNotes}
                onChange={(e) => setPoNotes(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Live Total Cost Calculation */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-400">Total Purchase Order Value:</span>
            <span className="text-lg font-bold text-blue-400 font-mono">
              LKR {poTotalCalc.toLocaleString()}
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

      {/* =========================================================
          ADD SUPPLIER MODAL
          ========================================================= */}
      <Modal
        isOpen={supplierModalOpen}
        onClose={() => setSupplierModalOpen(false)}
        title="Add New Supplier"
        description="Register a new procurement vendor with credit limits and payment terms."
        maxWidth="lg"
      >
        <form onSubmit={handleCreateSupplier} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                Contact Person Name
              </label>
              <input
                type="text"
                placeholder="e.g. Kamal Perera"
                value={supPerson}
                onChange={(e) => setSupPerson(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">
                Phone / WhatsApp Number *
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

            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">
                Email Address (Optional)
              </label>
              <input
                type="email"
                placeholder="supplier@company.lk"
                value={supEmail}
                onChange={(e) => setSupEmail(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">
                Credit Limit Exposure (LKR)
              </label>
              <input
                type="number"
                min="0"
                value={supCreditLimit}
                onChange={(e) => setSupCreditLimit(e.target.value === "" ? "" : Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">
                Default Credit Terms (Days)
              </label>
              <input
                type="number"
                min="1"
                value={supCreditDays}
                onChange={(e) => setSupCreditDays(e.target.value === "" ? "" : Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1">
              Office / Warehouse Address
            </label>
            <input
              type="text"
              placeholder="No. 12, Industrial Zone, Ekala"
              value={supAddress}
              onChange={(e) => setSupAddress(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1">
              Supplier Notes / Categories Supplied
            </label>
            <input
              type="text"
              placeholder="e.g. Pure Honey, Packaging Bottles, Fabric"
              value={supDescription}
              onChange={(e) => setSupDescription(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
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

      {/* =========================================================
          EDIT SUPPLIER MODAL
          ========================================================= */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="Edit Supplier Profile"
        description={`Modify details for ${editingSupplier?.name || "Supplier"}`}
        maxWidth="lg"
      >
        <form onSubmit={handleUpdateSupplier} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">
                Company / Supplier Name *
              </label>
              <input
                type="text"
                required
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">
                Contact Person Name
              </label>
              <input
                type="text"
                value={editPerson}
                onChange={(e) => setEditPerson(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">
                Phone / WhatsApp Number *
              </label>
              <input
                type="text"
                required
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">
                Credit Limit Exposure (LKR)
              </label>
              <input
                type="number"
                min="0"
                value={editCreditLimit}
                onChange={(e) => setEditCreditLimit(e.target.value === "" ? "" : Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">
                Default Credit Terms (Days)
              </label>
              <input
                type="number"
                min="1"
                value={editCreditDays}
                onChange={(e) => setEditCreditDays(e.target.value === "" ? "" : Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1">
              Office / Warehouse Address
            </label>
            <input
              type="text"
              value={editAddress}
              onChange={(e) => setEditAddress(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1">
              Description / Notes
            </label>
            <input
              type="text"
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setEditModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" loading={updatingSup}>
              Update Supplier
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
