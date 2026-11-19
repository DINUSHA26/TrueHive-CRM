"use client";

import React from "react";
import { useRouter } from "next/navigation";
import {
  PanelLeftClose,
  PanelLeftOpen,
  LayoutGrid,
  MessageSquare,
  Users,
  UserPlus,
  Megaphone,
  ShoppingCart,
  Package,
  ClipboardList,
  Truck,
  Wallet,
  TrendingUp,
  Settings,
  UserCircle2,
  LogOut,
  X,
  CreditCard,
  FileSpreadsheet,
  FileText,
  Receipt,
} from "lucide-react";

export type NavKey =
  | "OVERVIEW"
  | "WHATSAPP_CHAT"
  | "CRM"
  | "CUSTOMER_CREDIT"
  | "LEADS"
  | "ANNOUNCEMENTS"
  | "POS_PANEL"
  | "PRODUCT_INVENTORY"
  | "ORDER_MANAGEMENT"
  | "QUOTATIONS"
  | "SUPPLIER_MANAGEMENT"
  | "SUPPLIER_LEDGER"
  | "INVOICES"
  | "CASH_FLOW"
  | "REPORTS"
  | "SETTINGS";

export interface NavSection {
  title: string;
  items: {
    key: NavKey;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badgeKey?: "whatsappChat" | "orderManagement";
    badgeVariant?: "green" | "gray";
  }[];
}

export const NAV_SECTIONS: NavSection[] = [
  {
    title: "GENERAL",
    items: [
      {
        key: "OVERVIEW",
        label: "Overview",
        icon: LayoutGrid,
      },
    ],
  },
  {
    title: "CUSTOMER ENGAGEMENT",
    items: [
      {
        key: "WHATSAPP_CHAT",
        label: "WhatsApp Chat",
        icon: MessageSquare,
        badgeKey: "whatsappChat",
        badgeVariant: "green",
      },
      {
        key: "CRM",
        label: "CRM",
        icon: Users,
      },
      {
        key: "CUSTOMER_CREDIT",
        label: "Credit Bills (AR)",
        icon: CreditCard,
      },
      {
        key: "LEADS",
        label: "Leads",
        icon: UserPlus,
      },
      {
        key: "ANNOUNCEMENTS",
        label: "Announcements",
        icon: Megaphone,
      },
    ],
  },
  {
    title: "SALES & OPERATIONS",
    items: [
      {
        key: "POS_PANEL",
        label: "POS Panel",
        icon: ShoppingCart,
      },
      {
        key: "PRODUCT_INVENTORY",
        label: "Product Inventory",
        icon: Package,
      },
      {
        key: "ORDER_MANAGEMENT",
        label: "Order Management",
        icon: ClipboardList,
      },
      {
        key: "QUOTATIONS",
        label: "Quotations",
        icon: FileText,
      },
      {
        key: "SUPPLIER_MANAGEMENT",
        label: "Supplier Management",
        icon: Truck,
      },
      {
        key: "SUPPLIER_LEDGER",
        label: "Supplier Ledger (AP)",
        icon: FileSpreadsheet,
      },
    ],
  },
  {
    title: "FINANCE & ANALYTICS",
    items: [
      {
        key: "INVOICES",
        label: "Invoices",
        icon: Receipt,
      },
      {
        key: "CASH_FLOW",
        label: "Cash Flow",
        icon: Wallet,
      },
      {
        key: "REPORTS",
        label: "Reports",
        icon: TrendingUp,
      },
    ],
  },
  {
    title: "ADMINISTRATION",
    items: [
      {
        key: "SETTINGS",
        label: "Settings",
        icon: Settings,
      },
    ],
  },
];

export const NAV_ROUTES: Record<NavKey, string> = {
  OVERVIEW: "/",
  WHATSAPP_CHAT: "/chats",
  CRM: "/crm",
  CUSTOMER_CREDIT: "/credit",
  LEADS: "/leads",
  ANNOUNCEMENTS: "/marketing",
  POS_PANEL: "/pos",
  PRODUCT_INVENTORY: "/products",
  ORDER_MANAGEMENT: "/orders",
  QUOTATIONS: "/quotations",
  SUPPLIER_MANAGEMENT: "/suppliers",
  SUPPLIER_LEDGER: "/supplier-ledger",
  INVOICES: "/invoices",
  CASH_FLOW: "/cashflow",
  REPORTS: "/reports",
  SETTINGS: "/settings",
};

interface SidebarProps {
  activeNav: NavKey;
  onSelectNav?: (key: NavKey) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
  badges?: {
    whatsappChat?: number;
    orderManagement?: number;
  };
  currentUser?: {
    name?: string;
    role?: string;
  };
  onLogout?: () => void;
}

