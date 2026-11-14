"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Megaphone,
  Calendar,
  Settings,
  Shield,
  Send,
  CheckCircle2,
} from "lucide-react";
import type { LeadItem } from "@/lib/store";

interface CampaignItem {
  id: string;
  campaignName: string;
  segment: string;
  channel: string;
  recipientsCount: number;
  status: string;
  sentAt: string;
}

interface RoleDef {
  role: string;
  title: string;
  description: string;
  allowedModules: string[];
}

interface Props {
  activeSubView: "MARKETING" | "SETTINGS";
  leads: LeadItem[];
}

export function MarketingAndSettingsPanel({ activeSubView, leads }: Props) {
  const [campaigns, setCampaigns] = useState<CampaignItem[]>([]);
  const [campaignName, setCampaignName] = useState("");
  const [segment, setSegment] = useState("HIGH_INTENT");
  const [channel, setChannel] = useState<"WHATSAPP_BROADCAST" | "ZOHO_EMAIL" | "RESEND_DIGEST">(
    "WHATSAPP_BROADCAST"
  );
  const [messageTemplate, setMessageTemplate] = useState(
    "ආයුබෝවන්! TrueHive වෙතින් මෙම සතිඅන්තයේ සියලුම Chocolate Fudge Cakes සහ Brownie Boxes සඳහා 15%ක විශේෂ වට්ටමක්! ඇණවුම් කිරීමට Reply කරන්න."
  );
  const [launching, setLaunching] = useState(false);

  // Settings state
  const [roles, setRoles] = useState<RoleDef[]>([]);
  const [settings, setSettings] = useState({
    businessName: "TrueHive Enterprise (Pvt) Ltd",
    hotlinePhone: "+94 78 163 0865",
    whatsappPhoneId: "104928192839102",
    geminiModel: "gemini-3.5-flash",
    redisDebounceSeconds: 3,
    thermalPrinterWidth: "80mm",
    autoDeductBomOnProcessing: true,
    autoSendOrderStatusWhatsApp: true,
    googleLiveDocId: "1TrueHiveLiveExecutiveReport2026",
    googleLiveSheetId: "1TrueHiveLiveFinancialLedger2026",
  });
  const [savedToast, setSavedToast] = useState(false);

  const loadData = useCallback(async () => {
    const [mRes, sRes] = await Promise.all([fetch("/api/marketing"), fetch("/api/settings")]);
    const [mData, sData] = await Promise.all([mRes.json(), sRes.json()]);
    if (mData.campaigns) setCampaigns(mData.campaigns);
    if (sData.settings) setSettings(sData.settings);
    if (sData.roles) setRoles(sData.roles);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleLaunchCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!campaignName) return;
    setLaunching(true);
    try {
      const res = await fetch("/api/marketing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignName,
          segment,
          channel,
          messageTemplate,
        }),
      });
      const data = await res.json();
      if (data.campaigns) setCampaigns(data.campaigns);
      setCampaignName("");
    } finally {
      setLaunching(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 3000);
  };

  if (activeSubView === "MARKETING") {
    return (
      <div className="space-y-6">
        <div className="grid lg:grid-cols-12 gap-6">
          {/* Campaign Launcher */}
          <div className="lg:col-span-5 bg-[#111827] border border-slate-800 rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-emerald-400" />
              Launch WhatsApp Broadcast / Zoho Campaign
            </h3>
            <form onSubmit={handleLaunchCampaign} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Campaign Title</label>
                <input
                  type="text"
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                  placeholder="e.g. Weekend Cake Lover VIP Broadcast"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-400 block mb-1">Channel</label>
                  <select
                    value={channel}
                    onChange={(e) =>
                      setChannel(
                        e.target.value as "WHATSAPP_BROADCAST" | "ZOHO_EMAIL" | "RESEND_DIGEST"
                      )
                    }
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                  >
                    <option value="WHATSAPP_BROADCAST">WhatsApp Cloud Broadcast</option>
                    <option value="ZOHO_EMAIL">Zoho Marketing Campaign</option>
                    <option value="RESEND_DIGEST">Resend Email Blast</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Target CRM Segment</label>
                  <select
                    value={segment}
                    onChange={(e) => setSegment(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                  >
                    <option value="HIGH_INTENT">High Intent Leads</option>
                    <option value="URGENT_ESCALATION">Urgent Escalations</option>
                    <option value="ALL_CUSTOMERS">All Customers & Leads</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-slate-400 block mb-1">
                  Approved Message Template (Sinhala / English)
                </label>
                <textarea
                  rows={4}
                  value={messageTemplate}
                  onChange={(e) => setMessageTemplate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                />
              </div>
              <button
                type="submit"
                disabled={launching}
                className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold rounded-xl flex items-center justify-center gap-1.5"
              >
                <Send className="w-4 h-4" />
                {launching ? "Dispatching via Redis Queue..." : "Launch Campaign Now"}
              </button>
            </form>
          </div>

          {/* Campaign History & Follow-Up Schedule Calendar */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-[#111827] border border-slate-800 rounded-xl p-5 space-y-3">
              <h3 className="text-sm font-bold text-white">
                Recent WhatsApp Broadcasts & Zoho Campaigns
              </h3>
              <div className="space-y-2">
                {campaigns.map((c) => (
                  <div
                    key={c.id}
                    className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between text-xs"
                  >
                    <div>
                      <p className="font-bold text-white">{c.campaignName}</p>
                      <p className="text-[11px] text-slate-400">
                        {c.channel} • Segment: {c.segment} • {c.sentAt}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-300 font-bold text-[10px]">
                        {c.status} ({c.recipientsCount} recipients)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[#111827] border border-slate-800 rounded-xl p-5 space-y-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-400" />
                Leads Follow-Up Calendar Schedule
              </h3>
              <div className="grid sm:grid-cols-2 gap-3">
                {leads.map((l) => (
                  <div
                    key={l.id}
                    className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs space-y-1"
                  >
                    <div className="flex justify-between font-bold">
                      <span className="text-white">{l.customerName}</span>
                      <span
                        className={
                          l.followUpBucket === "OVERDUE" ? "text-red-400" : "text-amber-400"
                        }
                      >
                        {l.nextFollowUpAt}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 truncate">{l.issueSummary}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // SETTINGS & RBAC MATRIX VIEW
  return (
    <div className="grid lg:grid-cols-12 gap-6">
      <div className="lg:col-span-6 bg-[#111827] border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Settings className="w-4 h-4 text-emerald-400" />
            System, WhatsApp Cloud API & POS Printer Configuration
          </h3>
          {savedToast && (
            <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" /> Saved!
            </span>
          )}
        </div>

        <form onSubmit={handleSaveSettings} className="space-y-3 text-xs">
          <div>
            <label className="text-slate-400 block mb-1">Business Name (Printed on POS Receipts)</label>
            <input
              type="text"
              value={settings.businessName}
              onChange={(e) => setSettings({ ...settings, businessName: e.target.value })}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-400 block mb-1">WhatsApp Phone Number ID</label>
              <input
                type="text"
                value={settings.whatsappPhoneId}
                onChange={(e) => setSettings({ ...settings, whatsappPhoneId: e.target.value })}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Gemini Agentic Model</label>
              <input
                type="text"
                value={settings.geminiModel}
                onChange={(e) => setSettings({ ...settings, geminiModel: e.target.value })}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-400 block mb-1">POS Thermal Printer Paper Width</label>
              <select
                value={settings.thermalPrinterWidth}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    thermalPrinterWidth: e.target.value as "80mm" | "58mm",
                  })
                }
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
              >
                <option value="80mm">80mm Standard Thermal Receipt</option>
                <option value="58mm">58mm Compact Thermal Receipt</option>
              </select>
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Redis Message Debounce (Seconds)</label>
              <input
                type="number"
                value={settings.redisDebounceSeconds}
                onChange={(e) =>
                  setSettings({ ...settings, redisDebounceSeconds: Number(e.target.value) })
                }
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-400 block mb-1">Live Google Doc ID</label>
              <input
                type="text"
                value={settings.googleLiveDocId}
                onChange={(e) => setSettings({ ...settings, googleLiveDocId: e.target.value })}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Live Google Sheet ID</label>
              <input
                type="text"
                value={settings.googleLiveSheetId}
                onChange={(e) => setSettings({ ...settings, googleLiveSheetId: e.target.value })}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold rounded-xl transition"
          >
            Save System Configuration
          </button>
        </form>
      </div>

      {/* Role-Based Access Control (RBAC) Matrix */}
      <div className="lg:col-span-6 bg-[#111827] border border-slate-800 rounded-xl p-5 space-y-3">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Shield className="w-4 h-4 text-emerald-400" />
          JWT Role-Based Access Control (RBAC) Matrix
        </h3>
        <div className="space-y-2.5">
          {roles.map((r) => (
            <div
              key={r.role}
              className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-white">{r.title}</span>
                <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 font-bold">
                  {r.role}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">{r.description}</p>
              <div className="flex flex-wrap gap-1 pt-1">
                {r.allowedModules.map((m) => (
                  <span
                    key={m}
                    className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300"
                  >
                    {m}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
