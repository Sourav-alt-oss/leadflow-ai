"use client";
import { useActionState } from "react";
import { submitAuth } from "@/app/auth/actions";

type Mode = "login" | "register" | "reset" | "resend";
const buttons: Record<Mode, string> = {
  login: "Sign in", register: "Register", reset: "Send reset email", resend: "Send verification email",
};

export function AccountForm({ mode }: { mode: Mode }) {
  const [message, action, pending] = useActionState(submitAuth, "");
  return (
    <form className="stack" action={action}>
      <input type="hidden" name="mode" value={mode} />
      <label>Email
        <input name="email" type="email" autoComplete="email" maxLength={254} required />
      </label>
      {mode !== "reset" && <label>Password
        <input name="password" type="password" required maxLength={128}
          minLength={mode === "register" ? 12 : 1}
          autoComplete={mode === "register" ? "new-password" : "current-password"} />
      </label>}
      {mode === "register" && <small className="muted">Use at least 12 characters. Verify your email to activate sign-in.</small>}
      <button type="submit" className="btn primary" disabled={pending}>
        {pending ? "Submitting…" : buttons[mode]}
      </button>
      {message && <p role="status" aria-live="polite">{message}</p>}
    </form>
  );
}
