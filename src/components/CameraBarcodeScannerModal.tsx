"use client";

import React, { useEffect, useRef, useState } from "react";
import { Camera, X, ScanBarcode, Check, AlertCircle } from "lucide-react";
import { BrowserMultiFormatReader } from "@zxing/library";
import type { ProductItem } from "@/lib/store";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onDetected: (barcode: string) => void;
  products: ProductItem[];
}

export function CameraBarcodeScannerModal({ isOpen, onClose, onDetected, products }: Props) {
  useBodyScrollLock(isOpen);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const [manualInput, setManualInput] = useState<string>("");
  const [cameraError, setCameraError] = useState<string>("");
  const [detectedFeedback, setDetectedFeedback] = useState<string>("");

  // Play a friendly POS beep sound on scan
  const playBeep = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(1760, ctx.currentTime);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } catch {}
  };

  const handleBarcodeFound = (barcode: string) => {
    if (!barcode) return;
    playBeep();
    setDetectedFeedback(barcode);
    setTimeout(() => {
      onDetected(barcode.trim());
      onClose();
    }, 350);
  };

  useEffect(() => {
    if (!isOpen) return;

    let codeReader: BrowserMultiFormatReader | null = null;
    let isSubscribed = true;

    async function initScanner() {
      try {
        setCameraError("");
        setDetectedFeedback("");
        codeReader = new BrowserMultiFormatReader();
        readerRef.current = codeReader;

        if (videoRef.current) {
          await codeReader.decodeFromVideoDevice(
            null,
            videoRef.current,
            (result) => {
              if (!isSubscribed) return;
              if (result) {
                const text = result.getText();
                if (text) {
                  isSubscribed = false;
                  if (codeReader) codeReader.reset();
                  handleBarcodeFound(text);
                }
              }
            }
          );
        }
      } catch (err: any) {
        console.warn("Camera init error:", err);
        setCameraError(
          "Camera access unavailable or blocked. You can type/scan with USB Barcode Scanner or select below:"
        );
      }
    }

    initScanner();

    return () => {
      isSubscribed = false;
      if (codeReader) {
        try {
          codeReader.reset();
        } catch {}
      }
      if (readerRef.current) {
        try {
          readerRef.current.reset();
        } catch {}
      }
    };
  }, [isOpen]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualInput.trim()) return;
    handleBarcodeFound(manualInput.trim());
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 overscroll-contain">
      <div className="bg-[#111827] border border-slate-700 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl overscroll-contain">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2 text-sm font-bold text-white">
            <Camera className="w-4 h-4 text-emerald-400" />
            Live Camera & Laser Barcode Scanner
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Camera Viewfinder */}
        <div className="relative bg-slate-950 rounded-xl overflow-hidden aspect-video border-2 border-emerald-500/50 flex items-center justify-center">
          <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
          
          {/* Animated Laser Scan Line */}
          <div className="absolute inset-x-6 top-1/2 -translate-y-1/2 h-0.5 bg-emerald-400 shadow-[0_0_15px_#10b981] animate-pulse" />

          {/* Corner Target Markers */}
          <div className="absolute top-3 left-3 w-4 h-4 border-t-2 border-l-2 border-emerald-400" />
          <div className="absolute top-3 right-3 w-4 h-4 border-t-2 border-r-2 border-emerald-400" />
          <div className="absolute bottom-3 left-3 w-4 h-4 border-b-2 border-l-2 border-emerald-400" />
          <div className="absolute bottom-3 right-3 w-4 h-4 border-b-2 border-r-2 border-emerald-400" />

          {/* Scan Success Overlay */}
          {detectedFeedback && (
            <div className="absolute inset-0 bg-emerald-500/30 backdrop-blur-xs flex items-center justify-center text-white font-mono font-bold text-sm gap-2">
              <Check className="w-5 h-5 text-emerald-300" /> Detected: {detectedFeedback}
            </div>
          )}
        </div>

        {cameraError && (
          <p className="text-[11px] text-amber-300 bg-amber-500/10 border border-amber-500/30 p-2.5 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            {cameraError}
          </p>
        )}

        {/* Manual Barcode / USB Gun Input */}
        <form onSubmit={handleManualSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <ScanBarcode className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              autoFocus
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              placeholder="Scan or type barcode (e.g. 479202600101)..."
              className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>
          <button
            type="submit"
            disabled={!manualInput.trim()}
            className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition flex items-center gap-1"
          >
            Scan
          </button>
        </form>

        {/* Quick-Tap Simulation List */}
        <div className="space-y-1.5 pt-1">
          <p className="text-[11px] text-slate-400 font-semibold">
            Quick-Select Registered Barcode:
          </p>
          <div className="grid grid-cols-1 gap-1.5 max-h-36 overflow-y-auto">
            {products.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => handleBarcodeFound(p.barcode)}
                className="px-3 py-2 rounded-lg bg-slate-900 hover:bg-emerald-500/20 border border-slate-800 hover:border-emerald-500/40 text-left text-xs flex items-center justify-between transition"
              >
                <span className="text-white font-semibold truncate max-w-[220px]">{p.name}</span>
                <span className="font-mono text-[11px] text-emerald-400 flex items-center gap-1">
                  <ScanBarcode className="w-3.5 h-3.5" /> {p.barcode}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
