"use client";

import { useSyncExternalStore } from "react";
import { Sun, Moon } from "lucide-react";

type Theme = "light" | "dark";

// สคริปต์ใน layout ตั้ง data-theme ไว้ก่อนหน้าเว็บโหลดเสร็จ ปุ่มนี้แค่อ่านและเปลี่ยนค่านั้น
function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => observer.disconnect();
}

const readTheme = (): Theme => (document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark");
const noop = () => () => {};

export default function ThemeToggle() {
  const theme = useSyncExternalStore<Theme>(subscribe, readTheme, () => "dark");
  const mounted = useSyncExternalStore(noop, () => true, () => false);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem("theme", next);
    } catch {
      /* ignore */
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={theme === "dark" ? "เปลี่ยนเป็นโหมดสว่าง" : "เปลี่ยนเป็นโหมดมืด"}
      title={theme === "dark" ? "โหมดสว่าง" : "โหมดมืด"}
      className="theme-toggle"
      suppressHydrationWarning
    >
      <span
        className="icon-wrapper"
        style={{
          transform: mounted ? "rotate(0deg)" : "rotate(-90deg)",
          opacity: mounted ? 1 : 0,
        }}
      >
        {theme === "dark" ? (
          <Sun size={16} strokeWidth={2} />
        ) : (
          <Moon size={16} strokeWidth={2} />
        )}
      </span>
    </button>
  );
}
