"use client";

import React, { useState } from "react";
import {
  Settings,
  Shield,
  UserCheck,
  Database,
  Cloud,
  CheckCircle2,
  Key,
  Plus,
  Lock,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table";
import { Modal } from "@/components/ui/Modal";

interface SettingsViewProps {
  currentUser?: { name?: string; role?: string };
  onRefresh: () => void;
}

export function SettingsView({ currentUser, onRefresh }: SettingsViewProps) {
  const [addStaffModal, setAddStaffModal] = useState(false);
  const [staffName, setStaffName] = useState("");
  const [staffEmail, setStaffEmail] = useState("");
  const [staffRole, setStaffRole] = useState("CASHIER");
  const [savingStaff, setSavingStaff] = useState(false);

  const staffMembers = [
    {
      name: currentUser?.name || "Administrator",
      email: "admin@truehive.lk",
      role: "SUPER_ADMIN",
      status: "Active",
    },
    {
      name: "Kasun Jayasuriya",
      email: "inventory@truehive.lk",
      role: "INVENTORY_MGR",
      status: "Active",
    },
    {
      name: "Nimanthi Perera",
      email: "cashier1@truehive.lk",
      role: "CASHIER",
      status: "Active",
    },
    {
      name: "Suresh Fernando",
      email: "crm@truehive.lk",
      role: "CRM_AGENT",
      status: "Active",
    },
  ];

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffName || !staffEmail) return;

    setSavingStaff(true);
    try {
      await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "CREATE_STAFF",
          name: staffName,
          email: staffEmail,
          role: staffRole,
        }),
      });
      setStaffName("");
      setStaffEmail("");
      setAddStaffModal(false);
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setSavingStaff(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Settings className="w-5 h-5 text-blue-500" />
          System Settings & Role-Based Access Control (RBAC)
        </h2>
        <p className="text-xs text-slate-400">
          Manage staff permissions, enterprise API credentials, and store configuration.
        </p>
      </div>

      {/* Grid: Staff Table + Integration Health */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Staff Management (8 Cols) */}
        <div className="lg:col-span-8 space-y-4">
          <Card>
            <CardHeader className="border-b border-slate-800/80 pb-3">
              <div>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Shield className="w-4 h-4 text-blue-400" />
                  Staff Members & Role Permissions
                </CardTitle>
                <p className="text-xs text-slate-400">
                  JWT authentication with granular per-route access control.
                </p>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setAddStaffModal(true)}
                leftIcon={<Plus className="w-3.5 h-3.5" />}
              >
                Add Staff
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Staff Member</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Assigned Role</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {staffMembers.map((staff, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-semibold text-white">
                        {staff.name}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-slate-300">
                        {staff.email}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            staff.role === "SUPER_ADMIN"
                              ? "primary"
                              : staff.role === "INVENTORY_MGR"
                              ? "warning"
                              : staff.role === "CASHIER"
                              ? "success"
                              : "neutral"
                          }
                          size="sm"
                        >
                          {staff.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="success" dot size="sm">
                          {staff.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Business Profile Card */}
          <Card>
            <CardHeader className="border-b border-slate-800/80 pb-3">
              <CardTitle className="text-sm">Store & Company Details</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-400">Business Name:</span>
                <p className="font-semibold text-white text-sm mt-0.5">TrueHive Store</p>
              </div>
              <div>
                <span className="text-slate-400">Support Hotline:</span>
                <p className="font-semibold text-white text-sm mt-0.5">+94 78 163 0865</p>
              </div>
              <div>
                <span className="text-slate-400">System Currency:</span>
                <p className="font-semibold text-white text-sm mt-0.5">LKR (Sri Lankan Rupee)</p>
              </div>
              <div>
                <span className="text-slate-400">Project Directory:</span>
                <p className="font-mono text-slate-300 text-xs mt-0.5">E:\truehive-crm</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Integration Status (4 Cols) */}
        <div className="lg:col-span-4 space-y-4">
          <Card>
            <CardHeader className="border-b border-slate-800/80 pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-400" />
                Live Integrations Health
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-4 text-xs">
              {[
                { name: "Supabase PostgreSQL", desc: "aws-1-ap-southeast-2 Pooler", status: "Connected" },
                { name: "Meta WhatsApp Cloud API", desc: "v20.0 Live Webhook", status: "Active" },
                { name: "Gemini 3.5 Flash Loop", desc: "Agentic Tool Calling", status: "Active" },
                { name: "Pusher WebSockets", desc: "Live Broadcast Channels", status: "Connected" },
                { name: "Redis Cache", desc: "Live Stock & Session Store", status: "Active" },
                { name: "Google Workspace API", desc: "Docs & Sheets Sync", status: "Ready" },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between"
                >
                  <div>
                    <p className="font-bold text-white">{item.name}</p>
                    <p className="text-[10px] text-slate-400">{item.desc}</p>
                  </div>
                  <Badge variant="success" dot size="sm">
                    {item.status}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add Staff Modal */}
      <Modal
        isOpen={addStaffModal}
        onClose={() => setAddStaffModal(false)}
        title="Add Staff Member"
        description="Invite a team member with role-based dashboard access."
        maxWidth="md"
      >
        <form onSubmit={handleAddStaff} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1">
              Full Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Dilshan Mendis"
              value={staffName}
              onChange={(e) => setStaffName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1">
              Work Email Address *
            </label>
            <input
              type="email"
              required
              placeholder="dilshan@truehive.lk"
              value={staffEmail}
              onChange={(e) => setStaffEmail(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1">
              System Role *
            </label>
            <select
              value={staffRole}
              onChange={(e) => setStaffRole(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
            >
              <option value="SUPER_ADMIN">SUPER_ADMIN (Full Control)</option>
              <option value="INVENTORY_MGR">INVENTORY_MGR (BOM & Stock)</option>
              <option value="CASHIER">CASHIER (POS Terminal Only)</option>
              <option value="CRM_AGENT">CRM_AGENT (WhatsApp & Leads)</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setAddStaffModal(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" loading={savingStaff}>
              Add Staff Member
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

