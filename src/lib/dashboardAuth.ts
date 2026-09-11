import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Acceso al dashboard privado: usuario/contraseña fijos en variables de
 * entorno (DASHBOARD_USERNAME, DASHBOARD_PASSWORD) + cookie de sesión
 * firmada con HMAC (DASHBOARD_SESSION_SECRET). Sin librería de auth: un
 * único usuario admin no la justifica.
 */

export const DASHBOARD_COOKIE = "amadevs_dash";
export const DASHBOARD_SESSION_MS = 1000 * 60 * 60 * 24 * 14; // 14 días

function sessionSecret(): string {
  const s = process.env.DASHBOARD_SESSION_SECRET;
  if (!s) throw new Error("Falta DASHBOARD_SESSION_SECRET en el entorno");
  return s;
}

function sign(payload: string): string {
  return createHmac("sha256", sessionSecret()).update(payload).digest("hex");
}

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  return bufA.length === bufB.length && timingSafeEqual(bufA, bufB);
}

export function createSessionToken(): string {
  const payload = String(Date.now() + DASHBOARD_SESSION_MS);
  return `${payload}.${sign(payload)}`;
}

export function isValidSessionToken(token: string | undefined | null): boolean {
  if (!token) return false;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return false;
  if (!safeEqual(sig, sign(payload))) return false;
  const exp = Number(payload);
  return Number.isFinite(exp) && Date.now() < exp;
}

export function checkCredentials(username: string, password: string): boolean {
  const expectedUser = process.env.DASHBOARD_USERNAME ?? "";
  const expectedPass = process.env.DASHBOARD_PASSWORD ?? "";
  if (!expectedUser || !expectedPass) return false;
  return safeEqual(username, expectedUser) && safeEqual(password, expectedPass);
}
