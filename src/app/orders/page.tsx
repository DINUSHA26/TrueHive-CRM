"use client";

import React, { useEffect, useState, useCallback } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { OrderManagementView } from "@/components/views/OrderManagementView";
import { OfficialA4InvoiceModal } from "@/components/OfficialA4InvoiceModal";
import type { OrderRecord } from "@/lib/store";

export default function OrdersPage() {
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [selectedA4Order, setSelectedA4Order] = useState<OrderRecord | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ name: string; role: string }>({
    name: "Administrator",
    role: "Super Admin",
  });

  const fetchData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch("/api/orders");
      const data = await res.json();
      if (data.orders) setOrders(data.orders);
    } catch (err) {
      console.error("Failed to load orders:", err);
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
      activeNav="ORDER_MANAGEMENT"
      onRefresh={fetchData}
      isRefreshing={isRefreshing}
      currentUser={currentUser}
      onLogout={handleLogout}
    >
      <OrderManagementView
        orders={orders}
        onRefresh={fetchData}
        onOpenA4Invoice={setSelectedA4Order}
      />

      <OfficialA4InvoiceModal
        order={selectedA4Order}
        onClose={() => setSelectedA4Order(null)}
      />
    </DashboardLayout>
  );
}
