"use client";

import { motion } from "framer-motion";
import { ScanSearch, Sparkles, UserRound, Wand2 } from "lucide-react";
import { useState } from "react";
import Builder from "@/components/builder/Builder";
import Checker from "@/components/checker/Checker";
import VoiceProfileForm from "@/components/profile/VoiceProfileForm";
import { isVoiceSetUp } from "@/lib/prompt/defaults";
import { useStore, voiceStore } from "@/lib/store";

type Tab = "builder" | "checker" | "voice";

export default function Page() {
  const [tab, setTab] = useState<Tab>("builder");
  const [voice] = useStore(voiceStore);
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
            <span className="font-semibold tracking-wider text-[11px]">ไม่ซ้ำแพตเทิร์น · เสียงครูฮีมจริง</span>
          </span>
        </div>
        <h1 className="display-xl mb-4 tracking-tight">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ffb789] via-[#f0a877] to-[#e8955f]">
            Turn Complexity Into Clarity
          </span>
        </h1>
        <p className="text-body max-w-xl mx-auto leading-relaxed" style={{ color: "var(--color-text-tertiary)" }}>
          ออกแบบคำสั่งให้ Claude เขียนโพสต์ในเสียงครูฮีม จากเรื่องจริงของครู
          หมุนวิธีเปิด โครงเรื่อง และวิธีปิดได้ไม่ซ้ำโพสต์ก่อน แล้วตรวจกลิ่น AI ก่อนโพสต์
        </p>
      </motion.div>

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
    </div>
  );
}
