"use client";

import React, { useEffect, useRef, useState } from "react";
import JsBarcode from "jsbarcode";
import {
  Printer,
  Download,
  Barcode as BarcodeIcon,
  X,
  Layers,
  Settings2,
  Check,
  Tag,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";

export interface BarcodeProduct {
  id: string;
  name: string;
  sku?: string | null;
  barcode?: string | null;
  price: number | string;
  stock?: number;
  variants?: Array<{
    id: string;
    name?: string;
    value?: string | null;
    sku?: string | null;
    barcode?: string | null;
    currentStock?: number;
    sellingPrice?: number;
    priceAdjustment?: number | string | null;
  }>;
}

interface BarcodeGeneratorModalProps {
  product: BarcodeProduct | null;
  isOpen: boolean;
  onClose: () => void;
  storeName?: string;
}

export function BarcodeGeneratorModal({
  product,
  isOpen,
  onClose,
  storeName = "TrueHive Enterprise",
}: BarcodeGeneratorModalProps) {
  const [selectedVariantId, setSelectedVariantId] = useState<string>("main");
  const [labelFormat, setLabelFormat] = useState<"thermal-50x25" | "thermal-40x30" | "a4-24" | "a4-40">(
    "thermal-50x25"
  );
  const [printCount, setPrintCount] = useState<number>(1);
  const [showStoreName, setShowStoreName] = useState(true);
  const [showTitle, setShowTitle] = useState(true);
  const [showPrice, setShowPrice] = useState(true);
  const [showVariant, setShowVariant] = useState(true);

  const barcodeRef = useRef<SVGSVGElement | null>(null);

  // Reset variant on open
  useEffect(() => {
    if (isOpen) {
      setSelectedVariantId("main");
    }
  }, [isOpen, product]);

  if (!product) return null;

  const hasVariants = Boolean(product.variants && product.variants.length > 0);
  const selectedVariant =
    hasVariants && selectedVariantId !== "main"
      ? product.variants?.find((v) => v.id === selectedVariantId)
      : null;

  const basePrice = Number((product as any).sellingPrice ?? product.price ?? 0);
  const currentPrice = selectedVariant
    ? selectedVariant.sellingPrice !== undefined
      ? Number(selectedVariant.sellingPrice)
      : basePrice + Number(selectedVariant.priceAdjustment || 0)
    : basePrice;

  const rawCode = selectedVariant?.barcode || selectedVariant?.sku || product.barcode || product.sku;
  const barcodeValue =
    rawCode && rawCode.trim().length > 0
      ? rawCode.trim().replace(/[^\w-]/g, "")
      : selectedVariant
      ? `VAR-${(selectedVariant.id || "000000").slice(-6).toUpperCase()}`
      : `PRD-${(product.id || "000000").slice(-6).toUpperCase()}`;

  const variantLabel = selectedVariant
    ? `${selectedVariant.name}${selectedVariant.value ? `: ${selectedVariant.value}` : ""}`
    : null;

  // Render barcode whenever target changes
  useEffect(() => {
    if (barcodeRef.current && barcodeValue && isOpen) {
      try {
        JsBarcode(barcodeRef.current, barcodeValue, {
          format: "CODE128",
          lineColor: "#0f172a",
          width: labelFormat.startsWith("thermal") ? 1.7 : 1.4,
          height: labelFormat === "thermal-40x30" ? 48 : 36,
          displayValue: true,
          fontSize: 11,
          margin: 4,
          background: "#ffffff",
        });
      } catch (err) {
        console.error("Barcode generation error:", err);
      }
    }
  }, [barcodeValue, labelFormat, isOpen, selectedVariantId]);

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const svgContent = barcodeRef.current ? barcodeRef.current.outerHTML : "";

    let labelsHtml = "";
    for (let i = 0; i < Math.max(1, printCount); i++) {
      labelsHtml += `
        <div class="barcode-card">
          ${showStoreName ? `<div class="store-name">${storeName}</div>` : ""}
          ${showTitle ? `<div class="item-name">${product.name}</div>` : ""}
          ${showVariant && variantLabel ? `<div class="variant-info">${variantLabel}</div>` : ""}
          <div class="svg-container">${svgContent}</div>
          ${showPrice ? `<div class="price-tag">LKR ${currentPrice.toLocaleString("en-LK", { minimumFractionDigits: 2 })}</div>` : ""}
        </div>
      `;
    }

    const isThermal = labelFormat.startsWith("thermal");
    const pageSize =
      labelFormat === "thermal-50x25"
        ? "50mm 25mm"
        : labelFormat === "thermal-40x30"
        ? "40mm 30mm"
        : "A4";

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Print Barcode Labels - ${product.name}</title>
          <style>
            @page {
              size: ${pageSize};
              margin: ${isThermal ? "1mm" : "8mm"};
            }
            body {
              margin: 0;
              padding: 0;
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
              color: #000;
              background: #fff;
            }
            .grid-container {
              display: ${isThermal ? "block" : "grid"};
              ${!isThermal ? `grid-template-columns: ${labelFormat === "a4-24" ? "repeat(3, 1fr)" : "repeat(4, 1fr)"}; gap: 4mm;` : ""}
            }
            .barcode-card {
              box-sizing: border-box;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              text-align: center;
              padding: 2mm;
              ${isThermal ? "page-break-after: always; height: 100vh;" : "border: 1px dashed #cbd5e1; border-radius: 4px; padding: 4mm;"}
            }
            .store-name {
              font-size: 8px;
              font-weight: 700;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              color: #475569;
              margin-bottom: 1px;
            }
            .item-name {
              font-size: 10px;
              font-weight: 700;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
              max-width: 100%;
            }
            .variant-info {
              font-size: 8px;
              color: #2563eb;
              font-weight: 600;
            }
            .svg-container svg {
              max-width: 100%;
              height: auto;
            }
            .price-tag {
              font-size: 11px;
              font-weight: 800;
              margin-top: 1px;
            }
          </style>
        </head>
        <body>
          <div class="grid-container">
            ${labelsHtml}
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleDownloadSVG = () => {
    if (!barcodeRef.current) return;
    const svgData = new XMLSerializer().serializeToString(barcodeRef.current);
    const blob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `barcode-${barcodeValue}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Generate Barcode & Print Labels" maxWidth="2xl">
      <div className="p-6 space-y-6">
        {/* Top Product Summary */}
        <div className="flex items-center justify-between p-3.5 bg-slate-950 rounded-xl border border-slate-800">
          <div>
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Tag className="w-4 h-4 text-blue-400" />
              {product.name}
            </h4>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Base SKU: {product.sku || "N/A"} | Price: LKR {Number(product.price).toLocaleString()}
            </p>
          </div>
          {hasVariants && (
            <Badge variant="primary" size="sm">
              {product.variants?.length} Variants
            </Badge>
          )}
        </div>

        {/* 2-Column Grid: Preview Left, Controls Right */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left: Barcode Live Sticker Preview */}
          <div className="flex flex-col items-center justify-center p-6 bg-slate-950 rounded-2xl border border-slate-800 min-h-[220px]">
            <div className="w-full max-w-[280px] bg-white text-slate-900 rounded-xl p-4 shadow-xl border border-slate-200 flex flex-col items-center text-center">
              {showStoreName && (
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">
                  {storeName}
                </p>
              )}
              {showTitle && (
                <p className="text-xs font-bold text-slate-900 truncate max-w-[240px]">
                  {product.name}
                </p>
              )}
              {showVariant && variantLabel && (
                <p className="text-[10px] font-semibold text-blue-600 mb-1">{variantLabel}</p>
              )}

              <div className="py-2 flex justify-center w-full overflow-hidden">
                <svg ref={barcodeRef} className="max-w-full" />
              </div>

              {showPrice && (
                <p className="text-sm font-extrabold text-slate-900 mt-1">
                  LKR {currentPrice.toLocaleString("en-LK", { minimumFractionDigits: 2 })}
                </p>
              )}
            </div>

            <p className="text-[11px] text-slate-500 mt-3 font-mono">
              Value: <span className="text-slate-300 font-semibold">{barcodeValue}</span>
            </p>
          </div>

          {/* Right: Print & Label Options */}
          <div className="space-y-4">
            {/* Variant Selector */}
            {hasVariants && (
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-blue-400" />
                  Select Target (Main or Variant)
                </label>
                <select
                  value={selectedVariantId}
                  onChange={(e) => setSelectedVariantId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="main">Main Product ({product.sku || "Base"})</option>
                  {product.variants?.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name} {v.value ? `(${v.value})` : ""} - SKU: {v.sku}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Label Format */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5 flex items-center gap-1.5">
                <Settings2 className="w-3.5 h-3.5 text-blue-400" />
                Printer & Label Format
              </label>
              <select
                value={labelFormat}
                onChange={(e) => setLabelFormat(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
              >
                <option value="thermal-50x25">Thermal Roll (50mm x 25mm Standard)</option>
                <option value="thermal-40x30">Thermal Roll (40mm x 30mm Large)</option>
                <option value="a4-24">A4 Sticker Sheet (24 Labels - 3x8)</option>
                <option value="a4-40">A4 Sticker Sheet (40 Labels - 4x10)</option>
              </select>
            </div>

            {/* Print Quantity */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                Print Quantity (Copies)
              </label>
              <input
                type="number"
                min="1"
                max="500"
                value={printCount}
                onChange={(e) => setPrintCount(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>

            {/* Toggles */}
            <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
              <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showStoreName}
                  onChange={(e) => setShowStoreName(e.target.checked)}
                  className="rounded border-slate-800 bg-slate-950 text-blue-600 focus:ring-0"
                />
                Store Name
              </label>
              <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showTitle}
                  onChange={(e) => setShowTitle(e.target.checked)}
                  className="rounded border-slate-800 bg-slate-950 text-blue-600 focus:ring-0"
                />
                Product Name
              </label>
              <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showPrice}
                  onChange={(e) => setShowPrice(e.target.checked)}
                  className="rounded border-slate-800 bg-slate-950 text-blue-600 focus:ring-0"
                />
                Price Tag
              </label>
              <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showVariant}
                  onChange={(e) => setShowVariant(e.target.checked)}
                  className="rounded border-slate-800 bg-slate-950 text-blue-600 focus:ring-0"
                />
                Variant Title
              </label>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-800">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadSVG}
            leftIcon={<Download className="w-4 h-4" />}
          >
            Download SVG
          </Button>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handlePrint}
              leftIcon={<Printer className="w-4 h-4" />}
            >
              Print {printCount} {printCount === 1 ? "Label" : "Labels"}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

