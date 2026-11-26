"use client";

import { motion, useReducedMotion } from "motion/react";

import { useTheme } from "next-themes";
import { Moon, Sun, Zap } from "lucide-react";
import Link from "next/link";

import {
  useEffect,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";

// Hydration-safe browser detection
const subscribe = () => () => {};

const getClientSnapshot = () => true;

const getServerSnapshot = () => false;

// Website logo
export function Logo() {
  return (
    <Link className="logo" href="/">
      <Zap />
      LeadFlow <span className="accent">AI</span>
    </Link>
  );
}

// Dark and light theme toggle
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();

  const ready = useSyncExternalStore(
    subscribe,
    getClientSnapshot,
    getServerSnapshot,
  );

  return (
    <button
      className="btn"
      aria-label="Toggle theme"
      disabled={!ready}
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
    >
      {ready && resolvedTheme === "light" ? (
        <Moon size={17} />
      ) : (
        <Sun size={17} />
      )}
    </button>
  );
}

// Reusable animated card
export function AnimatedCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      className={`card ${className}`}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.25 }}
    >
      {children}
    </motion.div>
  );
}

// Hydration-safe animated counter
export function Counter({
  value,
  format = (n: number) => Math.round(n).toLocaleString("en-IN"),
}: {
  value: number;
  format?: (n: number) => string;
}) {
  const ready = useSyncExternalStore(
    subscribe,
    getClientSnapshot,
    getServerSnapshot,
  );

  const reduced = useReducedMotion();

  const [shown, setShown] = useState(0);

  useEffect(() => {
    // Wait until hydration finishes.
    // Do not animate when reduced motion is enabled.
    if (!ready || reduced) return;

    const start = performance.now();

    let frame = 0;

    const tick = (now: number) => {
      const progress = Math.max(0, Math.min((now - start) / 500, 1));

      const eased = 1 - (1 - progress) ** 3;

      setShown(value * eased);

      if (progress < 1) {
        frame = requestAnimationFrame(tick);
      }
    };

    frame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frame);
    };
  }, [value, reduced, ready]);

  // Same initial output on server and browser.
  const displayValue = !ready ? 0 : reduced ? value : shown;

  return <>{format(displayValue)}</>;
}
