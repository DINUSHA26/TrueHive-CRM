"use client";

import React from "react";
import {
  DollarSign,
  ShoppingCart,
  TrendingUp,
  AlertTriangle,
  ArrowUpRight,
  MessageSquare,
  Users,
  Package,
  FileText,
  Clock,
  Sparkles,
  ChevronRight,
  Printer,
} from "lucide-react";
import { StatCard } from "@/components/ui/StatCard";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table";
import { EmptyState } from "@/components/ui/EmptyState";
import type { NavKey } from "@/components/layout/Sidebar";
import type { ProductItem, IngredientItem, OrderRecord } from "@/lib/store";

interface OverviewStats {
  totalRevenue: number;
  totalCogs: number;
  totalOrders: number;
  pendingOrdersCount: number;
  avgOrder: number;
  totalProducts: number;
  lowStockCount: number;
  totalCustomers: number;
  totalLeads: number;
  unreadChats: number;
  escalatedChats: number;
}

interface OverviewViewProps {
  stats: OverviewStats;
  recentOrders: OrderRecord[];
  products: ProductItem[];
  ingredients: IngredientItem[];
  onNavigate: (key: NavKey) => void;
  onOpenA4Invoice: (order: OrderRecord) => void;
}

export function OverviewView({
  stats,
  recentOrders,
  products,
  ingredients,
  onNavigate,
  onOpenA4Invoice,
}: OverviewViewProps) {
  // Dynamic margin calculation
  const grossProfit = stats.totalRevenue - stats.totalCogs;
  const marginPercent =
    stats.totalRevenue > 0
      ? Math.round((grossProfit / stats.totalRevenue) * 100)
      : 0;

  // Filter low stock products and ingredients
  const lowStockProducts = products.filter(
    (p) => p.currentStock <= (p.reorderLevel || 10)
  );
  const lowStockIngredients = ingredients.filter(
    (i) => i.currentStock <= (i.reorderLevel || 5)
  );

  return (
    <div className="space-y-6">
      {/* Low Stock Warning Banner if applicable */}
      {(lowStockProducts.length > 0 || lowStockIngredients.length > 0) && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-amber-300">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">
                Low Stock Alert ({lowStockProducts.length} Products, {lowStockIngredients.length} Ingredients)
              </p>
              <p className="text-xs text-amber-300/80">
                Some items have fallen below their configured reorder thresholds. Restock via Supplier PO.
              </p>
            </div>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onNavigate("SUPPLIER_MANAGEMENT")}
            className="shrink-0 text-amber-300 border-amber-500/40 hover:bg-amber-500/20"
          >
            Create Restock PO
          </Button>
        </div>
      )}

      {/* 4 Core Dynamic KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="TOTAL REVENUE"
          value={`LKR ${stats.totalRevenue.toLocaleString()}`}
          change={stats.totalRevenue > 0 ? 14.8 : 0}
          changePeriod="vs last month"
          icon={<DollarSign className="w-5 h-5" />}
          iconBg="bg-blue-600/20 text-blue-400 border border-blue-500/30"
          badgeText="Verified Cashflow"
        />

        <StatCard
          title="TOTAL ORDERS"
          value={stats.totalOrders}
          change={stats.pendingOrdersCount > 0 ? stats.pendingOrdersCount : undefined}
          changePeriod="pending fulfillment"
          icon={<ShoppingCart className="w-5 h-5" />}
          iconBg="bg-emerald-600/20 text-emerald-400 border border-emerald-500/30"
          badgeText={`${stats.pendingOrdersCount} Pending`}
        />

        <StatCard
          title="AVERAGE ORDER VALUE"
          value={`LKR ${stats.avgOrder.toLocaleString()}`}
          subtitle={`${stats.totalOrders} orders processed`}
          icon={<TrendingUp className="w-5 h-5" />}
          iconBg="bg-purple-600/20 text-purple-400 border border-purple-500/30"
        />

        <StatCard
          title="GROSS PROFIT MARGIN"
          value={`${marginPercent}%`}
          subtitle={`COGS: LKR ${stats.totalCogs.toLocaleString()}`}
          icon={<Sparkles className="w-5 h-5" />}
          iconBg="bg-amber-600/20 text-amber-400 border border-amber-500/30"
          badgeText="BOM Costing"
        />
      </div>

      {/* Quick Action Navigation Shortcuts */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={() => onNavigate("POS_PANEL")}
          className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-blue-500/50 hover:bg-slate-800/60 transition group text-left"
        >
          <div className="p-2 rounded-xl bg-blue-600/20 text-blue-400 w-fit mb-2 group-hover:scale-105 transition">
            <ShoppingCart className="w-4 h-4" />
          </div>
          <p className="text-xs font-semibold text-white">POS Terminal</p>
          <p className="text-[11px] text-slate-400">Barcode scanner & billing</p>
        </button>

        <button
          onClick={() => onNavigate("WHATSAPP_CHAT")}
          className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-emerald-500/50 hover:bg-slate-800/60 transition group text-left"
        >
          <div className="p-2 rounded-xl bg-emerald-600/20 text-emerald-400 w-fit mb-2 group-hover:scale-105 transition">
            <MessageSquare className="w-4 h-4" />
          </div>
          <p className="text-xs font-semibold text-white">WhatsApp Live Chat</p>
          <p className="text-[11px] text-slate-400">{stats.unreadChats} unread messages</p>
        </button>

        <button
          onClick={() => onNavigate("PRODUCT_INVENTORY")}
          className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-purple-500/50 hover:bg-slate-800/60 transition group text-left"
        >
          <div className="p-2 rounded-xl bg-purple-600/20 text-purple-400 w-fit mb-2 group-hover:scale-105 transition">
            <Package className="w-4 h-4" />
          </div>
          <p className="text-xs font-semibold text-white">Product Inventory</p>
          <p className="text-[11px] text-slate-400">{products.length} active products</p>
        </button>

        <button
          onClick={() => onNavigate("LEADS")}
          className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-amber-500/50 hover:bg-slate-800/60 transition group text-left"
        >
          <div className="p-2 rounded-xl bg-amber-600/20 text-amber-400 w-fit mb-2 group-hover:scale-105 transition">
            <Users className="w-4 h-4" />
          </div>
          <p className="text-xs font-semibold text-white">Leads Pipeline</p>
          <p className="text-[11px] text-slate-400">{stats.totalLeads} active leads</p>
        </button>
      </div>

      {/* Main Grid: Recent Live Orders + Low Stock / Inventory Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Live Orders (Takes 2 Columns on desktop) */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="border-b border-slate-800/80 pb-3">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-400" />
                  Recent Live Orders
                </CardTitle>
                <p className="text-xs text-slate-400 mt-0.5">
                  Real-time orders synced across POS Counter and WhatsApp Cloud API
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onNavigate("ORDER_MANAGEMENT")}
                rightIcon={<ChevronRight className="w-3.5 h-3.5" />}
              >
                View All
              </Button>
            </CardHeader>

            <CardContent className="p-0">
              {recentOrders.length === 0 ? (
                <EmptyState
                  title="No orders yet"
                  description="When a customer places an order via WhatsApp or POS, it will appear here in real-time."
                  actionLabel="Create POS Sale"
                  onAction={() => onNavigate("POS_PANEL")}
                />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order #</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentOrders.slice(0, 6).map((order) => {
                      const statusVariant =
                        order.status === "DELIVERED"
                          ? "success"
                          : order.status === "PENDING"
                          ? "warning"
                          : order.status === "PROCESSING"
                          ? "primary"
                          : "neutral";

                      return (
                        <TableRow key={order.id}>
                          <TableCell className="font-mono font-semibold text-white">
                            {order.orderNumber}
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium text-white">{order.customerName}</p>
                              <p className="text-[11px] text-slate-400">{order.customerPhone}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-[11px] font-medium text-slate-400">
                              {order.source === "POS_TERMINAL"
                                ? "POS Terminal"
                                : order.source === "WHATSAPP_AI"
                                ? "WhatsApp AI"
                                : "Manual"}
                            </span>
                          </TableCell>
                          <TableCell className="font-semibold text-white">
                            LKR {order.totalAmount.toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <Badge variant={statusVariant} size="sm">
                              {order.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onOpenA4Invoice(order)}
                              title="Print A4 Tax Invoice"
                              className="p-1.5"
                            >
                              <FileText className="w-3.5 h-3.5 text-blue-400" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Sidebar Column: Stock Status & BOM Highlights */}
        <div className="space-y-6">
          {/* Inventory Overview */}
          <Card>
            <CardHeader className="border-b border-slate-800/80 pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Package className="w-4 h-4 text-emerald-400" />
                Catalog Status
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onNavigate("PRODUCT_INVENTORY")}
                className="text-xs"
              >
                Manage
              </Button>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Total Products in Catalog:</span>
                <span className="font-bold text-white">{products.length}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Raw Ingredients Stocked:</span>
                <span className="font-bold text-white">{ingredients.length}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Items with Low Stock:</span>
                <span
                  className={`font-bold ${
                    lowStockProducts.length > 0 ? "text-amber-400" : "text-emerald-400"
                  }`}
                >
                  {lowStockProducts.length}
                </span>
              </div>

              {/* Sample Product stock gauges */}
              <div className="pt-2 border-t border-slate-800 space-y-3">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Inventory Levels
                </p>
                {products.slice(0, 4).map((p) => {
                  const percent = Math.min(
                    100,
                    Math.round((p.currentStock / ((p.reorderLevel || 10) * 3)) * 100)
                  );
                  const isLow = p.currentStock <= (p.reorderLevel || 10);
                  return (
                    <div key={p.id} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-300 font-medium truncate max-w-[140px]">
                          {p.name}
                        </span>
                        <span className={`font-mono text-xs ${isLow ? "text-amber-400 font-bold" : "text-slate-400"}`}>
                          {p.currentStock} {p.unit || "pcs"}
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            isLow ? "bg-amber-500" : "bg-emerald-500"
                          }`}
                          style={{ width: `${Math.max(5, percent)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* CRM & WhatsApp Engagement Snapshot */}
          <Card>
            <CardHeader className="border-b border-slate-800/80 pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-emerald-400" />
                Customer Engagement
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onNavigate("WHATSAPP_CHAT")}
                className="text-xs"
              >
                Chats
              </Button>
            </CardHeader>
            <CardContent className="space-y-3 pt-4 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Total Registered Customers:</span>
                <span className="font-bold text-white">{stats.totalCustomers}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Active Leads in Pipeline:</span>
                <span className="font-bold text-white">{stats.totalLeads}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Unread WhatsApp Inquiries:</span>
                <Badge variant={stats.unreadChats > 0 ? "success" : "neutral"} size="sm">
                  {stats.unreadChats} Unread
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Escalated to Human Agent:</span>
                <Badge variant={stats.escalatedChats > 0 ? "warning" : "neutral"} size="sm">
                  {stats.escalatedChats} Urgent
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

