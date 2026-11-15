"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sidebar, type NavKey } from "./Sidebar";
import { Header } from "./Header";

interface DashboardLayoutProps {
  activeNav: NavKey;
  onSelectNav?: (key: NavKey) => void;
  children: React.ReactNode;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  badges?: {
    whatsappChat?: number;
    orderManagement?: number;
  };
  currentUser?: {
    name?: string;
    role?: string;
  };
  lowStockCount?: number;
  onLogout?: () => void;
}

export function DashboardLayout({
  activeNav,
  onSelectNav,
  children,
  onRefresh,
  isRefreshing = false,
  badges,
  currentUser,
  lowStockCount,
  onLogout,
}: DashboardLayoutProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const [liveBadges, setLiveBadges] = useState<{ whatsappChat?: number; orderManagement?: number }>(
    badges || { whatsappChat: 0, orderManagement: 0 }
  );
  const [liveLowStock, setLiveLowStock] = useState<number>(lowStockCount ?? 0);
  const [liveUser, setLiveUser] = useState<{ name?: string; role?: string }>(
    currentUser || { name: "Administrator", role: "Super Admin" }
  );

  useEffect(() => {
    if (badges) {
      setLiveBadges((prev) => ({
        ...prev,
        ...badges,
      }));
    }
  }, [badges]);

  useEffect(() => {
    if (lowStockCount !== undefined) {
      setLiveLowStock(lowStockCount);
    }
  }, [lowStockCount]);

  useEffect(() => {
    if (currentUser) {
      setLiveUser(currentUser);
    }
  }, [currentUser]);

  // Fetch real counts from /api/overview if badges or lowStockCount were not passed
  useEffect(() => {
    if (!badges || lowStockCount === undefined) {
      fetch("/api/overview")
        .then((r) => r.json())
        .then((data) => {
          if (data?.stats) {
            if (!badges) {
              setLiveBadges({
                whatsappChat: data.stats.unreadChats || 0,
                orderManagement: data.stats.pendingOrdersCount || 0,
              });
            }
            if (lowStockCount === undefined) {
              setLiveLowStock(data.stats.lowStockCount || 0);
            }
          }
        })
        .catch(() => {});
    }

    if (!currentUser) {
      try {
        const saved = localStorage.getItem("truehive_user");
        if (saved) {
          setLiveUser(JSON.parse(saved));
          return;
        }
      } catch {}
      fetch("/api/auth/me")
        .then((r) => r.json())
        .then((d) => {
          if (d?.user?.name) {
            setLiveUser({ name: d.user.name, role: d.user.role });
          }
        })
        .catch(() => {});
    }
  }, [badges, lowStockCount, currentUser]);

  // Restore collapsed preference from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("truehive_sidebar_collapsed");
      if (saved !== null) {
        setIsCollapsed(saved === "true");
      }
    } catch {
      // Ignore
    }
  }, []);

  const handleToggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("truehive_sidebar_collapsed", String(next));
      } catch {
        // Ignore
      }
      return next;
    });
  };

  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-row">
      {/* Sidebar (Responsive Desktop & Mobile Drawer) */}
      <Sidebar
        activeNav={activeNav}
        onSelectNav={onSelectNav}
        isCollapsed={isCollapsed}
        onToggleCollapse={handleToggleCollapse}
        isMobileOpen={isMobileOpen}
        onCloseMobile={() => setIsMobileOpen(false)}
        badges={liveBadges}
        currentUser={liveUser}
        onLogout={onLogout}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen overflow-x-hidden">
        {/* Top Header */}
        <Header
          activeNav={activeNav}
          onOpenMobile={() => setIsMobileOpen(true)}
          onRefresh={onRefresh}
          isRefreshing={isRefreshing}
          onQuickPos={() => {
            if (onSelectNav) onSelectNav("POS_PANEL");
            router.push("/pos");
          }}
          lowStockCount={liveLowStock}
          unreadChatsCount={liveBadges.whatsappChat || 0}
          onLogout={onLogout}
        />

        {/* Scrollable Page Body */}
        <main className="flex-1 p-4 lg:p-6 max-w-7xl w-full mx-auto space-y-6">
          {children}
        </main>
      </div>
    </div>
  );
}

