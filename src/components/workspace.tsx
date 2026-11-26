"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Contact,
  Building2,
  Briefcase,
  Kanban,
  ListTodo,
  CalendarDays,
  Activity as ActivityIcon,
  ChartNoAxesCombined,
  BrainCircuit,
  Bell,
  UserRoundCog,
  Workflow,
  Settings as SettingsIcon,
  Menu,
  X,
  Search,
  Eye,
  EyeOff,
} from "lucide-react";
import { motion } from "motion/react";
import * as Dialog from "@radix-ui/react-dialog";
import { useDemo } from "@/demo/store";
import { roles, type Role, type Collection } from "@/demo/model";
import { Logo, ThemeToggle } from "./shared";
import { Dashboard } from "./dashboard";
import { Records } from "./records";
import { Pipeline } from "./pipeline";
import { Assistant, Calendar, Activity, Automations, Settings } from "./extras";
const links = [
  ["dashboard", "Overview", LayoutDashboard],
  ["leads", "Leads", Users],
  ["contacts", "Contacts", Contact],
  ["companies", "Companies", Building2],
  ["deals", "Deals", Briefcase],
  ["pipeline", "Sales pipeline", Kanban],
  ["tasks", "Tasks", ListTodo],
  ["calendar", "Calendar", CalendarDays],
  ["activities", "Activities", ActivityIcon],
  ["analytics", "Analytics", ChartNoAxesCombined],
  ["ai-assistant", "AI assistant", BrainCircuit],
  ["notifications", "Notifications", Bell],
  ["team", "Team", UserRoundCog],
  ["automations", "Automations", Workflow],
  ["settings", "Settings", SettingsIcon],
] as const;
export function Login() {
  const { switchRole } = useDemo();
  const router = useRouter();
  const [role, setRole] = useState<Role>("Administrator");
  const [show, setShow] = useState(false);
  const [remember, setRemember] = useState(true);
  const enter = (r: Role) => {
    switchRole(r, remember);
    router.push("/demo/dashboard");
  };
  return (
    <div
      className="min-h-screen grid place-items-center p-5"
      style={{
        background: "radial-gradient(ellipse at top,#6366f133,transparent 65%)",
      }}
    >
      <motion.div
        className="card stack w-full max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Logo />
        <span className="pill self-start">Interactive demo</span>
        <h1>Welcome to LeadFlow</h1>
        <p className="muted">
          No real authentication. Use fictional credentials only.
        </p>
        <form
          className="stack"
          onSubmit={(e) => {
            e.preventDefault();
            enter(role);
          }}
        >
          <label>
            Demo persona
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as Role)}
            >
              {roles.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
          </label>
          <label>
            Example email
            <input
              type="email"
              defaultValue="demo@example.com"
              required
              autoComplete="off"
            />
          </label>
          <label>
            Sample password
            <div className="row">
              <input
                className="flex-1"
                type={show ? "text" : "password"}
                defaultValue="demoonly"
                required
                autoComplete="off"
              />
              <button
                type="button"
                aria-label="Show or hide password"
                className="btn"
                onClick={() => setShow(!show)}
              >
                {show ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </label>
          <label className="row">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
            />{" "}
            Remember demo persona
          </label>
          <button className="btn primary">Enter demo</button>
          <button
            type="button"
            className="btn"
            onClick={() => enter("Administrator")}
          >
            Continue as Demo Admin
          </button>
        </form>
        <Link href="/" className="muted">
          Back to website
        </Link>
      </motion.div>
    </div>
  );
}
export function Workspace({ section }: { section: string }) {
  const {
    data,
    role,
    switchRole,
    atlasStatus,
    atlasMessage,
    retryAtlas,
    reloadAtlas,
    exportAtlasBackup,
  } = useDemo();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState(false);
  const [query, setQuery] = useState("");
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearch((s) => !s);
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, []);
  const page = links.find((l) => l[0] === section)?.[1] || "Overview";
  const unread = data?.notifications.filter((n) => !n.read).length || 0;
  const records = [
    "leads",
    "contacts",
    "companies",
    "deals",
    "tasks",
    "team",
  ] as Collection[];
  return (
    <div className="shell">
      <aside className={`sidebar ${open ? "open" : ""}`}>
        <div className="row between mb-5">
          <Logo />
          <button
            className="btn mobile"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
          >
            <X size={16} />
          </button>
        </div>
        <div className="card p-3 mb-4">
          <small>WORKSPACE</small>
          <p className="font-semibold">LeadFlow Demo</p>
          <small>Fictional organization</small>
        </div>
        {links.map(([href, name, Icon]) => (
          <Link
            key={href}
            className={`side-link ${section === href ? "active" : ""}`}
            aria-current={section === href ? "page" : undefined}
            href={`/demo/${href}`}
            onClick={() => setOpen(false)}
          >
            <Icon size={17} />
            {name}
            {href === "notifications" && unread > 0 && (
              <span className="pill ml-auto">{unread}</span>
            )}
          </Link>
        ))}
        <Link href="/" className="side-link mt-4">
          ← Marketing website
        </Link>
      </aside>
      <div className="main">
        <header className="top row between">
          <div className="row">
            <button
              className="btn mobile"
              aria-label="Open menu"
              onClick={() => setOpen(true)}
            >
              <Menu size={18} />
            </button>
            <span className="muted desktop">Workspace /</span>
            <strong>{page}</strong>
          </div>
          <div className="row">
            <button
              className="btn"
              aria-label="Global search"
              onClick={() => setSearch(true)}
            >
              <Search size={17} />
              <span className="desktop">Search · Ctrl K</span>
            </button>
            <Link
              className="btn"
              aria-label="Notifications"
              href="/demo/notifications"
            >
              <Bell size={17} />
              {unread || ""}
            </Link>
            <ThemeToggle />
            <select
              className="max-w-40"
              aria-label="Demo persona"
              value={role}
              onChange={(e) => switchRole(e.target.value as Role)}
            >
              {roles.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
          </div>
        </header>
        <motion.main
          className="content"
          key={section}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div className="card row between" role="status">
            <div>
              <strong>Atlas: {atlasStatus}</strong>
              <p className="muted">{atlasMessage}</p>
            </div>
            <div className="row">
              {atlasStatus === "error" && (
                <button className="btn" onClick={retryAtlas}>
                  Retry
                </button>
              )}
              {atlasStatus === "conflict" && (
                <button className="btn" onClick={reloadAtlas}>
                  Reload Atlas
                </button>
              )}
              <button className="btn" onClick={exportAtlasBackup}>
                Export JSON backup
              </button>
            </div>
          </div>
          {!data ? (
            <div className="card" aria-busy={atlasStatus === "loading"}>
              {atlasStatus === "loading"
                ? "Loading CRM records from Atlas…"
                : "CRM unavailable. Check the Atlas status above."}
            </div>
          ) : section === "dashboard" ? (
            <Dashboard />
          ) : section === "analytics" ? (
            <Dashboard analytics />
          ) : section === "pipeline" ? (
            <Pipeline />
          ) : section === "calendar" ? (
            <Calendar />
          ) : section === "ai-assistant" ? (
            <Assistant />
          ) : section === "activities" ? (
            <Activity />
          ) : section === "notifications" ? (
            <Activity notifications />
          ) : section === "automations" ? (
            <Automations />
          ) : section === "settings" ? (
            <Settings />
          ) : (
            <Records collection={section as Collection} />
          )}
          <small>
            Interactive demo · fictional records · MongoDB Atlas persistence ·
            single-user local demo, not multi-user collaboration.
          </small>
        </motion.main>
      </div>
      <Dialog.Root open={search} onOpenChange={setSearch}>
        <Dialog.Portal>
          <Dialog.Overlay className="overlay" />
          <Dialog.Content className="dialog stack">
            <Dialog.Title className="font-bold text-lg">
              Search workspace
            </Dialog.Title>
            <Dialog.Description className="muted">
              Search pages and sample records.
            </Dialog.Description>
            <input
              autoFocus
              aria-label="Search workspace"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search leads, tasks, pages…"
            />
            {links
              .filter((l) => l[1].toLowerCase().includes(query.toLowerCase()))
              .slice(0, 5)
              .map((l) => (
                <Link
                  onClick={() => setSearch(false)}
                  key={l[0]}
                  className="btn"
                  href={`/demo/${l[0]}`}
                >
                  {l[1]}
                </Link>
              ))}
            {query &&
              data &&
              records
                .flatMap((c) =>
                  data[c]
                    .filter((r) =>
                      r.name.toLowerCase().includes(query.toLowerCase()),
                    )
                    .slice(0, 3)
                    .map((r) => (
                      <Link
                        key={r.id}
                        className="btn"
                        href={`/demo/${c}`}
                        onClick={() => setSearch(false)}
                      >
                        {r.name} · {c}
                      </Link>
                    )),
                )
                .slice(0, 10)}
            <Dialog.Close className="btn">Close</Dialog.Close>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
