"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  MessageSquare,
  Bot,
  UserCheck,
  Send,
  Sparkles,
  Search,
  CheckCheck,
  Check,
  ArrowLeft,
  MoreVertical,
  Smile,
  Paperclip,
  Archive,
  MessageSquarePlus,
  Radio,
  Users,
  RefreshCw,
  X,
  ShieldCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import type { ChatThread } from "@/lib/store";
import { getPusherClient, CHANNELS } from "@/lib/pusher";

interface WhatsAppChatViewProps {
  chats: ChatThread[];
  onRefresh: () => void;
  onMarkAsRead?: (chatId: string) => void;
}

type FilterChip = "ALL" | "UNREAD" | "AI_ACTIVE" | "HUMAN_AGENT";
type MobileScreen = "LIST" | "CHAT";

/**
 * WhatsApp Delivery & Read Status Ticks Component
 * 1 Grey Tick: Sent (Data Off / Server received)
 * 2 Grey Ticks: Delivered (Data On / Delivered to phone)
 * 2 Blue Ticks: Read / Seen by Customer
 */
function MessageTicks({
  direction,
  status,
}: {
  direction: "INBOUND" | "OUTBOUND";
  status?: "SENT" | "DELIVERED" | "READ";
}) {
  if (direction === "INBOUND") return null;

  // Single grey tick: Sent (Customer phone data is off)
  if (status === "SENT") {
    return (
      <span title="Sent (Customer data off)" className="inline-flex items-center ml-1">
        <Check className="w-3.5 h-3.5 text-slate-400" />
      </span>
    );
  }

  // Double grey ticks: Delivered (Customer phone data is on)
  if (status === "DELIVERED") {
    return (
      <span title="Delivered (Data on)" className="inline-flex items-center ml-1">
        <CheckCheck className="w-3.5 h-3.5 text-slate-400" />
      </span>
    );
  }

  // Double blue ticks: Read / Seen by customer (Default for seen/replied messages)
  return (
    <span title="Read / Seen" className="inline-flex items-center ml-1">
      <CheckCheck className="w-3.5 h-3.5 text-[#53bdeb]" />
    </span>
  );
}

