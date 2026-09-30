"use client";

import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";

export function Step({
  num,
  title,
  summary,
  defaultOpen = true,
  children,
}: {
  num: number | string;
  title: string;
  summary?: ReactNode;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  return (
    <details className="step" open={defaultOpen}>
      <summary>
        <span className="step-num">{num}</span>
        <span className="min-w-0">
          <span className="block heading-md text-[0.95rem]" style={{ color: "var(--color-text-primary)" }}>
            {title}
          </span>
          {summary && (
            <span className="block text-micro truncate" style={{ color: "var(--color-text-tertiary)" }}>
              {summary}
            </span>
          )}
        </span>
        <ChevronDown size={18} className="step-chevron" />
      </summary>
      <div className="step-body">{children}</div>
    </details>
  );
}

export function SubLabel({ children, hint }: { children: ReactNode; hint?: ReactNode }) {
  return (
    <div className="sub-label">
      {children}
      {hint && <span className="hint">{hint}</span>}
    </div>
  );
}

export function Chip({
  active,
  onClick,
  children,
  disabled,
  title,
}: {
  active?: boolean;
  onClick: () => void;
  children: ReactNode;
  disabled?: boolean;
  title?: string;
}) {
  return (
    <button
      type="button"
      className={`chip ${active ? "active" : ""}`}
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-pressed={active}
    >
      {children}
    </button>
  );
}

export function Segmented<T extends string | number>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: ReactNode }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="segmented">
      {options.map((o) => (
        <button
          key={String(o.value)}
          type="button"
          className={`segmented-item ${value === o.value ? "active" : ""}`}
          onClick={() => onChange(o.value)}
          aria-pressed={value === o.value}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function OptionCard({
  active,
  onClick,
  title,
  desc,
  tags,
  lead,
}: {
  active: boolean;
  onClick: () => void;
  title: ReactNode;
  desc?: ReactNode;
  tags?: ReactNode;
  lead?: ReactNode;
}) {
  return (
    <button type="button" className={`opt-card ${active ? "active" : ""}`} onClick={onClick} aria-pressed={active}>
      <span className="opt-title">
        {lead}
        {title}
      </span>
      {desc && <span className="opt-desc">{desc}</span>}
      {tags && <span className="opt-tags">{tags}</span>}
    </button>
  );
}

export function Notice({
  kind,
  icon,
  children,
}: {
  kind: "info" | "warn" | "fail" | "ok";
  icon?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className={`notice ${kind}`}>
      {icon && <span className="mt-0.5 flex-none">{icon}</span>}
      <div className="min-w-0">{children}</div>
    </div>
  );
}
