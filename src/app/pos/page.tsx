"use client";

import React, { useEffect, useState, useCallback } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PosPanelView } from "@/components/views/PosPanelView";
import { OfficialA4InvoiceModal } from "@/components/OfficialA4InvoiceModal";
import type { ProductItem, IngredientItem, OrderRecord } from "@/lib/store";

export default function PosPage() {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [ingredients, setIngredients] = useState<IngredientItem[]>([]);
  const [selectedA4Order, setSelectedA4Order] = useState<OrderRecord | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ name: string; role: string }>({
    name: "Administrator",
    role: "Super Admin",
  });

  const fetchData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch("/api/inventory");
      const data = await res.json();
      if (data.products) setProducts(data.products);
      if (data.ingredients) setIngredients(data.ingredients);
    } catch (err) {
      console.error("Failed to load inventory for POS:", err);
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
      activeNav="POS_PANEL"
      onRefresh={fetchData}
      isRefreshing={isRefreshing}
      currentUser={currentUser}
      onLogout={handleLogout}
    >
      <PosPanelView
        products={products}
        ingredients={ingredients}
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
