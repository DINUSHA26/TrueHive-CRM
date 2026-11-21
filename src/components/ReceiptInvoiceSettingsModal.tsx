"use client";

import React, { useState, useEffect } from "react";
import {
  Printer,
  Sliders,
  Barcode,
  QrCode,
  Building2,
  FileText,
  Check,
  Save,
  RotateCcw,
  Sparkles,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";

export interface ReceiptSettings {
  paperWidth: "80mm" | "58mm" | "A4";
  fontSize: "normal" | "compact";
  showBarcode: boolean;
  barcodeHeight: "small" | "medium" | "large";
  showQrCode: boolean;
  businessName: string;
  subHeader: string;
  address: string;
  phone: string;
  vatNumber: string;
  footerNote: string;
  returnPolicy: string;
  showCashier: boolean;
  showSku: boolean;
  showDiscounts: boolean;
}

export const DEFAULT_RECEIPT_SETTINGS: ReceiptSettings = {
  paperWidth: "80mm",
  fontSize: "normal",
  showBarcode: true,
  barcodeHeight: "medium",
  showQrCode: true,
  businessName: "TrueHive",
  subHeader: "Quality Retail & Wellness Hub",
  address: "Bandaranayake Mawatha, Colombo",
  phone: "+94 76 573 1249",
  vatNumber: "",
  footerNote: "Thank you! Come again! / ස්තූතියි නැවත එන්න!",
  returnPolicy: "Items can be exchanged within 7 days with this bill.",
  showCashier: true,
  showSku: true,
  showDiscounts: true,
};

export function getReceiptSettings(): ReceiptSettings {
  if (typeof window === "undefined") return DEFAULT_RECEIPT_SETTINGS;
  try {
    const saved = localStorage.getItem("truehive_receipt_settings");
    if (saved) {
      return { ...DEFAULT_RECEIPT_SETTINGS, ...JSON.parse(saved) };
    }
  } catch {}
  return DEFAULT_RECEIPT_SETTINGS;
}

export function saveReceiptSettings(settings: ReceiptSettings): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("truehive_receipt_settings", JSON.stringify(settings));
    // Optional background sync with backend settings
    fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ receiptSettings: settings }),
    }).catch(() => null);
  } catch {}
}

interface ReceiptInvoiceSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSettingsSaved?: (newSettings: ReceiptSettings) => void;
}

