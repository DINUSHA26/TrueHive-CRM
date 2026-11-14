"use client";

import React, { useEffect, useRef } from "react";
import JsBarcode from "jsbarcode";

interface BarcodeDisplayProps {
  value: string;
  height?: number;
  width?: number;
  fontSize?: number;
  label?: string;
  priceLkr?: number;
}

export function BarcodeDisplay({
  value,
  height = 42,
  width = 1.6,
  fontSize = 12,
  label,
  priceLkr,
}: BarcodeDisplayProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (svgRef.current && value) {
      try {
        JsBarcode(svgRef.current, value, {
          format: "CODE128",
          lineColor: "#0f172a",
          width,
          height,
          displayValue: true,
          fontSize,
          margin: 4,
          background: "#ffffff",
        });
      } catch (err) {
        console.error("Barcode render error:", err);
      }
    }
  }, [value, height, width, fontSize]);

  return (
    <div className="inline-flex flex-col items-center bg-white px-3 py-2 rounded-lg border border-slate-200 text-slate-900">
      {label && <span className="text-[11px] font-semibold truncate max-w-[180px]">{label}</span>}
      <svg ref={svgRef} className="max-w-full" />
      {priceLkr !== undefined && (
        <span className="text-xs font-bold text-slate-900 mt-0.5">LKR {priceLkr.toLocaleString()}</span>
      )}
    </div>
  );
}
