import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  checkCredentials,
  createSessionToken,
  DASHBOARD_COOKIE,
  DASHBOARD_SESSION_MS,
} from "@/lib/dashboardAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let body: { username?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const username = body.username?.trim() ?? "";
  const password = body.password ?? "";
  if (!username || !password || !checkCredentials(username, password)) {
    return NextResponse.json({ error: "Usuario o contraseña incorrectos" }, { status: 401 });
  }

  const store = await cookies();
  store.set(DASHBOARD_COOKIE, createSessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: Math.floor(DASHBOARD_SESSION_MS / 1000),
  });

  return NextResponse.json({ ok: true });
}