export function WhatsAppChatView({ chats, onRefresh, onMarkAsRead }: WhatsAppChatViewProps) {
  const [selectedChatId, setSelectedChatId] = useState<string>(chats[0]?.id || "");
  const [mobileScreen, setMobileScreen] = useState<MobileScreen>("LIST");
  const [filterChip, setFilterChip] = useState<FilterChip>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [replyText, setReplyText] = useState("");
  const [simText, setSimText] = useState("");
  const [simulating, setSimulating] = useState(false);
  const [showSimModal, setShowSimModal] = useState(false);
  const [mobileTab, setMobileTab] = useState<"CHATS" | "UPDATES" | "COMMUNITIES" | "AI_STUDIO">("CHATS");

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-sync selected chat if initial chats was empty
  useEffect(() => {
    if (chats.length > 0 && (!selectedChatId || !chats.some((c) => c.id === selectedChatId))) {
      setSelectedChatId(chats[0].id);
    }
  }, [chats, selectedChatId]);

  // Filter chats by search query and filter chips
  const filteredChats = chats.filter((c) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const match =
        c.customerName.toLowerCase().includes(q) ||
        c.whatsappPhone.includes(q) ||
        (c.lastMessageText && c.lastMessageText.toLowerCase().includes(q));
      if (!match) return false;
    }

    if (filterChip === "UNREAD") return c.unreadCount > 0;
    if (filterChip === "AI_ACTIVE") return c.isAiActive;
    if (filterChip === "HUMAN_AGENT") return !c.isAiActive;
    return true;
  });

  const activeChat = chats.find((c) => c.id === selectedChatId) || filteredChats[0] || chats[0];

  // Browser / Phone Back Button Support:
  // When inside mobile chat screen, pressing hardware back or browser back returns to LIST instead of home!
  useEffect(() => {
    const handlePopState = () => {
      if (mobileScreen === "CHAT") {
        setMobileScreen("LIST");
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [mobileScreen]);

  const handleOpenChatOnMobile = (chatId: string) => {
    setSelectedChatId(chatId);
    setMobileScreen("CHAT");

    // Push browser history state so mobile back button returns to chat list safely
    if (typeof window !== "undefined") {
      window.history.pushState({ screen: "chat", chatId }, "", `#chat-${chatId}`);
    }

    const target = chats.find((c) => c.id === chatId);
    if (target) {
      target.unreadCount = 0;
      markAsRead(chatId);
    }
  };

  const handleBackToChatList = () => {
    if (typeof window !== "undefined" && window.location.hash.startsWith("#chat-")) {
      window.history.back();
    } else {
      setMobileScreen("LIST");
    }
  };

  // Mark chat as read in both local state and backend database
  const markAsRead = useCallback(
    async (chatId: string) => {
      if (!chatId) return;
      if (onMarkAsRead) {
        onMarkAsRead(chatId);
      }
      try {
        await fetch("/api/crm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "MARK_AS_READ", chatId }),
        });
      } catch (err) {
        console.warn("[CRM] Failed to mark chat as read:", err);
      }
    },
    [onMarkAsRead]
  );

  // Automatically mark active chat as seen when opened
  useEffect(() => {
    if (activeChat && activeChat.unreadCount > 0) {
      activeChat.unreadCount = 0;
      markAsRead(activeChat.id);
    }
  }, [activeChat?.id, activeChat?.unreadCount, markAsRead]);

  // Realtime Pusher subscription
  useEffect(() => {
    const pusher = getPusherClient();
    if (pusher) {
      const channel = pusher.subscribe(CHANNELS.LIVE_CHAT);
      channel.bind("message-received", (data: any) => {
        onRefresh();
        if (data?.chatRoomId && data.chatRoomId === selectedChatId) {
          markAsRead(data.chatRoomId);
        }
      });
      channel.bind("message-sent", () => onRefresh());
      channel.bind("chat-read", (data: any) => {
        if (data?.chatRoomId && onMarkAsRead) {
          onMarkAsRead(data.chatRoomId);
        }
      });
      return () => {
        channel.unbind_all();
        channel.unsubscribe();
      };
    }
  }, [onRefresh, selectedChatId, markAsRead, onMarkAsRead]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeChat?.messages?.length, mobileScreen]);

  const handleToggleHandover = async (chat: ChatThread) => {
    chat.isAiActive = !chat.isAiActive;
    try {
      await fetch("/api/crm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "TOGGLE_HANDOVER",
          chatId: chat.id,
          isAiActive: chat.isAiActive,
        }),
      });
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !activeChat) return;

    // Requirement: When AI is active, staff replying must switch to Staff Mode!
    if (activeChat.isAiActive) {
      activeChat.isAiActive = false;
      try {
        await fetch("/api/crm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "TOGGLE_HANDOVER",
            chatId: activeChat.id,
            isAiActive: false,
          }),
        });
      } catch (err) {
        console.error("Failed to auto-handover to staff:", err);
      }
    }

    const messageText = replyText.trim();
    setReplyText("");

    // Optimistically show message immediately with 1 Grey Tick (SENT)
    const optimisticMessage = {
      id: `local-${Date.now()}`,
      direction: "OUTBOUND" as const,
      senderType: "HUMAN_AGENT" as const,
      messageType: "TEXT" as const,
      content: messageText,
      timestamp: new Date().toLocaleTimeString("en-US", {
        timeZone: "Asia/Colombo",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      }),
      status: "SENT" as "SENT" | "DELIVERED" | "READ", // 1 Tick: sent to server, awaiting delivery
    };

    if (activeChat.messages) {
      activeChat.messages.push(optimisticMessage);
    }
    activeChat.lastMessageText = messageText;
    activeChat.lastMessageAt = optimisticMessage.timestamp;
    activeChat.unreadCount = 0;
    if (onMarkAsRead) {
      onMarkAsRead(activeChat.id);
    }

    try {
      await fetch("/api/crm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "SEND_REPLY",
          chatId: activeChat.id,
          text: messageText,
        }),
      });

      // Update tick to DELIVERED (2 grey ticks)
      optimisticMessage.status = "DELIVERED";
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSimulateIncoming = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!simText.trim() || !activeChat) return;
    setSimulating(true);
    try {
      await fetch("/api/crm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "SIMULATE_INCOMING",
          phone: activeChat.whatsappPhone,
          customerName: activeChat.customerName,
          text: simText.trim(),
        }),
      });
      setSimText("");
      setShowSimModal(false);
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setSimulating(false);
    }
  };

  // Helper avatar letter color
  const getAvatarBg = (name: string) => {
    const colors = [
      "bg-emerald-600",
      "bg-blue-600",
      "bg-purple-600",
      "bg-amber-600",
      "bg-rose-600",
      "bg-teal-600",
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash += name.charCodeAt(i);
    return colors[hash % colors.length];
  };


  return (
    <div className="w-full flex flex-col space-y-3">
      {/* ========================================================
          DESKTOP & TABLET TOP BANNER: CLOUD API STATUS & GEMINI STATS
          ======================================================== */}
      <div className="hidden lg:flex items-center justify-between p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/15 text-emerald-400 shrink-0">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white">Meta WhatsApp Cloud API Live Chat</h3>
              <Badge variant="success" dot className="text-[10px]">
                Live Webhook Connected
              </Badge>
            </div>
            <p className="text-xs text-slate-400">
              Autonomous Gemini Agentic Tool Loop responds in real-time. Human agent takeover toggles instantly.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="primary" className="text-xs font-semibold">
            Gemini 3.5 Flash Loop
          </Badge>
          <button
            onClick={onRefresh}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-white transition"
            title="Refresh Chats"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ========================================================
          MOBILE VIEW (SCREENS < LG): SCREEN 1 (LIST) & SCREEN 2 (CHAT)
          ======================================================== */}
      <div className="block lg:hidden w-full">
        {/* ========================================================
            MOBILE SCREEN 1: WHATSAPP CHAT LIST (Matches Image 1)
            ======================================================== */}
        {mobileScreen === "LIST" && (
          <div className="w-full bg-[#0b141a] text-slate-100 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl flex flex-col min-h-[640px] max-h-[86vh]">
            {/* Top Desktop Feature Sync Banner on Mobile */}
            <div className="px-3 py-1.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Cloud API Live</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-indigo-300 bg-indigo-500/20 px-2 py-0.5 rounded-full font-bold">
                  Gemini Loop
                </span>
                <button
                  onClick={onRefresh}
                  className="text-slate-400 hover:text-white p-1"
                  title="Refresh Chats"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Top WhatsApp Mobile App Bar (Camera removed per instruction) */}
            <div className="px-4 pt-3 pb-2 bg-[#0b141a] flex items-center justify-between border-b border-[#202c33]/60">
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                <span>WhatsApp</span>
                <span className="w-2 h-2 rounded-full bg-[#25D366] animate-pulse inline-block" />
              </h1>
              <div className="flex items-center gap-3 text-[#8696a0]">
                <button type="button" className="p-1 hover:text-white transition">
                  <MoreVertical className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Meta AI Search Bar */}
            <div className="px-3 py-2 bg-[#0b141a]">
              <div className="relative flex items-center bg-[#202c33] rounded-full px-3.5 py-2">
                <Search className="w-4 h-4 text-[#8696a0] mr-2 shrink-0" />
                <input
                  type="text"
                  placeholder="Ask Meta AI or Search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent text-xs text-white placeholder-[#8696a0] focus:outline-none"
                />
              </div>
            </div>

            {/* Filter Chips Bar (All, Unread, AI Mode, Staff Mode) */}
            <div className="px-3 py-1 flex items-center gap-2 overflow-x-auto no-scrollbar whitespace-nowrap border-b border-[#202c33]/40 pb-2">
              <button
                type="button"
                onClick={() => setFilterChip("ALL")}
                className={`px-3.5 py-1 rounded-full text-xs font-semibold transition ${
                  filterChip === "ALL"
                    ? "bg-[#103629] text-[#25D366] border border-[#25D366]/40"
                    : "bg-[#202c33] text-[#8696a0] hover:bg-[#2a3942]"
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setFilterChip("UNREAD")}
                className={`px-3.5 py-1 rounded-full text-xs font-semibold transition ${
                  filterChip === "UNREAD"
                    ? "bg-[#103629] text-[#25D366] border border-[#25D366]/40"
                    : "bg-[#202c33] text-[#8696a0] hover:bg-[#2a3942]"
                }`}
              >
                Unread
              </button>
              <button
                type="button"
                onClick={() => setFilterChip("AI_ACTIVE")}
                className={`px-3.5 py-1 rounded-full text-xs font-semibold transition ${
                  filterChip === "AI_ACTIVE"
                    ? "bg-[#103629] text-[#25D366] border border-[#25D366]/40"
                    : "bg-[#202c33] text-[#8696a0] hover:bg-[#2a3942]"
                }`}
              >
                AI Mode
              </button>
              <button
                type="button"
                onClick={() => setFilterChip("HUMAN_AGENT")}
                className={`px-3.5 py-1 rounded-full text-xs font-semibold transition ${
                  filterChip === "HUMAN_AGENT"
                    ? "bg-[#103629] text-[#25D366] border border-[#25D366]/40"
                    : "bg-[#202c33] text-[#8696a0] hover:bg-[#2a3942]"
                }`}
              >
                Staff Mode
              </button>
            </div>

            {/* Archived Header Row */}
            <div className="px-4 py-2 flex items-center justify-between text-xs text-[#8696a0] border-b border-[#202c33]/30">
              <div className="flex items-center gap-3">
                <Archive className="w-4 h-4 text-[#8696a0]" />
                <span className="font-semibold text-white">Archived</span>
              </div>
              <span className="text-[11px] text-[#25D366] font-bold">Live Sync</span>
            </div>

            {/* Mobile Chat List Rows */}
            <div className="flex-1 overflow-y-auto divide-y divide-[#202c33]/30 custom-scrollbar pb-16">
              {filteredChats.length === 0 ? (
                <div className="p-8 text-center text-xs text-[#8696a0]">
                  No WhatsApp conversations match your criteria.
                </div>
              ) : (
                filteredChats.map((chat) => {
                  const avatarColor = getAvatarBg(chat.customerName);
                  const lastMsg = chat.messages?.[chat.messages.length - 1];
                  const isOutbound = lastMsg ? lastMsg.direction === "OUTBOUND" : true;

                  return (
                    <div
                      key={chat.id}
                      onClick={() => handleOpenChatOnMobile(chat.id)}
                      className="w-full px-3.5 py-3 flex items-center gap-3 hover:bg-[#202c33]/50 active:bg-[#202c33] transition cursor-pointer"
                    >
                      {/* Avatar */}
                      <div
                        className={`w-12 h-12 rounded-full ${avatarColor} text-white font-bold text-base flex items-center justify-center shrink-0 shadow`}
                      >
                        {chat.customerName.charAt(0).toUpperCase() || "U"}
                      </div>

                      {/* Info & Snippet */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <h4 className="text-sm font-semibold text-white truncate max-w-[190px]">
                            {chat.customerName}
                          </h4>
                          <span
                            className={`text-[11px] shrink-0 ${
                              chat.unreadCount > 0 ? "text-[#25D366] font-bold" : "text-[#8696a0]"
                            }`}
                          >
                            {chat.lastMessageAt || "Recently"}
                          </span>
                        </div>

                        <div className="flex items-center justify-between gap-1">
                          <p className="text-xs text-[#8696a0] truncate flex items-center gap-0.5">
                            {isOutbound && (
                              <MessageTicks
                                direction="OUTBOUND"
                                status={lastMsg?.status || "READ"}
                              />
                            )}
                            <span className="truncate ml-1">{chat.lastMessageText || "No messages yet"}</span>
                          </p>

                          {chat.unreadCount > 0 ? (
                            <span className="w-5 h-5 rounded-full bg-[#25D366] text-[#0b141a] font-extrabold text-[10px] flex items-center justify-center shrink-0">
                              {chat.unreadCount}
                            </span>
                          ) : chat.isAiActive ? (
                            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-semibold shrink-0">
                              AI
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Mobile Bottom Navigation Bar */}
            <div className="h-14 bg-[#0b141a] border-t border-[#202c33] flex items-center justify-around px-2 z-10 shrink-0">
              <button
                type="button"
                onClick={() => setMobileTab("CHATS")}
                className="flex flex-col items-center gap-0.5"
              >
                <div className="px-3.5 py-0.5 rounded-full bg-[#103629] text-[#25D366]">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold text-[#25D366]">Chats</span>
              </button>

              <button
                type="button"
                onClick={() => setMobileTab("UPDATES")}
                className="flex flex-col items-center gap-0.5 text-[#8696a0] hover:text-white"
              >
                <Radio className="w-5 h-5" />
                <span className="text-[10px]">Updates</span>
              </button>

              <button
                type="button"
                onClick={() => setMobileTab("COMMUNITIES")}
                className="flex flex-col items-center gap-0.5 text-[#8696a0] hover:text-white"
              >
                <Users className="w-5 h-5" />
                <span className="text-[10px]">Communities</span>
              </button>

              <button
                type="button"
                onClick={() => setShowSimModal(true)}
                className="flex flex-col items-center gap-0.5 text-[#8696a0] hover:text-white"
              >
                <Bot className="w-5 h-5 text-indigo-400" />
                <span className="text-[10px] text-indigo-300">AI Studio</span>
              </button>
            </div>
          </div>
        )}

        {/* ========================================================
            MOBILE SCREEN 2: FIXED FULLSCREEN CONVERSATION VIEW
            Fixes: Header permanently sticky at top, user info clearly visible,
            Back button returns safely to list, Middle scrolls perfectly!
            ======================================================== */}
        {mobileScreen === "CHAT" && (
          <div className="fixed inset-0 z-50 bg-[#0b141a] text-slate-100 flex flex-col h-[100dvh] w-full overflow-hidden animate-fade-in">
            {/* Top WhatsApp Conversation Header (Sticky at top, always visible) */}
            <div className="px-2 py-2.5 bg-[#1f2c34] flex items-center justify-between border-b border-[#202c33] shrink-0 sticky top-0 z-30 shadow-md">
              <div className="flex items-center gap-1.5 min-w-0">
                {/* Back Arrow button to return to Chat List without reloading home */}
                <button
                  type="button"
                  onClick={handleBackToChatList}
                  className="p-1.5 rounded-full text-white hover:bg-[#2a3942] transition active:scale-90"
                  title="Back to Chat List"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>

                {/* Avatar */}
                <div
                  className={`w-9 h-9 rounded-full ${getAvatarBg(
                    activeChat?.customerName || "U"
                  )} text-white font-bold text-sm flex items-center justify-center shrink-0 shadow`}
                >
                  {activeChat?.customerName?.charAt(0).toUpperCase() || "U"}
                </div>

                {/* User Name & WhatsApp Phone */}
                <div className="min-w-0 leading-tight">
                  <h3 className="text-sm font-semibold text-white truncate max-w-[150px]">
                    {activeChat?.customerName}
                  </h3>
                  <span className="text-[11px] text-[#8696a0] font-mono truncate block">
                    {activeChat?.whatsappPhone}
                  </span>
                </div>
              </div>

              {/* Header Right Actions (Camera & Calls removed) */}
              <div className="flex items-center gap-2 shrink-0">
                {/* Handover Toggle Pill */}
                <button
                  type="button"
                  onClick={() => activeChat && handleToggleHandover(activeChat)}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-bold flex items-center gap-1 transition ${
                    activeChat?.isAiActive
                      ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/40"
                      : "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                  }`}
                  title={activeChat?.isAiActive ? "Switch to Staff Mode" : "Switch to Gemini AI Loop"}
                >
                  {activeChat?.isAiActive ? (
                    <>
                      <Bot className="w-3.5 h-3.5" />
                      <span>AI Mode</span>
                    </>
                  ) : (
                    <>
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Staff Mode</span>
                    </>
                  )}
                </button>


                <button type="button" className="p-1 text-[#8696a0] hover:text-white">
                  <MoreVertical className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Conversation Messages Canvas (Middle scrollable area) */}
            <div
              className="flex-1 p-3 overflow-y-auto space-y-2.5 custom-scrollbar bg-[#0b141a]"
              style={{
                backgroundImage:
                  "radial-gradient(#1f2c34 0.75px, transparent 0.75px), radial-gradient(#1f2c34 0.75px, #0b141a 0.75px)",
                backgroundSize: "30px 30px",
                backgroundPosition: "0 0, 15px 15px",
              }}
            >
              {/* Date Separator Pill */}
              <div className="flex justify-center my-2">
                <span className="px-3 py-1 rounded-lg bg-[#182229] border border-[#222e35] text-[11px] text-[#8696a0] font-medium shadow-sm">
                  {activeChat?.lastMessageAt ? `Live Chat • ${activeChat.lastMessageAt}` : "Today"}
                </span>
              </div>

              {activeChat?.messages?.map((msg) => {
                const isCustomer = msg.senderType === "CUSTOMER";
                const isAi = msg.senderType === "AI_BOT";

                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isCustomer ? "items-start" : "items-end"} w-full`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-[13px] relative shadow-sm ${
                        isCustomer
                          ? "bg-[#202c33] text-white rounded-tl-none border border-[#2a3942]/40"
                          : isAi
                          ? "bg-[#005c4b] text-white rounded-tr-none border border-indigo-400/30"
                          : "bg-[#005c4b] text-white rounded-tr-none"
                      }`}
                    >
                      {/* AI Header if Bot generated */}
                      {isAi && (
                        <div className="flex items-center gap-1 text-[10px] font-bold text-indigo-300 mb-1">
                          <Sparkles className="w-3 h-3 text-indigo-400" />
                          <span>Gemini Agent Loop</span>
                        </div>
                      )}

                      {/* Content */}
                      <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>

                      {/* Timestamp & Accurate WhatsApp Delivery / Read Ticks */}
                      <div className="flex items-center justify-end gap-1 mt-1 text-[10px] text-[#8696a0] select-none">
                        <span>{msg.timestamp}</span>
                        {!isCustomer && (
                          <MessageTicks
                            direction="OUTBOUND"
                            status={msg.status || "READ"}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Bottom Warning if AI Mode is Active (Requirement: Staff must switch to staff mode to reply) */}
            {activeChat?.isAiActive && (
              <div className="px-3 py-2 bg-indigo-950/80 border-t border-indigo-800/50 flex items-center justify-between text-xs text-indigo-200 shrink-0">
                <span className="flex items-center gap-1.5 truncate">
                  <Bot className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <span className="truncate">AI Bot is active. Type reply to switch to Staff Mode.</span>
                </span>
                <button
                  type="button"
                  onClick={() => handleToggleHandover(activeChat)}
                  className="px-2 py-0.5 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[10px] shrink-0 ml-2"
                >
                  Take Over
                </button>
              </div>
            )}

            {/* Bottom WhatsApp Input Bar (Camera removed per instruction) */}
            <div className="p-2 bg-[#1f2c34] border-t border-[#202c33] flex items-center gap-2 shrink-0 sticky bottom-0 z-30">
              <div className="flex-1 flex items-center bg-[#2a3942] rounded-full px-3 py-1.5 gap-2">
                <button type="button" className="text-[#8696a0] hover:text-white transition">
                  <Smile className="w-5 h-5" />
                </button>
                <form onSubmit={handleSendReply} className="flex-1">
                  <input
                    type="text"
                    placeholder="Message"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    className="w-full bg-transparent text-xs text-white placeholder-[#8696a0] focus:outline-none"
                  />
                </form>
                <button type="button" className="text-[#8696a0] hover:text-white transition">
                  <Paperclip className="w-4 h-4" />
                </button>
              </div>

              {/* Round Green Send Button */}
              <button
                type="button"
                onClick={(e) => handleSendReply(e as any)}
                className="w-10 h-10 rounded-full bg-[#00a884] hover:bg-[#00c59b] text-white flex items-center justify-center shrink-0 shadow-lg transition active:scale-95"
              >
                <Send className="w-4 h-4 translate-x-0.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================
          DESKTOP VIEW (SCREENS >= LG): WIDESCREEN 2-COLUMN LAYOUT
          "kalin hadhapu eke ewa desktop view ekedhi dhiga athata dhanna eke adhala wena dhe yatathe dhanna"
          ======================================================== */}
      <div className="hidden lg:grid grid-cols-12 gap-4 h-[calc(100vh-230px)] min-h-[560px]">
        {/* Left Column: Conversations List (5 Cols) */}
        <div className="col-span-5 bg-slate-900/90 border border-slate-800 rounded-2xl flex flex-col overflow-hidden shadow-sm">
          {/* Top Search & Filter Bar */}
          <div className="p-3 border-b border-slate-800 space-y-2">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search chats by name or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Filter Tabs on Desktop */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar whitespace-nowrap pt-1">
              <button
                type="button"
                onClick={() => setFilterChip("ALL")}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                  filterChip === "ALL"
                    ? "bg-emerald-600 text-white"
                    : "bg-slate-800/60 text-slate-400 hover:text-white"
                }`}
              >
                All Chats
              </button>
              <button
                type="button"
                onClick={() => setFilterChip("UNREAD")}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                  filterChip === "UNREAD"
                    ? "bg-emerald-600 text-white"
                    : "bg-slate-800/60 text-slate-400 hover:text-white"
                }`}
              >
                Unread
              </button>
              <button
                type="button"
                onClick={() => setFilterChip("AI_ACTIVE")}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                  filterChip === "AI_ACTIVE"
                    ? "bg-emerald-600 text-white"
                    : "bg-slate-800/60 text-slate-400 hover:text-white"
                }`}
              >
                AI Mode
              </button>
              <button
                type="button"
                onClick={() => setFilterChip("HUMAN_AGENT")}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                  filterChip === "HUMAN_AGENT"
                    ? "bg-emerald-600 text-white"
                    : "bg-slate-800/60 text-slate-400 hover:text-white"
                }`}
              >
                Staff Mode
              </button>
            </div>
          </div>

          {/* Conversation List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60 custom-scrollbar">
            {filteredChats.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No chats match your search query.
              </div>
            ) : (
              filteredChats.map((chat) => {
                const isSelected = activeChat?.id === chat.id;
                const avatarColor = getAvatarBg(chat.customerName);
                const lastMsg = chat.messages?.[chat.messages.length - 1];
                const isOutbound = lastMsg ? lastMsg.direction === "OUTBOUND" : true;

                return (
                  <button
                    key={chat.id}
                    onClick={() => {
                      setSelectedChatId(chat.id);
                      chat.unreadCount = 0;
                      markAsRead(chat.id);
                    }}
                    className={`w-full p-3.5 text-left flex items-start justify-between gap-3 transition ${
                      isSelected
                        ? "bg-emerald-500/15 border-l-4 border-emerald-500"
                        : "hover:bg-slate-800/40"
                    }`}
                  >
                    {/* Round Avatar */}
                    <div
                      className={`w-11 h-11 rounded-full ${avatarColor} text-white font-bold text-sm flex items-center justify-center shrink-0 shadow mt-0.5`}
                    >
                      {chat.customerName.charAt(0).toUpperCase() || "U"}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-xs font-bold text-white truncate">
                          {chat.customerName}
                        </span>
                        <span
                          className={`text-[10px] shrink-0 ${
                            chat.unreadCount > 0 ? "text-emerald-400 font-bold" : "text-slate-400"
                          }`}
                        >
                          {chat.lastMessageAt || "Recently"}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 font-mono mb-1">{chat.whatsappPhone}</p>
                      <p className="text-xs text-slate-300 truncate flex items-center gap-0.5">
                        {isOutbound && (
                          <MessageTicks
                            direction="OUTBOUND"
                            status={lastMsg?.status || "READ"}
                          />
                        )}
                        <span className="truncate ml-1">{chat.lastMessageText || "No messages yet"}</span>
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      {chat.unreadCount > 0 && (
                        <span className="w-5 h-5 rounded-full bg-[#25D366] text-slate-950 text-[10px] font-black flex items-center justify-center">
                          {chat.unreadCount}
                        </span>
                      )}
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                          chat.isAiActive
                            ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                            : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                        }`}
                      >
                        {chat.isAiActive ? "AI Mode" : "Staff"}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Active Conversation (7 Cols) */}
        <div className="col-span-7 bg-slate-900/90 border border-slate-800 rounded-2xl flex flex-col overflow-hidden shadow-sm">
          {!activeChat ? (
            <div className="flex-1 flex items-center justify-center p-6">
              <EmptyState
                icon={<MessageSquare className="w-8 h-8" />}
                title="Select a chat"
                description="Choose a conversation from the left to view message history, AI actions, or respond directly."
              />
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="p-3.5 border-b border-slate-800 flex items-center justify-between gap-3 shrink-0 bg-slate-950/40">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-full ${getAvatarBg(
                      activeChat.customerName
                    )} text-white font-bold text-sm flex items-center justify-center shrink-0 shadow`}
                  >
                    {activeChat.customerName.charAt(0).toUpperCase() || "U"}
                  </div>
                  <div className="truncate">
                    <h4 className="text-sm font-bold text-white truncate">
                      {activeChat.customerName}
                    </h4>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400 font-mono">{activeChat.whatsappPhone}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleHandover(activeChat)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
                      activeChat.isAiActive
                        ? "bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm"
                        : "bg-amber-600 hover:bg-amber-500 text-white shadow-sm"
                    }`}
                  >
                    {activeChat.isAiActive ? (
                      <>
                        <Bot className="w-3.5 h-3.5" />
                        AI Active (Take Over)
                      </>
                    ) : (
                      <>
                        <UserCheck className="w-3.5 h-3.5" />
                        Staff Active (Resume AI)
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Message History Canvas */}
              <div
                className="flex-1 p-4 overflow-y-auto space-y-3 custom-scrollbar bg-[#0b141a]"
                style={{
                  backgroundImage:
                    "radial-gradient(#1f2c34 0.75px, transparent 0.75px), radial-gradient(#1f2c34 0.75px, #0b141a 0.75px)",
                  backgroundSize: "30px 30px",
                  backgroundPosition: "0 0, 15px 15px",
                }}
              >
                {/* Date separator pill */}
                <div className="flex justify-center my-1">
                  <span className="px-3 py-1 rounded-lg bg-[#182229] border border-[#222e35] text-[11px] text-[#8696a0] font-medium shadow-sm">
                    {activeChat.lastMessageAt ? `Live Chat • ${activeChat.lastMessageAt}` : "Today"}
                  </span>
                </div>

                {activeChat.messages.map((msg) => {
                  const isCustomer = msg.senderType === "CUSTOMER";
                  const isAi = msg.senderType === "AI_BOT";

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isCustomer ? "items-start" : "items-end"}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-xs shadow-md ${
                          isCustomer
                            ? "bg-[#202c33] text-white rounded-tl-none border border-[#2a3942]/50"
                            : isAi
                            ? "bg-[#005c4b] text-white rounded-tr-none border border-indigo-400/40"
                            : "bg-[#005c4b] text-white rounded-tr-none"
                        }`}
                      >
                        {/* Sender Label */}
                        <div className="flex items-center gap-1.5 mb-1 text-[10px] opacity-80 select-none">
                          {isAi ? (
                            <span className="flex items-center gap-1 font-bold text-indigo-300">
                              <Sparkles className="w-3 h-3 text-indigo-400" /> Gemini Agent
                            </span>
                          ) : msg.senderType === "HUMAN_AGENT" ? (
                            <span className="font-bold text-emerald-200">Staff Agent</span>
                          ) : (
                            <span className="font-bold text-slate-300">{activeChat.customerName}</span>
                          )}
                          <span>•</span>
                          <span>{msg.timestamp}</span>
                        </div>

                        {/* Content */}
                        <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>

                        {/* WhatsApp Delivery / Read Ticks for outbound messages */}
                        {!isCustomer && (
                          <div className="flex items-center justify-end gap-1 mt-1 text-[10px] text-emerald-200/80 select-none">
                            <MessageTicks
                              direction="OUTBOUND"
                              status={msg.status || "READ"}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Bottom Warning if AI Mode is active on Desktop */}
              {activeChat.isAiActive && (
                <div className="px-4 py-2 bg-indigo-950/70 border-t border-indigo-800/40 flex items-center justify-between text-xs text-indigo-200 shrink-0">
                  <span className="flex items-center gap-2">
                    <Bot className="w-4 h-4 text-indigo-400 shrink-0" />
                    <span>
                      <strong>AI Auto-Agent Loop Active:</strong> Typing a reply will automatically switch chat to Staff Mode.
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={() => handleToggleHandover(activeChat)}
                    className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs"
                  >
                    Switch to Staff Mode
                  </button>
                </div>
              )}

              {/* Bottom Reply Form & Simulation Controls placed cleanly underneath */}
              <div className="p-3 border-t border-slate-800 space-y-2 shrink-0 bg-slate-950/60">
                <form onSubmit={handleSendReply} className="flex items-center gap-2">
                  <div className="flex-1 flex items-center bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 gap-2">
                    <Paperclip className="w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Type official WhatsApp reply to customer..."
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      className="flex-1 bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none"
                    />
                  </div>
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    className="bg-[#00a884] hover:bg-[#00c59b] border-none text-white font-bold"
                    rightIcon={<Send className="w-3.5 h-3.5" />}
                  >
                    Send
                  </Button>
                </form>

                {/* Simulate incoming customer message right under the relevant section */}
                <div className="flex items-center gap-2 pt-1 border-t border-slate-800/60">
                  <span className="text-[10px] text-slate-500 font-bold shrink-0 uppercase tracking-wider">
                    Test Loop:
                  </span>
                  <input
                    type="text"
                    placeholder="Simulate customer WhatsApp message (triggers Gemini Loop)..."
                    value={simText}
                    onChange={(e) => setSimText(e.target.value)}
                    className="flex-1 px-2.5 py-1.5 bg-slate-950 border border-slate-800/80 rounded-lg text-[11px] text-slate-300 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                  />
                  <Button
                    variant="secondary"
                    size="sm"
                    loading={simulating}
                    onClick={() => handleSimulateIncoming()}
                    className="text-xs"
                  >
                    Simulate
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ========================================================
          SIMULATION MODAL / QUICK DRAWER (FOR TESTING GEMINI LOOP ON MOBILE)
          ======================================================== */}
      {showSimModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-800 p-4 shadow-2xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                <Sparkles className="w-4 h-4" />
                <span>Simulate Customer WhatsApp</span>
              </div>
              <button
                type="button"
                onClick={() => setShowSimModal(false)}
                className="text-slate-400 hover:text-white text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Send a test message as{" "}
              <strong className="text-white">{activeChat?.customerName || "Customer"}</strong> (
              <span className="font-mono text-emerald-400">{activeChat?.whatsappPhone}</span>). This will trigger
              the live Gemini 3.5 Agentic Tool Loop.
            </p>

            <form onSubmit={handleSimulateIncoming} className="space-y-3">
              <textarea
                rows={3}
                required
                value={simText}
                onChange={(e) => setSimText(e.target.value)}
                placeholder="e.g. Can I order 2 chocolate cakes? Or what is my credit balance?"
                className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
              />

              <div className="flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSimModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  loading={simulating}
                  className="bg-[#00a884] hover:bg-[#00c59b] border-none text-white font-bold"
                >
                  Trigger Gemini Loop
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
