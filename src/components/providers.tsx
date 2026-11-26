"use client";
import { ThemeProvider } from "next-themes";
import { MotionConfig } from "motion/react";
import { Toaster } from "sonner";
import { DemoProvider } from "@/demo/store";
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <MotionConfig reducedMotion="user">
        <DemoProvider>
          {children}
          <Toaster position="bottom-right" richColors />
        </DemoProvider>
      </MotionConfig>
    </ThemeProvider>
  );
}
