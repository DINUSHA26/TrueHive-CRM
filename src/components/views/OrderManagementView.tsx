"use client";

import React, { useState } from "react";
import {
  ClipboardList,
  Search,
  FileText,
  Printer,
  Sparkles,
  CheckCircle2,
  Clock,
  Send,
  ChevronDown,
  ArrowRight,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table";
import { EmptyState } from "@/components/ui/EmptyState";
import type { OrderRecord } from "@/lib/store";

interface OrderManagementViewProps {
  orders: OrderRecord[];
  onRefresh: () => void;
  onOpenA4Invoice: (order: OrderRecord) => void;
}

const STATUS_ORDER = [
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "READY_TO_SHIP",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
] as const;

export function OrderManagementView({
  orders,
  onRefresh,
  onOpenA4Invoice,
}: OrderManagementViewProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{
    whatsappMessage: string;
    bomDeductions: string[];
  } | null>(null);

  const filtered = orders.filter((o) => {
    if (statusFilter !== "ALL" && o.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        o.orderNumber.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.customerPhone.includes(q) ||
        (o.barcode && o.barcode.includes(q))
      );
    }
    return true;
  });

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    setUpdatingId(orderId);
    try {
      const res = await fetch("/api/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setFeedback({
          whatsappMessage: data.whatsappMessageSent,
          bomDeductions: data.bomDeductions || [],
        });
        onRefresh();
      }
    } catch (err) {
      console.error("Order status update failed:", err);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-blue-500" />
            Order Management & Fulfillment
          </h2>
          <p className="text-xs text-slate-400">
            Automated WhatsApp triggers, atomic BOM ingredient deductions, and official A4 tax invoices.
          </p>
        </div>
      </div>

      {/* WhatsApp Trigger Feedback Banner */}
      {feedback && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 space-y-1">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-white flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Automated WhatsApp Cloud API Notification Dispatched:
            </p>
            <button
              onClick={() => setFeedback(null)}
              className="text-[11px] text-slate-400 hover:text-white"
            >
              Dismiss
            </button>
          </div>
          <p className="text-xs font-mono bg-slate-950/60 p-2.5 rounded-xl border border-slate-800 text-emerald-400">
            {feedback.whatsappMessage}
          </p>
          {feedback.bomDeductions.length > 0 && (
            <p className="text-[11px] text-slate-400 pt-1">
              BOM Deductions: {feedback.bomDeductions.join(" • ")}
            </p>
          )}
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search order #, customer, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto">
          {["ALL", "PENDING", "PROCESSING", "READY_TO_SHIP", "DELIVERED"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                statusFilter === st
                  ? "bg-blue-600 text-white"
                  : "bg-slate-950 border border-slate-800 text-slate-400 hover:text-white"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Table */}
      <Card>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <EmptyState
              icon={<ClipboardList className="w-8 h-8" />}
              title="No orders found"
              description="Orders placed via POS counter or WhatsApp AI will appear here."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Items / Summary</TableHead>
                  <TableHead>Total & Source</TableHead>
                  <TableHead>Fulfillment Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((order) => {
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
                      <TableCell className="font-mono font-bold text-white">
                        <div>
                          <span>{order.orderNumber}</span>
                          <p className="text-[10px] text-slate-400 font-normal">
                            {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : "Today"}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-semibold text-white">{order.customerName}</p>
                          <p className="text-xs text-slate-400 font-mono">{order.customerPhone}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-0.5">
                          {order.items.slice(0, 2).map((item, idx) => (
                            <p key={idx} className="text-xs text-slate-300">
                              {item.productName} <span className="text-slate-400">× {item.quantity}</span>
                            </p>
                          ))}
                          {order.items.length > 2 && (
                            <p className="text-[10px] text-slate-400">
                              +{order.items.length - 2} more item(s)
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-bold text-white">
                            LKR {order.totalAmount.toLocaleString()}
                          </p>
                          <p className="text-[10px] text-blue-400 font-medium">
                            {order.source === "POS_TERMINAL"
                              ? "POS Counter"
                              : order.source === "WHATSAPP_AI"
                              ? "WhatsApp Cloud AI"
                              : "Dashboard"}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <select
                            disabled={updatingId === order.id}
                            value={order.status}
                            onChange={(e) => handleStatusChange(order.id, e.target.value)}
                            className="px-2.5 py-1 bg-slate-950 border border-slate-800 rounded-lg text-xs font-semibold text-white focus:outline-none"
                          >
                            {STATUS_ORDER.map((s) => (
                              <option key={s} value={s}>
                                {s}
                              </option>
                            ))}
                          </select>
                          <Badge variant={statusVariant} size="sm">
                            {order.status}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => onOpenA4Invoice(order)}
                          leftIcon={<FileText className="w-3.5 h-3.5 text-blue-400" />}
                        >
                          A4 Invoice
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
  );
}

