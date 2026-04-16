import { createHmac, timingSafeEqual } from "node:crypto";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export type AppRole = "CUSTOMER" | "OPERATOR" | "ADMIN";

export type AppSession = {
  email: string;
  name: string;
  role: AppRole;
};

type SessionPayload = AppSession & {
  exp: number;
};

export const SESSION_COOKIE_NAME = "trucks_now_session";

function getSessionSecret() {
  return process.env.SESSION_SECRET || "trucks-now-dev-secret";
}

function sign(value: string) {
  return createHmac("sha256", getSessionSecret()).update(value).digest("hex");
}

function encodePayload(payload: SessionPayload) {
  const json = JSON.stringify(payload);
  const body = Buffer.from(json, "utf8").toString("base64url");
  const signature = sign(body);
  return `${body}.${signature}`;
}

export function decodeSession(value: string | undefined): AppSession | null {
  if (!value) {
    return null;
  }

  const [body, signature] = value.split(".");

  if (!body || !signature) {
    return null;
  }

  const expectedSignature = sign(body);

  if (signature.length !== expectedSignature.length) {
    return null;
  }

  if (!timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as SessionPayload;

    if (!payload.email || !payload.name || !payload.role || payload.exp < Date.now()) {
      return null;
    }

    return {
      email: payload.email,
      name: payload.name,
      role: payload.role,
    };
  } catch {
    return null;
  }
}

export async function createSession(session: AppSession) {
  const cookieStore = await cookies();
  const expires = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);
  const value = encodePayload({
    ...session,
    exp: expires.getTime(),
  });

  cookieStore.set(SESSION_COOKIE_NAME, value, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires,
  });
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function getCurrentSession(): Promise<AppSession | null> {
  const cookieStore = await cookies();
  const value = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  return decodeSession(value);
}

export function getDefaultPathForRole(role: AppRole) {
  switch (role) {
    case "ADMIN":
      return "/admin";
    case "OPERATOR":
      return "/operator";
    default:
      return "/customer";
  }
}

export function canAccessPath(role: AppRole, path: string) {
  if (path.startsWith("/admin")) {
    return role === "ADMIN";
  }

  if (path.startsWith("/operator")) {
    return role === "OPERATOR" || role === "ADMIN";
  }

  return true;
}

export function normalizeNextPath(nextPath: string | undefined, fallbackRole: AppRole) {
  if (!nextPath || !nextPath.startsWith("/")) {
    return getDefaultPathForRole(fallbackRole);
  }

  return canAccessPath(fallbackRole, nextPath) ? nextPath : getDefaultPathForRole(fallbackRole);
}

export async function requireRole(allowedRoles: AppRole[], nextPath: string) {
  const session = await getCurrentSession();

  if (!session) {
    redirect(`/login?reason=auth&next=${encodeURIComponent(nextPath)}`);
  }

  if (!allowedRoles.includes(session.role)) {
    redirect(`/login?reason=role&next=${encodeURIComponent(nextPath)}`);
  }

  return session;
}
