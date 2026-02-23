// lib/auth.ts — Utilidades de sesión del lado del SERVIDOR
// Este módulo solo se ejecuta en Node.js (server-side), nunca en el browser.
import crypto from "crypto";
import type { NextApiResponse } from "next";

const SESSION_SECRET =
  process.env.SESSION_SECRET ??
  "spm-fallback-dev-secret-change-in-production";

const SESSION_DURATION_MS = 8 * 60 * 60 * 1000; // 8 horas
export const SESSION_COOKIE_NAME = "spm_session";

export interface SessionPayload {
  username: string;
  role: string;
  nombre: string;
  iat: number;
  exp: number;
}

// ── Token ────────────────────────────────────────────────────────────────────

export function createSessionToken(
  username: string,
  role: string,
  nombre: string
): string {
  const payload: SessionPayload = {
    username,
    role,
    nombre,
    iat: Date.now(),
    exp: Date.now() + SESSION_DURATION_MS,
  };
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString("base64");
  const signature = crypto
    .createHmac("sha256", SESSION_SECRET)
    .update(payloadB64)
    .digest("hex");
  return `${payloadB64}.${signature}`;
}

export function verifySessionToken(token: string): SessionPayload | null {
  try {
    const lastDot = token.lastIndexOf(".");
    if (lastDot < 0) return null;
    const payloadB64 = token.slice(0, lastDot);
    const signature = token.slice(lastDot + 1);

    const expected = crypto
      .createHmac("sha256", SESSION_SECRET)
      .update(payloadB64)
      .digest("hex");

    // Comparación en tiempo constante para evitar timing attacks
    if (
      signature.length !== expected.length ||
      !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
    ) {
      return null;
    }

    const payload: SessionPayload = JSON.parse(
      Buffer.from(payloadB64, "base64").toString("utf8")
    );

    if (Date.now() > payload.exp) return null; // expirado
    return payload;
  } catch {
    return null;
  }
}

// ── Request helper ────────────────────────────────────────────────────────────

export function getSessionFromRequest(req: {
  headers: { cookie?: string };
}): SessionPayload | null {
  const cookieHeader = req.headers.cookie ?? "";
  const cookies = cookieHeader.split(";").reduce<Record<string, string>>(
    (acc, part) => {
      const eq = part.trim().indexOf("=");
      if (eq > 0) acc[part.slice(0, eq).trim()] = part.slice(eq + 1).trim();
      return acc;
    },
    {}
  );
  const token = cookies[SESSION_COOKIE_NAME];
  if (!token) return null;
  return verifySessionToken(token);
}

// ── Cookie helpers ────────────────────────────────────────────────────────────

// En producción (Vercel / HTTPS) añadimos Secure para restringir la cookie a HTTPS
const SECURE_FLAG =
  process.env.NODE_ENV === "production" || process.env.VERCEL === "1"
    ? "; Secure"
    : "";

export function setSessionCookie(res: NextApiResponse, token: string): void {
  const maxAge = Math.floor(SESSION_DURATION_MS / 1000);
  res.setHeader(
    "Set-Cookie",
    `${SESSION_COOKIE_NAME}=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${maxAge}${SECURE_FLAG}`
  );
}

export function clearSessionCookie(res: NextApiResponse): void {
  res.setHeader(
    "Set-Cookie",
    `${SESSION_COOKIE_NAME}=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0${SECURE_FLAG}`
  );
}
