"use client";

import React, { useState, useEffect } from "react";
import {
  Package,
  Plus,
  Printer,
  Sparkles,
  Search,
  ScanBarcode,
  Layers,
  ChefHat,
  AlertTriangle,
  CheckCircle2,
  FolderTree,
  Barcode as BarcodeIcon,
  Edit2,
  Trash2,
  SlidersHorizontal,
  Tag,
  ArrowUpDown,
  TrendingDown,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table";
import { Modal } from "@/components/ui/Modal";
import { BarcodeDisplay } from "@/components/BarcodeDisplay";
import { BarcodeGeneratorModal } from "@/components/products/BarcodeGeneratorModal";
import { ProductFormModal } from "@/components/products/ProductFormModal";
import { StockUpdateModal } from "@/components/products/StockUpdateModal";
import { CategoryManagementView } from "@/components/categories/CategoryManagementView";
import type { ProductItem, IngredientItem, SupplierRecord } from "@/lib/store";

interface ProductInventoryViewProps {
  products: ProductItem[];
  ingredients: IngredientItem[];
  suppliers: SupplierRecord[];
  onRefresh: () => void;
}

export function ProductInventoryView({
  products,
  ingredients,
  suppliers,
  onRefresh,
}: ProductInventoryViewProps) {
  const [activeTab, setActiveTab] = useState<
    "PRODUCTS" | "CATEGORIES" | "INGREDIENTS_BOM" | "BARCODE_PRINTER"
  >("PRODUCTS");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  // Modals state
  const [productFormOpen, setProductFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null);

  const [barcodeModalProduct, setBarcodeModalProduct] = useState<any | null>(null);
  const [stockUpdateProduct, setStockUpdateProduct] = useState<ProductItem | null>(null);
  const [viewVariantsProduct, setViewVariantsProduct] = useState<ProductItem | null>(null);

  // Ingredient modal (Add & Edit)
  const [ingredientModalOpen, setIngredientModalOpen] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState<any | null>(null);
  const [ingName, setIngName] = useState("");
  const [ingSku, setIngSku] = useState("");
  const [ingUnit, setIngUnit] = useState("kg");
  const [ingUnitCost, setIngUnitCost] = useState<number>(250);
  const [ingStock, setIngStock] = useState<number>(50);
  const [ingReorder, setIngReorder] = useState<number>(10);
  const [ingSupplier, setIngSupplier] = useState<string>("");
  const [savingIng, setSavingIng] = useState(false);

  // Categories list
  const [categoriesList, setCategoriesList] = useState<Array<{ id: string; name: string }>>([]);

  useEffect(() => {
    fetch("/api/categories")
      .then((res) => res.json())
      .then((data) => {
        if (data.flatCategories) {
          setCategoriesList(data.flatCategories);
        } else if (data.categories) {
          setCategoriesList(data.categories.map((c: any) => ({ id: c.id, name: c.name })));
        }
      })
      .catch(() => {});
  }, []);

  const getCategoryName = (cat: any): string => {
    if (!cat) return "General";
    if (typeof cat === "string") return cat;
    if (typeof cat === "object" && cat.name) return String(cat.name);
    return "General";
  };

  const filteredProducts = products.filter((p) => {
    const q = search.toLowerCase();
    const catName = getCategoryName(p.category);
    const matchesSearch =
      !search ||
      p.name.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q) ||
      p.barcode.includes(q) ||
      catName.toLowerCase().includes(q);

    const matchesCategory =
      categoryFilter === "all" ||
      p.categoryId === categoryFilter ||
      catName.toLowerCase() === categoryFilter.toLowerCase();

    return matchesSearch && matchesCategory;
  });

  const filteredIngredients = ingredients.filter((i) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      i.name.toLowerCase().includes(q) ||
      i.sku.toLowerCase().includes(q) ||
      i.supplierName.toLowerCase().includes(q)
    );
  });

  const handleOpenCreateProduct = () => {
    setEditingProduct(null);
    setProductFormOpen(true);
  };

  const handleOpenEditProduct = (p: ProductItem) => {
    setEditingProduct(p);
    setProductFormOpen(true);
  };

  const handleOpenCreateIngredient = () => {
    setEditingIngredient(null);
    setIngName("");
    setIngSku("");
    setIngUnit("kg");
    setIngUnitCost(250);
    setIngStock(50);
    setIngReorder(10);
    setIngSupplier(suppliers[0]?.name || "");
    setIngredientModalOpen(true);
  };

  const handleOpenEditIngredient = (ing: any) => {
    setEditingIngredient(ing);
    setIngName(ing.name || "");
    setIngSku(ing.sku || "");
    setIngUnit(ing.unit || "kg");
    setIngUnitCost(Number(ing.unitCost || 0));
    setIngStock(Number(ing.currentStock || 0));
    setIngReorder(Number(ing.reorderLevel || 10));
    setIngSupplier(ing.supplierName || ing.supplier?.name || "");
    setIngredientModalOpen(true);
  };

  const handleSaveIngredient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ingName.trim()) return;

    setSavingIng(true);
    try {
      const isEdit = Boolean(editingIngredient?.id);
      const res = await fetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: isEdit ? "UPDATE_INGREDIENT" : "CREATE_INGREDIENT",
          id: editingIngredient?.id,
          name: ingName.trim(),
          sku: ingSku.trim() || undefined,
          unit: ingUnit,
          unitCost: Number(ingUnitCost),
          currentStock: Number(ingStock),
          reorderLevel: Number(ingReorder),
          supplierName: ingSupplier.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to save ingredient");
      }

      setIngredientModalOpen(false);
      setEditingIngredient(null);
      onRefresh();
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to save ingredient");
    } finally {
      setSavingIng(false);
    }
  };

  const handleDeleteIngredient = async (ing: any) => {
    if (!confirm(`Are you sure you want to delete / deactivate ingredient "${ing.name}"?`)) return;
    try {
      const res = await fetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "DELETE_INGREDIENT",
          id: ing.id,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to delete ingredient");
      }
      onRefresh();
    } catch (err: any) {
      console.error("Failed to delete ingredient:", err);
      alert(err.message || "Failed to delete ingredient");
    }
  };

  const handleDeleteProduct = async (p: ProductItem) => {
    if (!confirm(`Are you sure you want to deactivate product "${p.name}"?`)) return;
    try {
      await fetch(`/api/products?id=${p.id}`, { method: "DELETE" });
      onRefresh();
    } catch (err) {
      console.error("Failed to delete product:", err);
    }
  };

  // Stats
  const totalProducts = products.length;
  const activeProducts = products.filter((p) => p.isActive !== false).length;
  const lowStockProducts = products.filter((p) => p.currentStock <= (p.reorderLevel || 5)).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Package className="w-5 h-5 text-blue-500" />
            Product Catalog & Inventory Management
          </h2>
          <p className="text-xs text-slate-400">
            Multi-variant catalog, category tree hierarchy, live barcode generation, and instant stock sync.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === "INGREDIENTS_BOM" ? (
            <Button
              variant="outline"
              size="sm"
              onClick={handleOpenCreateIngredient}
              leftIcon={<ChefHat className="w-3.5 h-3.5 text-amber-400" />}
            >
              + New Ingredient
            </Button>
          ) : activeTab === "CATEGORIES" ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setActiveTab("PRODUCTS")}
              leftIcon={<Package className="w-4 h-4" />}
            >
              Back to Products
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveTab("CATEGORIES")}
                leftIcon={<FolderTree className="w-3.5 h-3.5 text-purple-400" />}
              >
                Categories
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleOpenCreateProduct}
                leftIcon={<Plus className="w-4 h-4" />}
              >
                + New Product
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Top 3 Stat Cards (Matching PrimeWear Image 2) */}
      {activeTab === "PRODUCTS" && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
            <p className="text-xs font-semibold text-slate-400">Total Products</p>
            <p className="text-2xl font-bold text-white mt-1">{totalProducts}</p>
          </div>
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
            <p className="text-xs font-semibold text-slate-400">Active Products</p>
            <p className="text-2xl font-bold text-emerald-400 mt-1">{activeProducts}</p>
          </div>
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
            <p className="text-xs font-semibold text-slate-400">Low Stock Alert</p>
            <p className="text-2xl font-bold text-red-400 mt-1">{lowStockProducts}</p>
          </div>
        </div>
      )}

      {/* View Switcher Tabs & Search Toolbar */}
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("PRODUCTS")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              activeTab === "PRODUCTS"
                ? "bg-blue-600 text-white"
                : "bg-slate-950 border border-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            Finished Products ({products.length})
          </button>
          <button
            onClick={() => setActiveTab("INGREDIENTS_BOM")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
              activeTab === "INGREDIENTS_BOM"
                ? "bg-blue-600 text-white"
                : "bg-slate-950 border border-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <ChefHat className="w-3.5 h-3.5" />
            Raw Ingredients & BOM ({ingredients.length})
          </button>
          <button
            onClick={() => setActiveTab("CATEGORIES")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
              activeTab === "CATEGORIES"
                ? "bg-blue-600 text-white"
                : "bg-slate-950 border border-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <FolderTree className="w-3.5 h-3.5" />
            Categories ({categoriesList.length})
          </button>
          <button
            onClick={() => setActiveTab("BARCODE_PRINTER")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              activeTab === "BARCODE_PRINTER"
                ? "bg-blue-600 text-white"
                : "bg-slate-950 border border-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            Print Barcode Labels
          </button>
        </div>

        {activeTab === "PRODUCTS" && (
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="flex items-center gap-1.5">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
              >
                <option value="all">All Categories</option>
                {categoriesList.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setActiveTab("CATEGORIES")}
                title="Manage Categories"
                className="p-1.5 bg-slate-950 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 rounded-xl transition"
              >
                <FolderTree className="w-3.5 h-3.5 text-purple-400" />
              </button>
            </div>

            <div className="relative w-full sm:w-56">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search products, SKU..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* Tab 1: Products Catalog Table */}
      {activeTab === "PRODUCTS" && (
        <Card>
          <CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-14">Image</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Stock Level</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-28 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((p) => {
                  const isLow = p.currentStock <= (p.reorderLevel || 5);
                  const hasVariants = Boolean(p.variants && p.variants.length > 0);
                  const totalVariantStock = hasVariants
                    ? p.variants?.reduce((sum, v) => sum + (v.currentStock || 0), 0)
                    : p.currentStock;

                  const thumbUrl =
                    (Array.isArray(p.images) && p.images[0]?.url) ||
                    p.imageUrl ||
                    null;

                  return (
                    <TableRow key={p.id}>
                      {/* Image Thumbnail */}
                      <TableCell>
                        {thumbUrl ? (
                          <img
                            src={thumbUrl}
                            alt={p.name}
                            className="w-10 h-10 rounded-lg object-cover border border-slate-800 bg-slate-950"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center text-slate-500 text-[10px]">
                            No img
                          </div>
                        )}
                      </TableCell>

                      {/* Product Name & SKU */}
                      <TableCell>
                        <div>
                          <p className="font-semibold text-white text-sm">{p.name}</p>
                          <p className="text-[11px] text-slate-400 font-mono">
                            SKU: {p.sku} | Barcode: {p.barcode}
                          </p>
                        </div>
                      </TableCell>

                      {/* Category */}
                      <TableCell>
                        <span className="text-xs text-slate-300 font-medium">
                          {getCategoryName(p.category)}
                        </span>
                      </TableCell>

                      {/* Price */}
                      <TableCell>
                        <div>
                          <p className="font-bold text-white text-sm">
                            LKR {p.sellingPrice.toLocaleString()}
                          </p>
                          {p.discountPrice && (
                            <p className="text-[10px] text-slate-500 line-through">
                              LKR {p.discountPrice.toLocaleString()}
                            </p>
                          )}
                        </div>
                      </TableCell>

                      {/* Stock Level with "By variant" badge matching PrimeWear Image 2 */}
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {hasVariants ? (
                            <button
                              type="button"
                              onClick={() => setViewVariantsProduct(p)}
                              className="text-xs font-semibold text-blue-400 hover:text-blue-300 underline decoration-dotted transition"
                            >
                              By variant ({totalVariantStock})
                            </button>
                          ) : (
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-white text-xs">
                                {p.currentStock} {p.unit || "pcs"}
                              </span>
                              {isLow && (
                                <Badge variant="danger" size="sm">
                                  Low
                                </Badge>
                              )}
                              <button
                                type="button"
                                onClick={() => setStockUpdateProduct(p)}
                                title="Quick Stock Adjustment"
                                className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition"
                              >
                                <SlidersHorizontal className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </div>
                      </TableCell>

                      {/* Status */}
                      <TableCell>
                        <Badge variant={p.isActive !== false ? "success" : "neutral"} size="sm" dot>
                          {p.isActive !== false ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>

                      {/* Actions: Barcode Generator, Edit, Delete */}
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* Dedicated Barcode Generator in front of product matching user request */}
                          <button
                            type="button"
                            onClick={() =>
                              setBarcodeModalProduct({
                                id: p.id,
                                name: p.name,
                                sku: p.sku,
                                barcode: p.barcode,
                                price: p.sellingPrice,
                                stock: p.currentStock,
                                variants: p.variants,
                              })
                            }
                            title="Generate Barcode & Print Labels"
                            className="p-1.5 text-blue-400 hover:text-blue-300 hover:bg-blue-950/40 rounded-lg transition"
                          >
                            <BarcodeIcon className="w-4 h-4" />
                          </button>

                          {/* Edit Product */}
                          <button
                            type="button"
                            onClick={() => handleOpenEditProduct(p)}
                            title="Edit Product"
                            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete */}
                          <button
                            type="button"
                            onClick={() => handleDeleteProduct(p)}
                            title="Deactivate Product"
                            className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-950/40 rounded-lg transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}

                {filteredProducts.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-slate-500">
                      No products found. Click "+ New Product" to add your first item.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Tab 2: Category Hierarchy Management (PrimeWear Style) */}
      {activeTab === "CATEGORIES" && <CategoryManagementView />}

      {/* Tab: Raw Ingredients & BOM */}
      {activeTab === "INGREDIENTS_BOM" && (
        <Card>
          <CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Raw Ingredient</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Unit Cost</TableHead>
                  <TableHead>Current Stock</TableHead>
                  <TableHead>Reorder Threshold</TableHead>
                  <TableHead>Primary Supplier</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-24 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredIngredients.map((ing) => {
                  const isLow = ing.currentStock <= ing.reorderLevel;
                  const supplierDisplay = ing.supplierName || (ing as any).supplier?.name || "—";
                  return (
                    <TableRow key={ing.id}>
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <ChefHat className="w-4 h-4 text-amber-400 shrink-0" />
                          <span className="font-semibold text-white">{ing.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-slate-400">
                        {ing.sku}
                      </TableCell>
                      <TableCell className="font-semibold text-white">
                        LKR {ing.unitCost.toLocaleString()} / {ing.unit}
                      </TableCell>
                      <TableCell className="font-bold text-white">
                        {ing.currentStock} {ing.unit}
                      </TableCell>
                      <TableCell className="text-slate-400 text-xs">
                        {ing.reorderLevel} {ing.unit}
                      </TableCell>
                      <TableCell className="text-xs text-slate-300">
                        {supplierDisplay}
                      </TableCell>
                      <TableCell>
                        <Badge variant={isLow ? "danger" : "success"} size="sm">
                          {isLow ? "Low Stock" : "In Stock"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEditIngredient(ing)}
                            title="Edit Ingredient"
                            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-blue-400" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteIngredient(ing)}
                            title="Deactivate Ingredient"
                            className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-950/40 rounded-lg transition"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}

                {filteredIngredients.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12 text-slate-500">
                      No raw ingredients found. Click "+ New Ingredient" to add one.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Tab 4: Barcode Labels Printable Sheet */}
      {activeTab === "BARCODE_PRINTER" && (
        <Card>
          <CardHeader className="border-b border-slate-800/80 pb-3 flex items-center justify-between">
            <div>
              <CardTitle className="text-sm flex items-center gap-2">
                <Printer className="w-4 h-4 text-blue-400" />
                Printable Barcode Label Sheets (A4 / Sticker Grid)
              </CardTitle>
              <p className="text-xs text-slate-400">
                Directly printable for thermal label rolls or multi-label A4 sticker sheets.
              </p>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={() => window.print()}
              leftIcon={<Printer className="w-4 h-4" />}
            >
              Print Labels
            </Button>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 p-4 bg-slate-950 rounded-2xl border border-slate-800">
              {products.map((p) => (
                <div
                  key={p.id}
                  className="p-3 bg-white text-slate-900 rounded-xl border border-slate-200 flex flex-col items-center justify-center text-center shadow"
                >
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">
                    TrueHive Enterprise
                  </p>
                  <p className="text-xs font-bold text-slate-900 truncate max-w-[160px]">{p.name}</p>
                  <BarcodeDisplay value={p.barcode} height={36} width={1.4} fontSize={10} />
                  <p className="text-xs font-extrabold text-slate-900 mt-1">
                    LKR {p.sellingPrice.toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Barcode Generator Modal */}
      <BarcodeGeneratorModal
        product={barcodeModalProduct}
        isOpen={Boolean(barcodeModalProduct)}
        onClose={() => setBarcodeModalProduct(null)}
      />

      {/* Product Create & Edit Form Modal */}
      <ProductFormModal
        isOpen={productFormOpen}
        onClose={() => setProductFormOpen(false)}
        onSuccess={onRefresh}
        initialProduct={editingProduct}
        categories={categoriesList}
      />

      {/* Quick Stock Adjustment Modal */}
      <StockUpdateModal
        product={stockUpdateProduct}
        isOpen={Boolean(stockUpdateProduct)}
        onClose={() => setStockUpdateProduct(null)}
        onSuccess={onRefresh}
      />

      {/* View Variants Modal */}
      <Modal
        isOpen={Boolean(viewVariantsProduct)}
        onClose={() => setViewVariantsProduct(null)}
        title={`Variants: ${viewVariantsProduct?.name}`}
        description="Inspect variant inventory, individual SKUs, barcodes, and selling prices."
        maxWidth="lg"
      >
        <div className="p-6 space-y-4">
          <div className="space-y-2">
            {viewVariantsProduct?.variants?.map((v) => (
              <div
                key={v.id}
                className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs"
              >
                <div>
                  <p className="font-bold text-white text-sm">
                    {v.name} {v.value ? `(${v.value})` : ""}
                  </p>
                  <p className="text-slate-400 font-mono mt-0.5">
                    SKU: {v.sku} | Barcode: {v.barcode}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-white">LKR {v.sellingPrice.toLocaleString()}</p>
                  <Badge variant={v.currentStock <= 5 ? "warning" : "primary"} size="sm" className="mt-1">
                    Stock: {v.currentStock}
                  </Badge>
                </div>
              </div>
            ))}

            {(!viewVariantsProduct?.variants || viewVariantsProduct.variants.length === 0) && (
              <p className="text-slate-500 text-center py-6">No variants defined for this product.</p>
            )}
          </div>

          <div className="flex items-center justify-end pt-3 border-t border-slate-800">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const prod = viewVariantsProduct;
                setViewVariantsProduct(null);
                if (prod) handleOpenEditProduct(prod);
              }}
            >
              Edit Product & Variants
            </Button>
          </div>
        </div>
      </Modal>

      {/* Ingredient Modal (Add & Edit) */}
      <Modal
        isOpen={ingredientModalOpen}
        onClose={() => {
          setIngredientModalOpen(false);
          setEditingIngredient(null);
        }}
        title={editingIngredient ? `Edit Raw Ingredient: ${editingIngredient.name}` : "Add Raw Material / Ingredient"}
        description={
          editingIngredient
            ? "Update ingredient unit cost, stock, reorder threshold, or primary supplier."
            : "Add a raw ingredient to track inventory and calculate BOM recipe COGS."
        }
        maxWidth="md"
      >
        <form onSubmit={handleSaveIngredient} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Ingredient Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              required
              value={ingName}
              onChange={(e) => setIngName(e.target.value)}
              placeholder="e.g. Belgian Dark Chocolate 70%"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">SKU / Code</label>
              <input
                type="text"
                value={ingSku}
                onChange={(e) => setIngSku(e.target.value)}
                placeholder="e.g. ING-COC-02"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Unit of Measure</label>
              <select
                value={ingUnit}
                onChange={(e) => setIngUnit(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
              >
                <option value="kg">kg (Kilograms)</option>
                <option value="g">g (Grams)</option>
                <option value="L">L (Liters)</option>
                <option value="ml">ml (Milliliters)</option>
                <option value="pcs">pcs (Pieces)</option>
                <option value="pack">pack (Packs)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Unit Cost (LKR) <span className="text-red-400">*</span>
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                required
                value={ingUnitCost}
                onChange={(e) => setIngUnitCost(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Current Stock <span className="text-red-400">*</span>
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                required
                value={ingStock}
                onChange={(e) => setIngStock(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Reorder Level / Threshold</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={ingReorder}
                onChange={(e) => setIngReorder(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Primary Supplier</label>
              <input
                type="text"
                list="suppliers-datalist"
                value={ingSupplier}
                onChange={(e) => setIngSupplier(e.target.value)}
                placeholder="Select or type supplier..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
              />
              <datalist id="suppliers-datalist">
                {suppliers.map((s) => (
                  <option key={s.id} value={s.name} />
                ))}
              </datalist>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setIngredientModalOpen(false);
                setEditingIngredient(null);
              }}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" disabled={savingIng}>
              {savingIng ? "Saving..." : editingIngredient ? "Update Ingredient" : "Save Ingredient"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
