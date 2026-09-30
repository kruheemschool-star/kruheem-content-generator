"use client";

import { Check, CircleAlert, CircleCheck, Download, Upload, UserRound } from "lucide-react";
import { useRef, useState } from "react";
import { isVoiceSetUp } from "@/lib/prompt/defaults";
import { BELIEF_OPTIONS, DONT_OPTIONS, PARTICLES, SELF_NAMES, STUDENT_CALLS } from "@/lib/prompt/options";
import type { VoiceProfile } from "@/lib/prompt/types";
import { exportBackup, importBackup, useStore, voiceStore } from "@/lib/store";
import { Chip, Notice, SubLabel } from "../ui";

function countPosts(text: string): number {
  return text
    .split(/\n\s*-{3,}\s*\n/)
    .map((s) => s.trim())
    .filter(Boolean).length;
}

function PickOne({ value, options, onChange, labelOf }: { value: string; options: string[]; onChange: (v: string) => void; labelOf?: (v: string) => string }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => (
        <Chip key={o || "none"} active={value === o} onClick={() => onChange(o)}>
          {labelOf ? labelOf(o) : o}
        </Chip>
      ))}
    </div>
  );
}

function PickMany({ selected, options, onToggle }: { selected: string[]; options: { id: string; label: string }[]; onToggle: (id: string) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => {
        const on = selected.includes(o.id);
        return (
          <Chip key={o.id} active={on} onClick={() => onToggle(o.id)}>
            {on && <Check size={13} />} {o.label}
          </Chip>
        );
      })}
    </div>
  );
}

