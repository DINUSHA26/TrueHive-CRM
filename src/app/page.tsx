"use client";

import React, { useEffect, useState, useCallback } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import type { NavKey } from "@/components/layout/Sidebar";
import { OverviewView } from "@/components/views/OverviewView";
import { WhatsAppChatView } from "@/components/views/WhatsAppChatView";
import { CrmView, type CustomerRecord } from "@/components/views/CrmView";
import { LeadsView } from "@/components/views/LeadsView";
import { AnnouncementsView } from "@/components/views/AnnouncementsView";
import { PosPanelView } from "@/components/views/PosPanelView";
import { ProductInventoryView } from "@/components/views/ProductInventoryView";
import { OrderManagementView } from "@/components/views/OrderManagementView";
import { SupplierManagementView } from "@/components/views/SupplierManagementView";
import { CashFlowView } from "@/components/views/CashFlowView";
import { ReportsView } from "@/components/views/ReportsView";
import { SettingsView } from "@/components/views/SettingsView";
import { CustomerCreditView } from "@/components/views/CustomerCreditView";
import { SupplierLedgerView } from "@/components/views/SupplierLedgerView";
import { QuotationsView } from "@/components/views/QuotationsView";
import { InvoiceManagementView } from "@/components/views/InvoiceManagementView";
import { EmployeeManagementView } from "@/components/views/EmployeeManagementView";
import { OfficialA4InvoiceModal } from "@/components/OfficialA4InvoiceModal";
import type {
  ProductItem,
  IngredientItem,
  LeadItem,
  OrderRecord,
  ChatThread,
  SupplierRecord,
  CashFlowRecord,
} from "@/lib/store";

