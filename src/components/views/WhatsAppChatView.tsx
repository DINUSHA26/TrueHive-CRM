"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  MessageSquare,
  Bot,
  UserCheck,
  Send,
  Sparkles,
  PhoneCall,
  Clock,
  Mic,
  Image as ImageIcon,
  Search,
  CheckCircle2,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
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

export function WhatsAppChatView({ chats, onRefresh, onMarkAsRead }: WhatsAppChatViewProps) {
  const [selectedChatId, setSelectedChatId] = useState<string>(chats[0]?.id || "");
  const [searchQuery, setSearchQuery] = useState("");
  const [replyText, setReplyText] = useState("");
  const [simText, setSimText] = useState("");
  const [simulating, setSimulating] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-sync selected chat if initial chats was empty
  useEffect(() => {
    if (chats.length > 0 && (!selectedChatId || !chats.some((c) => c.id === selectedChatId))) {
      setSelectedChatId(chats[0].id);
    }
  }, [chats, selectedChatId]);

  const filteredChats = chats.filter((c) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.customerName.toLowerCase().includes(q) ||
      c.whatsappPhone.includes(q) ||
      (c.lastMessageText && c.lastMessageText.toLowerCase().includes(q))
    );
  });

  const activeChat = chats.find((c) => c.id === selectedChatId) || filteredChats[0];

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

  // Automatically mark active chat as seen when opened or selected
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
  }, [activeChat?.messages?.length]);

  const handleSelectChat = (chatId: string) => {
    setSelectedChatId(chatId);
    const target = chats.find((c) => c.id === chatId);
    if (target) {
      target.unreadCount = 0;
      markAsRead(chatId);
    }
  };

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

    const messageText = replyText.trim();
    setReplyText("");

    // Optimistically show message immediately
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
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSimulateIncoming = async () => {
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
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setSimulating(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Info Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-600/20 text-emerald-400 shrink-0">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Meta WhatsApp Cloud API Live Chat</h3>
            <p className="text-xs text-slate-400">
              Autonomous Gemini Agentic Tool Loop responds in real-time. Human agent handover toggles instantly.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="success" dot>
            Cloud API Active
          </Badge>
          <Badge variant="primary">Gemini 3.5 Flash Loop</Badge>
        </div>
      </div>

      {/* Main 2-Column Split: Chat Room List & Active Conversation */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-[calc(100vh-220px)] min-h-[500px]">
        {/* Left Column: Conversations List (5 Cols) */}
        <div className="lg:col-span-5 bg-slate-900/90 border border-slate-800/80 rounded-2xl flex flex-col overflow-hidden">
          {/* Search Bar */}
          <div className="p-3 border-b border-slate-800/80">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search chats by name or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Conversation List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60 custom-scrollbar">
            {filteredChats.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                No chats match your search query.
              </div>
            ) : (
              filteredChats.map((chat) => {
                const isSelected = activeChat?.id === chat.id;
                return (
                  <button
                    key={chat.id}
                    onClick={() => handleSelectChat(chat.id)}
                    className={`w-full p-3.5 text-left flex items-start justify-between gap-3 transition ${
                      isSelected
                        ? "bg-blue-600/15 border-l-4 border-blue-500"
                        : "hover:bg-slate-800/40"
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-xs font-bold text-white truncate">
                          {chat.customerName}
                        </span>
                        <span className="text-[10px] text-slate-400 shrink-0">
                          {chat.lastMessageAt || "Recently"}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 font-mono mb-1">{chat.whatsappPhone}</p>
                      <p className="text-xs text-slate-300 truncate">{chat.lastMessageText}</p>
                    </div>

                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      {chat.unreadCount > 0 && (
                        <span className="w-5 h-5 rounded-full bg-emerald-500 text-slate-950 text-[10px] font-black flex items-center justify-center">
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
                        {chat.isAiActive ? "AI Mode" : "Human Agent"}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Active Conversation (7 Cols) */}
        <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800/80 rounded-2xl flex flex-col overflow-hidden">
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
              <div className="p-3.5 border-b border-slate-800/80 flex items-center justify-between gap-3 shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold shrink-0">
                    {activeChat.customerName.charAt(0) || "U"}
                  </div>
                  <div className="truncate">
                    <h4 className="text-sm font-bold text-white truncate">
                      {activeChat.customerName}
                    </h4>
                    <p className="text-xs text-slate-400 font-mono">{activeChat.whatsappPhone}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleHandover(activeChat)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
                      activeChat.isAiActive
                        ? "bg-indigo-600 hover:bg-indigo-500 text-white"
                        : "bg-amber-600 hover:bg-amber-500 text-white"
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
                        Human Active (Resume AI)
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Message History */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3 custom-scrollbar">
                {activeChat.messages.map((msg) => {
                  const isCustomer = msg.senderType === "CUSTOMER";
                  const isAi = msg.senderType === "AI_BOT";
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isCustomer ? "items-start" : "items-end"}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-xs ${
                          isCustomer
                            ? "bg-slate-800 text-slate-100 border border-slate-700/60 rounded-tl-none"
                            : isAi
                            ? "bg-indigo-600/90 text-white rounded-tr-none shadow-md"
                            : "bg-blue-600 text-white rounded-tr-none shadow-md"
                        }`}
                      >
                        <div className="flex items-center gap-1.5 mb-1 text-[10px] opacity-75">
                          {isAi ? (
                            <span className="flex items-center gap-1 font-bold">
                              <Sparkles className="w-3 h-3" /> Gemini Agent
                            </span>
                          ) : msg.senderType === "HUMAN_AGENT" ? (
                            <span className="font-bold">Staff Agent</span>
                          ) : (
                            <span>{activeChat.customerName}</span>
                          )}
                          <span>•</span>
                          <span>{msg.timestamp}</span>
                        </div>
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Reply Form & Simulation Toolbar */}
              <div className="p-3 border-t border-slate-800/80 space-y-2 shrink-0">
                <form onSubmit={handleSendReply} className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Type official WhatsApp reply to customer..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    className="flex-1 px-3 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    rightIcon={<Send className="w-3.5 h-3.5" />}
                  >
                    Send
                  </Button>
                </form>

                {/* Simulate incoming customer message for testing */}
                <div className="flex items-center gap-2 pt-1 border-t border-slate-800/50">
                  <input
                    type="text"
                    placeholder="Simulate customer WhatsApp message (triggers Gemini Loop)..."
                    value={simText}
                    onChange={(e) => setSimText(e.target.value)}
                    className="flex-1 px-2.5 py-1.5 bg-slate-950/40 border border-slate-800/60 rounded-lg text-[11px] text-slate-300 placeholder-slate-600 focus:outline-none"
                  />
                  <Button
                    variant="secondary"
                    size="sm"
                    loading={simulating}
                    onClick={handleSimulateIncoming}
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
    </div>
  );
}
