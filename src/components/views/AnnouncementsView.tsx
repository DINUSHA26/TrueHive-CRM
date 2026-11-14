"use client";

import React, { useState } from "react";
import {
  Megaphone,
  Send,
  Sparkles,
  Users,
  CheckCircle2,
  Clock,
  RefreshCw,
  MessageSquare,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

interface AnnouncementsViewProps {
  onRefresh: () => void;
}

export function AnnouncementsView({ onRefresh }: AnnouncementsViewProps) {
  const [broadcastTitle, setBroadcastTitle] = useState("");
  const [broadcastBody, setBroadcastBody] = useState("");
  const [targetAudience, setTargetAudience] = useState("ALL_CUSTOMERS");
  const [sending, setSending] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const [zohoSyncing, setZohoSyncing] = useState(false);

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle || !broadcastBody) return;

    setSending(true);
    try {
      const res = await fetch("/api/marketing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "WHATSAPP_BROADCAST",
          title: broadcastTitle,
          message: broadcastBody,
          targetAudience,
        }),
      });
      const data = await res.json();
      setStatusMsg(data.message || "Broadcast successfully dispatched to WhatsApp Cloud API queue!");
      setBroadcastTitle("");
      setBroadcastBody("");
      setTimeout(() => setStatusMsg(""), 6000);
      onRefresh();
    } catch (err) {
      console.error(err);
      setStatusMsg("Failed to dispatch broadcast");
    } finally {
      setSending(false);
    }
  };

  const handleZohoSync = async () => {
    setZohoSyncing(true);
    try {
      const res = await fetch("/api/crm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "SYNC_ZOHO" }),
      });
      const data = await res.json();
      setStatusMsg(data.message || "Customer segments synced to Zoho Campaigns!");
      setTimeout(() => setStatusMsg(""), 6000);
    } catch {
      setStatusMsg("Failed to sync with Zoho");
    } finally {
      setZohoSyncing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-purple-400" />
            Announcements & WhatsApp Broadcasts
          </h2>
          <p className="text-xs text-slate-400">
            Send bulk announcements, promotional offers, and service updates to segmented audiences.
          </p>
        </div>

        <Button
          variant="secondary"
          size="sm"
          onClick={handleZohoSync}
          loading={zohoSyncing}
          leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
        >
          Sync Zoho Campaigns
        </Button>
      </div>

      {statusMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          {statusMsg}
        </div>
      )}

      {/* Grid: Broadcast Creator + Campaign Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Creator (7 Cols) */}
        <div className="lg:col-span-7">
          <Card>
            <CardHeader className="border-b border-slate-800/80 pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Send className="w-4 h-4 text-purple-400" />
                Compose WhatsApp Broadcast
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <form onSubmit={handleSendBroadcast} className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">
                    Campaign / Announcement Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Weekend Flash Sale & New Arrivals"
                    value={broadcastTitle}
                    onChange={(e) => setBroadcastTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">
                    Target Audience Segment
                  </label>
                  <select
                    value={targetAudience}
                    onChange={(e) => setTargetAudience(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="ALL_CUSTOMERS">All Registered Customers</option>
                    <option value="VIP_CUSTOMERS">VIP High-Spend Customers</option>
                    <option value="PENDING_LEADS">Leads with Pending Quotes</option>
                    <option value="WALK_IN_RETAIL">Retail POS Walk-in Buyers</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">
                    Announcement Message Body *
                  </label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Hello {{customer_name}}, we are excited to announce..."
                    value={broadcastBody}
                    onChange={(e) => setBroadcastBody(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500 font-sans"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Use <code className="text-blue-400">{"{{customer_name}}"}</code> to personalize each message dynamically.
                  </p>
                </div>

                <div className="pt-2 flex justify-end">
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    loading={sending}
                    leftIcon={<Send className="w-3.5 h-3.5" />}
                  >
                    Dispatch via Meta Cloud API
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Campaign Stats & History (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <Card>
            <CardHeader className="border-b border-slate-800/80 pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                Delivery Performance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4 text-xs">
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
                <span className="text-slate-400">Average Read Rate:</span>
                <span className="text-emerald-400 font-bold text-sm">94.2%</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
                <span className="text-slate-400">Meta WhatsApp Cloud Health:</span>
                <Badge variant="success" dot size="sm">
                  Tier 1 Verified
                </Badge>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
                <span className="text-slate-400">Zoho Campaigns Integration:</span>
                <Badge variant="primary" size="sm">
                  Two-Way Sync Ready
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

