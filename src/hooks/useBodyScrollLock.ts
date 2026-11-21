"use client";

import { useEffect } from "react";

let lockCount = 0;
let originalOverflow = "";
let originalPosition = "";
let originalTop = "";
let originalWidth = "";
let originalPaddingRight = "";
let savedScrollY = 0;

/**
 * useBodyScrollLock:
 * Prevents background page scrolling while any modal or popup is open.
 * Supports nested modals via reference counting.
 * Restores exact scroll position when closed.
 */
export function useBodyScrollLock(isLocked: boolean) {
  useEffect(() => {
    if (!isLocked || typeof window === "undefined") return;

    if (lockCount === 0) {
      savedScrollY = window.scrollY;
      originalOverflow = document.body.style.overflow;
      originalPosition = document.body.style.position;
      originalTop = document.body.style.top;
      originalWidth = document.body.style.width;
      originalPaddingRight = document.body.style.paddingRight;

      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

      document.body.style.overflow = "hidden";
      document.body.style.position = "fixed";
      document.body.style.top = `-${savedScrollY}px`;
      document.body.style.width = "100%";
      if (scrollbarWidth > 0) {
        document.body.style.paddingRight = `${scrollbarWidth}px`;
      }
    }
    lockCount++;

    return () => {
      lockCount = Math.max(0, lockCount - 1);
      if (lockCount === 0) {
        document.body.style.overflow = originalOverflow;
        document.body.style.position = originalPosition;
        document.body.style.top = originalTop;
        document.body.style.width = originalWidth;
        document.body.style.paddingRight = originalPaddingRight;
        window.scrollTo(0, savedScrollY);
      }
    };
  }, [isLocked]);
}
