"use client";

import { useContext, useState } from "react";
import { copyText } from "@/lib/clipboard";
import { buildLegacyPrompt, type LegacyMode } from "@/lib/legacy/buildLegacyPrompt";
import { ActiveContext } from "@/components/active";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Copy,
  Check,
  BookOpen,
  Target,
  Zap,
  FileText,
  BookMarked,
  Wand2,
  MessageSquare,
  Share2,
  Bookmark,
  UserPlus,
  Link,
  Heart,
  Users,
  GraduationCap,
  Flame,
  Film,
  Tv,
  Atom,
  AlignJustify,
  AlignLeft,
  Calculator,
  Pencil,
  AlertTriangle,
  Brain,
  PlayCircle,
  Trophy,
} from "lucide-react";

type Mode = LegacyMode;

interface ToneOption {
  value: string;
  emoji: string;
  label: string;
  desc: string;
}

interface CTAOption {
  value: string;
  icon: React.ReactNode;
  label: string;
}

export default function LegacyBuilder() {
  const active = useContext(ActiveContext);
  const [topic, setTopic] = useState("");
  const [mode, setMode] = useState<Mode>("Math Explainer");
  const [selectedTones, setSelectedTones] = useState<string[]>(["อบอุ่น"]);
  const [length, setLength] = useState<string>("ปานกลาง");
  const [selectedCTAs, setSelectedCTAs] = useState<string[]>(["คอมเมนต์"]);
  const [selectedSpecials, setSelectedSpecials] = useState<string[]>([]);
  const [writingFormat, setWritingFormat] = useState<string>("ต่อเนื่อง");
  const [keyDetail, setKeyDetail] = useState("");

  const [generatedPrompt, setGeneratedPrompt] = useState("");
  const [copied, setCopied] = useState(false);

  // ── Toggle helpers ──
  function toggleTone(tone: string) {
    setSelectedTones((prev) =>
      prev.includes(tone) ? prev.filter((t) => t !== tone) : [...prev, tone]
    );
  }

  function toggleCTA(cta: string) {
    setSelectedCTAs((prev) =>
      prev.includes(cta) ? prev.filter((c) => c !== cta) : [...prev, cta]
    );
  }

  function toggleSpecial(s: string) {
    setSelectedSpecials((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  }


  // ── Build Prompt ── (ข้อความคำสั่งอยู่ใน buildLegacyPrompt คัดลอกมาตรงตัวจากเวอร์ชันเดิม)
  function handleBuildPrompt() {
    if (!topic.trim()) return;
    setGeneratedPrompt(
      buildLegacyPrompt({ topic, mode, selectedTones, length, selectedCTAs, selectedSpecials, writingFormat, keyDetail }),
    );
  }

  async function handleCopy() {
    const ok = await copyText(generatedPrompt);
    if (!ok) return;
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // ── Data ──
  const modes: { value: Mode; icon: React.ReactNode; label: string; sub: string }[] = [
    { value: "Math Explainer", icon: <BookOpen size={20} strokeWidth={1.5} />, label: "วิชาการ", sub: "อธิบายคณิตศาสตร์" },
    { value: "Study & Motivation", icon: <Target size={20} strokeWidth={1.5} />, label: "เทคนิค & แรงบันดาลใจ", sub: "จูงใจ ให้กำลังใจ" },
  ];

  const tones: ToneOption[] = [
    { value: "ขำขัน", emoji: "😂", label: "ขำขัน", desc: "ดึงคนหยุดดู" },
    { value: "อบอุ่น", emoji: "🤗", label: "อบอุ่น", desc: "สร้างไว้วางใจ" },
    { value: "ปลุกใจ", emoji: "🔥", label: "ปลุกใจ", desc: "กระตุ้น Action" },
    { value: "เชิญชวน/โน้มน้าว", emoji: "📢", label: "โน้มน้าว", desc: "อยากทำตาม" },
    { value: "FOMO/เร่งด่วน", emoji: "⚠️", label: "FOMO", desc: "กลัวพลาด" },
    { value: "ท้าทาย/โต้แย้ง", emoji: "🎯", label: "ท้าทาย", desc: "อยากถกเถียง" },
    { value: "เล่าเรื่อง", emoji: "📖", label: "เล่าเรื่อง", desc: "อ่านจนจบ" },
    { value: "ตรงไปตรงมา", emoji: "💬", label: "ตรงไปตรงมา", desc: "พูดตรงๆ" },
    { value: "ว้าว/ทึ่ง", emoji: "🤯", label: "ว้าว/ทึ่ง", desc: "ชวนทึ่ง" },
  ];

  const ctaOptions: CTAOption[] = [
    { value: "คอมเมนต์", icon: <MessageSquare size={14} strokeWidth={1.5} />, label: "คอมเมนต์" },
    { value: "แชร์", icon: <Share2 size={14} strokeWidth={1.5} />, label: "แชร์" },
    { value: "Save", icon: <Bookmark size={14} strokeWidth={1.5} />, label: "เก็บไว้ดู" },
    { value: "แท็กเพื่อน", icon: <UserPlus size={14} strokeWidth={1.5} />, label: "แท็กเพื่อน" },
    { value: "กดลิงก์", icon: <Link size={14} strokeWidth={1.5} />, label: "กดลิงก์/สมัคร" },
    { value: "กดติดตาม", icon: <Heart size={14} strokeWidth={1.5} />, label: "ไลค์/ติดตาม" },
  ];

  const specialOptions: { value: string; icon: React.ReactNode; label: string; desc: string }[] = [
    { value: "ผู้ปกครอง", icon: <Users size={16} strokeWidth={1.5} />, label: "เขียนถึงผู้ปกครอง", desc: "สื่อสารกับพ่อแม่โดยตรง" },
    { value: "นักเรียน", icon: <GraduationCap size={16} strokeWidth={1.5} />, label: "เขียนถึงนักเรียน", desc: "พูดกับเด็กๆ เป็นกันเอง" },
    { value: "ดราม่า", icon: <Flame size={16} strokeWidth={1.5} />, label: "สไตล์ดราม่า", desc: "เร้าอารมณ์ เรียกยอดวิว" },
    { value: "ภาพยนตร์", icon: <Film size={16} strokeWidth={1.5} />, label: "อ้างอิงภาพยนตร์", desc: "ยกตัวอย่างจากหนัง/ซีรีส์" },
    { value: "การ์ตูน", icon: <Tv size={16} strokeWidth={1.5} />, label: "อ้างอิงการ์ตูน", desc: "ยกตัวอย่างจากอนิเมะ" },
    { value: "บุคคลสำคัญ", icon: <Atom size={16} strokeWidth={1.5} />, label: "อ้างอิงบุคคลสำคัญ", desc: "นักวิทย์/นักคณิตศาสตร์" },
    { value: "จุดพลาดบ่อย", icon: <AlertTriangle size={16} strokeWidth={1.5} />, label: "เตือนจุดพลาดบ่อย", desc: "เด็กพลาดตรงไหนซ้ำๆ" },
    { value: "เทคนิคช่วยจำ", icon: <Brain size={16} strokeWidth={1.5} />, label: "เทคนิคช่วยจำ", desc: "สูตรลัด จำแบบไม่ลืม" },
    { value: "ขายคอร์ส", icon: <PlayCircle size={16} strokeWidth={1.5} />, label: "สอดแทรกขายคอร์ส", desc: "Soft-sell VOD เนียนๆ" },
    { value: "เคสศิษย์เก่า", icon: <Trophy size={16} strokeWidth={1.5} />, label: "เคสศิษย์เก่าสำเร็จ", desc: "เรื่องจริงสร้างแรงบันดาลใจ" },
  ];

  const formatOptions: { value: string; icon: React.ReactNode; label: string; desc: string }[] = [
    { value: "ต่อเนื่อง", icon: <AlignJustify size={16} strokeWidth={1.5} />, label: "บทความยาวต่อเนื่อง", desc: "ย่อหน้ายาว ลื่นไหล" },
    { value: "เว้นบรรทัด", icon: <AlignLeft size={16} strokeWidth={1.5} />, label: "เว้นบรรทัดอ่านง่าย", desc: "ประโยคสั้น สแกนเร็ว" },
  ];

  const lengths: { value: string; icon: React.ReactNode; label: string; words: string }[] = [
    { value: "สั้น", icon: <Zap size={14} strokeWidth={1.5} />, label: "สั้น", words: "500–600" },
    { value: "ปานกลาง", icon: <FileText size={14} strokeWidth={1.5} />, label: "ปานกลาง", words: "1,000–1,500" },
    { value: "ยาว", icon: <BookMarked size={14} strokeWidth={1.5} />, label: "ยาว", words: "3,000–4,000" },
  ];

  return (
    <div className="legacy-ui relative z-10 px-2 sm:px-0 pb-2">
      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Control Panel */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="lg:col-span-5"
        >
          <div className="surface p-8 space-y-8 backdrop-blur-xl bg-opacity-40">
            {/* Header */}
            <div className="flex items-center gap-4">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center bg-gradient-to-br from-[#ffb789] to-[#e8955f] shadow-lg shadow-[#ffb789]/20"
              >
                <Wand2 size={24} className="text-[#0a0a0c]" />
              </div>
              <div>
                <h2 className="heading-md text-primary">ตั้งค่า Prompt</h2>
                <p className="text-micro text-tertiary">ปรับแต่งเอกลักษณ์เฉพาะตัวของคุณ</p>
              </div>
            </div>

            <div className="divider" />

            {/* Inputs Section */}
            <div className="space-y-6">
              {/* Topic Input */}
              <div className="field-group">
                <label className="field-label flex items-center gap-2">
                  <BookOpen size={14} /> หัวข้อที่ต้องการ
                </label>
                <input
                  className="field-input h-12 text-base"
                  placeholder='เช่น "สมการเชิงเส้น" หรือ "วิธีอ่านหนังสือ"'
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                />
              </div>

              {/* Mode Selection */}
              <div className="field-group">
                <label className="field-label">รูปแบบการนำเสนอ</label>
                <div className="grid grid-cols-2 gap-3">
                  {modes.map((m) => (
                    <button
                      key={m.value}
                      onClick={() => setMode(m.value)}
                      className={`mode-option group transition-all duration-500 ${mode === m.value ? "selected" : ""}`}
                    >
                      <div className={`p-3 rounded-xl transition-colors duration-500 ${mode === m.value ? "bg-[#ffb789] text-[#0a0a0c]" : "bg-bg-elevated text-tertiary group-hover:text-secondary"}`}>
                        {m.icon}
                      </div>
                      <span className="font-bold mt-2">{m.label}</span>
                      <span className="text-[10px] opacity-60 font-medium">{m.sub}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Tone Multi-select */}
              <div className="field-group">
                <label className="field-label">บุคลิกและน้ำเสียง <span className="opacity-50 text-[10px] ml-1">(เลือกได้หลายแบบ)</span></label>
                <div className="grid grid-cols-2 gap-2">
                  {tones.map((t) => {
                    const isActive = selectedTones.includes(t.value);
                    return (
                      <button
                        key={t.value}
                        onClick={() => toggleTone(t.value)}
                        className={`tone-option text-left px-4 py-3 transition-all duration-300 ${isActive ? "selected" : "opacity-70 grayscale hover:grayscale-0 hover:opacity-100"}`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{t.emoji}</span>
                          <div className="leading-tight">
                            <p className="text-micro font-bold">{t.label}</p>
                            <p className="text-[9px] opacity-60">{t.desc}</p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Length Selection */}
              <div className="field-group">
                <label className="field-label">ความยาวของเนื้อหา</label>
                <div className="segmented p-1.5 bg-bg-elevated/50">
                  {lengths.map((l) => (
                    <button
                      key={l.value}
                      onClick={() => setLength(l.value)}
                      className={`segmented-item py-2.5 font-bold transition-all duration-500 ${length === l.value ? "active" : ""}`}
                    >
                      {l.icon}
                      <span className="ml-1.5">{l.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* CTA Multi-select */}
              <div className="field-group">
                <label className="field-label">Action ท้ายบทความ</label>
                <div className="flex flex-wrap gap-2">
                  {ctaOptions.map((c) => {
                    const isActive = selectedCTAs.includes(c.value);
                    return (
                      <button
                        key={c.value}
                        onClick={() => toggleCTA(c.value)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full border-2 transition-all duration-300 font-bold text-micro ${isActive ? "bg-[#ffb789]/10 border-[#ffb789] text-[#ffb789]" : "bg-bg-elevated border-transparent opacity-60 hover:opacity-100 font-medium"}`}
                      >
                        {c.icon}
                        {c.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Special Instructions Multi-select */}
              <div className="field-group">
                <label className="field-label">
                  คำสั่งพิเศษ
                  <span className="opacity-50 text-[10px] ml-1">(ติ๊กเลือกได้หลายข้อ หรือไม่เลือกเลยก็ได้)</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {specialOptions.map((s) => {
                    const isActive = selectedSpecials.includes(s.value);
                    return (
                      <button
                        key={s.value}
                        type="button"
                        onClick={() => toggleSpecial(s.value)}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border-2 text-left transition-all duration-300 ${
                          isActive
                            ? "bg-[#ffb789]/10 border-[#ffb789] text-[#ffb789]"
                            : "bg-bg-elevated/60 border-transparent opacity-70 hover:opacity-100"
                        }`}
                      >
                        <span
                          className={`flex items-center justify-center w-5 h-5 rounded-md border-2 transition-colors ${
                            isActive ? "bg-[#ffb789] border-[#ffb789]" : "border-white/20"
                          }`}
                        >
                          {isActive && <Check size={12} strokeWidth={3} className="text-[#0a0a0c]" />}
                        </span>
                        <span className={isActive ? "text-[#ffb789]" : "text-tertiary"}>{s.icon}</span>
                        <div className="leading-tight flex-1 min-w-0">
                          <p className="text-micro font-bold truncate">{s.label}</p>
                          <p className="text-[9px] opacity-60 truncate">{s.desc}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Writing Format */}
              <div className="field-group">
                <label className="field-label">
                  รูปแบบการเขียนเนื้อหา
                  <span className="opacity-50 text-[10px] ml-1">(เลือก 1 แบบ)</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {formatOptions.map((f) => {
                    const isActive = writingFormat === f.value;
                    return (
                      <button
                        key={f.value}
                        type="button"
                        onClick={() => setWritingFormat(f.value)}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border-2 text-left transition-all duration-300 ${
                          isActive
                            ? "bg-[#ffb789]/10 border-[#ffb789] text-[#ffb789]"
                            : "bg-bg-elevated/60 border-transparent opacity-70 hover:opacity-100"
                        }`}
                      >
                        <span className={isActive ? "text-[#ffb789]" : "text-tertiary"}>{f.icon}</span>
                        <div className="leading-tight flex-1 min-w-0">
                          <p className="text-micro font-bold truncate">{f.label}</p>
                          <p className="text-[9px] opacity-60 truncate">{f.desc}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Detail Input */}
              <div className="field-group">
                <label className="field-label">ข้อมูลเพิ่มเติม <span className="opacity-50 text-[10px] ml-1">(ออปชันเสริม)</span></label>
                <textarea
                  className="field-textarea min-h-[100px] border-none bg-bg-elevated/50"
                  placeholder="เช่น ต้องการเน้นเด็ก ม.ปลาย, มีโจทย์ประกอบ 2 ข้อ..."
                  value={keyDetail}
                  onChange={(e) => setKeyDetail(e.target.value)}
                />
              </div>

              <button
                className="btn-generate group overflow-hidden"
                onClick={handleBuildPrompt}
                disabled={!topic.trim() || selectedTones.length === 0 || selectedCTAs.length === 0}
              >
                <span className="relative z-10 flex items-center gap-3">
                  <Sparkles size={20} className="group-hover:rotate-12 transition-transform" />
                  สร้าง Prompt อัจฉริยะ
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-[#ffd1b3] to-[#e8955f] opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            </div>
          </div>
        </motion.div>

        {/* Right Preview Panel */}
        <div className="lg:col-span-7 lg:sticky lg:top-12">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="output-surface min-h-[600px] flex flex-col bg-bg-secondary/40 backdrop-blur-2xl relative overflow-hidden group shadow-2xl"
          >
            {/* Background Decorative Pattern */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#ffb789_1px,transparent_1px)] [background-size:20px_20px]" />

            {/* Header */}
            <div className="output-header px-8 py-6 flex items-center justify-between border-b border-white/5 relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-[#ffb789] animate-pulse" />
                <span className="heading-md font-bold tracking-tight">AI Output Preview</span>
              </div>

              <AnimatePresence>
                {generatedPrompt && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    onClick={handleCopy}
                    className="btn-ghost bg-[#ffb789] text-[#0a0a0c] hover:bg-[#ffd1b3] border-none px-6 rounded-full font-bold h-10"
                  >
                    {copied ? <><Check size={16} /> คัดลอกสำเร็จ!</> : <><Copy size={16} /> คัดลอกผลลัพธ์</>}
                  </motion.button>
                )}
              </AnimatePresence>
            </div>

            {/* Content Body */}
            <div className="flex-1 p-8 relative z-10">
              <AnimatePresence mode="wait">
                {generatedPrompt ? (
                  <motion.div
                    key="prompt"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="relative"
                  >
                    <div className="absolute -inset-1 bg-gradient-to-r from-[#ffb789]/10 to-[#e8955f]/5 blur-2xl rounded-3xl" />
                    <pre
                      className="relative p-8 rounded-3xl bg-bg-elevated/40 border border-white/5 text-body leading-loose whitespace-pre-wrap selection:bg-[#ffb789]/30"
                      style={{ fontFamily: "var(--font-sans)" }}
                    >
                      {generatedPrompt}
                    </pre>
                  </motion.div>
                ) : (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="h-full flex flex-col items-center justify-center space-y-8 pt-16"
                  >
                    {/* Orbit System */}
                    <div key={active ? "on" : "off"} className="relative w-44 h-44 flex items-center justify-center">

                      {/* Ambient glow */}
                      <div className="absolute inset-4 bg-[#ffb789]/15 blur-3xl animate-pulse rounded-full" />

                      {/* Dashed orbit ring */}
                      <div
                        className="absolute rounded-full border border-dashed border-[#ffb789]/25"
                        style={{ width: 128, height: 128, top: 24, left: 24 }}
                      />

                      {/* Center icon */}
                      <div className="w-20 h-20 rounded-2xl flex items-center justify-center relative z-10 shadow-xl"
                        style={{
                          background: "var(--color-bg-elevated)",
                          border: "1px solid rgba(255,183,137,0.18)",
                          boxShadow: "0 0 32px rgba(255,183,137,0.12)",
                        }}
                      >
                        <motion.div
                          animate={{ rotate: [0, 10, -8, 6, 0] }}
                          transition={{ duration: 4, repeat: active ? Infinity : 0, ease: "easeInOut" }}
                        >
                          <Wand2 size={36} style={{ color: "#ffb789", opacity: 0.7 }} />
                        </motion.div>
                      </div>

                      {/* Orbiting icons */}
                      {(
                        [
                          { Icon: Calculator, initialDeg: 0,   color: "#ffb789", label: "คำนวณ" },
                          { Icon: BookOpen,   initialDeg: 120,  color: "#ffd1b3", label: "อ่าน"  },
                          { Icon: Pencil,     initialDeg: 240,  color: "#e8955f", label: "เขียน" },
                        ] as const
                      ).map(({ Icon, initialDeg, color }) => (
                        <motion.div
                          key={initialDeg}
                          className="absolute inset-0"
                          style={{ rotate: initialDeg }}
                          animate={{ rotate: initialDeg + 360 }}
                          transition={{ duration: 9, repeat: active ? Infinity : 0, ease: "linear" }}
                        >
                          {/* Icon positioned at top of orbit radius */}
                          <div
                            className="absolute left-1/2"
                            style={{ top: 6, transform: "translateX(-50%)" }}
                          >
                            <motion.div
                              className="w-9 h-9 rounded-xl flex items-center justify-center shadow-md"
                              style={{
                                background: "var(--color-bg-secondary)",
                                border: `1px solid ${color}30`,
                                boxShadow: `0 4px 16px ${color}22`,
                                rotate: -initialDeg,
                              }}
                              animate={{ rotate: -(initialDeg + 360) }}
                              transition={{ duration: 9, repeat: active ? Infinity : 0, ease: "linear" }}
                            >
                              <Icon size={15} style={{ color }} strokeWidth={1.75} />
                            </motion.div>
                          </div>
                        </motion.div>
                      ))}
                    </div>

                    <div className="text-center space-y-2">
                      <h3 className="heading-lg font-bold">รอการสร้างสรรค์...</h3>
                      <p className="text-body max-w-[280px] mx-auto" style={{ color: "var(--color-text-tertiary)" }}>
                        กรอกข้อมูลด้านซ้ายเพื่อรับ Prompt ในสไตล์ครูฮีมที่ไม่เหมือนใคร
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Hint Footer */}
            {generatedPrompt && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="px-8 py-6 border-t border-white/5 bg-bg-elevated/20"
              >
                <div className="flex items-start gap-4 p-4 rounded-2xl bg-[#ffb789]/5 border border-[#ffb789]/10">
                  <div className="p-2 rounded-lg bg-[#ffb789]/10 text-[#ffb789]">
                    <Zap size={16} />
                  </div>
                  <p className="text-micro text-secondary leading-relaxed">
                    ก๊อปปี้ไปวางใน <span className="text-[#ffb789] font-bold">ChatGPT, Gemini</span> หรือ <span className="text-[#ffb789] font-bold">Claude</span> ได้ทันที
                    บอทจะกลร่างเป็นครูฮีมสุดใจดีคอยช่วยเหลือคุณอย่างเต็มที่ครับ!
                  </p>
                </div>
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
