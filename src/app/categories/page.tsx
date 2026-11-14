"use client";

import React, { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { CategoryManagementView } from "@/components/categories/CategoryManagementView";

export default function CategoriesPage() {
  const [currentUser, setCurrentUser] = useState<{ name: string; role: string }>({
    name: "Administrator",
    role: "Super Admin",
  });

  useEffect(() => {
    try {
      const savedUser = localStorage.getItem("truehive_user");
      if (savedUser) setCurrentUser(JSON.parse(savedUser));
    } catch {}
  }, []);

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
      currentUser={currentUser}
      activeNav="PRODUCT_INVENTORY"
      onLogout={handleLogout}
    >
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold text-white">Categories Management</h2>
          <p className="text-xs text-slate-400">
            Manage product category tree, sub-level hierarchies, and catalog taxonomy.
          </p>
        </div>
        <CategoryManagementView />
      </div>
    </DashboardLayout>
  );
}
