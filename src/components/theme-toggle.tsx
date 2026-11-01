"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

const KEY = "shubh-theme";

export function applyTheme(theme: "light" | "dark") {
  document.documentElement.classList.toggle("dark", theme === "dark");
  localStorage.setItem(KEY, theme);
}

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  const next = dark ? "light" : "dark";
  return (
    <button
      type="button"
      className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm text-ink hover:bg-surface-muted"
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      onClick={() => {
        applyTheme(next);
        setDark(next === "dark");
      }}
    >
      {dark ? <Sun className="size-4" aria-hidden /> : <Moon className="size-4" aria-hidden />}
      {compact ? null : dark ? "Light" : "Dark"}
    </button>
  );
}
