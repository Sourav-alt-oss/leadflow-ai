"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import {
  authConfigured, authenticate, createAccount, lookupAccount,
  sendReset, sendVerification, setAccountSession, clearAccountSession,
} from "@/lib/firebase-auth";

const emailSchema = z.string().trim().email().max(254);
const credentials = z.object({ email: emailSchema, password: z.string().min(1).max(128) });
const registration = credentials.extend({ password: z.string().min(12).max(128) });

export async function submitAuth(_previous: string, form: FormData): Promise<string> {
  if (!authConfigured()) return "Account authentication is not configured yet.";
  const mode = form.get("mode");
  const raw = { email: form.get("email"), password: form.get("password") };

  if (mode === "reset") {
    const email = emailSchema.safeParse(raw.email);
    if (!email.success) return "Enter a valid email address.";
    try { await sendReset(email.data); } catch { /* Do not reveal whether an email exists. */ }
    return "If the address belongs to an account, a reset email may arrive. Check spam as well.";
  }

  if (mode !== "register" && mode !== "login" && mode !== "resend") return "Invalid request.";
  const values = (mode === "register" ? registration : credentials).safeParse(raw);
  if (!values.success) return "Enter a valid email and password. New passwords need at least 12 characters.";
  const { email, password } = values.data;

  if (mode === "register") {
    try {
      const result = await createAccount(email, password);
      try { await sendVerification(result.idToken); } catch { /* The resend form remains available. */ }
    } catch { /* Generic response to avoid exposing existing accounts. */ }
    return "If registration succeeded, verify your email before signing in. Use resend verification if needed.";
  }

  try {
    const result = await authenticate(email, password);
    const account = await lookupAccount(result.idToken);
    if (!account || account.disabled) return "Unable to sign in with those credentials.";
    if (mode === "resend") {
      if (!account.emailVerified) await sendVerification(result.idToken);
      return "If verification is still required, check your inbox for the verification email.";
    }
    if (!account.emailVerified) return "Verify your email before signing in. You can request another verification email.";
    await setAccountSession(result.idToken, result.expiresIn);
  } catch {
    return "Unable to complete authentication. Check your credentials or try again later.";
  }
  redirect("/account");
}

export async function signOut() {
  await clearAccountSession();
  redirect("/auth/login");
}