export function Sidebar({
  activeNav,
  onSelectNav,
  isCollapsed = false,
  onToggleCollapse,
  isMobileOpen = false,
  onCloseMobile,
  badges = { whatsappChat: 0, orderManagement: 0 },
  currentUser = { name: "Administrator", role: "Super Admin" },
  onLogout,
}: SidebarProps) {
  const router = useRouter();

  const handleItemClick = (key: NavKey) => {
    if (onSelectNav) {
      onSelectNav(key);
    }
    const target = NAV_ROUTES[key];
    if (target) {
      router.push(target);
    }
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  const sidebarContent = (
    <div className="h-full flex flex-col p-3 bg-[#0a1120] text-slate-100 select-none overflow-hidden">
      {/* Top Brand Header */}
      <div className="flex items-center justify-between pb-2.5 border-b border-slate-800/80 px-1 shrink-0">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center shrink-0 p-1 shadow-sm shadow-amber-500/10">
            <img
              src="/logo.png"
              alt="TrueHive Logo"
              className="w-full h-full object-contain"
            />
          </div>
          {!isCollapsed && (
            <div className="leading-tight truncate">
              <h1 className="text-[14px] font-bold text-white tracking-tight">
                TrueHive
              </h1>
              <p className="text-[10px] text-slate-400">Management Portal</p>
            </div>
          )}
        </div>

        {/* Desktop Collapse / Mobile Close */}
        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="hidden lg:flex p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition"
          >
            {isCollapsed ? (
              <PanelLeftOpen className="w-4 h-4" />
            ) : (
              <PanelLeftClose className="w-4 h-4" />
            )}
          </button>
        )}

        {/* Mobile close cross */}
        {onCloseMobile && (
          <button
            onClick={onCloseMobile}
            aria-label="Close sidebar"
            className="lg:hidden p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Navigation Sections (Scrolls cleanly between header and profile) */}
      <div className="flex-1 overflow-y-auto custom-scrollbar py-2 space-y-2.5 pr-1 min-h-0">
        {NAV_SECTIONS.map((section) => (
          <div key={section.title} className="space-y-0.5">
            {!isCollapsed && (
              <div className="px-3 pt-1 pb-0.5">
                <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                  {section.title}
                </span>
              </div>
            )}
            {section.items.map((item) => {
              const Icon = item.icon;
              const isActive = activeNav === item.key;
              const badgeValue =
                item.badgeKey && badges ? badges[item.badgeKey] : undefined;

              return (
                <button
                  key={item.key}
                  onClick={() => handleItemClick(item.key)}
                  title={isCollapsed ? item.label : undefined}
                  className={`w-full group flex items-center justify-between px-3 py-1.5 rounded-xl text-[13px] font-normal transition-colors duration-150 ${
                    isActive
                      ? "bg-[#2563eb] text-white shadow-md shadow-blue-600/30 font-medium"
                      : "text-slate-300 hover:bg-slate-800/60 hover:text-white"
                  } ${isCollapsed ? "justify-center px-2 py-2" : ""}`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon
                      className={`w-4 h-4 shrink-0 ${
                        isActive
                          ? "text-white"
                          : "text-slate-400 group-hover:text-slate-200"
                      }`}
                    />
                    {!isCollapsed && <span className="truncate">{item.label}</span>}
                  </div>

                  {!isCollapsed && badgeValue !== undefined && badgeValue > 0 && (
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                        item.badgeVariant === "green"
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          : "bg-slate-800 text-slate-400 border border-slate-700/50"
                      }`}
                    >
                      {badgeValue}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Footer Profile Section (Permanently fitted to the screen bottom) */}
      <div className="pt-2 border-t border-slate-800/80 shrink-0 mt-auto">
        <div
          className={`flex items-center justify-between p-2 rounded-xl bg-slate-900/80 border border-slate-800/80 shadow-sm ${
            isCollapsed ? "flex-col gap-2 p-1.5" : ""
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700/80 flex items-center justify-center text-slate-300 shrink-0 shadow-inner">
              <UserCircle2 className="w-5 h-5 text-slate-300" />
            </div>
            {!isCollapsed && (
              <div className="leading-tight truncate">
                <p className="text-[12px] font-bold text-white truncate">
                  {currentUser.name || "Administrator"}
                </p>
                <p className="text-[10px] text-slate-400 font-mono uppercase tracking-wider truncate">
                  {currentUser.role || "Super Admin"}
                </p>
              </div>
            )}
          </div>

          <button
            onClick={onLogout}
            title="Sign out"
            aria-label="Logout"
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800/80 transition"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sticky Sidebar (Locked to screen height so user profile always fits on screen) */}
      <aside
        className={`hidden lg:flex flex-col shrink-0 sticky top-0 h-screen border-r border-slate-800/80 bg-[#0a1120] transition-all duration-300 no-print z-20 ${
          isCollapsed ? "w-[72px]" : "w-64"
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile / Tablet Drawer Backdrop */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-sm transition-opacity"
          onClick={onCloseMobile}
        />
      )}

      {/* Mobile / Tablet Drawer Off-Canvas (Full height with user profile at bottom) */}
      <aside
        className={`lg:hidden fixed inset-y-0 left-0 z-50 w-72 h-[100dvh] bg-[#0a1120] border-r border-slate-800 shadow-2xl transform transition-transform duration-300 ease-in-out no-print ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {sidebarContent}
      </aside>
    </>
  );
}

