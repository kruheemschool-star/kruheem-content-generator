"use client";

import { CircleAlert, CircleCheck, Download, Upload, UserRound } from "lucide-react";
import { useRef, useState } from "react";
import { isVoiceSetUp } from "@/lib/prompt/defaults";
import type { VoiceProfile } from "@/lib/prompt/types";
import { exportBackup, importBackup, useStore, voiceStore } from "@/lib/store";
import { Notice } from "../ui";

type Field = {
  key: keyof VoiceProfile;
  label: string;
  hint: string;
  placeholder: string;
  rows?: number;
};

const SHORT_FIELDS: Field[] = [
  { key: "selfName", label: "เรียกตัวเองว่า", hint: "ในโพสต์ครูแทนตัวเองว่าอะไร", placeholder: "ครู" },
  { key: "particle", label: "คำลงท้าย", hint: "เว้นว่างถ้าไม่ใช้", placeholder: "ครับ" },
  { key: "studentCall", label: "เรียกนักเรียนว่า", hint: "ใช้ตอนเขียนถึงนักเรียน", placeholder: "หนูๆ" },
  { key: "products", label: "สิ่งที่ครูขาย", hint: "ใช้ตอนชวนคอร์สแบบบอกตรง", placeholder: "คอร์สเรียน VOD และคลังข้อสอบออนไลน์ที่ kruheemmath.com" },
];

const LONG_FIELDS: Field[] = [
  {
    key: "beliefs",
    label: "ความเชื่อหลักของครู",
    hint: "บรรทัดละข้อ 3–5 ข้อ ส่วนนี้ทำให้เสียงเป็นของครูฮีม ไม่ใช่ครูคนไหนก็ได้",
    placeholder: "เช่น สิ่งที่ครูเชื่อเรื่องการเรียนเลข สิ่งที่ครูย้ำกับผู้ปกครองบ่อยๆ\nบรรทัดละหนึ่งความเชื่อ",
    rows: 5,
  },
  {
    key: "catchphrases",
    label: "คำติดปาก",
    hint: "คำหรือวลีที่ครูพูดบ่อยจริงๆ บรรทัดละคำ",
    placeholder: "คำที่ลูกศิษย์ได้ยินแล้วรู้ทันทีว่าเป็นครูฮีม",
    rows: 3,
  },
  {
    key: "donts",
    label: "สิ่งที่ครูไม่ทำ",
    hint: "บรรทัดละข้อ",
    placeholder: "เช่น เรื่องที่ครูไม่พูดในเพจ น้ำเสียงที่ครูไม่ใช้",
    rows: 3,
  },
];

export default function VoiceProfileForm() {
  const [voice, setVoice] = useStore(voiceStore);
  const [importMsg, setImportMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const setupDone = isVoiceSetUp(voice);
  const sampleCount = voice.samplePosts
    .split(/\n\s*-{3,}\s*\n/)
    .map((s) => s.trim())
    .filter(Boolean).length;

  const set = (key: keyof VoiceProfile, value: string) => setVoice((prev) => ({ ...prev, [key]: value }));

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
      <div className="surface p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "var(--color-accent-soft)" }}>
            <UserRound size={20} className="text-accent" />
          </div>
          <div>
            <p className="heading-md">ตัวตนครูฮีม</p>
            <p className="text-micro" style={{ color: "var(--color-text-tertiary)" }}>
              ตั้งครั้งเดียว ทุกคำสั่งจะดึงไปใช้เอง บันทึกอัตโนมัติทุกครั้งที่พิมพ์
            </p>
          </div>
        </div>

        {setupDone ? (
          <Notice kind="ok" icon={<CircleCheck size={16} />}>
            ตั้งค่าตัวตนแล้ว {sampleCount > 0 ? `มีโพสต์ตัวอย่าง ${sampleCount} ชิ้น` : "ถ้าเพิ่มโพสต์จริงสัก 2–3 ชิ้น Claude จะจับจังหวะเสียงครูได้แม่นขึ้นมาก"}
          </Notice>
        ) : (
          <Notice kind="warn" icon={<CircleAlert size={16} />}>
            <b>ยังไม่ได้ตั้งค่า</b> ตอนนี้คำสั่งรู้แค่ข้อมูลพื้นฐาน ใส่ความเชื่อหลักกับโพสต์จริงที่คนตอบรับดีสัก 2–3 ชิ้น
            แล้วโพสต์ที่ได้จะเป็นเสียงครูฮีมจริงๆ ไม่ใช่เสียงครูทั่วไป
          </Notice>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {SHORT_FIELDS.map((f) => (
            <div key={f.key} className={`field-group ${f.key === "products" ? "sm:col-span-2" : ""}`}>
              <label className="field-label" htmlFor={`v-${f.key}`}>
                {f.label} <span className="text-[0.68rem]" style={{ color: "var(--color-text-tertiary)" }}>· {f.hint}</span>
              </label>
              <input id={`v-${f.key}`} className="field-input" placeholder={f.placeholder} value={voice[f.key]} onChange={(e) => set(f.key, e.target.value)} />
            </div>
          ))}
        </div>

        {LONG_FIELDS.map((f) => (
          <div key={f.key} className="field-group">
            <label className="field-label" htmlFor={`v-${f.key}`}>
              {f.label} <span className="text-[0.68rem]" style={{ color: "var(--color-text-tertiary)" }}>· {f.hint}</span>
            </label>
            <textarea id={`v-${f.key}`} className="field-textarea" rows={f.rows} placeholder={f.placeholder} value={voice[f.key]} onChange={(e) => set(f.key, e.target.value)} />
          </div>
        ))}

        <div className="field-group">
          <label className="field-label" htmlFor="v-samplePosts">
            โพสต์จริงของครู{" "}
            <span className="text-[0.68rem]" style={{ color: "var(--color-text-tertiary)" }}>
              · วางได้ 2–3 ชิ้น คั่นแต่ละชิ้นด้วยบรรทัด --- (Claude ใช้จับจังหวะเสียงเท่านั้น ถูกสั่งห้ามลอกประโยคและโครง)
            </span>
          </label>
          <textarea
            id="v-samplePosts"
            className="field-textarea"
            style={{ minHeight: 260 }}
            placeholder={"วางโพสต์ชิ้นที่ 1\n---\nวางโพสต์ชิ้นที่ 2\n---\nวางโพสต์ชิ้นที่ 3"}
            value={voice.samplePosts}
            onChange={(e) => set("samplePosts", e.target.value)}
          />
          {sampleCount > 3 && (
            <p className="text-[0.68rem]" style={{ color: "var(--color-warning)" }}>
              ใส่มา {sampleCount} ชิ้น คำสั่งจะใช้แค่ 3 ชิ้นแรก เพื่อไม่ให้ยาวเกินไป
            </p>
          )}
        </div>
      </div>

      <div className="surface p-6 space-y-3">
        <p className="heading-md text-[0.95rem]">สำรองข้อมูล</p>
        <p className="text-micro" style={{ color: "var(--color-text-tertiary)" }}>
          ตัวตน ประวัติแพตเทิร์น และบรรทัดกันซ้ำ เก็บอยู่ในเบราว์เซอร์เครื่องนี้เท่านั้น ไม่ได้ส่งขึ้นเว็บ
          ถ้าจะใช้อีกเครื่อง หรือกลัวข้อมูลหายตอนล้างเบราว์เซอร์ ให้กดสำรองแล้วนำเข้าที่เครื่องใหม่
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
