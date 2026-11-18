"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { SupplierLedgerView } from "@/components/views/SupplierLedgerView";
import type { SupplierRecord, IngredientItem, ProductItem } from "@/lib/store";
import { NAV_ROUTES } from "@/components/layout/Sidebar";

export default function SupplierLedgerPage() {
  const router = useRouter();
  const [suppliers, setSuppliers] = useState<SupplierRecord[]>([]);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [ingredients, setIngredients] = useState<IngredientItem[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ name: string; role: string }>({
    name: "Administrator",
    role: "Super Admin",
  });

  const fetchData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const [supRes, invRes] = await Promise.all([
        fetch("/api/suppliers"),
        fetch("/api/inventory"),
      ]);
      const [supData, invData] = await Promise.all([
        supRes.json(),
        invRes.json(),
      ]);
      if (supData.suppliers) setSuppliers(supData.suppliers);
      if (invData.products) setProducts(invData.products);
      if (invData.ingredients) setIngredients(invData.ingredients);
    } catch (err) {
      console.error("Failed to fetch supplier ledger records:", err);
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
      activeNav="SUPPLIER_LEDGER"
      onRefresh={fetchData}
      isRefreshing={isRefreshing}
      currentUser={currentUser}
      onLogout={handleLogout}
    >
      <SupplierLedgerView
        suppliers={suppliers}
        products={products}
        ingredients={ingredients}
        onRefresh={fetchData}
        onNavigate={(key) => router.push(NAV_ROUTES[key] || "/")}
      />
    </DashboardLayout>
  );
}
