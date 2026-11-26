"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { stateSchema, type DemoState } from "./model";
import { seed } from "./seed";

const LEGACY = "leadflow-demo-v1";
const PENDING = "leadflow-atlas-pending-v1";
const API = "/api/crm-state";
type Pending = { revision: number; state: DemoState };
type Status = "loading" | "saved" | "saving" | "error" | "conflict";
class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}
async function request(
  method: "GET" | "PUT",
  payload?: Pending,
  signal?: AbortSignal,
) {
  const response = await fetch(API, {
    method,
    signal,
    cache: "no-store",
    ...(payload
      ? {
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      : {}),
  });
  const result = await response.json();
  if (!response.ok)
    throw new ApiError(
      result.error || "Atlas request failed.",
      response.status,
    );
  return result as { revision: number; state?: DemoState | null };
}
function readPending(): Pending | null {
  const raw = localStorage.getItem(PENDING);
  if (!raw) return null;
  const value = JSON.parse(raw);
  if (!Number.isSafeInteger(value.revision) || value.revision < 1)
    throw Error("Invalid pending backup revision.");
  return { revision: value.revision, state: stateSchema.parse(value.state) };
}
function initialState() {
  const raw = localStorage.getItem(LEGACY);
  return raw === null ? seed() : stateSchema.parse(JSON.parse(raw));
}
function backup(pending: Pending) {
  localStorage.setItem(PENDING, JSON.stringify(pending));
}
function clearPending() {
  try {
    localStorage.removeItem(PENDING);
  } catch {
    /* Storage unavailable. */
  }
}
function same(a: DemoState, b: DemoState) {
  return JSON.stringify(a) === JSON.stringify(b);
}
function describe(error: unknown) {
  return error instanceof Error ? error.message : "Atlas request failed.";
}

export function useAtlasData() {
  const [data, setData] = useState<DemoState | null>(null);
  const [status, setStatus] = useState<Status>("loading");
  const [message, setMessage] = useState("Connecting to MongoDB Atlas…");
  const session = useRef({
    revision: 0,
    confirmed: null as DemoState | null,
    desired: null as DemoState | null,
    busy: false,
    blocked: false,
  });
  const alive = useRef(false);

  const flush = useCallback(async () => {
    const s = session.current;
    if (
      !alive.current ||
      !s.revision ||
      s.busy ||
      s.blocked ||
      !s.desired ||
      s.desired === s.confirmed
    )
      return;
    s.busy = true;
    setStatus("saving");
    setMessage("Saving changes to Atlas…");
    try {
      while (alive.current && s.desired && s.desired !== s.confirmed) {
        const snapshot = s.desired;
        // Save a recovery copy before the network request. If storage fails,
        // do not silently proceed without the recovery copy.
        backup({ revision: s.revision, state: snapshot });
        const result = await request("PUT", {
          revision: s.revision,
          state: snapshot,
        });
        s.revision = result.revision;
        s.confirmed = snapshot;
      }
      if (alive.current) {
        clearPending();
        setStatus("saved");
        setMessage("All changes saved to MongoDB Atlas.");
      }
    } catch (error) {
      if (alive.current) {
        const conflict = error instanceof ApiError && error.status === 409;
        s.blocked = conflict;
        // Keep the latest unsaved state for recovery, including changes during the request.
        try {
          if (s.desired) backup({ revision: s.revision, state: s.desired });
        } catch {
          /* Export current state manually. */
        }
        setStatus(conflict ? "conflict" : "error");
        setMessage(describe(error));
      }
    } finally {
      s.busy = false;
    }
  }, []);

  useEffect(() => {
    alive.current = true;
    const controller = new AbortController();
    const { signal } = controller;
    async function initialize() {
      try {
        let remote = await request("GET", undefined, signal);
        if (signal.aborted) return;
        if (!remote.state) {
          const imported = initialState();
          try {
            const inserted = await request(
              "PUT",
              { revision: 0, state: imported },
              signal,
            );
            remote = { revision: inserted.revision, state: imported };
          } catch (error) {
            if (!(error instanceof ApiError && error.status === 409))
              throw error;
            remote = await request("GET", undefined, signal);
          }
        }
        if (signal.aborted) return;
        if (!remote.state || remote.revision < 1)
          throw Error("Atlas workspace was not initialized.");
        const state = stateSchema.parse(remote.state);
        const pending = readPending();
        const s = session.current;
        s.revision = remote.revision;
        s.confirmed = state;
        s.desired = state;
        s.blocked = false;
        if (pending && !same(pending.state, state)) {
          if (pending.revision !== remote.revision) {
            s.blocked = true;
            // Keep the unsaved copy visible and exportable. Do not overwrite Atlas.
            setData(pending.state);
            s.desired = pending.state;
            setStatus("conflict");
            setMessage(
              "Unsaved browser changes conflict with Atlas. Export the pending JSON, then reload Atlas to discard the local copy.",
            );
            return;
          }
          s.desired = pending.state;
          setData(pending.state);
          setStatus("saving");
          setMessage("Recovering unsaved changes…");
          return;
        }
        clearPending();
        setData(state);
        setStatus("saved");
        setMessage("MongoDB Atlas connected.");
      } catch (error) {
        if (!signal.aborted) {
          setStatus("error");
          setMessage(describe(error));
        }
      }
    }
    void initialize();
    return () => {
      alive.current = false;
      controller.abort();
    };
  }, []);

  useEffect(() => {
    if (!data) return;
    const s = session.current;
    s.desired = data;
    if (s.revision && data !== s.confirmed) {
      // Persist the latest pending copy, even while another write is in flight.
      // Defer state updates to the network callback; no synchronous setState here.
      let cancelled = false;
      queueMicrotask(() => {
        const latest = s.desired;
        if (cancelled || s.blocked || !latest || latest === s.confirmed) return;
        try {
          backup({ revision: s.revision, state: latest });
        } catch {
          setStatus("error");
          setMessage(
            "Cannot save the browser recovery copy. Export your current data.",
          );
          return;
        }
        void flush();
      });
      return () => {
        cancelled = true;
      };
    }
  }, [data, flush]);

  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      const s = session.current;
      if (s.busy || (s.desired && s.desired !== s.confirmed)) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, []);

  function retry() {
    if (session.current.revision) void flush();
    else window.location.reload();
  }
  function reloadAtlas() {
    if (session.current.busy) return;
    if (
      window.confirm(
        "Discard pending browser changes and reload the Atlas workspace? Export a backup first.",
      )
    ) {
      clearPending();
      session.current.desired = session.current.confirmed;
      window.location.reload();
    }
  }
  function exportAtlasBackup() {
    try {
      const payload =
        session.current.desired ?? readPending()?.state ?? initialState();
      const url = URL.createObjectURL(
        new Blob([JSON.stringify(payload, null, 2)], {
          type: "application/json",
        }),
      );
      const link = document.createElement("a");
      link.href = url;
      link.download = "leadflow-crm-backup.json";
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) {
      setMessage(describe(error));
    }
  }
  return {
    data,
    setData,
    atlasStatus: status,
    atlasMessage: message,
    retryAtlas: retry,
    reloadAtlas,
    exportAtlasBackup,
  };
}
