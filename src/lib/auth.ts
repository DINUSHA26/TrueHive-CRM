import { cookies } from "next/headers";

export type RoleType =
  | "SUPER_ADMIN"
  | "MANAGER"
  | "CASHIER_POS"
  | "SUPPORT_AGENT"
  | "INVENTORY_STAFF"
  | "ACCOUNTANT";

export interface JWTPayload {
  userId?: string;
  id?: string;
  email: string;
  name: string;
  role: RoleType;
  exp?: number;
  iat?: number;
  permissions?: string[];
}

export const AUTH_COOKIE_NAME = "truehive_token";

/**
 * Decodes and validates a JWT token without requiring backend secrets in the frontend.
 * - Extracts and decodes the standard base64url JWT payload.
 * - Checks expiration timestamp (`exp`).
 * - Ensures required identity claims (`email`, `role`) exist.
 *
 * Cryptographic signature verification is strictly performed by the NestJS backend on all API requests.
 */
export function decodeAndValidateToken(token: string): JWTPayload | null {
  if (!token || typeof token !== "string") return null;

  const parts = token.trim().split(".");
  if (parts.length !== 3) return null;

  try {
    const payloadBase64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload =
      typeof atob === "function"
        ? atob(payloadBase64)
        : Buffer.from(payloadBase64, "base64").toString("utf-8");

    const payload = JSON.parse(jsonPayload) as JWTPayload;

    // Check expiration if exp is present (exp is in seconds)
    if (payload.exp && typeof payload.exp === "number") {
      const nowInSeconds = Math.floor(Date.now() / 1000);
      if (payload.exp < nowInSeconds) {
        // Token has expired
        return null;
      }
    }

    if (!payload.email || !payload.role) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

/**
 * Validates a JWT session token for Next.js route protection.
 * Decoupled: Frontend verifies structure & active TTL; Backend verifies crypto signature.
 */
export async function verifyJwtToken(token: string): Promise<JWTPayload | null> {
  return decodeAndValidateToken(token);
}

export async function getCurrentUser(): Promise<JWTPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
    if (!token) return null;
    return decodeAndValidateToken(token);
  } catch {
    return null;
  }
}

export const ROLE_PERMISSIONS: Record<RoleType, string[]> = {
  SUPER_ADMIN: [
    "DASHBOARD",
    "POS",
    "LEADS_CRM",
    "LIVE_CHAT",
    "ORDERS",
    "PRODUCTS_BARCODE",
    "INGREDIENTS_BOM",
    "SUPPLIERS_PO",
    "CASHFLOW_FINANCE",
    "REPORTS_GOOGLE_DOCS",
    "MARKETING_ZOHO",
    "SETTINGS",
  ],
  MANAGER: [
    "DASHBOARD",
    "POS",
    "LEADS_CRM",
    "LIVE_CHAT",
    "ORDERS",
    "PRODUCTS_BARCODE",
    "INGREDIENTS_BOM",
    "SUPPLIERS_PO",
    "REPORTS_GOOGLE_DOCS",
    "MARKETING_ZOHO",
  ],
  CASHIER_POS: ["POS", "ORDERS", "PRODUCTS_BARCODE"],
  SUPPORT_AGENT: ["DASHBOARD", "LEADS_CRM", "LIVE_CHAT", "ORDERS"],
  INVENTORY_STAFF: ["PRODUCTS_BARCODE", "INGREDIENTS_BOM", "SUPPLIERS_PO", "ORDERS"],
  ACCOUNTANT: ["DASHBOARD", "ORDERS", "SUPPLIERS_PO", "CASHFLOW_FINANCE", "REPORTS_GOOGLE_DOCS"],
};

export function hasModuleAccess(role: RoleType, moduleKey: string): boolean {
  if (role === "SUPER_ADMIN") return true;
  return ROLE_PERMISSIONS[role]?.includes(moduleKey) ?? false;
}
