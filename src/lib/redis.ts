import Redis from "ioredis";

const globalForRedis = globalThis as unknown as {
  redis: Redis | null;
  memoryStore: Map<string, { value: string; expiresAt?: number }>;
};

if (!globalForRedis.memoryStore) {
  globalForRedis.memoryStore = new Map();
}

export function getRedisClient(): Redis | null {
  if (globalForRedis.redis !== undefined) return globalForRedis.redis;
  if (!process.env.REDIS_URL) {
    globalForRedis.redis = null;
    return null;
  }
  try {
    const client = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 1,
      connectTimeout: 800,
      commandTimeout: 1000,
      lazyConnect: true,
    });
    globalForRedis.redis = client;
    return client;
  } catch {
    globalForRedis.redis = null;
    return null;
  }
}

/**
 * Buffers rapid consecutive WhatsApp messages from the same phone number
 * (e.g. Customer sends "Hi", "Cake 1kg", "Price?" within 3 seconds)
 * so the Gemini Agentic Loop processes them together efficiently.
 */
export async function bufferWhatsAppMessage(
  phone: string,
  messageText: string,
  ttlSeconds = 30
): Promise<string[]> {
  const key = `wa:buffer:${phone}`;
  const redis = getRedisClient();

  if (redis) {
    try {
      await redis.rpush(key, messageText);
      await redis.expire(key, ttlSeconds);
      return await redis.lrange(key, 0, -1);
    } catch {
      // Fallback to memory store
    }
  }

  const existing = globalForRedis.memoryStore.get(key);
  const list: string[] = existing ? JSON.parse(existing.value) : [];
  list.push(messageText);
  globalForRedis.memoryStore.set(key, {
    value: JSON.stringify(list),
    expiresAt: Date.now() + ttlSeconds * 1000,
  });
  return list;
}

export async function consumeBufferedWhatsAppMessages(phone: string): Promise<string> {
  const key = `wa:buffer:${phone}`;
  const redis = getRedisClient();

  if (redis) {
    try {
      const messages = await redis.lrange(key, 0, -1);
      await redis.del(key);
      return messages.join("\n");
    } catch {
      // Fallback
    }
  }

  const existing = globalForRedis.memoryStore.get(key);
  globalForRedis.memoryStore.delete(key);
  if (!existing) return "";
  const list: string[] = JSON.parse(existing.value);
  return list.join("\n");
}

/**
 * Webhook Idempotency: Prevents duplicate processing of the same WhatsApp message ID
 */
export async function markWebhookProcessed(waMessageId: string): Promise<boolean> {
  const key = `wa:msg:${waMessageId}`;
  const redis = getRedisClient();

  if (redis) {
    try {
      const res = await redis.set(key, "1", "EX", 86400, "NX");
      return res === "OK";
    } catch {
      // Fallback
    }
  }

  if (globalForRedis.memoryStore.has(key)) return false;
  globalForRedis.memoryStore.set(key, { value: "1", expiresAt: Date.now() + 86400 * 1000 });
  return true;
}

/**
 * Live Stock Cache for sub-millisecond POS & WhatsApp Bot checks
 */
export async function updateLiveStockCache(sku: string, stock: number): Promise<void> {
  const key = `stock:sku:${sku}`;
  const redis = getRedisClient();
  if (redis) {
    try {
      await redis.set(key, String(stock), "EX", 3600);
      return;
    } catch {
      // Fallback
    }
  }
  globalForRedis.memoryStore.set(key, { value: String(stock) });
}
