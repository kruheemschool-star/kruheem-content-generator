"use client";

import { motion } from "framer-motion";
import {
  BookOpen,
  Calculator,
  Check,
  CircleAlert,
  Copy,
  History,
  Info,
  MessageCircleQuestionMark,
  Pencil,
  Trash2,
  Wand2,
} from "lucide-react";
import { useState } from "react";
import type { BuildResult } from "@/lib/prompt/build";
import { labelOf } from "@/lib/prompt/defaults";
import { NEED_LABEL } from "@/lib/prompt/options";
import type { BuilderConfig, HistoryEntry } from "@/lib/prompt/types";
import { Notice } from "../ui";

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(ta);
      return ok;
    } catch {
      return false;
    }
  }
}

function EmptyState() {
  return (
    <div className="h-full flex flex-col items-center justify-center space-y-8 py-16">
      <div className="relative w-44 h-44 flex items-center justify-center">
        <div className="absolute inset-4 blur-3xl animate-pulse rounded-full" style={{ background: "var(--color-apricot-glow)" }} />
        <div
          className="absolute rounded-full border border-dashed"
          style={{ width: 128, height: 128, top: 24, left: 24, borderColor: "var(--color-border-default)" }}
        />
        <div
          className="w-20 h-20 rounded-2xl flex items-center justify-center relative z-10 shadow-xl"
          style={{
            background: "var(--color-bg-elevated)",
            border: "1px solid var(--color-border-default)",
            boxShadow: "0 0 32px var(--color-apricot-glow)",
          }}
        >
          <motion.div animate={{ rotate: [0, 10, -8, 6, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}>
            <Wand2 size={36} style={{ color: "var(--color-apricot-500)", opacity: 0.8 }} />
          </motion.div>
        </div>
        {(
          [
            { Icon: Calculator, initialDeg: 0, color: "#ffb789" },
            { Icon: BookOpen, initialDeg: 120, color: "#ffd1b3" },
            { Icon: Pencil, initialDeg: 240, color: "#e8955f" },
          ] as const
        ).map(({ Icon, initialDeg, color }) => (
          <motion.div
            key={initialDeg}
            className="absolute inset-0"
            style={{ rotate: initialDeg }}
            animate={{ rotate: initialDeg + 360 }}
            transition={{ duration: 9, repeat: Infinity, ease: "linear" }}
          >
            <div className="absolute left-1/2" style={{ top: 6, transform: "translateX(-50%)" }}>
              <motion.div
                className="w-9 h-9 rounded-xl flex items-center justify-center shadow-md"
                style={{
                  background: "var(--color-bg-secondary)",
                  border: `1px solid ${color}30`,
                  boxShadow: `0 4px 16px ${color}22`,
                  rotate: -initialDeg,
                }}
                animate={{ rotate: -(initialDeg + 360) }}
                transition={{ duration: 9, repeat: Infinity, ease: "linear" }}
              >
                <Icon size={15} style={{ color }} strokeWidth={1.75} />
              </motion.div>
            </div>
          </motion.div>
        ))}
      </div>
      <div className="text-center space-y-2 px-6">
        <h3 className="heading-lg font-bold">รอหัวข้อจากครู</h3>
        <p className="text-body max-w-[320px] mx-auto" style={{ color: "var(--color-text-tertiary)" }}>
          พิมพ์หัวข้อในขั้นที่ 1 แล้วคำสั่งจะขึ้นตรงนี้ทันที ปรับอะไรทางซ้าย คำสั่งก็เปลี่ยนตาม
        </p>
      </div>
    </div>
  );
}

function HistoryList({ history, onDelete, onClear }: { history: HistoryEntry[]; onDelete: (id: string) => void; onClear: () => void }) {
  if (!history.length) {
    return (
      <p className="text-micro" style={{ color: "var(--color-text-tertiary)" }}>
        ยังไม่มีประวัติ กดคัดลอกคำสั่งครั้งแรกแล้วแอปจะเริ่มจำว่าโพสต์นี้ใช้แพตเทิร์นอะไร
      </p>
    );
  }
  return (
    <div className="space-y-2">
      {history.slice(0, 6).map((h, i) => (
        <div key={h.id} className="flex items-start gap-3 p-3 rounded-xl" style={{ background: "var(--color-bg-tertiary)" }}>
          <span className="text-micro font-bold mt-0.5 w-5 flex-none text-accent">{i + 1}</span>
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline gap-2">
              <p className="text-caption font-semibold truncate" style={{ color: "var(--color-text-primary)" }}>
                {h.topic || "(ไม่มีหัวข้อ)"}
              </p>
              <span className="text-[0.65rem] flex-none" style={{ color: "var(--color-text-tertiary)" }}>
                {new Date(h.at).toLocaleDateString("th-TH", { day: "numeric", month: "short" })}
              </span>
            </div>
            <div className="flex flex-wrap gap-1 mt-1.5">
              <span className="tag">เปิด: {labelOf("opening", h.opening)}</span>
              <span className="tag">โครง: {labelOf("arc", h.arc)}</span>
              <span className="tag">ปิด: {labelOf("ending", h.ending)}</span>
              <span className="tag">{labelOf("tone", h.tone)}</span>
            </div>
          </div>
          <button type="button" className="btn-small" style={{ padding: "0 8px" }} onClick={() => onDelete(h.id)} aria-label="ลบรายการนี้" title="ลบรายการนี้">
            <Trash2 size={12} />
          </button>
        </div>
      ))}
      <div className="flex justify-end">
        <button type="button" className="btn-small" onClick={onClear}>
          ล้างประวัติทั้งหมด
        </button>
      </div>
    </div>
  );
}

export default function PromptPanel({
  cfg,
  result,
  recentWarnings,
  justCopied,
  history,
  onCopied,
  onDeleteHistory,
  onClearHistory,
}: {
  cfg: BuilderConfig;
  result: BuildResult | null;
  recentWarnings: string[];
  justCopied: boolean;
  history: HistoryEntry[];
  onCopied: () => void;
  onDeleteHistory: (id: string) => void;
  onClearHistory: () => void;
}) {
  const [copied, setCopied] = useState<"ok" | "fail" | null>(null);

  async function handleCopy() {
    if (!result) return;
    const ok = await copyText(result.prompt);
    setCopied(ok ? "ok" : "fail");
    if (ok) onCopied();
    setTimeout(() => setCopied(null), 2200);
  }

  return (
    <div className="space-y-4">
      <div className="output-surface flex flex-col">
        <div className="output-header gap-3 flex-wrap">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-2.5 h-2.5 rounded-full animate-pulse flex-none" style={{ background: "var(--color-apricot-500)" }} />
            <div className="min-w-0">
              <p className="heading-md">คำสั่งสำหรับ Claude</p>
              {result && (
                <p className="text-[0.68rem]" style={{ color: "var(--color-text-tertiary)" }}>
                  {result.prompt.length.toLocaleString("th-TH")} ตัวอักษร · กดคัดลอกแล้วแอปจะจำแพตเทิร์นนี้ไว้
                </p>
              )}
            </div>
          </div>
          <button type="button" className="btn-copy" onClick={handleCopy} disabled={!result}>
            {copied === "ok" ? (
              <>
                <Check size={16} /> คัดลอกแล้ว
              </>
            ) : copied === "fail" ? (
              <>
                <CircleAlert size={16} /> คัดลอกไม่ได้ ลองลากคลุมเอง
              </>
            ) : (
              <>
                <Copy size={16} /> คัดลอกคำสั่ง
              </>
            )}
          </button>
        </div>

        {result ? (
          <div className="p-5 space-y-3">
            <div className="flex flex-wrap gap-1.5">
              <span className="tag">
                เปิด:{" "}
                {result.openingMode === "single"
                  ? labelOf("opening", result.openingIds[0])
                  : result.openingMode === "choose"
                    ? "Claude เลือกจาก 3 แบบ"
                    : "3 เวอร์ชัน 3 แบบ"}
              </span>
              <span className="tag">โครง: {labelOf("arc", cfg.arc)}</span>
              <span className="tag">ปิด: {labelOf("ending", cfg.ending)}</span>
              <span className="tag">{labelOf("tone", cfg.tonePrimary)}</span>
            </div>

            {result.missing.length > 0 && (
              <Notice kind="warn" icon={<MessageCircleQuestionMark size={15} />}>
                แพตเทิร์นที่เลือกต้องใช้ <b>{result.missing.map((n) => NEED_LABEL[n]).join(" · ")}</b> แต่ครูยังไม่ได้กรอกในขั้นที่ 2
                คำสั่งจึงให้ Claude ถามครูก่อนเขียน กันไม่ให้แต่งเรื่องขึ้นเอง
              </Notice>
            )}
            {result.missing.length === 0 && result.interviewing && (
              <Notice kind="info" icon={<MessageCircleQuestionMark size={15} />}>
                เปิดโหมดสัมภาษณ์อยู่ Claude จะถามครู 3–5 ข้อก่อน แล้วค่อยเขียน
              </Notice>
            )}
            {justCopied && (
              <Notice kind="ok" icon={<Check size={15} />}>
                บันทึกแพตเทิร์นนี้ลงประวัติแล้ว โพสต์ถัดไปกดปุ่มลัดในขั้นที่ 3 แอปจะเลือกชุดใหม่ที่ไม่ซ้ำให้
              </Notice>
            )}
            {recentWarnings.map((w) => (
              <Notice key={w} kind="warn" icon={<History size={15} />}>
                {w}
              </Notice>
            ))}
            {result.notes.map((n) => (
              <Notice key={n} kind="info" icon={<Info size={15} />}>
                {n}
              </Notice>
            ))}

            <pre
              className="prompt-pre p-5 rounded-2xl overflow-auto max-h-[62vh]"
              style={{ background: "var(--color-bg-tertiary)", border: "1px solid var(--color-border-subtle)" }}
            >
              {result.prompt}
            </pre>

            <p className="text-micro" style={{ color: "var(--color-text-tertiary)" }}>
              วางคำสั่งใน Claude ได้เลย ถ้า Claude ถามกลับ ตอบสั้นๆ แบบพูดก็พอ ได้โพสต์แล้วเอามาวางในแท็บ “ตรวจบทความ” เพื่อเช็กกลิ่น AI ก่อนโพสต์
            </p>
          </div>
        ) : (
          <EmptyState />
        )}
      </div>

      <div className="surface p-5">
        <div className="flex items-center gap-2 mb-3">
          <History size={16} className="text-accent" />
          <p className="heading-md text-[0.95rem]">แพตเทิร์นที่เพิ่งใช้</p>
        </div>
        <HistoryList history={history} onDelete={onDeleteHistory} onClear={onClearHistory} />
      </div>
    </div>
  );
}
