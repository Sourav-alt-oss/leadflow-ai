"use client";

import { useEffect, useState } from "react";
import { stateSchema, type DemoState } from "./model";
import { seed } from "./seed";

// Isolate fictional public demo data from the local Atlas workspace.
const STORAGE_KEY = "leadflow-public-demo-v1";
type Status = "loading" | "saved" | "saving" | "error" | "conflict";

export function useAtlasData() {
  const [data, setData] = useState<DemoState | null>(null);
  const [status, setStatus] = useState<Status>("loading");
  const [message, setMessage] = useState("Loading fictional demo records...");
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        const initial = raw === null ? seed() : stateSchema.parse(JSON.parse(raw));
        setData(initial);
        setStatus("saved");
        setMessage("Public demo: records are stored in this browser only.");
      } catch {
        setStatus("error");
        setMessage("Unable to load browser demo records. Check browser storage permissions.");
      }
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!data) return;
    let cancelled = false;
    let saved = false;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      saved = true;
    } catch {
      // Leave the current data available for JSON export.
    }
    queueMicrotask(() => {
      if (cancelled) return;
      setStatus(saved ? "saved" : "error");
      setMessage(saved
        ? "Changes saved in this browser. Fictional demo only."
        : "Unable to save browser data. Export a JSON backup.");
    });
    return () => { cancelled = true; };
  }, [data, retryCount]);

  function retryAtlas() {
    if (data) setRetryCount((count) => count + 1);
    else window.location.reload();
  }

  function reloadAtlas() {
    window.location.reload();
  }

  function exportAtlasBackup() {
    if (!data) return;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "leadflow-crm-backup-demo.json";
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return {
    data,
    setData,
    atlasStatus: status,
    atlasMessage: message,
    retryAtlas,
    reloadAtlas,
    exportAtlasBackup,
  };
}
