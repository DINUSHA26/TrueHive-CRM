"use client";

import React, { useEffect, useState, useCallback } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ReportsView } from "@/components/views/ReportsView";

export default function ReportsPage() {
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalOrders, setTotalOrders] = useState(0);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [syncHistory, setSyncHistory] = useState<any[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ name: string; role: string }>({
    name: "Administrator",
    role: "Super Admin",
  });

  const fetchData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const [overRes, finRes] = await Promise.all([
        fetch("/api/overview"),
        fetch("/api/finance"),
      ]);
      const [overData, finData] = await Promise.all([
        overRes.json(),
        finRes.json(),
      ]);
      if (overData.stats) {
        setTotalRevenue(overData.stats.totalRevenue || 0);
        setTotalOrders(overData.stats.totalOrders || 0);
        setTotalCustomers(overData.stats.totalCustomers || 0);
      }
      if (finData.googleSyncHistory) {
        setSyncHistory(finData.googleSyncHistory);
      }
    } catch (err) {
      console.error("Failed to load reports data:", err);
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
      activeNav="REPORTS"
      onRefresh={fetchData}
      isRefreshing={isRefreshing}
      currentUser={currentUser}
      onLogout={handleLogout}
    >
      <ReportsView
        totalRevenue={totalRevenue}
        totalOrders={totalOrders}
        totalCustomers={totalCustomers}
        syncHistory={syncHistory}
        onRefresh={fetchData}
      />
    </DashboardLayout>
  );
}