export default function VoiceProfileForm() {
  const [voice, setVoice] = useStore(voiceStore);
  const [importMsg, setImportMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const setupDone = isVoiceSetUp(voice);
  const sampleCount = countPosts(voice.samplePosts);

  const set = <K extends keyof VoiceProfile>(key: K, value: VoiceProfile[K]) => setVoice((prev) => ({ ...prev, [key]: value }));
  const toggleIn = (key: "beliefIds" | "dontIds", id: string) =>
    setVoice((prev) => ({ ...prev, [key]: prev[key].includes(id) ? prev[key].filter((x) => x !== id) : [...prev[key], id] }));

  function download() {
    const blob = new Blob([JSON.stringify(exportBackup(), null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `kruheem-prompt-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function upload(file: File) {
    if (!window.confirm("นำเข้าไฟล์นี้จะแทนที่ตัวตน ประวัติ และบรรทัดกันซ้ำที่มีอยู่ตอนนี้ทั้งหมด ทำต่อไหม")) {
      if (fileRef.current) fileRef.current.value = "";
      return;
    }
    try {
      const ok = importBackup(JSON.parse(await file.text()));
      setImportMsg(ok ? { ok: true, text: "นำเข้าเรียบร้อย ตัวตน ประวัติ และบรรทัดกันซ้ำถูกแทนที่แล้ว" } : { ok: false, text: "ไฟล์นี้ไม่ใช่ไฟล์สำรองของแอปนี้" });
    } catch {
      setImportMsg({ ok: false, text: "อ่านไฟล์ไม่ได้ ลองเลือกไฟล์ .json ที่ได้จากปุ่มสำรองอีกครั้ง" });
    }
    if (fileRef.current) fileRef.current.value = "";
  }

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div className="surface p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "var(--color-accent-soft)" }}>
            <UserRound size={20} className="text-accent" />
          </div>
          <div>
            <p className="heading-md">ตัวตนครูฮีม</p>
            <p className="text-micro" style={{ color: "var(--color-text-tertiary)" }}>
              กดเลือกครั้งเดียว ทุกคำสั่งจะดึงไปใช้เอง บันทึกอัตโนมัติ
            </p>
          </div>
        </div>

        {setupDone ? (
          <Notice kind="ok" icon={<CircleCheck size={16} />}>
            ตั้งค่าตัวตนแล้ว{sampleCount > 0 ? ` มีโพสต์ตัวอย่าง ${sampleCount} ชิ้น` : ""}
          </Notice>
        ) : (
          <Notice kind="warn" icon={<CircleAlert size={16} />}>
            <b>ยังไม่ได้ตั้งค่า</b> กดเลือกความเชื่อที่ตรงกับครูสัก 3–5 ข้อข้างล่าง ใช้เวลาไม่ถึงนาที โพสต์ที่ได้จะเป็นเสียงครูฮีมจริงๆ
          </Notice>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <SubLabel>เรียกตัวเองว่า</SubLabel>
            <PickOne value={voice.selfName} options={SELF_NAMES} onChange={(v) => set("selfName", v)} />
          </div>
          <div>
            <SubLabel>คำลงท้าย</SubLabel>
            <PickOne value={voice.particle} options={PARTICLES} onChange={(v) => set("particle", v)} labelOf={(v) => v || "ไม่ใช้"} />
          </div>
          <div>
            <SubLabel>เรียกนักเรียนว่า</SubLabel>
            <PickOne value={voice.studentCall} options={STUDENT_CALLS} onChange={(v) => set("studentCall", v)} />
          </div>
        </div>

        <div>
          <SubLabel hint="เลือกข้อที่ครูเชื่อจริง 3–5 ข้อ ส่วนนี้ทำให้เสียงเป็นของครูฮีม ไม่ใช่ครูคนไหนก็ได้">ความเชื่อหลักของครู</SubLabel>
          <PickMany selected={voice.beliefIds} options={BELIEF_OPTIONS} onToggle={(id) => toggleIn("beliefIds", id)} />
        </div>

        <div>
          <SubLabel>สิ่งที่ครูไม่ทำ</SubLabel>
          <PickMany selected={voice.dontIds} options={DONT_OPTIONS} onToggle={(id) => toggleIn("dontIds", id)} />
        </div>

        <details className="rounded-xl p-4" style={{ background: "var(--color-bg-tertiary)" }}>
          <summary className="cursor-pointer text-caption font-semibold" style={{ color: "var(--color-text-secondary)" }}>
            เพิ่มเติม (ไม่บังคับ) · พิมพ์ความเชื่อเอง คำติดปาก โพสต์จริง สิ่งที่ครูขาย
          </summary>
          <div className="space-y-4 mt-4">
            <div className="field-group">
              <label className="field-label" htmlFor="v-beliefs">ความเชื่อที่ไม่มีในปุ่ม · บรรทัดละข้อ</label>
              <textarea id="v-beliefs" className="field-textarea" rows={2} value={voice.beliefs} onChange={(e) => set("beliefs", e.target.value)} />
            </div>
            <div className="field-group">
              <label className="field-label" htmlFor="v-catch">คำติดปากที่ครูพูดบ่อยจริง · บรรทัดละคำ</label>
              <textarea id="v-catch" className="field-textarea" rows={2} value={voice.catchphrases} onChange={(e) => set("catchphrases", e.target.value)} />
            </div>
            <div className="field-group">
              <label className="field-label" htmlFor="v-donts">สิ่งที่ครูไม่ทำ ที่ไม่มีในปุ่ม · บรรทัดละข้อ</label>
              <textarea id="v-donts" className="field-textarea" rows={2} value={voice.donts} onChange={(e) => set("donts", e.target.value)} />
            </div>
            <div className="field-group">
              <label className="field-label" htmlFor="v-samplePosts">
                โพสต์จริงของครู · ก๊อปมาวางได้เลย 2–3 ชิ้น คั่นด้วยบรรทัด --- (Claude ใช้จับจังหวะเสียงเท่านั้น ห้ามลอก)
              </label>
              <textarea
                id="v-samplePosts"
                className="field-textarea"
                style={{ minHeight: 180 }}
                placeholder={"วางโพสต์ชิ้นที่ 1\n---\nวางโพสต์ชิ้นที่ 2"}
                value={voice.samplePosts}
                onChange={(e) => set("samplePosts", e.target.value)}
              />
              {sampleCount > 3 && (
                <p className="text-[0.68rem]" style={{ color: "var(--color-warning)" }}>
                  ใส่มา {sampleCount} ชิ้น คำสั่งจะใช้แค่ 3 ชิ้นแรก
                </p>
              )}
            </div>
            <div className="field-group">
              <label className="field-label" htmlFor="v-products">สิ่งที่ครูขาย · ใช้ตอนชวนคอร์ส</label>
              <input id="v-products" className="field-input" value={voice.products} onChange={(e) => set("products", e.target.value)} />
            </div>
          </div>
        </details>
      </div>

      <div className="surface p-6 space-y-3">
        <p className="heading-md text-[0.95rem]">สำรองข้อมูล</p>
        <p className="text-micro" style={{ color: "var(--color-text-tertiary)" }}>
          ตัวตน ประวัติแพตเทิร์น และบรรทัดกันซ้ำ เก็บอยู่ในเบราว์เซอร์เครื่องนี้เท่านั้น ไม่ได้ส่งขึ้นเว็บ
          ถ้าจะใช้อีกเครื่อง ให้กดสำรองแล้วนำเข้าที่เครื่องใหม่
        </p>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn-ghost" onClick={download}>
            <Download size={14} /> สำรองเป็นไฟล์
          </button>
          <button type="button" className="btn-ghost" onClick={() => fileRef.current?.click()}>
            <Upload size={14} /> นำเข้าจากไฟล์
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) upload(f);
            }}
          />
        </div>
        {importMsg && (
          <Notice kind={importMsg.ok ? "ok" : "fail"} icon={importMsg.ok ? <CircleCheck size={15} /> : <CircleAlert size={15} />}>
            {importMsg.text}
          </Notice>
        )}
      </div>
    </div>
  );
}
