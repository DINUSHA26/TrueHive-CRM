"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { CustomerCreditView } from "@/components/views/CustomerCreditView";
import type { CustomerRecord } from "@/components/views/CrmView";
import { NAV_ROUTES } from "@/components/layout/Sidebar";

export default function CreditPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ name: string; role: string }>({
    name: "Administrator",
    role: "Super Admin",
  });

  const fetchData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch("/api/crm?view=customers");
      const data = await res.json();
      if (data.customers) setCustomers(data.customers);
    } catch (err) {
      console.error("Failed to load customers for credit view:", err);
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
      activeNav="CUSTOMER_CREDIT"
      onRefresh={fetchData}
      isRefreshing={isRefreshing}
      currentUser={currentUser}
      onLogout={handleLogout}
    >
      <CustomerCreditView
        customers={customers}
        onRefresh={fetchData}
        onNavigate={(key) => router.push(NAV_ROUTES[key] || "/")}
      />
    </DashboardLayout>
  );
}
