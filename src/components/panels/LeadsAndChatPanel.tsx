"use client";

import React, { useState } from "react";
import {
  AlertTriangle,
  PhoneCall,
  MessageSquare,
  Bot,
  UserCheck,
  Send,
  Sparkles,
  Clock,
  Share2,
  Wrench,
  PlusCircle,
  CalendarPlus,
  Mic,
  Image as ImageIcon,
  X,
} from "lucide-react";
import type { LeadItem, ChatThread } from "@/lib/store";

interface Props {
  leads: LeadItem[];
  chats: ChatThread[];
  activeView: "LEADS_CRM" | "LIVE_CHAT";
  onRefresh: () => void;
}

export function LeadsAndChatPanel({ leads, chats, activeView, onRefresh }: Props) {
  const [stageFilter, setStageFilter] = useState<string>("ALL");
  const [intentFilter, setIntentFilter] = useState<string>("ALL");
  const [followUpFilter, setFollowUpFilter] = useState<string>("ALL");
  const [specificDate, setSpecificDate] = useState<string>("");
  const [searchText, setSearchText] = useState("");
  const [noteInputMap, setNoteInputMap] = useState<Record<string, string>>({});
  const [zohoStatus, setZohoStatus] = useState("");

  // + Add Appointment Modal State (GenLead SL Top-Right Button)
  const [addApptOpen, setAddApptOpen] = useState(false);
  const [apptName, setApptName] = useState("");
  const [apptPhone, setApptPhone] = useState("9477");
  const [apptIssue, setApptIssue] = useState("");
  const [apptTime, setApptTime] = useState("Tomorrow, 10:30 AM");

  // Live Chat State
  const [selectedChatId, setSelectedChatId] = useState<string>(chats[0]?.id || "");
  const [humanReplyText, setHumanReplyText] = useState("");
  const [simCustomerMessage, setSimCustomerMessage] = useState("");
  const [simRunning, setSimRunning] = useState(false);

  const selectedChat = chats.find((c) => c.id === selectedChatId) || chats[0];

  const overdueCount = leads.filter((l) => l.followUpBucket === "OVERDUE").length;
  const todayCount = leads.filter((l) => l.followUpBucket === "TODAY").length;

  const filteredLeads = leads.filter((l) => {
    if (stageFilter !== "ALL" && l.stage !== stageFilter) return false;
    if (intentFilter !== "ALL" && l.intent !== intentFilter) return false;
    if (followUpFilter !== "ALL" && l.followUpBucket !== followUpFilter) return false;
    if (
      searchText &&
      !l.customerName.toLowerCase().includes(searchText.toLowerCase()) &&
      !l.phone.includes(searchText) &&
      !l.issueSummary.toLowerCase().includes(searchText.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  const handleStageChange = async (leadId: string, stage: string) => {
    await fetch("/api/crm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "UPDATE_LEAD", leadId, stage }),
    });
    onRefresh();
  };

  const handleAddNote = async (leadId: string) => {
    const note = noteInputMap[leadId];
    if (!note) return;
    await fetch("/api/crm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "UPDATE_LEAD", leadId, note }),
    });
    setNoteInputMap((prev) => ({ ...prev, [leadId]: "" }));
    onRefresh();
  };

  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apptName) return;
    await fetch("/api/crm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "CREATE_APPOINTMENT",
        customerName: apptName,
        phone: apptPhone,
        issueSummary: apptIssue,
        nextFollowUpAt: apptTime,
      }),
    });
    setApptName("");
    setApptIssue("");
    setAddApptOpen(false);
    onRefresh();
  };

  const handleSyncZoho = async () => {
    setZohoStatus("Syncing leads to Zoho Marketing Campaigns...");
    const res = await fetch("/api/crm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "SYNC_ZOHO" }),
    });
    const data = await res.json();
    setZohoStatus(data.message || "Synced to Zoho Campaigns");
    setTimeout(() => setZohoStatus(""), 5000);
  };

  const handleToggleHandover = async (chat: ChatThread) => {
    await fetch("/api/crm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "TOGGLE_HANDOVER",
        chatId: chat.id,
        isAiActive: !chat.isAiActive,
      }),
    });
    onRefresh();
  };

  const handleSendHumanReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChat || !humanReplyText.trim()) return;
    await fetch("/api/crm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "SEND_HUMAN_REPLY",
        chatId: selectedChat.id,
        message: humanReplyText,
      }),
    });
    setHumanReplyText("");
    onRefresh();
  };

  const triggerSimulatedWebhook = async (
    message: string,
    messageType: "TEXT" | "AUDIO" | "IMAGE" = "TEXT"
  ) => {
    if (!selectedChat || !message.trim()) return;
    setSimRunning(true);
    try {
      await fetch("/api/webhooks/whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: selectedChat.whatsappPhone,
          customerName: selectedChat.customerName,
          message,
          messageType,
        }),
      });
      setSimCustomerMessage("");
      onRefresh();
    } finally {
      setSimRunning(false);
    }
  };

  if (activeView === "LEADS_CRM") {
    return (
      <div className="space-y-5">
        {/* + Add Appointment Modal */}
        {addApptOpen && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#111827] border border-slate-700 rounded-2xl max-w-md w-full p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <CalendarPlus className="w-4 h-4 text-emerald-400" />
                  Schedule New Customer Appointment / Lead
                </h3>
                <button
                  onClick={() => setAddApptOpen(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <form onSubmit={handleCreateAppointment} className="space-y-3 text-xs">
                <div>
                  <label className="text-slate-400 block mb-1">Customer Name</label>
                  <input
                    type="text"
                    value={apptName}
                    onChange={(e) => setApptName(e.target.value)}
                    placeholder="e.g. Dilshan Jayasuriya"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                    required
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">WhatsApp Phone</label>
                  <input
                    type="text"
                    value={apptPhone}
                    onChange={(e) => setApptPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                    required
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Requirement / Inquiry Summary</label>
                  <input
                    type="text"
                    value={apptIssue}
                    onChange={(e) => setApptIssue(e.target.value)}
                    placeholder="e.g. Custom 20kg Corporate Anniversary Cake Tasting"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                    required
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Scheduled Follow-Up Date & Time</label>
                  <input
                    type="text"
                    value={apptTime}
                    onChange={(e) => setApptTime(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold rounded-xl"
                >
                  Save Appointment to Pipeline
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Top Header & Stage Tabs (GenLead SL Style) */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-[#111827] border border-slate-800 rounded-xl p-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              Customer Leads & Job Pipeline
            </h2>
            <p className="text-xs text-slate-400">
              Track inbound customer inquiries captured & qualified by your WhatsApp Gemini AI
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {(["ALL", "NEW", "CONTACTED", "SCHEDULED", "COMPLETED", "LOST"] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStageFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  stageFilter === st
                    ? "bg-emerald-500 text-slate-950"
                    : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
                }`}
              >
                {st === "ALL" ? `ALL LEADS (${leads.length})` : st}
              </button>
            ))}

            <button
              onClick={() => setAddApptOpen(true)}
              className="ml-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-xs font-bold flex items-center gap-1"
            >
              + Add Appointment
            </button>

            <button
              onClick={handleSyncZoho}
              className="px-3 py-1.5 rounded-lg bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 text-xs font-bold flex items-center gap-1.5 hover:bg-indigo-500/30"
            >
              <Share2 className="w-3.5 h-3.5" />
              Sync Zoho
            </button>
          </div>
        </div>

        {zohoStatus && (
          <div className="p-3 rounded-xl bg-indigo-500/15 border border-indigo-500/40 text-indigo-300 text-xs font-semibold">
            {zohoStatus}
          </div>
        )}

        {/* Overdue Follow-up Alert Banner */}
        <div className="bg-amber-950/30 border border-amber-500/40 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-amber-300">
                {overdueCount} follow-up overdue! You have {todayCount} leads scheduled for follow-up today.
              </p>
              <p className="text-[11px] text-amber-200/70">
                Promptly calling high-intent WhatsApp leads on scheduled dates dramatically boosts order conversion.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFollowUpFilter("TODAY")}
              className="px-3 py-1.5 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold"
            >
              Today ({todayCount})
            </button>
            <button
              onClick={() => setFollowUpFilter("OVERDUE")}
              className="px-3 py-1.5 rounded-lg bg-red-500/20 border border-red-500/40 text-red-300 text-xs font-bold"
            >
              Overdue ({overdueCount})
            </button>
            <input
              type="date"
              value={specificDate}
              onChange={(e) => setSpecificDate(e.target.value)}
              className="px-2.5 py-1 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-300"
            />
            {followUpFilter !== "ALL" && (
              <button
                onClick={() => setFollowUpFilter("ALL")}
                className="px-2.5 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Search & Intent Filter Row */}
        <div className="bg-[#111827] border border-slate-800 rounded-xl p-4 space-y-3">
          <input
            type="text"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="Search by customer name, WhatsApp phone, town or AI-extracted requirement..."
            className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500"
          />

          <div className="flex flex-wrap items-center gap-2">
            {[
              { key: "ALL", label: `All Intent (${leads.length})` },
              { key: "HIGH_INTENT", label: "High Intent" },
              { key: "ENGAGED", label: "Engaged" },
              { key: "EXPLORING", label: "Exploring" },
              { key: "URGENT_ESCALATION", label: "URGENT ESCALATION" },
            ].map((item) => (
              <button
                key={item.key}
                onClick={() => setIntentFilter(item.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                  intentFilter === item.key
                    ? "bg-emerald-500/20 border-emerald-500 text-emerald-300"
                    : "bg-slate-900/90 border-slate-800 text-slate-400 hover:border-slate-700"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Lead Cards List */}
        <div className="space-y-3">
          {filteredLeads.map((lead) => (
            <div
              key={lead.id}
              className="bg-[#111827] border border-slate-800 hover:border-slate-700 rounded-xl p-5 space-y-3 transition"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h3 className="text-sm font-bold text-white">{lead.customerName}</h3>
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                    {lead.phone}
                  </span>
                  <span
                    className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                      lead.intent === "URGENT_ESCALATION"
                        ? "bg-red-500/20 border-red-500/40 text-red-300"
                        : "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
                    }`}
                  >
                    {lead.intent.replace("_", " ")}
                  </span>
                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-amber-400" /> {lead.nextFollowUpAt}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={lead.stage}
                    onChange={(e) => handleStageChange(lead.id, e.target.value)}
                    className="px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs font-bold text-white"
                  >
                    <option value="NEW">NEW</option>
                    <option value="CONTACTED">CONTACTED</option>
                    <option value="SCHEDULED">SCHEDULED</option>
                    <option value="COMPLETED">COMPLETED</option>
                    <option value="LOST">LOST</option>
                  </select>

                  <a
                    href={`https://wa.me/${lead.phone}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5"
                  >
                    <MessageSquare className="w-3.5 h-3.5" /> WhatsApp
                  </a>
                  <a
                    href={`tel:+${lead.phone}`}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center gap-1.5 border border-slate-700"
                  >
                    <PhoneCall className="w-3.5 h-3.5" /> Call Directly
                  </a>
                </div>
              </div>

              <p className="text-xs text-slate-200">
                <span className="text-slate-400">Issue: </span>
                {lead.issueSummary}
              </p>

              {/* AI-Extracted Structured Badges */}
              <div className="flex flex-wrap gap-2 text-[11px]">
                <span className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300">
                  Type of Business: <strong className="text-white">{lead.businessType}</strong>
                </span>
                <span className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300">
                  Order / Volume: <strong className="text-white">{lead.dailyMessageVolume}</strong>
                </span>
                <span className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300">
                  Media / Voice / Slip Processed:{" "}
                  <strong className="text-emerald-400">{lead.needsMediaSupport}</strong>
                </span>
              </div>

              {/* Call Notes */}
              <div className="pt-2 border-t border-slate-800/80 space-y-2">
                {lead.callNotes.map((note, idx) => (
                  <div
                    key={idx}
                    className="text-xs bg-slate-900/90 border border-slate-800 px-3 py-1.5 rounded-lg text-slate-300"
                  >
                    📝 {note}
                  </div>
                ))}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={noteInputMap[lead.id] || ""}
                    onChange={(e) =>
                      setNoteInputMap((prev) => ({ ...prev, [lead.id]: e.target.value }))
                    }
                    placeholder="+ Add call notes or follow-up outcome..."
                    className="flex-1 px-3 py-1.5 bg-slate-900/60 border border-slate-800 rounded-lg text-xs text-white"
                  />
                  <button
                    onClick={() => handleAddNote(lead.id)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded-lg text-slate-200 flex items-center gap-1"
                  >
                    <PlusCircle className="w-3.5 h-3.5" /> Save Note
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // LIVE WHATSAPP CHAT & AGENTIC LOOP VIEW
  return (
    <div className="grid lg:grid-cols-12 gap-6">
      {/* Left Thread List */}
      <div className="lg:col-span-4 bg-[#111827] border border-slate-800 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <h3 className="text-sm font-bold text-white">WhatsApp Cloud API Inbox</h3>
          <span className="text-[11px] text-emerald-400 font-semibold">Live Pusher Sync</span>
        </div>

        <div className="space-y-2">
          {chats.map((chat) => (
            <div
              key={chat.id}
              onClick={() => setSelectedChatId(chat.id)}
              className={`p-3 rounded-xl border cursor-pointer transition ${
                selectedChat?.id === chat.id
                  ? "bg-slate-800/90 border-emerald-500/50"
                  : "bg-slate-900/60 border-slate-800 hover:border-slate-700"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">{chat.customerName}</span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    chat.isAiActive
                      ? "bg-emerald-500/20 text-emerald-300"
                      : "bg-amber-500/20 text-amber-300"
                  }`}
                >
                  {chat.isAiActive ? "🤖 AI Bot Active" : "👤 Human Handover"}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono mt-0.5">{chat.whatsappPhone}</p>
              <p className="text-xs text-slate-300 truncate mt-1.5">{chat.lastMessageText}</p>
            </div>
          ))}
        </div>

        {/* Inbound Customer Simulator to test the Gemini Agentic Loop live */}
        <div className="mt-4 pt-4 border-t border-slate-800 space-y-2.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
            <Sparkles className="w-4 h-4" />
            Test Inbound Customer WhatsApp (Multimodal)
          </div>
          <p className="text-[11px] text-slate-400">
            Simulate Text, Sinhala Voice Note, or Bank Slip Image to watch Redis Buffer + Gemini Agentic Tool Calling:
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              triggerSimulatedWebhook(simCustomerMessage, "TEXT");
            }}
            className="space-y-2"
          >
            <input
              type="text"
              value={simCustomerMessage}
              onChange={(e) => setSimCustomerMessage(e.target.value)}
              placeholder="e.g. Cake stock keeyada? or Urgent human agent one!"
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
            />
            <button
              type="submit"
              disabled={simRunning}
              className="w-full py-2 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 rounded-lg text-xs font-bold transition"
            >
              {simRunning ? "Running Gemini Agentic Loop..." : "Send Simulated Customer Text"}
            </button>
          </form>

          {/* Multimodal Quick Simulator Buttons */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              disabled={simRunning}
              onClick={() =>
                triggerSimulatedWebhook(
                  "[Voice Note 0:08]: Mata Belgian Chocolate Cake 1kg ekak order karanna one No 15, Galle Rd, Bambalapitiya walata COD",
                  "AUDIO"
                )
              }
              className="py-1.5 px-2 rounded-lg bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/30 text-indigo-300 text-[11px] font-semibold flex items-center justify-center gap-1"
            >
              <Mic className="w-3.5 h-3.5" /> Sim Voice Note
            </button>
            <button
              type="button"
              disabled={simRunning}
              onClick={() =>
                triggerSimulatedWebhook(
                  "[Cloudinary Bank Receipt Image]: Commercial Bank Transfer LKR 3,850 for #ORD-2501",
                  "IMAGE"
                )
              }
              className="py-1.5 px-2 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-[11px] font-semibold flex items-center justify-center gap-1"
            >
              <ImageIcon className="w-3.5 h-3.5" /> Sim Bank Slip
            </button>
          </div>
        </div>
      </div>

      {/* Right Active Conversation & Handover Controls */}
      <div className="lg:col-span-8 bg-[#111827] border border-slate-800 rounded-xl p-5 flex flex-col justify-between min-h-[540px]">
        {selectedChat ? (
          <>
            {/* Top Bar with Human Handover Toggle */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  {selectedChat.customerName}
                  <span className="text-xs font-mono text-slate-400">
                    ({selectedChat.whatsappPhone})
                  </span>
                </h3>
                <p className="text-[11px] text-slate-400">
                  Status:{" "}
                  <strong className={selectedChat.isAiActive ? "text-emerald-400" : "text-amber-400"}>
                    {selectedChat.handoverStatus}
                  </strong>
                </p>
              </div>

              <button
                onClick={() => handleToggleHandover(selectedChat)}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition ${
                  selectedChat.isAiActive
                    ? "bg-amber-500 hover:bg-amber-400 text-slate-950"
                    : "bg-emerald-500 hover:bg-emerald-400 text-slate-950"
                }`}
              >
                {selectedChat.isAiActive ? (
                  <>
                    <UserCheck className="w-4 h-4" /> Take Over Chat (Pause AI / Human Mode)
                  </>
                ) : (
                  <>
                    <Bot className="w-4 h-4" /> Resume Gemini AI Automation
                  </>
                )}
              </button>
            </div>

            {/* Messages Feed with Agent Tool Traces */}
            <div className="flex-1 py-4 space-y-3 overflow-y-auto max-h-[380px] pr-1">
              {selectedChat.messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex flex-col ${
                    m.direction === "INBOUND" ? "items-start" : "items-end"
                  }`}
                >
                  <div
                    className={`max-w-[82%] rounded-2xl px-4 py-2.5 text-xs space-y-1.5 ${
                      m.direction === "INBOUND"
                        ? "bg-slate-800 text-slate-100"
                        : m.senderType === "HUMAN_AGENT"
                        ? "bg-amber-500/20 border border-amber-500/40 text-amber-100"
                        : m.senderType === "SYSTEM"
                        ? "bg-indigo-500/20 border border-indigo-500/40 text-indigo-200"
                        : "bg-emerald-500/20 border border-emerald-500/40 text-emerald-100"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-4 text-[10px] opacity-75 font-bold">
                      <span>
                        {m.senderType} ({m.messageType})
                      </span>
                      <span>{m.timestamp}</span>
                    </div>
                    <p className="whitespace-pre-line leading-relaxed">{m.content}</p>

                    {m.toolCalls && m.toolCalls.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-emerald-500/30 space-y-1">
                        <span className="text-[10px] font-bold text-emerald-300 flex items-center gap-1">
                          <Wrench className="w-3 h-3" /> Agentic Loop Tools Executed:
                        </span>
                        {m.toolCalls.map((tc, i) => (
                          <div
                            key={i}
                            className="text-[10px] font-mono bg-slate-950/70 px-2 py-1 rounded text-emerald-300"
                          >
                            ⚡ {tc}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom Human Agent Reply Input */}
            <form onSubmit={handleSendHumanReply} className="pt-3 border-t border-slate-800 flex gap-2">
              <input
                type="text"
                value={humanReplyText}
                onChange={(e) => setHumanReplyText(e.target.value)}
                placeholder="Send manual staff reply via WhatsApp Cloud API..."
                className="flex-1 px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
              />
              <button
                type="submit"
                className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" /> Send Reply
              </button>
            </form>
          </>
        ) : null}
      </div>
    </div>
  );
}
