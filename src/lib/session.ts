// Edge-safe 세션 토큰 (jose) — middleware에서도 import 가능 (bcrypt/next 의존 없음)
import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "bloomai_session";

export type SessionPayload = {
  userId: string;
  tenantId: string;
  role: string;
  name: string;
};

function secret() {
  return new TextEncoder().encode(
    process.env.AUTH_SECRET || "dev-only-insecure-secret-please-set-AUTH_SECRET"
  );
}

export async function signSession(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret());
}

export async function verifySession(token: string | undefined): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    return {
      userId: String(payload.userId),
      tenantId: String(payload.tenantId),
      role: String(payload.role),
      name: String(payload.name),
    };
  } catch {
    return null;
  }
}