export function ReceiptInvoiceSettingsModal({
  isOpen,
  onClose,
  onSettingsSaved,
}: ReceiptInvoiceSettingsModalProps) {
  const [settings, setSettings] = useState<ReceiptSettings>(DEFAULT_RECEIPT_SETTINGS);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSettings(getReceiptSettings());
      setSavedSuccess(false);
    }
  }, [isOpen]);

  const handleSave = () => {
    saveReceiptSettings(settings);
    setSavedSuccess(true);
    if (onSettingsSaved) onSettingsSaved(settings);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 800);
  };

  const handleReset = () => {
    if (confirm("Reset receipt & invoice settings to default?")) {
      setSettings(DEFAULT_RECEIPT_SETTINGS);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Receipt & Invoice Customization" maxWidth="2xl">
      <div className="space-y-6 max-h-[75vh] overflow-y-auto pr-1 text-xs">
        {/* Banner */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-blue-950/60 to-indigo-950/60 border border-blue-800/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-600/20 text-blue-400">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">POS Bill & Invoice Formats</h4>
              <p className="text-[11px] text-slate-400">
                Configure thermal receipt paper size, barcode height, headers, and exchange policies.
              </p>
            </div>
          </div>
          <button
            onClick={handleReset}
            className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 transition"
          >
            <RotateCcw className="w-3 h-3" /> Reset
          </button>
        </div>

        {/* 1. Paper Width & Sizing */}
        <div className="space-y-3">
          <h5 className="font-bold text-white uppercase tracking-wider text-[11px] flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-blue-400" /> Paper Size & Typography
          </h5>
          <div className="grid grid-cols-3 gap-2.5">
            {[
              { id: "80mm", title: "80mm Thermal", desc: "Standard POS Cashier Roll" },
              { id: "58mm", title: "58mm Thermal", desc: "Compact Mini Roll" },
              { id: "A4", title: "A4 Sheet", desc: "Full Tax Invoice Standard" },
            ].map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setSettings({ ...settings, paperWidth: p.id as any })}
                className={`p-3 rounded-xl border text-left transition ${
                  settings.paperWidth === p.id
                    ? "border-blue-500 bg-blue-950/30 text-white"
                    : "border-slate-800 bg-slate-900/50 text-slate-400 hover:text-white"
                }`}
              >
                <div className="font-bold text-xs">{p.title}</div>
                <div className="text-[10px] text-slate-500">{p.desc}</div>
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800 mt-2">
            <div>
              <span className="font-semibold text-white block">Compact Font Mode</span>
              <span className="text-[11px] text-slate-400">Reduces receipt length to save thermal paper</span>
            </div>
            <button
              type="button"
              onClick={() =>
                setSettings({
                  ...settings,
                  fontSize: settings.fontSize === "compact" ? "normal" : "compact",
                })
              }
              className={`w-11 h-6 rounded-full transition-colors flex items-center p-0.5 ${
                settings.fontSize === "compact" ? "bg-blue-600 justify-end" : "bg-slate-700 justify-start"
              }`}
            >
              <span className="w-5 h-5 rounded-full bg-white shadow-md" />
            </button>
          </div>
        </div>

        {/* 2. Barcode & QR Display */}
        <div className="space-y-3">
          <h5 className="font-bold text-white uppercase tracking-wider text-[11px] flex items-center gap-1.5">
            <Barcode className="w-3.5 h-3.5 text-emerald-400" /> Barcode & QR Code Options
          </h5>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Show Barcode Toggle */}
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-semibold text-white block">Print Code128 Barcode</span>
                  <span className="text-[10px] text-slate-400">Scannable invoice barcode on bottom</span>
                </div>
                <button
                  type="button"
                  onClick={() => setSettings({ ...settings, showBarcode: !settings.showBarcode })}
                  className={`w-10 h-5 rounded-full transition-colors flex items-center p-0.5 ${
                    settings.showBarcode ? "bg-emerald-600 justify-end" : "bg-slate-700 justify-start"
                  }`}
                >
                  <span className="w-4 h-4 rounded-full bg-white shadow-md" />
                </button>
              </div>

              {settings.showBarcode && (
                <div className="pt-2 border-t border-slate-800/80">
                  <span className="text-[10px] text-slate-400 block mb-1">Barcode Height:</span>
                  <div className="grid grid-cols-3 gap-1.5">
                    {(["small", "medium", "large"] as const).map((h) => (
                      <button
                        key={h}
                        type="button"
                        onClick={() => setSettings({ ...settings, barcodeHeight: h })}
                        className={`py-1 rounded-lg text-[10px] font-semibold capitalize border ${
                          settings.barcodeHeight === h
                            ? "border-emerald-500 bg-emerald-950/40 text-emerald-300"
                            : "border-slate-800 bg-slate-950 text-slate-400"
                        }`}
                      >
                        {h}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Show QR Code Toggle */}
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="font-semibold text-white block flex items-center gap-1">
                  <QrCode className="w-3.5 h-3.5 text-blue-400" /> Verify QR Code
                </span>
                <span className="text-[10px] text-slate-400">Print digital verification QR at receipt bottom</span>
              </div>
              <button
                type="button"
                onClick={() => setSettings({ ...settings, showQrCode: !settings.showQrCode })}
                className={`w-10 h-5 rounded-full transition-colors flex items-center p-0.5 ${
                  settings.showQrCode ? "bg-blue-600 justify-end" : "bg-slate-700 justify-start"
                }`}
              >
                <span className="w-4 h-4 rounded-full bg-white shadow-md" />
              </button>
            </div>
          </div>
        </div>

        {/* 3. Header & Store Branding */}
        <div className="space-y-3">
          <h5 className="font-bold text-white uppercase tracking-wider text-[11px] flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-amber-400" /> Header & Store Branding
          </h5>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">Store / Business Name</label>
              <input
                type="text"
                value={settings.businessName}
                onChange={(e) => setSettings({ ...settings, businessName: e.target.value })}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs focus:border-blue-500 outline-none"
                placeholder="TrueHive"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">Sub-Header / Branch</label>
              <input
                type="text"
                value={settings.subHeader}
                onChange={(e) => setSettings({ ...settings, subHeader: e.target.value })}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs focus:border-blue-500 outline-none"
                placeholder="Main Flagship Branch"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">Address</label>
              <input
                type="text"
                value={settings.address}
                onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs focus:border-blue-500 outline-none"
                placeholder="123 Galle Road, Colombo"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">Contact Phone / Hotline</label>
              <input
                type="text"
                value={settings.phone}
                onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs focus:border-blue-500 outline-none"
                placeholder="+94 77 000 0000"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">Tax / VAT Registration No. (Optional)</label>
              <input
                type="text"
                value={settings.vatNumber}
                onChange={(e) => setSettings({ ...settings, vatNumber: e.target.value })}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs focus:border-blue-500 outline-none"
                placeholder="VAT-1029384756"
              />
            </div>
          </div>
        </div>

        {/* 4. Footer Messages & Policy */}
        <div className="space-y-3">
          <h5 className="font-bold text-white uppercase tracking-wider text-[11px] flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-purple-400" /> Receipt Footer & Exchange Policy
          </h5>
          <div className="space-y-3">
            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">Greeting / Footer Message</label>
              <input
                type="text"
                value={settings.footerNote}
                onChange={(e) => setSettings({ ...settings, footerNote: e.target.value })}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs focus:border-blue-500 outline-none"
                placeholder="Thank you! Come again!"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">Return / Exchange Policy Text</label>
              <textarea
                rows={2}
                value={settings.returnPolicy}
                onChange={(e) => setSettings({ ...settings, returnPolicy: e.target.value })}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs focus:border-blue-500 outline-none resize-none"
                placeholder="Items once sold can be exchanged within 7 days..."
              />
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-800">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSave}
            leftIcon={savedSuccess ? <Check className="w-3.5 h-3.5 text-white" /> : <Save className="w-3.5 h-3.5" />}
            className={savedSuccess ? "bg-emerald-600 hover:bg-emerald-500" : ""}
          >
            {savedSuccess ? "Saved Successfully!" : "Save Receipt Settings"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