export default function TrueHiveWorkspace() {
  const [activeNav, setActiveNav] = useState<NavKey>("OVERVIEW");
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [ingredients, setIngredients] = useState<IngredientItem[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierRecord[]>([]);
  const [leads, setLeads] = useState<LeadItem[]>([]);
  const [chats, setChats] = useState<ChatThread[]>([]);
  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [cashflow, setCashflow] = useState<CashFlowRecord[]>([]);
  const [googleSyncHistory, setGoogleSyncHistory] = useState<any[]>([]);
  const [overviewStats, setOverviewStats] = useState({
    totalRevenue: 0,
    totalCogs: 0,
    totalOrders: 0,
    pendingOrdersCount: 0,
    avgOrder: 0,
    totalProducts: 0,
    lowStockCount: 0,
    totalCustomers: 0,
    totalLeads: 0,
    unreadChats: 0,
    escalatedChats: 0,
  });

  const [currentUser, setCurrentUser] = useState<{ name: string; role: string }>({
    name: "Administrator",
    role: "Super Admin",
  });
  const [selectedA4Order, setSelectedA4Order] = useState<OrderRecord | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch all real live data from PostgreSQL endpoints
  const fetchAllData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("truehive_token") : null;
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const [overRes, invRes, crmRes, ordRes, finRes] = await Promise.all([
        fetch("/api/overview", { headers, cache: "no-store" }).catch(() => null),
        fetch("/api/inventory", { headers, cache: "no-store" }).catch(() => null),
        fetch(`/api/crm?_t=${Date.now()}`, { headers, cache: "no-store" }).catch(() => null),
        fetch("/api/orders", { headers, cache: "no-store" }).catch(() => null),
        fetch("/api/finance", { headers, cache: "no-store" }).catch(() => null),
      ]);

      if (overRes?.ok) {
        const overData = await overRes.json();
        if (overData.stats) setOverviewStats(overData.stats);
      }

      if (invRes?.ok) {
        const invData = await invRes.json();
        if (invData.products) setProducts(invData.products);
        if (invData.ingredients) setIngredients(invData.ingredients);
        if (invData.suppliers) setSuppliers(invData.suppliers);
      }

      if (crmRes?.ok) {
        const crmData = await crmRes.json();
        if (crmData.leads) setLeads(crmData.leads);
        if (crmData.chats) setChats(crmData.chats);
        if (crmData.customers) setCustomers(crmData.customers);
      }

      if (ordRes?.ok) {
        const ordData = await ordRes.json();
        if (ordData.orders) setOrders(ordData.orders);
      }

      if (finRes?.ok) {
        const finData = await finRes.json();
        if (finData.cashflow) setCashflow(finData.cashflow);
        if (finData.googleSyncHistory) setGoogleSyncHistory(finData.googleSyncHistory);
      }
    } catch (err) {
      console.error("Failed to load real database records:", err);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    const verifyAuthAndLoad = async () => {
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("truehive_token") : null;
        const headers: Record<string, string> = {};
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const meRes = await fetch("/api/auth/me", { headers });
        if (meRes.status === 401) {
          localStorage.removeItem("truehive_token");
          localStorage.removeItem("truehive_user");
          document.cookie = "truehive_token=; path=/; max-age=0";
          document.cookie = "truehive_auth_token=; path=/; max-age=0";
          window.location.href = "/login";
          return;
        }
        if (meRes.ok) {
          const meData = await meRes.json();
          if (meData.authenticated && meData.user) {
            if (isMounted) {
              setCurrentUser({
                name: meData.user.name || "Administrator",
                role: meData.user.role || "Super Admin",
              });
              fetchAllData();
            }
            return;
          }
        }
      } catch (e) {
        console.warn("Auth check error:", e);
      }

      // Fallback: Check cached local user session
      const localUserStr =
        typeof window !== "undefined"
          ? localStorage.getItem("truehive_user") || sessionStorage.getItem("truehive_user")
          : null;
      if (localUserStr) {
        try {
          const localUser = JSON.parse(localUserStr);
          if (localUser && isMounted) {
            setCurrentUser({
              name: localUser.name || "Administrator",
              role: localUser.role || "Super Admin",
            });
            fetchAllData();
            return;
          }
        } catch {}
      }

      // If unauthenticated, redirect to login
      window.location.href = "/login";
    };

    verifyAuthAndLoad();

    return () => {
      isMounted = false;
    };
  }, [fetchAllData]);

  // Sync activeNav with ?nav= query parameter if present
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const navParam = params.get("nav") as NavKey | null;
      if (navParam) {
        setActiveNav(navParam);
      }
    }
  }, []);

  // Real-time polling for WhatsApp chats when on chat view
  useEffect(() => {
    if (activeNav !== "WHATSAPP_CHAT") return;
    const interval = setInterval(() => {
      fetch("/api/crm")
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (data?.chats) setChats(data.chats);
        })
        .catch(() => null);
    }, 2500);

    return () => clearInterval(interval);
  }, [activeNav]);

  // Dynamic badges
  const unreadChatsCount =
    chats.length > 0
      ? chats.reduce((acc, c) => acc + (c.unreadCount || 0), 0)
      : (overviewStats.unreadChats || 0);
  const pendingOrdersCount =
    overviewStats.pendingOrdersCount || orders.filter((o) => o.status === "PENDING").length;
  const lowStockCount =
    overviewStats.lowStockCount ||
    products.filter((p) => p.currentStock <= (p.reorderLevel || 10)).length;

  const handleChatMarkAsRead = useCallback((chatId: string) => {
    setChats((prev) =>
      prev.map((c) => (c.id === chatId ? { ...c, unreadCount: 0 } : c))
    );
  }, []);

  return (
    <DashboardLayout
      activeNav={activeNav}
      onSelectNav={setActiveNav}
      onRefresh={fetchAllData}
      isRefreshing={isRefreshing}
      badges={{
        whatsappChat: unreadChatsCount,
        orderManagement: pendingOrdersCount,
      }}
      currentUser={currentUser}
      lowStockCount={lowStockCount}
      onLogout={async () => {
        try {
          await fetch("/api/auth/logout", { method: "POST" });
        } catch {
          // Ignore
        }
        try {
          localStorage.removeItem("truehive_user");
          sessionStorage.removeItem("truehive_user");
        } catch {}
        window.location.href = "/login";
      }}
    >
      {/* View router */}
      {activeNav === "OVERVIEW" && (
        <OverviewView
          stats={overviewStats}
          recentOrders={orders}
          products={products}
          ingredients={ingredients}
          onNavigate={setActiveNav}
          onOpenA4Invoice={setSelectedA4Order}
        />
      )}

      {activeNav === "WHATSAPP_CHAT" && (
        <WhatsAppChatView
          chats={chats}
          onRefresh={fetchAllData}
          onMarkAsRead={handleChatMarkAsRead}
        />
      )}

      {activeNav === "CRM" && (
        <CrmView
          customers={customers}
          onRefresh={fetchAllData}
          onNavigate={setActiveNav}
        />
      )}

      {activeNav === "CUSTOMER_CREDIT" && (
        <CustomerCreditView
          customers={customers}
          onRefresh={fetchAllData}
          onNavigate={setActiveNav}
        />
      )}

      {activeNav === "LEADS" && (
        <LeadsView leads={leads} onRefresh={fetchAllData} />
      )}

      {activeNav === "ANNOUNCEMENTS" && (
        <AnnouncementsView onRefresh={fetchAllData} />
      )}

      {activeNav === "POS_PANEL" && (
        <PosPanelView
          products={products}
          ingredients={ingredients}
          orders={orders}
          onRefresh={fetchAllData}
          onOpenA4Invoice={setSelectedA4Order}
        />
      )}

      {activeNav === "PRODUCT_INVENTORY" && (
        <ProductInventoryView
          products={products}
          ingredients={ingredients}
          suppliers={suppliers}
          onRefresh={fetchAllData}
        />
      )}

      {activeNav === "ORDER_MANAGEMENT" && (
        <OrderManagementView
          orders={orders}
          onRefresh={fetchAllData}
          onOpenA4Invoice={setSelectedA4Order}
        />
      )}

      {activeNav === "QUOTATIONS" && (
        <QuotationsView
          products={products}
          customers={customers}
          onRefresh={fetchAllData}
          onOpenA4Invoice={setSelectedA4Order}
        />
      )}

      {activeNav === "SUPPLIER_MANAGEMENT" && (
        <SupplierManagementView
          suppliers={suppliers}
          ingredients={ingredients}
          products={products}
          onRefresh={fetchAllData}
        />
      )}

      {activeNav === "SUPPLIER_LEDGER" && (
        <SupplierLedgerView
          suppliers={suppliers}
          products={products}
          ingredients={ingredients}
          onRefresh={fetchAllData}
          onNavigate={setActiveNav}
        />
      )}

      {activeNav === "INVOICES" && (
        <InvoiceManagementView
          orders={orders}
          products={products}
          customers={customers}
          onRefresh={fetchAllData}
          onOpenA4Invoice={setSelectedA4Order}
        />
      )}

      {activeNav === "CASH_FLOW" && (
        <CashFlowView cashflow={cashflow} onRefresh={fetchAllData} />
      )}

      {activeNav === "REPORTS" && (
        <ReportsView
          totalRevenue={overviewStats.totalRevenue}
          totalOrders={overviewStats.totalOrders}
          totalCustomers={customers.length || overviewStats.totalCustomers}
          syncHistory={googleSyncHistory}
          onRefresh={fetchAllData}
        />
      )}

      {activeNav === "SETTINGS" && (
        <SettingsView currentUser={currentUser} onRefresh={fetchAllData} />
      )}

      {(activeNav === "EMPLOYEES" || activeNav === "ATTENDANCE" || activeNav === "PAYROLL") && (
        <EmployeeManagementView
          defaultTab={
            activeNav === "ATTENDANCE"
              ? "ATTENDANCE"
              : activeNav === "PAYROLL"
              ? "PAYROLL"
              : "DIRECTORY"
          }
        />
      )}

      {/* Global Official A4 Tax Invoice Modal */}
      <OfficialA4InvoiceModal
        order={selectedA4Order}
        onClose={() => setSelectedA4Order(null)}
      />
    </DashboardLayout>
  );
}
