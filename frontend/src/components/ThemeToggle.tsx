"use client";
import { Sun, Moon } from "lucide-react";
import { Icon } from "@/components/Icon";
import { useTheme } from "./ThemeProvider";

export default function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      onClick={toggle}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className={[
        "rounded-lg p-2 min-h-[44px] min-w-[44px] flex items-center justify-center",
        "transition-colors duration-200",
        "hover:bg-[var(--color-border)] focus:outline-none",
        "focus-visible:ring-2 focus-visible:ring-[var(--color-gold)]",
      ].join(" ")}
    >
      {/* Icon is decorative; aria-label on the button conveys the action */}
      <Icon
        icon={isDark ? Sun : Moon}
        size="md"
        className="text-[var(--color-text)]"
      />
    </button>
  );
}
