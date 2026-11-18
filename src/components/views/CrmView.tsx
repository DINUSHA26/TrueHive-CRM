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
  CreditCard,
  History,
  Award,
  AlertTriangle,
  Receipt,
  FileText,
  Clock,
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
  customerCode?: string;
  name: string;
  phone: string;
  whatsappId?: string;
  nic?: string;
  email?: string;
  address?: string;
  customerType?: string; // Regular, Wholesale, Corporate
  creditLimit?: number;
  creditDays?: number;
  starPoints?: number;
  creditBalance?: number;
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
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [modalOpen, setModalOpen] = useState(false);

  // Form State
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("947");
  const [nic, setNic] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [customerType, setCustomerType] = useState("Regular");
  const [creditLimit, setCreditLimit] = useState<number | "">(50000);
  const [creditDays, setCreditDays] = useState<number | "">(30);
  const [starPoints, setStarPoints] = useState<number | "">(0);
  const [saving, setSaving] = useState(false);

  // Customer History Modal
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerRecord | null>(null);
  const [historyData, setHistoryData] = useState<any>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const filtered = customers.filter((c) => {
    const q = search.toLowerCase();
    const matchesSearch =
      c.name.toLowerCase().includes(q) ||
      c.phone.includes(q) ||
      (c.customerCode && c.customerCode.toLowerCase().includes(q)) ||
      (c.nic && c.nic.toLowerCase().includes(q)) ||
      (c.email && c.email.toLowerCase().includes(q));

    const matchesType =
      typeFilter === "ALL" || (c.customerType || "Regular").toUpperCase() === typeFilter.toUpperCase();

    return matchesSearch && matchesType;
  });

  const totalSpentAll = customers.reduce((acc, c) => acc + (c.totalSpent || 0), 0);
  const totalCreditBalance = customers.reduce((acc, c) => acc + (c.creditBalance || 0), 0);

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;

    setSaving(true);
    try {
      const res = await fetch("/api/crm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "CREATE_CUSTOMER",
          name: name.trim(),
          phone: phone.trim(),
          nic: nic.trim() || undefined,
          email: email.trim() || undefined,
          address: address.trim() || undefined,
          customerType,
          creditLimit: creditLimit === "" ? 0 : Number(creditLimit),
          creditDays: creditDays === "" ? 30 : Number(creditDays),
          starPoints: starPoints === "" ? 0 : Number(starPoints),
        }),
      });

      const data = await res.json();
      if (data.success) {
        setName("");
        setPhone("947");
        setNic("");
        setEmail("");
        setAddress("");
        setCustomerType("Regular");
        setCreditLimit(50000);
        setCreditDays(30);
        setStarPoints(0);
        setModalOpen(false);
        onRefresh();
      } else {
        alert(data.error || "Failed to create customer");
      }
    } catch (err) {
      console.error(err);
      alert("Error saving customer.");
    } finally {
      setSaving(false);
    }
  };

  const handleOpenHistory = async (customer: CustomerRecord) => {
    setSelectedCustomer(customer);
    setHistoryModalOpen(true);
    setLoadingHistory(true);
    try {
      const res = await fetch(`/api/credit/customers/${customer.id}/history`);
      const data = await res.json();
      if (data.success) {
        setHistoryData(data.customer);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingHistory(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and KPI cards */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-500" />
            Customer Directory (CRM & Credit Master)
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Customer profiles with Credit Limits, Credit Terms, NIC verification, and Star Points.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onNavigate("CUSTOMER_CREDIT")}
            leftIcon={<CreditCard className="w-4 h-4 text-indigo-400" />}
          >
            Credit Bills Center
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setModalOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Add Customer
          </Button>
        </div>
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
            Rs. {totalSpentAll.toLocaleString()}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Direct from POS & WhatsApp</p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
          <p className="text-xs text-slate-400 font-medium">TOTAL ACTIVE CREDIT BALANCE</p>
          <p className="text-2xl font-bold text-rose-400 mt-1">
            Rs. {totalCreditBalance.toLocaleString()}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Outstanding receivables</p>
        </div>
      </div>

      {/* Filter and Table Card */}
      <Card>
        <CardHeader className="border-b border-slate-800/80 pb-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative w-full max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search by Code (CUST-0001), Name, Phone, NIC..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
              {["ALL", "REGULAR", "WHOLESALE", "CORPORATE"].map((type) => (
                <button
                  key={type}
                  onClick={() => setTypeFilter(type)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                    typeFilter === type
                      ? "bg-blue-600 text-white"
                      : "bg-slate-800/60 text-slate-400 hover:text-white hover:bg-slate-800"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
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
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer / Code</TableHead>
                    <TableHead>Contact & NIC</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Credit Limit</TableHead>
                    <TableHead>Credit Balance</TableHead>
                    <TableHead>Star Points</TableHead>
                    <TableHead>Total Spent</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((c) => {
                    const balance = c.creditBalance || 0;
                    const limit = c.creditLimit || 0;
                    const isOverLimit = limit > 0 && balance >= limit;

                    return (
                      <TableRow key={c.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-600/20 text-blue-400 font-bold flex items-center justify-center text-xs">
                              {c.name.charAt(0) || "C"}
                            </div>
                            <div>
                              <p className="font-semibold text-white text-xs">{c.name}</p>
                              <p className="text-[10px] text-slate-400 font-mono">
                                {c.customerCode || `CUST-${c.id.slice(0, 4)}`}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-0.5 text-xs">
                            <p className="font-mono text-slate-200">{c.phone}</p>
                            {c.nic && <p className="text-[10px] text-slate-400">NIC: {c.nic}</p>}
                            {c.email && <p className="text-[10px] text-slate-400">{c.email}</p>}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              c.customerType === "Wholesale"
                                ? "warning"
                                : c.customerType === "Corporate"
                                ? "primary"
                                : "neutral"
                            }
                            size="sm"
                          >
                            {c.customerType || "Regular"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="font-mono text-xs text-slate-300">
                            Rs. {limit.toLocaleString()}
                          </span>
                          <span className="text-[10px] text-slate-500 block">
                            {c.creditDays || 30} Days
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`font-mono text-xs font-bold ${
                                balance > 0 ? "text-rose-400" : "text-emerald-400"
                              }`}
                            >
                              Rs. {balance.toLocaleString()}
                            </span>
                            {isOverLimit && (
                              <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-amber-400 text-xs font-semibold">
                            <Award className="w-3.5 h-3.5" />
                            {c.starPoints || 0}
                          </div>
                        </TableCell>
                        <TableCell className="font-semibold text-white text-xs">
                          Rs. {(c.totalSpent || 0).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenHistory(c)}
                              className="text-xs py-1 px-2 text-slate-300 hover:text-white"
                              leftIcon={<History className="w-3.5 h-3.5 text-indigo-400" />}
                            >
                              History
                            </Button>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => onNavigate("POS_PANEL")}
                              className="text-xs py-1 px-2.5"
                            >
                              New Sale
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Customer Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Add New Customer Profile"
        description="Register a new retail or wholesale customer with Credit Limits and Terms."
        maxWidth="lg"
      >
        <form onSubmit={handleCreateCustomer} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">
                National Identity Card (NIC)
              </label>
              <input
                type="text"
                placeholder="e.g. 199012345678"
                value={nic}
                onChange={(e) => setNic(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">Customer Type</label>
              <select
                value={customerType}
                onChange={(e) => setCustomerType(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
              >
                <option value="Regular">Regular</option>
                <option value="Wholesale">Wholesale</option>
                <option value="Corporate">Corporate</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">
                Initial Star Points
              </label>
              <input
                type="number"
                min={0}
                value={starPoints}
                onChange={(e) => setStarPoints(e.target.value === "" ? "" : Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">
                Credit Amount Limit (Rs.)
              </label>
              <input
                type="number"
                min={0}
                step="any"
                placeholder="e.g. 50000"
                value={creditLimit}
                onChange={(e) => setCreditLimit(e.target.value === "" ? "" : Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">
                Credit Days Term Limit
              </label>
              <input
                type="number"
                min={1}
                value={creditDays}
                onChange={(e) => setCreditDays(e.target.value === "" ? "" : Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
              <input
                type="text"
                placeholder="No. 45, Galle Road, Colombo 03"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>
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

      {/* Customer Invoice & Credit History Modal */}
      <Modal
        isOpen={historyModalOpen}
        onClose={() => setHistoryModalOpen(false)}
        title="Customer Ledger & Invoice History"
        description={selectedCustomer ? `${selectedCustomer.name} (${selectedCustomer.customerCode || "CUST"})` : ""}
        maxWidth="2xl"
      >
        {selectedCustomer && (
          <div className="space-y-4 text-xs">
            {/* KPI bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 rounded-xl bg-slate-900 border border-slate-800">
              <div>
                <p className="text-slate-400">Credit Limit</p>
                <p className="font-bold text-white text-sm">
                  Rs. {(selectedCustomer.creditLimit || 0).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-slate-400">Current Debt</p>
                <p className="font-bold text-rose-400 text-sm">
                  Rs. {(selectedCustomer.creditBalance || 0).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-slate-400">Available Credit</p>
                <p className="font-bold text-emerald-400 text-sm">
                  Rs. {Math.max(0, (selectedCustomer.creditLimit || 0) - (selectedCustomer.creditBalance || 0)).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-slate-400">Star Points</p>
                <p className="font-bold text-amber-400 text-sm">
                  {selectedCustomer.starPoints || 0} Pts
                </p>
              </div>
            </div>

            {loadingHistory ? (
              <div className="py-12 text-center text-slate-400">Loading customer history...</div>
            ) : historyData ? (
              <div className="space-y-4">
                {/* Credit Bills Table */}
                <div>
                  <h4 className="font-bold text-white mb-2 flex items-center gap-1.5">
                    <Receipt className="w-4 h-4 text-indigo-400" />
                    Credit Bills ({historyData.creditBills?.length || 0})
                  </h4>
                  {!historyData.creditBills || historyData.creditBills.length === 0 ? (
                    <p className="text-slate-500 italic p-2 rounded-lg bg-slate-950">No credit bills recorded.</p>
                  ) : (
                    <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-800">
                      <table className="w-full text-left">
                        <thead className="bg-slate-950 text-slate-400 text-[11px]">
                          <tr>
                            <th className="p-2">Bill #</th>
                            <th className="p-2">Date</th>
                            <th className="p-2">Total</th>
                            <th className="p-2">Paid</th>
                            <th className="p-2">Balance</th>
                            <th className="p-2">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-850">
                          {historyData.creditBills.map((cb: any) => (
                            <tr key={cb.id} className="text-[11px]">
                              <td className="p-2 font-mono text-white">{cb.billNumber}</td>
                              <td className="p-2 text-slate-400">{new Date(cb.dateGiven).toLocaleDateString()}</td>
                              <td className="p-2 font-mono">Rs. {cb.totalAmount.toLocaleString()}</td>
                              <td className="p-2 font-mono text-emerald-400">Rs. {cb.paidAmount.toLocaleString()}</td>
                              <td className="p-2 font-mono text-rose-400 font-bold">Rs. {cb.balance.toLocaleString()}</td>
                              <td className="p-2">
                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                                  cb.status === "PAID" ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400"
                                }`}>
                                  {cb.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Orders History */}
                <div>
                  <h4 className="font-bold text-white mb-2 flex items-center gap-1.5">
                    <ShoppingBag className="w-4 h-4 text-blue-400" />
                    Recent POS Orders ({historyData.orders?.length || 0})
                  </h4>
                  {!historyData.orders || historyData.orders.length === 0 ? (
                    <p className="text-slate-500 italic p-2 rounded-lg bg-slate-950">No orders placed yet.</p>
                  ) : (
                    <div className="max-h-44 overflow-y-auto space-y-1.5">
                      {historyData.orders.map((o: any) => (
                        <div key={o.id} className="flex justify-between items-center p-2 rounded-lg bg-slate-950 border border-slate-800">
                          <div>
                            <span className="font-mono text-white font-medium">{o.orderNumber}</span>
                            <span className="text-[10px] text-slate-500 ml-2">{new Date(o.createdAt).toLocaleDateString()}</span>
                            <span className="text-[10px] text-indigo-400 ml-2">[{o.paymentMethod}]</span>
                          </div>
                          <span className="font-bold text-white">Rs. {o.totalAmount.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : null}

            <div className="flex justify-end pt-3 border-t border-slate-800">
              <Button variant="outline" size="sm" onClick={() => setHistoryModalOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
