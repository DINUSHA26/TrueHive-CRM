"use client";

import React, { useEffect, useRef, useState } from "react";
import { Camera, X, ScanBarcode } from "lucide-react";
import type { ProductItem } from "@/lib/store";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onDetected: (barcode: string) => void;
  products: ProductItem[];
}

export function CameraBarcodeScannerModal({ isOpen, onClose, onDetected, products }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [cameraError, setCameraError] = useState<string>("");

  useEffect(() => {
    if (!isOpen) return;
    let stream: MediaStream | null = null;
    let intervalId: ReturnType<typeof setInterval> | null = null;

    async function startCamera() {
      try {
        setCameraError("");
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        // Use native BarcodeDetector API if available in Chrome/Edge
        const Win = window as unknown as {
          BarcodeDetector?: new (opts: { formats: string[] }) => {
            detect: (video: HTMLVideoElement) => Promise<{ rawValue: string }[]>;
          };
        };

        if (Win.BarcodeDetector) {
          const detector = new Win.BarcodeDetector({
            formats: ["code_128", "ean_13", "qr_code"],
          });
          intervalId = setInterval(async () => {
            if (videoRef.current && videoRef.current.readyState === 4) {
              try {
                const barcodes = await detector.detect(videoRef.current);
                if (barcodes.length > 0 && barcodes[0].rawValue) {
                  onDetected(barcodes[0].rawValue);
                  onClose();
                }
              } catch {
                // Ignore frame error
              }
            }
          }, 350);
        }
      } catch {
        setCameraError(
          "Camera permission not granted or no webcam detected. Use Quick-Scan Simulation below:"
        );
      }
    }

    startCamera();

    return () => {
      if (intervalId) clearInterval(intervalId);
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
    };
  }, [isOpen, onClose, onDetected]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#111827] border border-slate-700 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2 text-sm font-bold text-white">
            <Camera className="w-4 h-4 text-emerald-400" />
            Live Camera Barcode Scanner
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="relative bg-slate-950 rounded-xl overflow-hidden aspect-video border border-emerald-500/40 flex items-center justify-center">
          <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
          <div className="absolute inset-x-8 top-1/2 -translate-y-1/2 h-0.5 bg-emerald-400 shadow-[0_0_12px_#10b981] animate-pulse" />
        </div>

        {cameraError && (
          <p className="text-[11px] text-amber-300 bg-amber-500/10 border border-amber-500/30 p-2.5 rounded-lg">
            {cameraError}
          </p>
        )}

        <div className="space-y-2">
          <p className="text-[11px] text-slate-400 font-semibold">
            Quick-Tap Barcode Detection (Instant Camera Trigger):
          </p>
          <div className="grid grid-cols-1 gap-1.5 max-h-40 overflow-y-auto">
            {products.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  onDetected(p.barcode);
                  onClose();
                }}
                className="px-3 py-2 rounded-lg bg-slate-900 hover:bg-emerald-500/20 border border-slate-800 hover:border-emerald-500/40 text-left text-xs flex items-center justify-between transition"
              >
                <span className="text-white font-semibold truncate">{p.name}</span>
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
