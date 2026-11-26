"use client";
import { useState } from "react";
import { useDemo } from "@/demo/store";
import { answer } from "@/demo/logic";
import { day, roles, type RecordItem } from "@/demo/model";
import { Editor, newRecord } from "./records";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { ThemeToggle, AnimatedCard } from "./shared";
import {
  addMonths,
  addWeeks,
  startOfWeek,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  format,
  addDays,
  endOfWeek,
} from "date-fns";
const prompts = [
  "Show my top priority leads",
  "Which deals are in negotiation?",
  "Summarize today’s follow-ups",
  "Draft a follow-up email",
  "Which tasks are overdue?",
  "Show the largest open opportunities",
  "Summarize sales performance",
];
export function Assistant() {
  const { data } = useDemo();
  const [query, setQuery] = useState("");
  const [chat, setChat] = useState<
    {
      id: string;
      who: string;
      text: string;
    }[]
  >([
    {
      id: "start",
      who: "Demo AI",
      text: "Explore your fictional CRM. Ask me about priorities, opportunities, follow-ups or email drafts.",
    },
  ]);
  if (!data) return null;
  const send = (q: string) => {
    if (!q.trim()) return;
    setChat((c) => [
      ...c,
      { id: crypto.randomUUID(), who: "You", text: q.trim() },
      { id: crypto.randomUUID(), who: "Demo AI", text: answer(data, q) },
    ]);
    setQuery("");
  };
  return (
    <>
      <h1>AI sales assistant</h1>
      <p className="muted">
        Simulated insights · deterministic local rules · no AI API or email
        delivery.
      </p>
      <div className="row">
        {prompts.map((p) => (
          <button className="btn text-sm" key={p} onClick={() => send(p)}>
            {p}
          </button>
        ))}
      </div>
      <div className="card stack" aria-live="polite">
        {chat.map((m) => (
          <motion.div
            key={m.id}
            className="card chat"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              marginLeft: m.who === "You" ? "12%" : 0,
              marginRight: m.who === "You" ? 0 : "8%",
              background: m.who === "You" ? "var(--elevated)" : "var(--bg)",
            }}
          >
            <strong className="accent">{m.who}</strong>
            {m.text.startsWith("Subject:") ? (
              <textarea
                aria-label="Editable email draft"
                value={m.text}
                onChange={(e) =>
                  setChat((c) =>
                    c.map((x) =>
                      x.id === m.id ? { ...x, text: e.target.value } : x,
                    ),
                  )
                }
                className="mt-2"
                rows={8}
              />
            ) : (
              <p className="mt-2">{m.text}</p>
            )}
            {m.who === "Demo AI" && (
              <button
                className="btn mt-3"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(m.text);
                    toast.success("Copied");
                  } catch {
                    toast.error("Clipboard unavailable");
                  }
                }}
              >
                Copy response
              </button>
            )}
          </motion.div>
        ))}
      </div>
      <form
        className="row"
        onSubmit={(e) => {
          e.preventDefault();
          send(query);
        }}
      >
        <input
          className="flex-1"
          aria-label="Ask demo AI"
          placeholder="Ask about your sales data…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button className="btn primary">Send</button>
      </form>
    </>
  );
}
export function Calendar() {
  const { data, allowed } = useDemo();
  const [cursor, setCursor] = useState(new Date());
  const [week, setWeek] = useState(false);
  const [item, setItem] = useState<RecordItem | null>(null);
  if (!data) return null;
  const start = week ? startOfWeek(cursor) : startOfWeek(startOfMonth(cursor));
  const end = week ? endOfWeek(cursor) : endOfWeek(endOfMonth(cursor));
  const dates = eachDayOfInterval({ start, end });
  return (
    <>
      <div className="row between">
        <div>
          <h1>Calendar</h1>
          <p className="muted">Task deadlines, meetings and lead follow-ups.</p>
        </div>
        <div className="row">
          <button className="btn" onClick={() => setWeek(false)}>
            Month
          </button>
          <button className="btn" onClick={() => setWeek(true)}>
            Week
          </button>
          <button className="btn" onClick={() => setCursor(new Date())}>
            Today
          </button>
        </div>
      </div>
      <div className="card stack">
        <div className="row between">
          <button
            className="btn"
            onClick={() =>
              setCursor((d) => (week ? addWeeks(d, -1) : addMonths(d, -1)))
            }
          >
            Previous
          </button>
          <h2>{format(cursor, "MMMM yyyy")}</h2>
          <button
            className="btn"
            onClick={() =>
              setCursor((d) => (week ? addWeeks(d, 1) : addMonths(d, 1)))
            }
          >
            Next
          </button>
        </div>
        <motion.div
          className="calendar"
          key={start.toISOString()}
          initial={{ opacity: 0, x: 8 }}
          animate={{ opacity: 1, x: 0 }}
        >
          {Array.from({ length: 7 }, (_, i) => (
            <small className="text-center" key={i}>
              {format(addDays(start, i), "EEE")}
            </small>
          ))}
          {dates.map((d) => {
            const key = format(d, "yyyy-MM-dd");
            const records = [
              ...data.events,
              ...data.tasks.filter((t) => t.status !== "Completed"),
              ...data.leads.filter(
                (l) => !["Converted", "Lost"].includes(l.status),
              ),
            ].filter((r) => r.date === key);
            return (
              <button
                key={key}
                className="calendar-cell"
                disabled={!allowed}
                onClick={() => setItem({ ...newRecord("events"), date: key })}
                aria-label={`Create event on ${key}`}
              >
                <strong className={key === day() ? "accent" : ""}>
                  {format(d, "d")}
                </strong>
                {records.slice(0, 3).map((r) => (
                  <p key={r.id} className="truncate text-xs mt-1">
                    {r.name}
                  </p>
                ))}
                {records.length > 3 && (
                  <small>+{records.length - 3} more</small>
                )}
              </button>
            );
          })}
        </motion.div>
        <h3>Meetings</h3>
        {data.events.map((r) => (
          <div className="row between" key={r.id}>
            <span>
              {r.date} · {r.name}
            </span>
            <button className="btn" onClick={() => setItem(r)}>
              {allowed ? "Edit" : "View"}
            </button>
          </div>
        ))}
      </div>
      {item && (
        <Editor collection="events" item={item} onClose={() => setItem(null)} />
      )}
    </>
  );
}
export function Activity({
  notifications = false,
}: {
  notifications?: boolean;
}) {
  const { data, read } = useDemo();
  if (!data) return null;
  return (
    <>
      <h1>{notifications ? "Notifications" : "Activity timeline"}</h1>
      <p className="muted">Local activity generated by demo interactions.</p>
      {notifications && (
        <div className="row">
          <button
            className="btn"
            onClick={() => data.notifications.forEach((n) => read(n.id))}
          >
            Mark all read
          </button>
          <span className="pill">
            {data.notifications.filter((n) => !n.read).length} unread
          </span>
        </div>
      )}
      <div className="stack">
        {notifications &&
          data.tasks
            .filter((t) => t.status !== "Completed" && t.date <= day())
            .map((t) => (
              <div key={t.id} className="card row between">
                <span>
                  {t.date < day() ? "Overdue" : "Due today"}: {t.name}
                </span>
                <small>Derived task reminder</small>
              </div>
            ))}
        <AnimatePresence>
          {(notifications ? data.notifications : data.activities).map((a) => (
            <motion.div
              layout
              key={a.id}
              className="card row between"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
            >
              <div>
                <p>{a.message}</p>
                <small>{new Date(a.date).toLocaleString()}</small>
              </div>
              {notifications && "read" in a && (
                <div className="row">
                  {!a.read && (
                    <button className="btn" onClick={() => read(a.id)}>
                      Mark read
                    </button>
                  )}
                  <button className="btn" onClick={() => read(a.id, true)}>
                    Dismiss
                  </button>
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </>
  );
}
export function Automations() {
  const { data, allowed, save, notify } = useDemo();
  const [edit, setEdit] = useState<RecordItem | null>(null);
  if (!data) return null;
  return (
    <>
      <h1>Automations</h1>
      <p className="muted">
        Manual local simulations only. Nothing runs after closing the browser.
      </p>
      <div className="grid2">
        {data.rules.map((r) => (
          <AnimatedCard key={r.id}>
            <div className="row between">
              <h3>{r.name}</h3>
              <span className="pill">{r.enabled ? "Enabled" : "Disabled"}</span>
            </div>
            <p className="muted my-3">{r.notes}</p>
            <div className="row">
              <button
                className="btn"
                disabled={!allowed}
                onClick={() => save("rules", { ...r, enabled: !r.enabled })}
              >
                {r.enabled ? "Disable" : "Enable"}
              </button>
              <button className="btn" onClick={() => setEdit(r)}>
                Edit description
              </button>
              <button
                className="btn primary"
                disabled={!allowed || !r.enabled}
                onClick={() => {
                  const count = r.name.includes("Overdue")
                    ? data.tasks.filter(
                        (t) => t.date < day() && t.status !== "Completed",
                      ).length
                    : r.name.includes("Won")
                      ? data.deals.filter((d) => d.status === "Won").length
                      : r.name.includes("Assignment")
                        ? data.leads.filter((l) => !l.ownerId).length
                        : r.name.includes("Follow-Up")
                          ? data.leads.filter(
                              (l) =>
                                l.date === day() &&
                                !["Lost", "Converted"].includes(l.status),
                            ).length
                          : data.leads.length;
                  notify(
                    `Automation: ${r.name} evaluated ${count} matching demo records`,
                  );
                  toast.success("Local workflow evaluated");
                }}
              >
                Run sample
              </button>
            </div>
          </AnimatedCard>
        ))}
      </div>
      <h2>Execution history</h2>
      {data.activities
        .filter((a) => a.message.startsWith("Automation:"))
        .map((a) => (
          <div className="card" key={a.id}>
            {a.message}
            <p className="muted">{new Date(a.date).toLocaleString()}</p>
          </div>
        ))}
      {edit && (
        <Editor collection="rules" item={edit} onClose={() => setEdit(null)} />
      )}
    </>
  );
}
export function Settings() {
  const { role, switchRole, reset, allowed } = useDemo();
  return (
    <>
      <h1>Settings</h1>
      <AnimatedCard>
        <div className="row between">
          <div>
            <h3>Appearance</h3>
            <p className="muted">Toggle light and dark theme.</p>
          </div>
          <ThemeToggle />
        </div>
      </AnimatedCard>
      <AnimatedCard>
        <div className="row between">
          <div>
            <h3>Demo persona</h3>
            <p className="muted">
              Viewer is read-only. Other roles are illustrative, not secured.
            </p>
          </div>
          <select
            aria-label="Choose persona"
            value={role}
            onChange={(e) => switchRole(e.target.value as typeof role)}
          >
            {roles.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
        </div>
      </AnimatedCard>
      <AnimatedCard>
        <h3>Reset demo data</h3>
        <p className="muted my-2">
          Restore the fictional sample dataset in Atlas. This replaces all saved
          CRM records. Export a backup first.
        </p>
        <button
          className="btn text-red-400"
          disabled={!allowed}
          onClick={() => {
            if (
              confirm(
                "Replace all Atlas CRM records with the original demo dataset?",
              )
            )
              reset();
          }}
        >
          Reset demo data
        </button>
      </AnimatedCard>
    </>
  );
}
