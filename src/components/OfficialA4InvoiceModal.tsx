"use client";

import React, { useRef } from "react";
import { BarcodeDisplay } from "@/components/BarcodeDisplay";
import { Download, Printer, X, FileText } from "lucide-react";
import type { OrderRecord } from "@/lib/store";

interface Props {
  order: OrderRecord | null;
  onClose: () => void;
}

export function OfficialA4InvoiceModal({ order, onClose }: Props) {
  const invoiceRef = useRef<HTMLDivElement | null>(null);

  if (!order) return null;

  const handleDownloadPdf = async () => {
    if (!invoiceRef.current) return;
    try {
      const html2pdfModule = (await import("html2pdf.js")).default;
      html2pdfModule()
        .set({
          margin: 10,
          filename: `TrueHive-Invoice-${order.orderNumber.replace("#", "")}.pdf`,
          image: { type: "jpeg", quality: 0.98 },
          html2canvas: { scale: 2 },
          jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
        })
        .from(invoiceRef.current)
        .save();
    } catch {
      window.print();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-3xl w-full p-5 space-y-4 shadow-2xl my-8">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3 no-print">
          <div className="flex items-center gap-2 text-sm font-bold text-white">
            <FileText className="w-4 h-4 text-emerald-400" />
            Official A4 Tax & Commercial Invoice ({order.orderNumber})
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPdf}
              className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" /> Download A4 PDF (html2pdf)
            </button>
            <button
              onClick={() => window.print()}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" /> Print A4
            </button>
            <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable A4 Sheet */}
        <div
          ref={invoiceRef}
          className="bg-white text-slate-900 p-8 rounded-xl space-y-6 shadow-inner"
        >
          <div className="flex justify-between items-start border-b-2 border-slate-900 pb-5">
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900">
                TRUEHIVE ENTERPRISE (PVT) LTD
              </h1>
              <p className="text-xs text-slate-600 mt-1">
                No. 142, Union Place, Colombo 02, Sri Lanka • Hotline: +94 78 163 0865
              </p>
              <p className="text-xs text-slate-600">
                Email: orders@truehive.lk • Web: www.truehive.lk
              </p>
            </div>
            <div className="text-right">
              <span className="px-3 py-1 rounded bg-slate-900 text-white font-extrabold text-xs uppercase">
                OFFICIAL INVOICE
              </span>
              <p className="text-lg font-black text-slate-900 mt-2">{order.orderNumber}</p>
              <p className="text-xs text-slate-500">Time: {order.createdAt}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 text-xs">
            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
              <p className="font-bold text-slate-500 uppercase text-[10px]">Billed To Customer:</p>
              <p className="text-sm font-bold text-slate-900">{order.customerName}</p>
              <p className="text-slate-700">Phone / WhatsApp: {order.customerPhone}</p>
              <p className="text-slate-700">Delivery Address: {order.shippingAddress}</p>
            </div>
            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1 text-right">
              <p className="font-bold text-slate-500 uppercase text-[10px]">Payment & Channel:</p>
              <p className="text-slate-800">
                Order Source: <strong>{order.source}</strong>
              </p>
              <p className="text-slate-800">
                Payment Method: <strong>{order.paymentMethod}</strong>
              </p>
              <p className="text-slate-800">
                Payment Status: <strong>{order.paymentStatus}</strong>
              </p>
            </div>
          </div>

          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white">
                <th className="py-2.5 px-3 rounded-tl-lg">#</th>
                <th className="py-2.5 px-3">Item Description</th>
                <th className="py-2.5 px-3">SKU / Barcode</th>
                <th className="py-2.5 px-3 text-center">Qty</th>
                <th className="py-2.5 px-3 text-right">Unit Price (LKR)</th>
                <th className="py-2.5 px-3 text-right rounded-tr-lg">Line Total (LKR)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 border-b border-slate-300">
              {order.items.map((item, idx) => (
                <tr key={idx}>
                  <td className="py-3 px-3 font-semibold">{idx + 1}</td>
                  <td className="py-3 px-3 font-bold text-slate-900">{item.productName}</td>
                  <td className="py-3 px-3 font-mono text-slate-600">
                    {item.sku} ({item.barcode})
                  </td>
                  <td className="py-3 px-3 text-center font-bold">{item.quantity}</td>
                  <td className="py-3 px-3 text-right">{item.unitPrice.toLocaleString()}</td>
                  <td className="py-3 px-3 text-right font-extrabold">
                    {item.totalPrice.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex flex-wrap items-center justify-between gap-6 pt-2">
            <div>
              <BarcodeDisplay value={order.barcode} height={38} width={1.5} />
            </div>

            <div className="w-64 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span>LKR {order.subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Discount:</span>
                <span>- LKR {order.discountAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-base font-black text-slate-900 border-t-2 border-slate-900 pt-2">
                <span>Grand Total:</span>
                <span>LKR {order.totalAmount.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
