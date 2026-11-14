"use client";

import React, { useEffect, useState, useCallback } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ProductInventoryView } from "@/components/views/ProductInventoryView";
import type { ProductItem, IngredientItem, SupplierRecord } from "@/lib/store";

export default function ProductsPage() {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [ingredients, setIngredients] = useState<IngredientItem[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierRecord[]>([]);
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
      if (data.suppliers) setSuppliers(data.suppliers);
    } catch (err) {
      console.error("Failed to load products:", err);
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
      activeNav="PRODUCT_INVENTORY"
      onRefresh={fetchData}
      isRefreshing={isRefreshing}
      currentUser={currentUser}
      onLogout={handleLogout}
    >
      <ProductInventoryView
        products={products}
        ingredients={ingredients}
        suppliers={suppliers}
        onRefresh={fetchData}
      />
    </DashboardLayout>
  );
}
