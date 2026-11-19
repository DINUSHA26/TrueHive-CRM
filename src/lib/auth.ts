import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";

export type RoleType =
  | "SUPER_ADMIN"
  | "MANAGER"
  | "CASHIER_POS"
  | "SUPPORT_AGENT"
  | "INVENTORY_STAFF"
  | "ACCOUNTANT";

export interface JWTPayload {
  userId: string;
  email: string;
  name: string;
  role: RoleType;
  permissions: string[];
}

const PRIMARY_SECRET = "e9a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6";
const FALLBACK_SECRET = "truehive-super-secret-jwt-key-change-in-production-2026";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || PRIMARY_SECRET
);

export const AUTH_COOKIE_NAME = "truehive_token";

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function signJwtToken(payload: JWTPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_SECRET);
}

export async function verifyJwtToken(token: string): Promise<JWTPayload | null> {
  const secretCandidates = Array.from(
    new Set(
      [process.env.JWT_SECRET, PRIMARY_SECRET, FALLBACK_SECRET].filter(
        (s): s is string => typeof s === "string" && s.length > 0
      )
    )
  );

  for (const secretStr of secretCandidates) {
    try {
      const { payload } = await jwtVerify(
        token,
        new TextEncoder().encode(secretStr)
      );
      return payload as unknown as JWTPayload;
    } catch {
      // Try next secret candidate
    }
  }
  return null;
}

export async function getCurrentUser(): Promise<JWTPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
    if (!token) return null;
    return verifyJwtToken(token);
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
