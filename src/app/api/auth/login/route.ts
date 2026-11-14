import { NextRequest, NextResponse } from "next/server";
import { signJwtToken, AUTH_COOKIE_NAME, RoleType, ROLE_PERMISSIONS } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

const FALLBACK_USERS: Record<string, { id: string; name: string; role: RoleType; pass: string }> = {
  "admin@truehive.lk": { id: "u-1", name: "Super Admin", role: "SUPER_ADMIN", pass: "admin123" },
  "manager@truehive.lk": { id: "u-2", name: "Store Manager", role: "MANAGER", pass: "admin123" },
  "cashier@truehive.lk": { id: "u-3", name: "POS Cashier", role: "CASHIER_POS", pass: "admin123" },
  "agent@truehive.lk": { id: "u-4", name: "WhatsApp Support Agent", role: "SUPPORT_AGENT", pass: "admin123" },
  "inventory@truehive.lk": { id: "u-5", name: "Inventory Staff", role: "INVENTORY_STAFF", pass: "admin123" },
  "accountant@truehive.lk": { id: "u-6", name: "Accountant", role: "ACCOUNTANT", pass: "admin123" },
};

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    const cleanEmail = String(email || "").trim().toLowerCase();

    if (!cleanEmail || !password) {
      return NextResponse.json(
        { error: "කරුණාකර ඔබගේ ඊමේල් ලිපිනය සහ මුරපදය ඇතුළත් කරන්න (Please enter email and password)" },
        { status: 400 }
      );
    }

    let authenticatedUser: { id: string; name: string; role: RoleType; email: string } | null = null;

    // 1. Try PostgreSQL Supabase user
    try {
      const dbUser = await prisma.user.findUnique({
        where: { email: cleanEmail },
      });

      if (dbUser && dbUser.isActive) {
        let isMatch = false;
        if (dbUser.passwordHash) {
          isMatch = await bcrypt.compare(password, dbUser.passwordHash);
          if (!isMatch && dbUser.passwordHash === password) {
            isMatch = true;
          }
        }
        if (isMatch) {
          authenticatedUser = {
            id: dbUser.id,
            name: dbUser.name,
            role: dbUser.role as RoleType,
            email: dbUser.email,
          };
        }
      }
    } catch (dbErr) {
      console.warn("Database lookup failed, falling back to local user store:", dbErr);
    }

    // 2. Fallback store check
    if (!authenticatedUser) {
      const fallback = FALLBACK_USERS[cleanEmail];
      if (fallback && fallback.pass === password) {
        authenticatedUser = {
          id: fallback.id,
          name: fallback.name,
          role: fallback.role,
          email: cleanEmail,
        };
      }
    }

    if (!authenticatedUser) {
      return NextResponse.json(
        { error: "ඊමේල් ලිපිනය හෝ මුරපදය වැරදියි (Invalid email or password)" },
        { status: 401 }
      );
    }

    const payload = {
      userId: authenticatedUser.id,
      email: authenticatedUser.email,
      name: authenticatedUser.name,
      role: authenticatedUser.role,
      permissions: ROLE_PERMISSIONS[authenticatedUser.role] || ["ALL"],
    };

    const token = await signJwtToken(payload);
    const res = NextResponse.json({ success: true, user: payload, token });

    res.cookies.set(AUTH_COOKIE_NAME, token, {
      httpOnly: true,
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
      sameSite: "lax",
    });

    return res;
  } catch (err) {
    console.error("[Login API Error]:", err);
    return NextResponse.json({ error: "පිවිසීමේදී දෝෂයක් ඇති විය (Login failed)" }, { status: 500 });
  }
}
