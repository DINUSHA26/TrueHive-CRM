import { NextResponse } from "next/server";
import { AUTH_COOKIE_NAME, getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  return NextResponse.json({
    authenticated: Boolean(user),
    user: user || null,
  });
}

export async function POST() {
  const res = NextResponse.json({ success: true });
  res.cookies.delete(AUTH_COOKIE_NAME);
  return res;
}
