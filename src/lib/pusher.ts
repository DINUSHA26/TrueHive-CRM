import PusherServer from "pusher";
import PusherClient from "pusher-js";

export const pusherServer =
  process.env.PUSHER_APP_ID && process.env.PUSHER_KEY && process.env.PUSHER_SECRET
    ? new PusherServer({
        appId: process.env.PUSHER_APP_ID,
        key: process.env.PUSHER_KEY,
        secret: process.env.PUSHER_SECRET,
        cluster: process.env.PUSHER_CLUSTER || "ap2",
        useTLS: true,
      })
    : null;

let pusherClientInstance: PusherClient | null = null;

export function getPusherClient(): PusherClient | null {
  if (typeof window === "undefined") return null;
  if (pusherClientInstance) return pusherClientInstance;

  const key = process.env.NEXT_PUBLIC_PUSHER_KEY || "ee4125fcfe677b96bcd3";
  const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER || "ap2";
  if (!key) return null;

  pusherClientInstance = new PusherClient(key, { cluster });
  return pusherClientInstance;
}

export const CHANNELS = {
  STOCK_SYNC: "truehive-stock-sync",
  LIVE_CHAT: "truehive-live-chat",
  ORDERS: "truehive-orders",
  ALERTS: "truehive-alerts",
};

export async function broadcastRealtimeEvent(
  channel: string,
  event: string,
  data: Record<string, unknown>
): Promise<void> {
  if (!pusherServer) return;
  try {
    await pusherServer.trigger(channel, event, data);
  } catch (err) {
    console.error("[Pusher Broadcast Error]:", err);
  }
}
