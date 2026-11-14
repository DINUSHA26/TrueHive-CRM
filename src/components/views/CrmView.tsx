"use client";

import React, { useState } from "react";
import {
  Users,
  UserPlus,
  Search,
  Phone,
  Mail,
  MapPin,
  ShoppingBag,
  DollarSign,
  Plus,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import type { NavKey } from "@/components/layout/Sidebar";

export interface CustomerRecord {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  totalOrders?: number;
  totalSpent?: number;
  loyaltyPoints?: number;
  createdAt?: string;
}

interface CrmViewProps {
  customers: CustomerRecord[];
  onRefresh: () => void;
  onNavigate: (key: NavKey) => void;
}

export function CrmView({ customers, onRefresh, onNavigate }: CrmViewProps) {
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("947");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [saving, setSaving] = useState(false);

  const filtered = customers.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.phone.includes(q) ||
      (c.email && c.email.toLowerCase().includes(q))
    );
  });

  const totalSpentAll = customers.reduce((acc, c) => acc + (c.totalSpent || 0), 0);

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;

    setSaving(true);
    try {
      await fetch("/api/crm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "CREATE_CUSTOMER",
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim(),
          address: address.trim(),
        }),
      });
      setName("");
      setPhone("947");
      setEmail("");
      setAddress("");
      setModalOpen(false);
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and KPI cards */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-500" />
            Customer Directory (CRM)
          </h2>
          <p className="text-xs text-slate-400">
            Unified customer profiles across POS retail checkout and WhatsApp Cloud API.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => setModalOpen(true)}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Add Customer
        </Button>
      </div>

      {/* Summary KPI row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
          <p className="text-xs text-slate-400 font-medium">TOTAL REGISTERED</p>
          <p className="text-2xl font-bold text-white mt-1">{customers.length}</p>
          <p className="text-[11px] text-slate-400 mt-1">Cross-channel verified</p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
          <p className="text-xs text-slate-400 font-medium">LIFETIME CUSTOMER SPEND</p>
          <p className="text-2xl font-bold text-emerald-400 mt-1">
            LKR {totalSpentAll.toLocaleString()}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Direct from POS & WhatsApp</p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
          <p className="text-xs text-slate-400 font-medium">LOYALTY RETENTION</p>
          <p className="text-2xl font-bold text-blue-400 mt-1">100% Synced</p>
          <p className="text-[11px] text-slate-400 mt-1">Supabase PostgreSQL</p>
        </div>
      </div>

      {/* Filter and Table Card */}
      <Card>
        <CardHeader className="border-b border-slate-800/80 pb-3">
          <div className="relative w-full max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search customers by name, phone or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>
          <span className="text-xs text-slate-400">
            Showing {filtered.length} of {customers.length}
          </span>
        </CardHeader>

        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <EmptyState
              icon={<Users className="w-8 h-8" />}
              title="No customers found"
              description="Register new walk-in clients or let WhatsApp AI create them automatically."
              actionLabel="Add Customer"
              onAction={() => setModalOpen(true)}
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Contact Info</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Orders</TableHead>
                  <TableHead>Total Spent</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-600/20 text-blue-400 font-bold flex items-center justify-center text-xs">
                          {c.name.charAt(0) || "C"}
                        </div>
                        <div>
                          <p className="font-semibold text-white">{c.name}</p>
                          <p className="text-[10px] text-slate-400">ID: {c.id.slice(0, 8)}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-0.5">
                        <p className="font-mono text-xs text-slate-200">{c.phone}</p>
                        {c.email && <p className="text-[11px] text-slate-400">{c.email}</p>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-slate-300">
                        {c.address || "Sri Lanka"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="neutral" size="sm">
                        {c.totalOrders || 1} Orders
                      </Badge>
                    </TableCell>
                    <TableCell className="font-semibold text-white">
                      LKR {(c.totalSpent || 0).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => onNavigate("POS_PANEL")}
                        className="text-xs"
                      >
                        New Sale
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add Customer Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Add New Customer"
        description="Register a new retail or wholesale customer into the Supabase database."
        maxWidth="md"
      >
        <form onSubmit={handleCreateCustomer} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1">
              Customer Full Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Priyantha Silva"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1">
              WhatsApp / Mobile Phone *
            </label>
            <input
              type="text"
              required
              placeholder="94771234567"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1">
              Email Address (Optional)
            </label>
            <input
              type="email"
              placeholder="customer@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1">
              Delivery / Billing Address
            </label>
            <textarea
              rows={2}
              placeholder="No. 45, Galle Road, Colombo 03"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" loading={saving}>
              Save Customer
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

