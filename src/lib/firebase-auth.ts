import "server-only";
import { cookies } from "next/headers";
import { z } from "zod";

const COOKIE = "leadflow_account";
const SESSION_SECONDS = 55 * 60;
const TokenResponse = z.object({ idToken: z.string().min(1), expiresIn: z.string() });
const UserResponse = z.object({
  users: z.array(z.object({
    localId: z.string().min(1),
    email: z.string().email(),
    emailVerified: z.boolean().optional(),
    disabled: z.boolean().optional(),
  })),
});
type Operation = "signUp" | "signInWithPassword" | "sendOobCode" | "lookup";

export function authConfigured() {
  return Boolean(process.env.FIREBASE_AUTH_API_KEY);
}

async function request(operation: Operation, body: object): Promise<unknown> {
  const key = process.env.FIREBASE_AUTH_API_KEY;
  if (!key) throw new Error("AUTH_NOT_CONFIGURED");
  const response = await fetch(
    "https://identitytoolkit.googleapis.com/v1/accounts:" + operation + "?key=" + encodeURIComponent(key),
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    },
  );
  if (!response.ok) throw new Error("AUTH_REQUEST_FAILED");
  return response.json();
}

export async function createAccount(email: string, password: string) {
  return TokenResponse.parse(await request("signUp", { email, password, returnSecureToken: true }));
}

export async function authenticate(email: string, password: string) {
  return TokenResponse.parse(await request("signInWithPassword", { email, password, returnSecureToken: true }));
}

export async function lookupAccount(idToken: string) {
  const result = UserResponse.parse(await request("lookup", { idToken }));
  return result.users[0] ?? null;
}

export async function sendVerification(idToken: string) {
  await request("sendOobCode", { requestType: "VERIFY_EMAIL", idToken });
}

export async function sendReset(email: string) {
  await request("sendOobCode", { requestType: "PASSWORD_RESET", email });
}

export async function setAccountSession(idToken: string, expiresIn: string) {
  const expiry = Number(expiresIn);
  if (!Number.isFinite(expiry) || expiry <= 0) throw new Error("INVALID_EXPIRY");
  (await cookies()).set(COOKIE, idToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: Math.min(SESSION_SECONDS, Math.floor(expiry)),
  });
}

export async function clearAccountSession() {
  (await cookies()).delete(COOKIE);
}

export async function getAccount() {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token || !authConfigured()) return null;
  try {
    const account = await lookupAccount(token);
    if (!account || account.disabled || !account.emailVerified) return null;
    return { id: account.localId, email: account.email };
  } catch {
    return null;
  }
}
