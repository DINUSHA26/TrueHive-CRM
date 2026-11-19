"use client";

import React, { useState, useEffect } from "react";
import {
  Package,
  Upload,
  X,
  Plus,
  Trash2,
  Layers,
  DollarSign,
  AlertCircle,
  Check,
  Loader2,
  Image as ImageIcon,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";

export interface FormProductVariant {
  id?: string;
  name: string;
  value: string;
  sku: string;
  barcode: string;
  sellingPrice: number;
  currentStock: number;
  priceAdjustment?: number;
  image?: string;
}

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialProduct?: any;
  categories: Array<{ id: string; name: string }>;
}

export function ProductFormModal({
  isOpen,
  onClose,
  onSuccess,
  initialProduct,
  categories,
}: ProductFormModalProps) {
  const isEdit = Boolean(initialProduct?.id);

  // Form states
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [sku, setSku] = useState("");
  const [barcode, setBarcode] = useState("");
  const [description, setDescription] = useState("");
  const [sellingPrice, setSellingPrice] = useState<number>(0);
  const [discountPrice, setDiscountPrice] = useState<number | undefined>();
  const [currentStock, setCurrentStock] = useState<number>(0);
  const [reorderLevel, setReorderLevel] = useState<number>(5);
  const [unit, setUnit] = useState("PCS");
  const [images, setImages] = useState<Array<{ url: string; position: number }>>([]);
  const [variants, setVariants] = useState<FormProductVariant[]>([]);

  const [uploadingImage, setUploadingImage] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Sync initial product data when opened
  useEffect(() => {
    if (isOpen) {
      if (initialProduct) {
        setName(initialProduct.name || "");
        setCategoryId(initialProduct.categoryId || (initialProduct.category?.id || ""));
        setSku(initialProduct.sku || "");
        setBarcode(initialProduct.barcode || "");
        setDescription(initialProduct.description || "");
        setSellingPrice(Number(initialProduct.sellingPrice || 0));
        setDiscountPrice(initialProduct.discountPrice ? Number(initialProduct.discountPrice) : undefined);
        setCurrentStock(Number(initialProduct.currentStock || 0));
        setReorderLevel(Number(initialProduct.reorderLevel || 5));
        setUnit(initialProduct.unit || "PCS");

        // Images
        if (Array.isArray(initialProduct.images) && initialProduct.images.length > 0) {
          setImages(initialProduct.images);
        } else if (initialProduct.imageUrl) {
          setImages([{ url: initialProduct.imageUrl, position: 0 }]);
        } else {
          setImages([]);
        }

        // Variants
        if (Array.isArray(initialProduct.variants)) {
          setVariants(
            initialProduct.variants.map((v: any) => ({
              id: v.id,
              name: v.name || "Variant",
              value: v.value || "",
              sku: v.sku || "",
              barcode: v.barcode || "",
              sellingPrice: Number(v.sellingPrice || initialProduct.sellingPrice || 0),
              currentStock: Number(v.currentStock || 0),
            }))
          );
        } else {
          setVariants([]);
        }
      } else {
        // Reset for New Product
        setName("");
        setCategoryId(categories[0]?.id || "");
        const randNum = Math.floor(1000 + Math.random() * 9000);
        setSku(`TH-PRD-${randNum}`);
        setBarcode(`4792026${Math.floor(10000 + Math.random() * 90000)}`);
        setDescription("");
        setSellingPrice(2500);
        setDiscountPrice(undefined);
        setCurrentStock(10);
        setReorderLevel(5);
        setUnit("PCS");
        setImages([]);
        setVariants([]);
      }
      setErrorMsg("");
    }
  }, [isOpen, initialProduct, categories]);

  // Handle Cloudinary Image Upload
  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingImage(true);
    setErrorMsg("");

    try {
      const newUploaded: Array<{ url: string; position: number }> = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append("file", file);
        formData.append("folder", "products");

        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        let data: any = {};
        try {
          data = await res.json();
        } catch {
          throw new Error(`Upload server returned status ${res.status}`);
        }

        if (data.success && data.data?.url) {
          newUploaded.push({
            url: data.data.url,
            position: images.length + newUploaded.length,
          });
        } else {
          throw new Error(data.error || "Upload failed");
        }
      }

      setImages((prev) => [...prev, ...newUploaded]);
    } catch (err: any) {
      console.error("Cloudinary upload failed:", err);
      setErrorMsg(err.message || "Failed to upload image to Cloudinary.");
    } finally {
      setUploadingImage(false);
      e.target.value = "";
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  // Add a new variant row
  const addVariantRow = () => {
    const vIndex = variants.length + 1;
    setVariants((prev) => [
      ...prev,
      {
        name: "Size",
        value: "M",
        sku: `${sku || "TH"}-V${vIndex}`,
        barcode: `${barcode || "479"}${vIndex}`,
        sellingPrice: sellingPrice,
        currentStock: 5,
      },
    ]);
  };

  const updateVariantRow = (index: number, field: keyof FormProductVariant, val: any) => {
    setVariants((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: val };
      return updated;
    });
  };

  const removeVariantRow = (index: number) => {
    setVariants((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg("Product Name is required.");
      return;
    }

    setSubmitting(true);
    setErrorMsg("");

    try {
      const payload = {
        id: initialProduct?.id,
        name: name.trim(),
        categoryId: categoryId || null,
        sku: sku.trim(),
        barcode: barcode.trim(),
        description: description.trim(),
        sellingPrice: Number(sellingPrice || 0),
        discountPrice: discountPrice ? Number(discountPrice) : null,
        currentStock: Number(currentStock || 0),
        reorderLevel: Number(reorderLevel || 5),
        unit,
        images,
        variants,
      };

      const res = await fetch("/api/products", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      let data: any = {};
      try {
        data = await res.json();
      } catch {
        throw new Error(`Server returned status ${res.status}`);
      }

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to save product.");
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? "Edit Product" : "Create New Product"}
      description="Configure product details, Cloudinary images, pricing, and variants."
      maxWidth="3xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {errorMsg && (
          <div className="p-3 bg-red-950/60 border border-red-800 rounded-xl text-xs text-red-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            {errorMsg}
          </div>
        )}

        {/* 1. Basic Information */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-white border-b border-slate-800 pb-2">
            Basic Information
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Product Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Linen Long Sleeve Shirt"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Category <span className="text-red-400">*</span>
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
              >
                <option value="">Select Category...</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                SKU (Stock Keeping Unit)
              </label>
              <input
                type="text"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="e.g. SHT-001"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Barcode Value (CODE128)
              </label>
              <input
                type="text"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                placeholder="e.g. 479202610023"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Description
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detailed description of the product..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* 2. Pricing */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-white border-b border-slate-800 pb-2">
            Pricing
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Selling Price (LKR) <span className="text-red-400">*</span>
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                required
                value={sellingPrice}
                onChange={(e) => setSellingPrice(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Compare at Price (LKR)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={discountPrice || ""}
                onChange={(e) =>
                  setDiscountPrice(e.target.value ? parseFloat(e.target.value) : undefined)
                }
                placeholder="Original price for showing discount"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>
          </div>
        </div>

        {/* 3. Inventory & Measurement */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-white border-b border-slate-800 pb-2">
            Inventory & Measurement
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Unit of Measure (UOM)
              </label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
              >
                <option value="PCS">Pieces / Units (Pcs)</option>
                <option value="KG">Kilograms (kg)</option>
                <option value="G">Grams (g)</option>
                <option value="L">Liters (L)</option>
                <option value="ML">Milliliters (ml)</option>
                <option value="M">Meters (m)</option>
                <option value="BOX">Box / Pack</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Stock Quantity <span className="text-red-400">*</span>
              </label>
              <input
                type="number"
                min="0"
                required
                value={currentStock}
                onChange={(e) => setCurrentStock(parseInt(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Low Stock Threshold
              </label>
              <input
                type="number"
                min="0"
                value={reorderLevel}
                onChange={(e) => setReorderLevel(parseInt(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>
          </div>
        </div>

        {/* 4. Product Images (Cloudinary) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div>
              <h3 className="text-sm font-bold text-white">Product Images</h3>
              <p className="text-[11px] text-slate-400">
                Uploaded to Cloudinary (WebP auto-optimized). First image is main thumbnail.
              </p>
            </div>
            <label className="cursor-pointer">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageFileChange}
                disabled={uploadingImage}
                className="hidden"
              />
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition">
                {uploadingImage ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Upload className="w-3.5 h-3.5" />
                )}
                {uploadingImage ? "Uploading..." : "Upload Images"}
              </span>
            </label>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {images.map((img, idx) => (
              <div
                key={idx}
                className="relative group rounded-xl overflow-hidden border border-slate-800 bg-slate-950 aspect-square"
              >
                <img src={img.url} alt={`Product ${idx}`} className="w-full h-full object-cover" />
                {idx === 0 && (
                  <span className="absolute bottom-1 left-1 bg-blue-600/90 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                    Main
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => removeImage(idx)}
                  className="absolute top-1 right-1 p-1 bg-red-600/80 hover:bg-red-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}

            {images.length === 0 && !uploadingImage && (
              <div className="col-span-full py-6 flex flex-col items-center justify-center border border-dashed border-slate-800 rounded-xl text-slate-500 text-xs">
                <ImageIcon className="w-6 h-6 mb-1 text-slate-600" />
                No images uploaded yet. Click Upload Images above.
              </div>
            )}
          </div>
        </div>

        {/* 5. Product Variants */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-400" />
                Product Variants
              </h3>
              <p className="text-[11px] text-slate-400">
                Optional: Add size, color, or weight variants with individual prices, stock, and barcodes.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addVariantRow}
              leftIcon={<Plus className="w-3.5 h-3.5" />}
            >
              Add Variant
            </Button>
          </div>

          {variants.length > 0 && (
            <div className="space-y-2">
              <div className="grid grid-cols-12 gap-2 text-[11px] font-bold text-slate-400 px-2">
                <div className="col-span-3">Type & Value</div>
                <div className="col-span-3">SKU & Barcode</div>
                <div className="col-span-3">Price (LKR)</div>
                <div className="col-span-2">Stock</div>
                <div className="col-span-1 text-right">Del</div>
              </div>

              {variants.map((v, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-12 gap-2 items-center p-2 rounded-xl bg-slate-950 border border-slate-800 text-xs"
                >
                  <div className="col-span-3 space-y-1">
                    <input
                      type="text"
                      placeholder="e.g. Size"
                      value={v.name}
                      onChange={(e) => updateVariantRow(idx, "name", e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs text-white"
                    />
                    <input
                      type="text"
                      placeholder="e.g. XL"
                      value={v.value}
                      onChange={(e) => updateVariantRow(idx, "value", e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs text-white"
                    />
                  </div>

                  <div className="col-span-3 space-y-1">
                    <input
                      type="text"
                      placeholder="SKU"
                      value={v.sku}
                      onChange={(e) => updateVariantRow(idx, "sku", e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-[11px] text-white font-mono"
                    />
                    <input
                      type="text"
                      placeholder="Barcode"
                      value={v.barcode}
                      onChange={(e) => updateVariantRow(idx, "barcode", e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-[11px] text-white font-mono"
                    />
                  </div>

                  <div className="col-span-3">
                    <input
                      type="number"
                      placeholder="Price"
                      value={v.sellingPrice}
                      onChange={(e) =>
                        updateVariantRow(idx, "sellingPrice", parseFloat(e.target.value) || 0)
                      }
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs text-white font-mono"
                    />
                  </div>

                  <div className="col-span-2">
                    <input
                      type="number"
                      placeholder="Qty"
                      value={v.currentStock}
                      onChange={(e) =>
                        updateVariantRow(idx, "currentStock", parseInt(e.target.value) || 0)
                      }
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs text-white font-mono"
                    />
                  </div>

                  <div className="col-span-1 text-right">
                    <button
                      type="button"
                      onClick={() => removeVariantRow(idx)}
                      className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-950/40 rounded-lg transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Buttons */}
        <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-800">
          <Button type="button" variant="ghost" size="sm" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm" disabled={submitting || uploadingImage}>
            {submitting ? "Saving..." : isEdit ? "Update Product" : "Create Product"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

