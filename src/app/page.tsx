"use client";

import { motion } from "framer-motion";
import { ArrowLeftRight, History, ScanSearch, Sparkles, UserRound, Wand2 } from "lucide-react";
import { useRef, useState, useSyncExternalStore } from "react";
import { ActiveContext } from "@/components/active";
import Builder from "@/components/builder/Builder";
import Checker from "@/components/checker/Checker";
import Compare from "@/components/compare/Compare";
import LegacyBuilder from "@/components/legacy/LegacyBuilder";
import VoiceProfileForm from "@/components/profile/VoiceProfileForm";
import { isVoiceSetUp } from "@/lib/prompt/defaults";
import { modeStore, useStore, voiceStore, type AppMode } from "@/lib/store";

type Tab = "builder" | "checker" | "voice";

const MODES: { id: AppMode; label: string; sub: string; icon: React.ReactNode }[] = [
  { id: "new", label: "เวอร์ชันใหม่", sub: "ปัจจุบัน", icon: <Sparkles size={15} /> },
  { id: "old", label: "เวอร์ชันเดิม", sub: "ก่อนปรับ", icon: <History size={15} /> },
  { id: "compare", label: "เปรียบเทียบ", sub: "เทียบทั้งสอง", icon: <ArrowLeftRight size={15} /> },
];

const BADGE: Record<AppMode, string> = {
  new: "ไม่ซ้ำแพตเทิร์น · เสียงครูฮีมจริง",
  old: "เวอร์ชันเดิม · ก่อนปรับปรุง",
  compare: "เทียบเวอร์ชันเดิมกับเวอร์ชันใหม่",
};

const noop = () => () => {};

const SUBTITLE: Record<AppMode, string> = {
  new: "ออกแบบคำสั่งให้ Claude เขียนโพสต์ในเสียงครูฮีม จากเรื่องจริงของครู หมุนวิธีเปิด โครงเรื่อง และวิธีปิดได้ไม่ซ้ำโพสต์ก่อน แล้วตรวจกลิ่น AI ก่อนโพสต์",
  old: "เวอร์ชันเดิมก่อนปรับปรุง ตัวเลือกเหมือนเดิม และคำสั่งที่ได้ตรงกับของเดิมทุกตัวอักษร",
  compare: "ลองหัวข้อเดียวกันกับทั้งสองเวอร์ชัน ดูว่าคำสั่งต่างกันตรงไหน แล้วเทียบโพสต์ที่ได้จริง",
};

export default function Page() {
  const [tab, setTab] = useState<Tab>("builder");
  const [voice] = useStore(voiceStore);
  const [mode, setMode] = useStore(modeStore);
  // ก่อนโหลดเสร็จ ยังไม่รู้ว่าครูเลือกเวอร์ชันไหนไว้ จึงยังไม่แสดงตัวสร้างคำสั่ง กันหน้าเวอร์ชันใหม่โผล่แวบก่อนสลับ
  const mounted = useSyncExternalStore(noop, () => true, () => false);
  const pillRefs = useRef<(HTMLButtonElement | null)[]>([]);

  function onPillKey(e: React.KeyboardEvent, i: number) {
    const step = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
    if (!step) return;
    e.preventDefault();
    const next = (i + step + MODES.length) % MODES.length;
    setMode(MODES[next].id);
    pillRefs.current[next]?.focus();
  }
  const voiceReady = isVoiceSetUp(voice);

  const tabs: { id: Tab; label: string; icon: React.ReactNode; dot?: boolean }[] = [
    { id: "builder", label: "สร้างคำสั่ง", icon: <Wand2 size={16} /> },
    { id: "checker", label: "ตรวจบทความ", icon: <ScanSearch size={16} /> },
    { id: "voice", label: "ตัวตนครูฮีม", icon: <UserRound size={16} />, dot: !voiceReady },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 relative z-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="text-center mb-8"
      >
        <div className="inline-flex items-center gap-2 mb-5">
          <span
            className="badge px-4 py-1.5 rounded-full"
            style={{
              background: "var(--color-accent-soft)",
              color: "var(--color-accent-text)",
              border: "1px solid var(--color-border-default)",
            }}
          >
            <Sparkles size={14} />
            <span className="font-semibold tracking-wider text-[11px]">{mounted ? BADGE[mode] : BADGE.new}</span>
          </span>
        </div>
        <h1 className="display-xl mb-4 tracking-tight">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ffb789] via-[#f0a877] to-[#e8955f]">
            Turn Complexity Into Clarity
          </span>
        </h1>
        <p className="text-body max-w-xl mx-auto leading-relaxed" style={{ color: "var(--color-text-tertiary)" }}>
          {mounted ? SUBTITLE[mode] : "\u00a0"}
        </p>
      </motion.div>

      {mounted ? (
        <>
          <div className="flex justify-center mb-4">
            <div className="mode-switch" role="radiogroup" aria-label="เลือกเวอร์ชัน">
              {MODES.map((m, i) => (
                <button
                  key={m.id}
                  ref={(el) => {
                    pillRefs.current[i] = el;
                  }}
                  type="button"
                  role="radio"
                  aria-checked={mode === m.id}
                  tabIndex={mode === m.id ? 0 : -1}
                  className={`mode-pill ${mode === m.id ? "active" : ""}`}
                  onClick={() => setMode(m.id)}
                  onKeyDown={(e) => onPillKey(e, i)}
                >
                  {m.icon}
                  <span className="flex flex-col items-start leading-tight">
                    <span>{m.label}</span>
                    <span className="mode-sub">{m.sub}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* เก็บทุกเวอร์ชันไว้ในหน้า แค่ซ่อน สลับไปมาแล้วสิ่งที่พิมพ์ค้างไว้ไม่หาย */}
          <div hidden={mode !== "new"}>
            <ActiveContext.Provider value={mode === "new"}>
            <div className="flex justify-center mb-6">
              <div className="tabbar" role="tablist">
                {tabs.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    role="tab"
                    aria-selected={tab === t.id}
                    className={`tab ${tab === t.id ? "active" : ""}`}
                    onClick={() => setTab(t.id)}
                  >
                    {t.icon}
                    {t.label}
                    {t.dot && tab !== t.id && <span className="tab-dot" title="ยังไม่ได้ตั้งค่า" />}
                  </button>
                ))}
              </div>
            </div>

            <div role="tabpanel">
              {tab === "builder" && <Builder />}
              {tab === "checker" && <Checker />}
              {tab === "voice" && <VoiceProfileForm />}
            </div>
            </ActiveContext.Provider>
          </div>
          <div hidden={mode !== "old"}>
            <ActiveContext.Provider value={mode === "old"}>
              <LegacyBuilder />
            </ActiveContext.Provider>
          </div>
          <div hidden={mode !== "compare"}>
            <ActiveContext.Provider value={mode === "compare"}>
              <Compare />
            </ActiveContext.Provider>
          </div>
        </>
      ) : (
        <div className="min-h-[60vh]" aria-hidden="true" />
      )}
    </div>
  );
}
