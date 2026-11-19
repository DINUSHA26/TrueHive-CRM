"use client";

import React, { useEffect, useState, useCallback } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { InvoiceManagementView } from "@/components/views/InvoiceManagementView";
import { OfficialA4InvoiceModal } from "@/components/OfficialA4InvoiceModal";
import { NAV_ROUTES } from "@/components/layout/Sidebar";
import type { OrderRecord, ProductItem } from "@/lib/store";
import type { CustomerRecord } from "@/components/views/CrmView";

export default function InvoicesPage() {
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [selectedA4Order, setSelectedA4Order] = useState<OrderRecord | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ name: string; role: string }>({
    name: "Administrator",
    role: "Super Admin",
  });

  const fetchData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const [oRes, pRes, cRes] = await Promise.allSettled([
        fetch("/api/orders"),
        fetch("/api/inventory"),
        fetch("/api/crm?view=customers"),
      ]);

      if (oRes.status === "fulfilled" && oRes.value.ok) {
        const oData = await oRes.value.json();
        if (oData.orders && Array.isArray(oData.orders)) setOrders(oData.orders);
        else if (Array.isArray(oData)) setOrders(oData);
        else if (oData.data && Array.isArray(oData.data)) setOrders(oData.data);
      }
      if (pRes.status === "fulfilled" && pRes.value.ok) {
        const pData = await pRes.value.json();
        if (pData.products && Array.isArray(pData.products)) setProducts(pData.products);
        else if (Array.isArray(pData)) setProducts(pData);
      }
      if (cRes.status === "fulfilled" && cRes.value.ok) {
        const cData = await cRes.value.json();
        if (cData.customers && Array.isArray(cData.customers)) setCustomers(cData.customers);
        else if (Array.isArray(cData)) setCustomers(cData);
      }
    } catch (err) {
      console.warn("Failed to load initial invoice data:", err);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    try {
      const savedUser = localStorage.getItem("truehive_user");
      if (savedUser) setCurrentUser(JSON.parse(savedUser));
    } catch {}
  }, [fetchData]);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {}
    try {
      localStorage.removeItem("truehive_user");
      sessionStorage.removeItem("truehive_user");
    } catch {}
    window.location.href = "/login";
  };

  return (
    <DashboardLayout
      activeNav="INVOICES"
      onRefresh={fetchData}
      isRefreshing={isRefreshing}
      currentUser={currentUser}
      onLogout={handleLogout}
    >
      <InvoiceManagementView
        orders={orders}
        products={products}
        customers={customers}
        onRefresh={fetchData}
        onOpenA4Invoice={setSelectedA4Order}
      />

      {/* Global Official A4 Tax Invoice Modal */}
      <OfficialA4InvoiceModal
        order={selectedA4Order}
        onClose={() => setSelectedA4Order(null)}
      />
    </DashboardLayout>
  );
}
