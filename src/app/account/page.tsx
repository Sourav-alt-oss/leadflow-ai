import { redirect } from "next/navigation";
import Link from "next/link";
import { getAccount } from "@/lib/firebase-auth";
import { signOut } from "@/app/auth/actions";

export default async function AccountPage() {
  const account = await getAccount();
  if (!account) redirect("/auth/login");
  return (
    <main className="section stack mx-auto max-w-2xl">
      <div className="card stack">
        <span className="pill">Verified account</span>
        <h1 className="text-3xl">Welcome to LeadFlow AI</h1>
        <p>Signed in as {account.email}</p>
        <p className="muted">This page requires a verified Firebase account. Private CRM workspaces and MongoDB synchronization are not enabled yet.</p>
        <Link className="btn" href="/demo/dashboard">Explore the fictional CRM demo</Link>
        <form action={signOut}><button className="btn primary" type="submit">Sign out</button></form>
      </div>
    </main>
  );
}
