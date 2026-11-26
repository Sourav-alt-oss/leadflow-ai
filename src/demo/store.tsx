"use client";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import {
  validate,
  blank,
  roles,
  type Collection,
  type DemoState,
  type RecordItem,
  type Role,
} from "./model";
import { seed } from "./seed";
import { useAtlasData } from "./atlas-sync";
const uid = () => crypto.randomUUID();
function log(s: DemoState, message: string, recordId = "") {
  const a = { id: uid(), message, date: new Date().toISOString(), recordId };
  return {
    ...s,
    activities: [a, ...s.activities],
    notifications: [{ ...a, id: uid(), read: false }, ...s.notifications],
  };
}
function useStore() {
  const { data, setData, ...atlas } = useAtlasData();
  const [role, setRole] = useState<Role>("Administrator");
  const [undo, setUndo] = useState<{
    collection: Collection;
    row: RecordItem;
  } | null>(null);
  useEffect(() => {
    // Read browser storage after hydration, in a scheduled callback.
    const frame = requestAnimationFrame(() => {
      try {
        const r = localStorage.getItem("leadflow-role");
        if (roles.some((x) => x === r)) {
          setRole(r as Role);
        }
      } catch {
        /* Storage may be unavailable. */
      }
    });
    return () => cancelAnimationFrame(frame);
  }, []);
  const switchRole = (r: Role, remember = true) => {
    setRole(r);
    try {
      if (remember) localStorage.setItem("leadflow-role", r);
      else localStorage.removeItem("leadflow-role");
    } catch {}
  };
  const allowed = role !== "Viewer" && atlas.atlasStatus !== "conflict";
  const save = (collection: Collection, row: RecordItem) => {
    if (!allowed) return;
    validate(collection, row);
    const item = { ...row, id: row.id || uid() };
    setData((s) => {
      if (!s) return s;
      const exists = s[collection].some((x) => x.id === item.id);
      return log(
        {
          ...s,
          [collection]: exists
            ? s[collection].map((x) => (x.id === item.id ? item : x))
            : [item, ...s[collection]],
        },
        `${exists ? "Updated" : "Created"} ${item.name}`,
        item.id,
      );
    });
    toast.info("Record updated; check Atlas sync status");
  };
  const remove = (collection: Collection, row: RecordItem) => {
    if (!allowed) return;
    if (collection === "companies" || collection === "team") {
      const field = collection === "companies" ? "companyId" : "ownerId";
      if (
        data &&
        ["leads", "contacts", "deals", "tasks"].some((k) =>
          data[k as Collection].some((x) => x[field] === row.id),
        )
      ) {
        toast.error("Reassign linked records before deleting.");
        return;
      }
    }
    if (
      (collection === "leads" || collection === "deals") &&
      data &&
      [...data.deals, ...data.tasks].some((x) => x.relatedId === row.id)
    ) {
      toast.error("Remove or reassign linked deals and tasks first.");
      return;
    }
    setUndo({ collection, row });
    setData((s) =>
      s
        ? log(
            {
              ...s,
              [collection]: s[collection].filter((x) => x.id !== row.id),
            },
            `Deleted ${row.name}`,
            row.id,
          )
        : s,
    );
    toast.success("Deleted");
  };
  const restore = () => {
    if (undo && allowed) {
      save(undo.collection, undo.row);
      setUndo(null);
    }
  };
  const convert = (row: RecordItem) => {
    if (!allowed || row.status === "Converted") return;
    const contact = {
      ...blank(uid(), row.name),
      email: row.email,
      phone: row.phone,
      companyId: row.companyId,
      ownerId: row.ownerId,
    };
    const deal = {
      ...blank(uid(), `${row.name} opportunity`),
      companyId: row.companyId,
      ownerId: row.ownerId,
      value: row.value,
      status: "New Opportunity",
      relatedId: row.id,
    };
    setData((s) =>
      s
        ? log(
            {
              ...s,
              leads: s.leads.map((l) =>
                l.id === row.id ? { ...l, status: "Converted" } : l,
              ),
              contacts: [contact, ...s.contacts],
              deals: [deal, ...s.deals],
            },
            `Converted ${row.name}`,
            row.id,
          )
        : s,
    );
    toast.success("Contact and deal created");
  };
  const notify = (message: string) => {
    if (allowed) setData((s) => (s ? log(s, message) : s));
  };
  const read = (id: string, dismiss = false) =>
    allowed &&
    setData((s) =>
      s
        ? {
            ...s,
            notifications: dismiss
              ? s.notifications.filter((n) => n.id !== id)
              : s.notifications.map((n) =>
                  n.id === id ? { ...n, read: true } : n,
                ),
          }
        : s,
    );
  const reset = useCallback(() => {
    if (allowed) {
      setData(seed());
      setUndo(null);
      toast.success("Demo restored");
    }
  }, [allowed, setData]);
  return {
    ...atlas,
    data,
    role,
    switchRole,
    allowed,
    save,
    remove,
    restore,
    undo,
    convert,
    notify,
    read,
    reset,
  };
}
const Context = createContext<ReturnType<typeof useStore> | null>(null);
export function DemoProvider({ children }: { children: ReactNode }) {
  const store = useStore();
  return <Context.Provider value={store}>{children}</Context.Provider>;
}
export function useDemo() {
  const s = useContext(Context);
  if (!s) throw Error("DemoProvider required");
  return s;
}
