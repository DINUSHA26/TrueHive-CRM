"use client";

import { useEffect, useRef } from "react";

/**
 * Global Hardware USB / Bluetooth Barcode Scanner Hook
 * Detects rapid keystrokes (< 45ms between characters) followed by Enter,
 * allowing cashiers & warehouse staff to scan barcodes without clicking an input field.
 */
export function useHardwareBarcodeScanner(onScan: (barcode: string) => void, enabled = true) {
  const bufferRef = useRef<string>("");
  const lastKeyTimeRef = useRef<number>(0);

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInputFocused =
        target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable);

      // Ignore if typing normally inside a text field unless it's a rapid burst
      const now = Date.now();
      const delta = now - lastKeyTimeRef.current;

      if (e.key === "Enter") {
        if (bufferRef.current.length >= 4 && delta < 120) {
          e.preventDefault();
          const scanned = bufferRef.current.trim();
          bufferRef.current = "";
          onScan(scanned);
        } else {
          bufferRef.current = "";
        }
        return;
      }

      if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
        if (delta > 100 && isInputFocused) {
          bufferRef.current = "";
          return;
        }
        if (delta > 150) {
          bufferRef.current = e.key;
        } else {
          bufferRef.current += e.key;
        }
        lastKeyTimeRef.current = now;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onScan, enabled]);
}
