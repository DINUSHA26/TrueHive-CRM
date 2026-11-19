"use client";

import React, { useEffect, useState, useCallback } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { QuotationsView } from "@/components/views/QuotationsView";
import { NAV_ROUTES } from "@/components/layout/Sidebar";
import { OfficialA4InvoiceModal } from "@/components/OfficialA4InvoiceModal";
import type { OrderRecord, ProductItem } from "@/lib/store";
import type { CustomerRecord } from "@/components/views/CrmView";

export default function QuotationsPage() {
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
      const [pRes, cRes] = await Promise.allSettled([
        fetch("/api/catalog/products"),
        fetch("/api/crm/customers"),
      ]);

      if (pRes.status === "fulfilled" && pRes.value.ok) {
        const pData = await pRes.value.json();
        if (pData.products) setProducts(pData.products);
      }
      if (cRes.status === "fulfilled" && cRes.value.ok) {
        const cData = await cRes.value.json();
        if (cData.customers) setCustomers(cData.customers);
      }
    } catch (err) {
      console.warn("Failed to load initial catalog/crm data:", err);
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
      activeNav="QUOTATIONS"
      onSelectNav={(nav) => {
        if (nav === "QUOTATIONS") return;
        const target = NAV_ROUTES[nav];
        if (target) {
          window.location.href = target;
        }
      }}
      onRefresh={fetchData}
      isRefreshing={isRefreshing}
      currentUser={currentUser}
      onLogout={handleLogout}
    >
      <QuotationsView
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
