"use client";

import React, { useState, useEffect } from "react";
import { Package, Plus, Minus, AlertCircle, Save, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";

interface StockUpdateModalProps {
  product: {
    id: string;
    name: string;
    sku: string;
    currentStock: number;
    unit?: string;
  } | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function StockUpdateModal({
  product,
  isOpen,
  onClose,
  onSuccess,
}: StockUpdateModalProps) {
  const [stock, setStock] = useState<number>(0);
  const [reason, setReason] = useState("Manual stock update");
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (product && isOpen) {
      setStock(product.currentStock || 0);
      setReason("Inventory cycle count adjustment");
      setErrorMsg("");
    }
  }, [product, isOpen]);

  if (!product) return null;

  const delta = stock - (product.currentStock || 0);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/products", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: product.id,
          newStock: stock,
          reason,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to update stock");
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to save stock update");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Quick Stock Adjustment"
      description="Update inventory quantity with live Redis and PostgreSQL sync."
      maxWidth="md"
    >
      <form onSubmit={handleSave} className="p-6 space-y-5">
        {errorMsg && (
          <div className="p-3 bg-red-950/60 border border-red-800 rounded-xl text-xs text-red-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            {errorMsg}
          </div>
        )}

        <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800">
          <p className="text-sm font-bold text-white">{product.name}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-slate-400 font-mono">SKU: {product.sku}</span>
            <Badge variant="primary" size="sm">
              Current: {product.currentStock} {product.unit || "pcs"}
            </Badge>
          </div>
        </div>

        {/* Stock controls */}
        <div>
          <label className="text-xs font-semibold text-slate-300 block mb-2">
            New Stock Level ({product.unit || "pcs"})
          </label>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setStock((prev) => Math.max(0, prev - 10))}
            >
              -10
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setStock((prev) => Math.max(0, prev - 1))}
            >
              -1
            </Button>
            <input
              type="number"
              min="0"
              required
              value={stock}
              onChange={(e) => setStock(Math.max(0, parseInt(e.target.value) || 0))}
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-center text-lg font-bold text-white font-mono focus:outline-none focus:border-blue-500"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setStock((prev) => prev + 1)}
            >
              +1
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setStock((prev) => prev + 10)}
            >
              +10
            </Button>
          </div>

          <p className="text-xs text-slate-400 text-center mt-2 font-mono">
            Adjustment:{" "}
            <span
              className={`font-bold ${
                delta > 0
                  ? "text-emerald-400"
                  : delta < 0
                  ? "text-red-400"
                  : "text-slate-400"
              }`}
            >
              {delta > 0 ? `+${delta}` : delta} {product.unit || "pcs"}
            </span>
          </p>
        </div>

        {/* Reason */}
        <div>
          <label className="text-xs font-semibold text-slate-300 block mb-1">
            Adjustment Reason / Notes
          </label>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Physical inventory check, supplier restock"
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
          <Button type="button" variant="ghost" size="sm" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            disabled={saving}
            leftIcon={<Save className="w-4 h-4" />}
          >
            {saving ? "Saving..." : "Update Stock"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

