"use client";

import { ArrowLeftRight, Check, CircleAlert, CircleCheck, CircleX, Copy, History, Info, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { checkPost, type CheckReport } from "@/lib/checker";
import { copyText } from "@/lib/clipboard";
import { FEATURE_ROWS } from "@/lib/compare/features";
import { postBody } from "@/lib/compare/postBody";
import { comparePrompts, type Better } from "@/lib/compare/promptMetrics";
import { LEGACY_DEFAULTS, buildLegacyPrompt, type LegacyMode } from "@/lib/legacy/buildLegacyPrompt";
import { buildPrompt } from "@/lib/prompt/build";
import { DEFAULT_VOICE } from "@/lib/prompt/defaults";
import { ARCS, AUDIENCES, forAudience } from "@/lib/prompt/options";
import type { Audience } from "@/lib/prompt/types";
import { configStore, modeStore, openingsStore, useStore, voiceStore } from "@/lib/store";
import TopicLibrary from "../builder/TopicLibrary";
import { Notice, Segmented, SubLabel } from "../ui";

type Side = "old" | "new";

const SIDE_LABEL: Record<Side, string> = { old: "เวอร์ชันเดิม", new: "เวอร์ชันใหม่" };
const SIDE_SHORT: Record<Side, string> = { old: "เดิม", new: "ใหม่" };

// ตัวเลขสรุปที่เป็นทรงของ AI หรือที่เวอร์ชันเดิมก็สั่งไว้เหมือนกัน (เรียกคุณพ่อคุณแม่) นับรวมในการเทียบ
// ที่เหลือ เช่น คำว่าครูฮีม 2–4 ครั้ง ความยาวก้อน การเว้นบรรทัด เป็นกติกาที่เวอร์ชันใหม่สั่งเพิ่มเอง จึงแสดงไว้แต่ไม่นับ
const COUNTED_STATS = new Set(["kpm", "emoji", "questions", "rhythm", "opening"]);

interface Tell {
  id: string;
  label: string;
  severity: "fail" | "warn";
}

function tellsOf(r: CheckReport): Tell[] {
  return [
    ...r.findings.map((f) => ({ id: f.id, label: `${f.label}${f.count > 1 ? ` ×${f.count}` : ""}`, severity: f.severity })),
    ...r.stats
      .filter((s) => COUNTED_STATS.has(s.id) && s.status !== "pass")
      .map((s) => ({ id: s.id, label: `${s.label} ${s.value}`, severity: s.status as "fail" | "warn" })),
  ];
}

function aiTells(r: CheckReport): { fail: number; warn: number } {
  const t = tellsOf(r);
  return { fail: t.filter((x) => x.severity === "fail").length, warn: t.filter((x) => x.severity === "warn").length };
}

function Mark({ better, side }: { better: Better; side: Side }) {
  if (better === null || better === "same") return null;
  return better === side ? (
    <CircleCheck size={14} style={{ color: "var(--color-success)" }} aria-label="ดีกว่า" />
  ) : (
    <CircleX size={14} style={{ color: "var(--color-error)" }} aria-label="ด้อยกว่า" />
  );
}

function PromptCard({ side, prompt }: { side: Side; prompt: string }) {
  const [copied, setCopied] = useState<"ok" | "fail" | null>(null);
  async function copy() {
    setCopied((await copyText(prompt)) ? "ok" : "fail");
    setTimeout(() => setCopied(null), 2200);
  }
  return (
    <div className="surface flex flex-col min-w-0">
      <div className="flex items-center justify-between gap-3 px-4 py-3" style={{ borderBottom: "1px solid var(--color-border-subtle)" }}>
        <div className="min-w-0">
          <p className="heading-md text-[0.95rem]">{SIDE_LABEL[side]}</p>
          <p className="text-[0.68rem]" style={{ color: "var(--color-text-tertiary)" }}>
            {prompt.length.toLocaleString("th-TH")} ตัวอักษร
          </p>
        </div>
        <button type="button" className="btn-ghost flex-none" onClick={copy}>
          {copied === "ok" ? <Check size={14} /> : copied === "fail" ? <CircleAlert size={14} /> : <Copy size={14} />}
          {copied === "ok" ? "คัดลอกแล้ว" : copied === "fail" ? "คัดลอกไม่ได้ ลากคลุมเอง" : "คัดลอก"}
        </button>
      </div>
      <pre className="prompt-pre p-4 overflow-auto max-h-[50vh] text-[0.78rem]">{prompt}</pre>
    </div>
  );
}

function ResultCard({ side, text, setText, report }: { side: Side; text: string; setText: (v: string) => void; report: CheckReport | null }) {
  const worry = report?.findings.some((f) => f.id === "worry-arc");
  const tells = report ? tellsOf(report) : [];
  const counts = report ? aiTells(report) : null;
  const ruleIssues = report?.stats.filter((s) => !COUNTED_STATS.has(s.id) && s.status !== "pass") ?? [];
  return (
    <div className="surface p-4 space-y-3 min-w-0">
      <p className="heading-md text-[0.95rem]">โพสต์ที่ได้จาก{SIDE_LABEL[side]}</p>
      <textarea
        className="field-textarea"
        style={{ minHeight: 160 }}
        placeholder={`วางโพสต์ที่ Claude เขียนจากคำสั่ง${SIDE_LABEL[side]} วางทั้งก้อนได้ ถ้ามีป้ายหัวข้อหรือแฮชแท็ก แอปจะตัดออกแล้วตรวจเฉพาะเนื้อโพสต์ (ถ้ามีหลายเวอร์ชันจะตรวจเวอร์ชันแรก)`}
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      {report && counts && (
        <div className="space-y-2">
          <div className="flex flex-wrap gap-1.5">
            <span className="tag" style={{ color: counts.fail ? "var(--color-error)" : "var(--color-success)" }}>
              สำนวน AI ควรแก้ {counts.fail}
            </span>
            <span className="tag" style={{ color: counts.warn ? "var(--color-warning)" : "var(--color-success)" }}>
              ควรดู {counts.warn}
            </span>
            {worry && <span className="tag recent">แพตเทิร์น กังวล → ปลอบ</span>}
          </div>
          {tells.length > 0 ? (
            <ul className="space-y-1">
              {tells.slice(0, 6).map((f) => (
                <li key={f.id} className="flex items-start gap-1.5 text-micro" style={{ color: "var(--color-text-secondary)" }}>
                  <span className="mt-0.5 flex-none">
                    {f.severity === "fail" ? <CircleX size={12} style={{ color: "var(--color-error)" }} /> : <CircleAlert size={12} style={{ color: "var(--color-warning)" }} />}
                  </span>
                  <span>{f.label}</span>
                </li>
              ))}
              {tells.length > 6 && (
                <li className="text-micro" style={{ color: "var(--color-text-tertiary)" }}>และอีก {tells.length - 6} จุด</li>
              )}
            </ul>
          ) : (
            <p className="text-micro" style={{ color: "var(--color-success)" }}>ไม่เจอสำนวนหรือทรงที่คนจับได้ว่าเป็น AI</p>
          )}
          {ruleIssues.length > 0 && (
            <div className="pt-1">
              <p className="text-[0.66rem] mb-1" style={{ color: "var(--color-text-tertiary)" }}>
                กติกาที่เวอร์ชันใหม่สั่งเพิ่ม (แสดงไว้ดู ไม่นับในการเทียบ)
              </p>
              <ul className="space-y-0.5">
                {ruleIssues.map((s) => (
                  <li key={s.id} className="text-[0.7rem]" style={{ color: "var(--color-text-tertiary)" }}>
                    · {s.label} {s.value}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function Compare() {
  const [cfg] = useStore(configStore);
  const [voice] = useStore(voiceStore);
  const [openings] = useStore(openingsStore);
  const [, setMode] = useStore(modeStore);
  // ตามหัวข้อและผู้อ่านในหน้าสร้างคำสั่งไปเรื่อยๆ จนกว่าครูจะแก้เองที่หน้านี้
  const [topicOverride, setTopic] = useState<string | null>(null);
  const [audienceOverride, setAudience] = useState<Audience | null>(null);
  // ชั้นที่ได้จากการกดหัวข้อเนื้อหาคณิต ใช้เฉพาะตอนหัวข้อยังเป็นอันนั้นอยู่
  const [gradeHint, setGradeHint] = useState<{ topic: string; grade: string } | null>(null);
  const topic = topicOverride ?? cfg.topic;
  const audience = audienceOverride ?? cfg.audience;
  const [legacyMode, setLegacyMode] = useState<LegacyMode>("Study & Motivation");
  const [oldPost, setOldPost] = useState("");
  const [newPost, setNewPost] = useState("");

  const t = topic.trim();
  const grade = cfg.grade || (gradeHint && gradeHint.topic === topic ? gradeHint.grade : "");

  const legacyState = useMemo(
    () => ({
      ...LEGACY_DEFAULTS,
      mode: legacyMode,
      selectedSpecials: [audience === "parent" ? "ผู้ปกครอง" : "นักเรียน"],
    }),
    [legacyMode, audience],
  );
  // โครงเรื่องบางแบบใช้ได้กับผู้อ่านกลุ่มเดียว ถ้าสลับผู้อ่านที่หน้านี้ ให้ใช้แบบแรกที่ใช้ได้แทน เหมือนหน้าสร้างคำสั่ง
  const newCfg = useMemo(() => {
    const arcs = forAudience(ARCS, audience);
    const arc = arcs.some((a) => a.id === cfg.arc) ? cfg.arc : arcs[0].id;
    return { ...cfg, topic: t, audience, arc, grade };
  }, [cfg, t, audience, grade]);

  const oldPrompt = useMemo(() => (t ? buildLegacyPrompt({ ...legacyState, topic: t }) : ""), [t, legacyState]);
  const newPrompt = useMemo(() => (t ? buildPrompt(newCfg, voice, openings).prompt : ""), [t, newCfg, voice, openings]);

  // คำสั่งแบบเดียวกันที่ไม่มีข้อความของครูเลย ใช้นับคำอังกฤษและตัวเลข ไม่ให้นับของที่ครูพิมพ์เองเป็นของคำสั่ง
  const metrics = useMemo(() => {
    if (!t) return [];
    const placeholder = "หัวข้อ";
    const bareVoice = { ...voice, catchphrases: "", beliefs: "", donts: "", samplePosts: "", products: DEFAULT_VOICE.products };
    const bare = {
      old: buildLegacyPrompt({ ...legacyState, topic: placeholder }),
      new: buildPrompt({ ...newCfg, topic: placeholder, material: { ...newCfg.material, detail: "" } }, bareVoice, []).prompt,
    };
    return comparePrompts(oldPrompt, newPrompt, bare);
  }, [t, legacyState, newCfg, voice, oldPrompt, newPrompt]);

  const oldReport = useMemo(
    () => (oldPost.trim() ? checkPost(postBody(oldPost), { audience, format: "flow", recentOpenings: openings }) : null),
    [oldPost, audience, openings],
  );
  const newReport = useMemo(
    () => (newPost.trim() ? checkPost(postBody(newPost), { audience, format: cfg.format, recentOpenings: openings }) : null),
    [newPost, audience, cfg.format, openings],
  );

  let verdict: string | null = null;
  if (oldReport && newReport) {
    const o = aiTells(oldReport);
    const n = aiTells(newReport);
    const counts = `เดิม: ควรแก้ ${o.fail} ควรดู ${o.warn} · ใหม่: ควรแก้ ${n.fail} ควรดู ${n.warn}`;
    const winner = n.fail !== o.fail ? (n.fail < o.fail ? "new" : "old") : n.warn !== o.warn ? (n.warn < o.warn ? "new" : "old") : null;
    verdict = winner ? `โพสต์จาก${SIDE_LABEL[winner]}มีสำนวนแบบ AI น้อยกว่า (${counts})` : `สองโพสต์มีสำนวนแบบ AI พอๆ กัน (${counts})`;
  }

  const groups = useMemo(() => {
    const m = new Map<string, typeof FEATURE_ROWS>();
    for (const r of FEATURE_ROWS) m.set(r.group, [...(m.get(r.group) ?? []), r]);
    return [...m.entries()];
  }, []);

  return (
    <div className="space-y-5">
      {/* 1 หัวข้อเดียวกัน */}
      <section className="surface p-5 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-none" style={{ background: "var(--color-accent-soft)" }}>
            <ArrowLeftRight size={20} className="text-accent" />
          </div>
          <div>
            <p className="heading-md">ลองหัวข้อเดียวกันกับทั้งสองเวอร์ชัน</p>
            <p className="text-micro" style={{ color: "var(--color-text-tertiary)" }}>
              เวอร์ชันเดิมใช้ค่าเริ่มต้นของมัน แล้วติ๊กเขียนถึงผู้ปกครองหรือนักเรียน กับโหมดตามที่เลือกด้านล่าง · เวอร์ชันใหม่ใช้การตั้งค่าล่าสุดของครูในหน้าสร้างคำสั่ง
            </p>
          </div>
        </div>
        <div className="field-group">
          <label className="field-label" htmlFor="cmp-topic">หัวข้อ</label>
          <input id="cmp-topic" className="field-input h-12 text-base" placeholder="พิมพ์เอง หรือกดเลือกจากคลังข้างล่าง" value={topic} onChange={(e) => setTopic(e.target.value)} />
        </div>
        <TopicLibrary
          audience={audience}
          grade={cfg.grade}
          current={topic}
          onPick={(v, hint) => {
            setTopic(v);
            setGradeHint(hint ? { topic: v, grade: hint } : null);
          }}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <SubLabel>เขียนถึงใคร</SubLabel>
            <Segmented<Audience> value={audience} onChange={setAudience} options={AUDIENCES.map((a) => ({ value: a.id, label: a.label }))} />
          </div>
          <div>
            <SubLabel hint="เวอร์ชันเดิมมีแค่ 2 โหมด">โหมดของเวอร์ชันเดิม</SubLabel>
            <Segmented<LegacyMode>
              value={legacyMode}
              onChange={setLegacyMode}
              options={[
                { value: "Study & Motivation", label: "แรงบันดาลใจ" },
                { value: "Math Explainer", label: "วิชาการ" },
              ]}
            />
          </div>
        </div>
      </section>

      {t && (
        <>
          {/* 2 ตรวจคำสั่ง */}
          <section className="surface p-5">
            <p className="heading-md text-[0.95rem] mb-1">คำสั่งสองเวอร์ชันต่างกันตรงไหน</p>
            <p className="text-micro mb-3" style={{ color: "var(--color-text-tertiary)" }}>
              ตรวจจากข้อความในคำสั่งจริงด้านล่าง เครื่องหมายถูกคือฝั่งที่ดีกว่าในข้อนั้น ข้อที่ไม่มีเครื่องหมายคือไม่ได้ตัดสินว่าฝั่งไหนดีกว่า
            </p>
            <div className="cmp-table">
              <div className="cmp-row cmp-head">
                <span>เรื่อง</span>
                <span>เวอร์ชันเดิม</span>
                <span>เวอร์ชันใหม่</span>
              </div>
              {metrics.map((m) => (
                <div key={m.id} className="cmp-row">
                  <span>
                    <span className="block font-semibold" style={{ color: "var(--color-text-primary)" }}>{m.label}</span>
                    {m.hint && <span className="block text-[0.66rem]" style={{ color: "var(--color-text-tertiary)" }}>{m.hint}</span>}
                  </span>
                  {(["old", "new"] as const).map((side) => (
                    <span key={side} className="cmp-cell">
                      <span className="cmp-side-label">{SIDE_SHORT[side]}</span>
                      <Mark better={m.better} side={side} /> {m[side]}
                    </span>
                  ))}
                </div>
              ))}
            </div>
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <PromptCard side="old" prompt={oldPrompt} />
            <PromptCard side="new" prompt={newPrompt} />
          </div>
          <p className="text-[0.7rem] px-1 -mt-2" style={{ color: "var(--color-text-tertiary)" }}>
            คัดลอกจากหน้านี้ไว้ลองเทียบเท่านั้น ไม่ถูกนับในประวัติกันซ้ำ ถ้าจะโพสต์จริงให้คัดลอกจากหน้าสร้างคำสั่งของเวอร์ชันใหม่
          </p>
        </>
      )}

      {/* 3 ผลลัพธ์จริง */}
      <section className="space-y-3">
        <div className="px-1">
          <p className="heading-md">เทียบผลลัพธ์จริง</p>
          <p className="text-micro" style={{ color: "var(--color-text-tertiary)" }}>
            ก๊อปคำสั่งทั้งสองไปให้ Claude เขียน (แยกแชทกัน) แล้ววางโพสต์ที่ได้ตรงนี้ แอปจะใช้ตัวตรวจเดียวกับแท็บตรวจบทความ
            และเทียบเฉพาะสำนวนกับทรงแบบ AI ส่วนกติกาที่เวอร์ชันใหม่สั่งเพิ่มเอง เช่น คำว่าครูฮีม 2–4 ครั้ง หรือความยาวก้อนบนจอ จะแสดงไว้ให้ดูแต่ไม่นับในการเทียบ
          </p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ResultCard side="old" text={oldPost} setText={setOldPost} report={oldReport} />
          <ResultCard side="new" text={newPost} setText={setNewPost} report={newReport} />
        </div>
        {verdict && (
          <Notice kind="info" icon={<Sparkles size={15} />}>
            {verdict} · ตัวตรวจจับได้เฉพาะคำและทรงที่รู้จัก ควรอ่านเทียบด้วยตัวเองอีกรอบ
          </Notice>
        )}
        {!verdict && (oldReport || newReport) && (
          <Notice kind="info" icon={<Info size={15} />}>
            วางโพสต์ให้ครบทั้งสองฝั่ง แล้วแอปจะสรุปว่าฝั่งไหนมีสำนวนแบบ AI น้อยกว่า
          </Notice>
        )}
      </section>

      {/* 4 ตารางสิ่งที่เปลี่ยน */}
      {groups.length > 0 && (
        <section className="surface p-5 space-y-4">
          <div className="flex items-center gap-2">
            <History size={16} className="text-accent" />
            <p className="heading-md text-[0.95rem]">อะไรเปลี่ยนไปบ้าง</p>
          </div>
          {groups.map(([group, rows]) => (
            <div key={group}>
              <p className="sub-label">{group}</p>
              <div className="cmp-table">
                {rows.map((r) => (
                  <div key={r.id} className="cmp-row">
                    <span className="font-semibold" style={{ color: "var(--color-text-primary)" }}>{r.topic}</span>
                    <span className="cmp-cell">
                      <span className="cmp-side-label">เดิม</span> {r.old}
                    </span>
                    <span className="cmp-cell">
                      <span className="cmp-side-label">ใหม่</span>
                      <span>
                        {r.new}
                        <span className="block text-[0.66rem] mt-0.5" style={{ color: "var(--color-text-tertiary)" }}>{r.why}</span>
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </section>
      )}

      {/* 5 เลือกใช้ */}
      <section className="surface p-5 flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <p className="text-caption flex-1" style={{ color: "var(--color-text-secondary)" }}>
          เลือกเวอร์ชันที่จะใช้ได้ทุกเมื่อจากปุ่มด้านบน แอปจะจำไว้ให้ครั้งหน้า
        </p>
        <div className="flex gap-2">
          <button type="button" className="btn-ghost" onClick={() => setMode("old")}>ใช้เวอร์ชันเดิม</button>
          <button type="button" className="btn-copy" onClick={() => setMode("new")}>ใช้เวอร์ชันใหม่</button>
        </div>
      </section>
    </div>
  );
}
