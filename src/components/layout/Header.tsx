"use client";

import React, { useState, useEffect } from "react";
import {
  Menu,
  Sun,
  Moon,
  RefreshCw,
  Bell,
  ShoppingCart,
  Calendar,
  Clock,
  CheckCircle2,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useTheme } from "@/components/ThemeProvider";
import type { NavKey } from "./Sidebar";

interface HeaderProps {
  activeNav: NavKey;
  onOpenMobile: () => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  onQuickPos?: () => void;
  lowStockCount?: number;
  unreadChatsCount?: number;
  onLogout?: () => void;
}

const NAV_TITLES: Record<NavKey, { category: string; title: string }> = {
  OVERVIEW: { category: "GENERAL", title: "Overview & Analytics" },
  WHATSAPP_CHAT: { category: "CUSTOMER ENGAGEMENT", title: "WhatsApp AI & Live Chat" },
  CRM: { category: "CUSTOMER ENGAGEMENT", title: "Customer Relationship Management" },
  CUSTOMER_CREDIT: { category: "CUSTOMER ENGAGEMENT", title: "Customer Credit Bills (AR)" },
  LEADS: { category: "CUSTOMER ENGAGEMENT", title: "Leads & Appointments Pipeline" },
  ANNOUNCEMENTS: { category: "CUSTOMER ENGAGEMENT", title: "Announcements & Broadcasts" },
  POS_PANEL: { category: "SALES & OPERATIONS", title: "Point of Sale (POS) Terminal" },
  PRODUCT_INVENTORY: { category: "SALES & OPERATIONS", title: "Product Inventory & BOM" },
  ORDER_MANAGEMENT: { category: "SALES & OPERATIONS", title: "Order Management & Tracking" },
  QUOTATIONS: { category: "SALES & OPERATIONS", title: "Quotations & Invoice Estimations" },
  SUPPLIER_MANAGEMENT: { category: "SALES & OPERATIONS", title: "Suppliers, PO & GRN" },
  SUPPLIER_LEDGER: { category: "SALES & OPERATIONS", title: "Supplier Ledger & Purchases (AP)" },
  CASH_FLOW: { category: "FINANCE & ANALYTICS", title: "Cash Flow & Financial Ledger" },
  REPORTS: { category: "FINANCE & ANALYTICS", title: "Executive Reports & Google Docs" },
  SETTINGS: { category: "ADMINISTRATION", title: "System Settings & RBAC Roles" },
};

export function Header({
  activeNav,
  onOpenMobile,
  onRefresh,
  isRefreshing = false,
  onQuickPos,
  lowStockCount = 0,
  unreadChatsCount = 0,
  onLogout,
}: HeaderProps) {
  const { theme, toggleTheme } = useTheme();
  const [timeString, setTimeString] = useState<string>("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeString(
        now.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const meta = NAV_TITLES[activeNav] || { category: "MANAGEMENT", title: "Dashboard" };

  return (
    <header className="h-16 px-4 lg:px-6 bg-[#0a1120]/95 backdrop-blur-md border-b border-slate-800/80 flex items-center justify-between shrink-0 sticky top-0 z-30 no-print">
      {/* Left: Mobile Menu Toggle + Breadcrumb */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobile}
          aria-label="Open navigation menu"
          className="lg:hidden p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="hidden sm:block">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-semibold tracking-wider uppercase text-blue-400">
              {meta.category}
            </span>
            <span className="text-slate-600 hidden sm:inline">•</span>
            <span className="text-xs text-slate-400 hidden sm:inline">TrueHive ERP</span>
          </div>
          <h2 className="text-sm lg:text-base font-bold text-white tracking-tight leading-tight">
            {meta.title}
          </h2>
        </div>
      </div>

      {/* Right: Real-time Status & Quick Actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Dark Mode / Light Mode Switcher (Replacing Supabase Live) */}
        <button
          type="button"
          onClick={toggleTheme}
          title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
          aria-label="Toggle dark/light theme"
          className={`theme-toggle-btn p-2 rounded-xl border transition-all duration-200 hover:scale-105 active:scale-95 flex items-center justify-center shrink-0 ${
            theme === "dark"
              ? "bg-[#182133] hover:bg-[#1e293b] border-slate-700/80 text-amber-400 shadow-sm"
              : "!bg-white hover:!bg-slate-100 !border-slate-200 !text-slate-800 shadow-sm"
          }`}
        >
          {theme === "dark" ? (
            <Sun className="w-4 h-4 text-amber-400 fill-amber-400/20 hover:rotate-45 transition-transform duration-300" />
          ) : (
            <Moon className="w-4 h-4 !text-slate-800 !fill-slate-800/10 hover:-rotate-12 transition-transform duration-300" />
          )}
        </button>

        {/* Live Clock */}
        {timeString && (
          <div className="hidden xl:flex items-center gap-1.5 text-xs text-slate-400 px-2.5 py-1 rounded-lg bg-slate-900/60 border border-slate-800/60">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-mono">{timeString}</span>
          </div>
        )}

        {/* Quick POS Sale Button */}
        {onQuickPos && (
          <Button
            variant="primary"
            size="sm"
            onClick={onQuickPos}
            leftIcon={<ShoppingCart className="w-3.5 h-3.5" />}
            className="inline-flex font-semibold shadow-md shadow-blue-600/30"
          >
            New Sale
          </Button>
        )}

        {/* Refresh Data Button */}
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            title="Refresh live data from Supabase"
            aria-label="Refresh data"
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800/80 transition"
          >
            <RefreshCw
              className={`w-4 h-4 ${isRefreshing ? "animate-spin text-blue-400" : ""}`}
            />
          </button>
        )}

        {/* Alerts / Notifications Pill */}
        {(lowStockCount > 0 || unreadChatsCount > 0) && (
          <div className="flex items-center gap-1 px-2 py-1 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold">
            <Bell className="w-3.5 h-3.5" />
            <span>{lowStockCount + unreadChatsCount}</span>
          </div>
        )}

        {/* Sign Out Action */}
        {onLogout && (
          <button
            onClick={onLogout}
            title="Sign out of portal"
            aria-label="Logout"
            className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-800 border border-slate-800/80 transition flex items-center gap-1.5 text-xs font-medium"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden md:inline">Sign Out</span>
          </button>
        )}
      </div>
    </header>
  );
}

