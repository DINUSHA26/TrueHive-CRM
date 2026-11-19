"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Menu,
  Sun,
  Moon,
  RefreshCw,
  Bell,
  ShoppingCart,
  Clock,
  LogOut,
  AlertTriangle,
  MessageSquare,
  PackageCheck,
  CreditCard,
  Users,
  CheckCheck,
  CheckCircle2,
  X,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
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
  pendingOrdersCount?: number;
  onSelectNav?: (key: NavKey) => void;
  onLogout?: () => void;
}

interface NotificationItem {
  id: string;
  type: "stock" | "chat" | "order" | "credit" | "hrm";
  title: string;
  description: string;
  badge: string;
  badgeClass: string;
  icon: React.ReactNode;
  time: string;
  href: string;
  navKey: NavKey;
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
  INVOICES: { category: "FINANCE & ANALYTICS", title: "Invoice Management & Billing Engine" },
  CASH_FLOW: { category: "FINANCE & ANALYTICS", title: "Cash Flow & Financial Ledger" },
  REPORTS: { category: "FINANCE & ANALYTICS", title: "Executive Reports & Google Docs" },
  EMPLOYEES: { category: "HUMAN RESOURCES & PAYROLL", title: "Employee Directory & Master" },
  ATTENDANCE: { category: "HUMAN RESOURCES & PAYROLL", title: "Daily Attendance & Shifts" },
  PAYROLL: { category: "HUMAN RESOURCES & PAYROLL", title: "Monthly Salary Sheet & Advances" },
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
  pendingOrdersCount = 0,
  onSelectNav,
  onLogout,
}: HeaderProps) {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const [timeString, setTimeString] = useState<string>("");
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);
  const notifRef = useRef<HTMLDivElement>(null);

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

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false);
      }
    }
    if (isNotifOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isNotifOpen]);

  // Construct active operational notifications list
  const allNotifications: NotificationItem[] = [
    ...(lowStockCount > 0
      ? [
          {
            id: "notif-low-stock",
            type: "stock" as const,
            title: "Low Inventory Alert",
            description: `${lowStockCount} product${lowStockCount > 1 ? "s are" : " is"} running below minimum safety stock levels.`,
            badge: "STOCK",
            badgeClass: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
            icon: <AlertTriangle className="w-4 h-4 text-rose-500" />,
            time: "Live ERP Sync",
            href: "/products",
            navKey: "PRODUCT_INVENTORY" as NavKey,
          },
        ]
      : []),
    ...(unreadChatsCount > 0
      ? [
          {
            id: "notif-unread-chats",
            type: "chat" as const,
            title: "Customer Inquiries",
            description: `${unreadChatsCount} unread WhatsApp message${unreadChatsCount > 1 ? "s" : ""} awaiting agent response.`,
            badge: "CHAT",
            badgeClass: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
            icon: <MessageSquare className="w-4 h-4 text-emerald-500" />,
            time: "Real-time",
            href: "/chats",
            navKey: "WHATSAPP_CHAT" as NavKey,
          },
        ]
      : []),
    ...(pendingOrdersCount > 0
      ? [
          {
            id: "notif-pending-orders",
            type: "order" as const,
            title: "Pending Order Dispatch",
            description: `${pendingOrdersCount} order${pendingOrdersCount > 1 ? "s" : ""} awaiting waybill assignment or pickup fulfillment.`,
            badge: "ORDERS",
            badgeClass: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
            icon: <PackageCheck className="w-4 h-4 text-blue-500" />,
            time: "Pending Action",
            href: "/orders",
            navKey: "ORDER_MANAGEMENT" as NavKey,
          },
        ]
      : []),
    {
      id: "notif-credit-ledger",
      type: "credit" as const,
      title: "Customer Credit (AR) Ledger",
      description: "Review outstanding customer credit accounts and record settlements.",
      badge: "CREDIT",
      badgeClass: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
      icon: <CreditCard className="w-4 h-4 text-purple-500" />,
      time: "Accounts",
      href: "/credit",
      navKey: "CUSTOMER_CREDIT" as NavKey,
    },
    {
      id: "notif-hrm-shifts",
      type: "hrm" as const,
      title: "Daily Attendance Tracking",
      description: "Employee check-ins and daily shift records are active for today.",
      badge: "HRM",
      badgeClass: "bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20",
      icon: <Users className="w-4 h-4 text-teal-500" />,
      time: "Today",
      href: "/attendance",
      navKey: "ATTENDANCE" as NavKey,
    },
  ];

  const activeNotifications = allNotifications.filter((n) => !dismissedIds.includes(n.id));
  const unreadCount = activeNotifications.length;

  const handleNotificationClick = (item: NotificationItem) => {
    setIsNotifOpen(false);
    if (!dismissedIds.includes(item.id)) {
      setDismissedIds((prev) => [...prev, item.id]);
    }
    if (onSelectNav) {
      onSelectNav(item.navKey);
    }
    router.push(item.href);
  };

  const handleMarkAllRead = () => {
    setDismissedIds(allNotifications.map((n) => n.id));
  };

  const handleDismissSingle = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setDismissedIds((prev) => [...prev, id]);
  };

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
        {/* Dark Mode / Light Mode Switcher */}
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

        {/* Alerts / Notifications Bell Button & Interactive Dropdown */}
        <div className="relative" ref={notifRef}>
          <button
            type="button"
            onClick={() => setIsNotifOpen((prev) => !prev)}
            title="Notifications & Operational Alerts"
            aria-label="View notifications"
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer select-none ${
              unreadCount > 0
                ? "bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/30 text-amber-500 dark:text-amber-400 font-semibold text-xs shadow-sm shadow-amber-500/10"
                : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-900/60 dark:hover:bg-slate-800 border-slate-300 dark:border-slate-800 text-slate-600 dark:text-slate-400 text-xs"
            } ${isNotifOpen ? "ring-2 ring-amber-500/50" : ""}`}
          >
            <Bell className={`w-3.5 h-3.5 ${unreadCount > 0 ? "animate-wiggle" : ""}`} />
            {unreadCount > 0 && <span className="font-bold">{unreadCount}</span>}
          </button>

          {/* Interactive Notifications Popover Menu */}
          {isNotifOpen && (
            <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 rounded-2xl bg-[#0a1120] border border-slate-800/90 shadow-2xl shadow-black/50 overflow-hidden z-50 notif-dropdown animate-fadeIn">
              {/* Header */}
              <div className="px-4 py-3 border-b border-slate-800/80 flex items-center justify-between bg-slate-950/40">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-amber-500/15 text-amber-500 flex items-center justify-center">
                    <Bell className="w-3.5 h-3.5" />
                  </div>
                  <h3 className="text-xs font-bold text-white tracking-tight">Notifications</h3>
                  {unreadCount > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-500 border border-amber-500/30">
                      {unreadCount} New
                    </span>
                  )}
                </div>

                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={handleMarkAllRead}
                    className="flex items-center gap-1 text-[11px] font-medium text-slate-400 hover:text-blue-400 transition"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    <span>Mark all read</span>
                  </button>
                )}
              </div>

              {/* Notification List */}
              <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-800/60 custom-scrollbar">
                {activeNotifications.length === 0 ? (
                  <div className="p-8 text-center space-y-2">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center mx-auto">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <p className="text-xs font-semibold text-white">All caught up!</p>
                    <p className="text-[11px] text-slate-400">
                      There are no unread operational alerts or pending actions at this time.
                    </p>
                  </div>
                ) : (
                  activeNotifications.map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => handleNotificationClick(notif)}
                      className="p-3.5 hover:bg-slate-800/50 transition cursor-pointer flex items-start gap-3 notif-item group relative"
                    >
                      <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800 shrink-0 mt-0.5 group-hover:border-slate-700 transition">
                        {notif.icon}
                      </div>

                      <div className="flex-1 min-w-0 pr-4">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border uppercase tracking-wider ${notif.badgeClass}`}>
                            {notif.badge}
                          </span>
                          <span className="text-[10px] text-slate-500">{notif.time}</span>
                        </div>
                        <h4 className="text-xs font-bold text-white group-hover:text-blue-400 transition-colors truncate">
                          {notif.title}
                        </h4>
                        <p className="text-[11px] text-slate-400 leading-snug mt-0.5 line-clamp-2">
                          {notif.description}
                        </p>
                      </div>

                      {/* Right Dismiss Button */}
                      <button
                        type="button"
                        onClick={(e) => handleDismissSingle(e, notif.id)}
                        title="Dismiss notification"
                        className="opacity-0 group-hover:opacity-100 p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition absolute right-2.5 top-3"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>

                      <div className="opacity-0 group-hover:opacity-100 transition text-slate-400 self-center">
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Footer */}
              <div className="p-2.5 bg-slate-950/60 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-1.5 text-slate-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>ERP Real-Time Monitor</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsNotifOpen(false);
                    if (onSelectNav) onSelectNav("OVERVIEW");
                    router.push("/");
                  }}
                  className="text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1"
                >
                  <span>Overview</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}
        </div>

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
