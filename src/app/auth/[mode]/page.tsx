import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { authConfigured, getAccount } from "@/lib/firebase-auth";
import { AccountForm } from "@/components/account-form";

const modes = ["login", "register", "reset", "resend"] as const;
type Mode = (typeof modes)[number];
const titles: Record<Mode, string> = {
  login: "Sign in to LeadFlow AI",
  register: "Create your account",
  reset: "Reset your password",
  resend: "Resend email verification",
};

export default async function AuthPage({ params }: { params: Promise<{ mode: string }> }) {
  const { mode: raw } = await params;
  if (!modes.includes(raw as Mode)) notFound();
  const mode = raw as Mode;
  if (await getAccount()) redirect("/account");
  return (
    <main className="section stack mx-auto max-w-xl">
      <Link href="/" className="btn self-start">LeadFlow AI</Link>
      <div className="card stack">
        <span className="pill">Real account authentication</span>
        <h1 className="text-3xl">{titles[mode]}</h1>
        <p className="muted">Your account is separate from the fictional public CRM demo.</p>
        {authConfigured() ? <AccountForm mode={mode} /> :
          <p role="status">Authentication is not configured in this environment yet.</p>}
        <div className="row flex-wrap">
          {mode !== "login" && <Link href="/auth/login">Sign in</Link>}
          {mode !== "register" && <Link href="/auth/register">Create account</Link>}
          {mode !== "reset" && <Link href="/auth/reset">Forgot password?</Link>}
          {mode !== "resend" && <Link href="/auth/resend">Resend verification</Link>}
        </div>
        <Link className="btn" href="/demo/dashboard">Try fictional demo without an account</Link>
      </div>
    </main>
  );
}
