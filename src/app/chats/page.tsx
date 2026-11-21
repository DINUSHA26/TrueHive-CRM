"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { WhatsAppChatView } from "@/components/views/WhatsAppChatView";
import type { ChatThread } from "@/lib/store";

export default function ChatsPage() {
  const [chats, setChats] = useState<ChatThread[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const cached = sessionStorage.getItem("truehive_cached_chats");
        if (cached) return JSON.parse(cached);
      } catch {}
    }
    return [];
  });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const isFetchingRef = useRef(false);
  const [currentUser, setCurrentUser] = useState<{ name: string; role: string }>({
    name: "Administrator",
    role: "Super Admin",
  });

  const fetchData = useCallback(async (silent = false) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    if (!silent) setIsRefreshing(true);

    try {
      const res = await fetch(`/api/crm?view=chats&_t=${Date.now()}`, {
        cache: "no-store",
      });
      const data = await res.json();
      if (data.chats) {
        setChats(data.chats);
        try {
          sessionStorage.setItem("truehive_cached_chats", JSON.stringify(data.chats));
        } catch {}
      }
    } catch (err) {
      console.error("Failed to load chat threads:", err);
    } finally {
      isFetchingRef.current = false;
      if (!silent) setIsRefreshing(false);
    }
  }, []);

  const handleMarkAsRead = useCallback((chatId: string) => {
    setChats((prevChats) => {
      const updated = prevChats.map((c) =>
        c.id === chatId ? { ...c, unreadCount: 0 } : c
      );
      try {
        sessionStorage.setItem("truehive_cached_chats", JSON.stringify(updated));
      } catch {}
      return updated;
    });
  }, []);

  useEffect(() => {
    fetchData(chats.length > 0);
    const interval = setInterval(() => {
      fetchData(true);
    }, 2500);

    try {
      const savedUser = localStorage.getItem("truehive_user");
      if (savedUser) setCurrentUser(JSON.parse(savedUser));
    } catch {}

    return () => clearInterval(interval);
  }, [fetchData, chats.length]);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {}
    try {
      localStorage.removeItem("truehive_user");
      sessionStorage.removeItem("truehive_user");
    } catch {}
    window.location.href = "/login";
  };

  const totalUnread = chats.reduce((acc, c) => acc + (c.unreadCount || 0), 0);

  return (
    <DashboardLayout
      activeNav="WHATSAPP_CHAT"
      onRefresh={() => fetchData(false)}
      isRefreshing={isRefreshing}
      badges={{ whatsappChat: totalUnread }}
      currentUser={currentUser}
      onLogout={handleLogout}
    >
      <WhatsAppChatView
        chats={chats}
        onRefresh={() => fetchData(true)}
        onMarkAsRead={handleMarkAsRead}
      />
    </DashboardLayout>
  );
}
