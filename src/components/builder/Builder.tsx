"use client";

import { Check, CircleAlert, Copy, Dice5, HeartPulse, Plus, X, Zap } from "lucide-react";
import { useMemo, useState } from "react";
import { copyText } from "@/lib/clipboard";
import { buildPrompt } from "@/lib/prompt/build";
import { labelOf } from "@/lib/prompt/defaults";
import {
  ANALOGY_SOURCES,
  ARCS,
  AUDIENCES,
  AUTO_OPENING,
  CTAS,
  DEPTHS,
  EMOJI_LEVELS,
  EXTRAS,
  FORMATS,
  GRADES,
  LENGTHS,
  NEED_LABEL,
  PARENT_TYPES,
  TIMINGS,
  TONES,
  forAudience,
} from "@/lib/prompt/options";
import { RECENT_OPENINGS, hasNeed, randomizeCombo, recentIds, rerollExtraOpenings } from "@/lib/prompt/randomize";
import type { Audience, BuilderConfig, Lean, Material } from "@/lib/prompt/types";
import { addRecentOpening, configStore, historyStore, openingsStore, recordHistory, useStore, voiceStore } from "@/lib/store";
import { Chip, Segmented, Step, SubLabel } from "../ui";
import PatternPicker from "./PatternPicker";
import PromptPanel from "./PromptPanel";
import TopicLibrary from "./TopicLibrary";

export type CopyState = "ok" | "fail" | null;

const PRESETS: { lean: Lean; label: string; hint: string; icon: React.ReactNode }[] = [
  { lean: "emotion", label: "เปิดด้วยอารมณ์", hint: "ฉาก ความรู้สึก เรื่องเล่า", icon: <HeartPulse size={17} /> },
  { lean: "direct", label: "เข้าเรื่องทันที", hint: "ตอบตรง ข้อมูลแน่น", icon: <Zap size={17} /> },
  { lean: "any", label: "สุ่มทั้งชุด", hint: "อะไรก็ได้ที่ไม่ซ้ำ", icon: <Dice5 size={17} /> },
];

function RecentOpenings({ list, onRemove }: { list: string[]; onRemove: (s: string) => void }) {
  const [draft, setDraft] = useState("");
  function add() {
    addRecentOpening(draft);
    setDraft("");
  }
  return (
    <div>
      <SubLabel hint="กดบันทึกได้จากแท็บตรวจบทความ ไม่ต้องพิมพ์เอง">บรรทัดแรกของโพสต์ก่อนๆ (กันเปิดซ้ำ)</SubLabel>
      {list.length > 0 ? (
        <ul className="space-y-1.5">
          {list.map((s) => (
            <li key={s} className="flex items-start gap-2 text-caption px-3 py-2 rounded-lg" style={{ background: "var(--color-bg-tertiary)", color: "var(--color-text-secondary)" }}>
              <span className="flex-1 min-w-0 break-words">{s}</span>
              <button type="button" onClick={() => onRemove(s)} aria-label="เอาออก" className="flex-none opacity-60 hover:opacity-100">
                <X size={14} />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-micro" style={{ color: "var(--color-text-tertiary)" }}>ยังไม่มี</p>
      )}
      <details className="mt-2">
        <summary className="text-micro cursor-pointer" style={{ color: "var(--color-text-tertiary)" }}>วางเองก็ได้</summary>
        <div className="flex gap-2 mt-2">
          <input
            className="field-input"
            placeholder="วางบรรทัดแรกของโพสต์ที่ลงไปแล้ว"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") add();
            }}
          />
          <button type="button" className="btn-ghost flex-none" onClick={add} disabled={!draft.trim()} aria-label="เพิ่มบรรทัดแรก">
            <Plus size={15} />
          </button>
        </div>
      </details>
    </div>
  );
}

export default function Builder() {
  const [cfg, setCfg] = useStore(configStore);
  const [voice] = useStore(voiceStore);
  const [history, setHistory] = useStore(historyStore);
  const [openings, setOpenings] = useStore(openingsStore);
  const [copied, setCopied] = useState<CopyState>(null);
  const [autoRolled, setAutoRolled] = useState(false);

  const update = (patch: Partial<BuilderConfig>) => setCfg((prev) => ({ ...prev, ...patch }));
  const setMaterial = (patch: Partial<Material>) => setCfg((prev) => ({ ...prev, material: { ...prev.material, ...patch } }));

  const last = history[0];
  // เพิ่งกดคัดลอกชุดนี้ไป ไม่ต้องเตือนว่าซ้ำกับตัวเอง
  const justCopied =
    !!last &&
    last.topic === cfg.topic.trim() &&
    last.opening === cfg.opening &&
    last.arc === cfg.arc &&
    last.ending === cfg.ending;

  /** เปลี่ยนหัวข้อหลังคัดลอก = เริ่มโพสต์ใหม่ สุ่มแพตเทิร์นใหม่ให้เลยโดยไม่ต้องกด */
  function setTopic(topic: string, gradeHint?: string) {
    const extra = gradeHint ? { grade: gradeHint } : {};
    if (justCopied && topic.trim() && topic.trim() !== last.topic) {
      setAutoRolled(true);
      setCfg((prev) => ({ ...prev, topic, ...extra, ...randomizeCombo(prev, history, prev.lean) }));
    } else {
      setCfg((prev) => ({ ...prev, topic, ...extra }));
    }
  }

  function setAudience(audience: Audience) {
    setCfg((prev) => {
      const arcs = forAudience(ARCS, audience);
      const arc = arcs.some((a) => a.id === prev.arc) ? prev.arc : arcs[0].id;
      return { ...prev, audience, arc };
    });
  }

  function pickPattern(patch: Partial<BuilderConfig>) {
    setAutoRolled(false);
    setCfg((prev) => {
      const next = { ...prev, ...patch };
      if (patch.opening && patch.opening !== AUTO_OPENING && next.extraOpenings.includes(patch.opening)) {
        next.extraOpenings = rerollExtraOpenings(next, history);
      }
      return next;
    });
  }

  function preset(lean: Lean) {
    setAutoRolled(false);
    setCfg((prev) => ({ ...prev, ...randomizeCombo(prev, history, lean) }));
  }

  function reroll() {
    setCfg((prev) => ({ ...prev, extraOpenings: rerollExtraOpenings(prev, history) }));
  }

  function setVersions(v: 1 | 3) {
    setCfg((prev) => ({ ...prev, versions: v, extraOpenings: v === 3 ? rerollExtraOpenings(prev, history) : prev.extraOpenings }));
  }

  function toggle(list: string[], id: string): string[] {
    return list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
  }

  const result = useMemo(() => (cfg.topic.trim() ? buildPrompt(cfg, voice, openings) : null), [cfg, voice, openings]);

  const recentWarnings = useMemo(() => {
    if (justCopied) return [];
    const out: string[] = [];
    if (cfg.opening !== AUTO_OPENING && cfg.versions === 1) {
      const i = recentIds(history, "opening", RECENT_OPENINGS).indexOf(cfg.opening);
      if (i !== -1) out.push(`วิธีเปิด "${labelOf("opening", cfg.opening)}" เพิ่งใช้ไปเมื่อ ${i + 1} โพสต์ก่อน กดปุ่มสไตล์ในขั้นที่ 1 เพื่อสุ่มใหม่ได้`);
    }
    if (last && last.arc === cfg.arc && last.ending === cfg.ending) {
      out.push("โครงเรื่องและวิธีปิดเหมือนโพสต์ล่าสุดทั้งคู่ คนอ่านจะรู้สึกว่าทรงเดิม");
    }
    return out;
  }, [justCopied, cfg.opening, cfg.versions, cfg.arc, cfg.ending, history, last]);

  async function handleCopy() {
    if (!result) return;
    const ok = await copyText(result.prompt);
    setCopied(ok ? "ok" : "fail");
    if (ok) {
      setAutoRolled(false);
      recordHistory({
        topic: cfg.topic.trim(),
        audience: cfg.audience,
        opening: cfg.opening,
        arc: cfg.arc,
        ending: cfg.ending,
        tone: cfg.tonePrimary,
      });
    }
    setTimeout(() => setCopied(null), 2200);
  }

  const isParent = cfg.audience === "parent";
  const extraCount = (cfg.material.detail.trim() ? 1 : 0) + (cfg.material.timing ? 1 : 0) + (cfg.material.frequent ? 1 : 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start pb-24 lg:pb-0">
      <div className="lg:col-span-5 space-y-3">
        {/* 1 เริ่มเร็ว */}
        <Step num={1} title="เริ่มเร็ว" summary="พิมพ์หรือกดเลือกหัวข้อ แล้วกดสไตล์ เท่านี้ก็คัดลอกได้เลย">
          <div className="field-group">
            <label className="field-label" htmlFor="topic">หัวข้อ</label>
            <input
              id="topic"
              className="field-input h-12 text-base"
              placeholder="พิมพ์เอง หรือกดเลือกจากคลังข้างล่าง"
              value={cfg.topic}
              onChange={(e) => setTopic(e.target.value)}
            />
          </div>
          <TopicLibrary audience={cfg.audience} grade={cfg.grade} current={cfg.topic} onPick={setTopic} />

          <div>
            <SubLabel>เขียนถึงใคร</SubLabel>
            <Segmented<Audience> value={cfg.audience} onChange={setAudience} options={AUDIENCES.map((a) => ({ value: a.id, label: a.label }))} />
          </div>

          <div>
            <SubLabel>ชั้นของ{isParent ? "ลูก" : "นักเรียน"}</SubLabel>
            <div className="flex flex-wrap gap-1.5">
              <Chip active={cfg.grade === ""} onClick={() => update({ grade: "" })}>ไม่ระบุ</Chip>
              {GRADES.map((g) => (
                <Chip key={g} active={cfg.grade === g} onClick={() => update({ grade: g })}>{g}</Chip>
              ))}
            </div>
          </div>

          {isParent && (
            <div>
              <SubLabel hint="เลือกแล้วเนื้อหาจะเจาะถึงคนกลุ่มนี้">คุณพ่อคุณแม่แบบไหน</SubLabel>
              <div className="flex flex-wrap gap-1.5">
                <Chip active={cfg.parentType === ""} onClick={() => update({ parentType: "" })}>ทั่วไป</Chip>
                {PARENT_TYPES.map((p) => (
                  <Chip key={p.id} active={cfg.parentType === p.id} onClick={() => update({ parentType: p.id })} title={p.desc}>
                    {p.label}
                  </Chip>
                ))}
              </div>
            </div>
          )}

          <div>
            <SubLabel hint="กดแล้วแอปเลือกวิธีเปิด โครงเรื่อง วิธีปิด และน้ำเสียงให้ทั้งชุด โดยไม่ซ้ำโพสต์ล่าสุด">สไตล์โพสต์นี้</SubLabel>
            <div className="grid grid-cols-3 gap-2">
              {PRESETS.map((p) => (
                <button key={p.lean} type="button" className={`preset-btn ${cfg.lean === p.lean ? "active" : ""}`} onClick={() => preset(p.lean)}>
                  {p.icon}
                  <span>{p.label}</span>
                  <span className="preset-hint">{p.hint}</span>
                </button>
              ))}
            </div>
            <p className="text-[0.68rem] mt-2" style={{ color: "var(--color-text-tertiary)" }}>
              ตอนนี้: {labelOf("opening", cfg.opening)} → {labelOf("arc", cfg.arc)} → {labelOf("ending", cfg.ending)} · กดซ้ำได้เรื่อยๆ จนกว่าจะถูกใจ
            </p>
          </div>
        </Step>

        {/* 2 ข้อมูลเสริม */}
        <Step num={2} title="ข้อมูลเสริม" summary={extraCount ? `ใส่แล้ว ${extraCount} อย่าง` : "ไม่ต้องกรอกก็ได้ ยิ่งมีเรื่องจริง ยิ่งไม่เหมือน AI"}>
          <div>
            <SubLabel hint="ไม่เลือกก็ได้">ตอนนี้ช่วงไหน</SubLabel>
            <div className="flex flex-wrap gap-1.5">
              <Chip active={cfg.material.timing === ""} onClick={() => setMaterial({ timing: "" })}>ไม่ระบุ</Chip>
              {TIMINGS.map((t) => (
                <Chip key={t.id} active={cfg.material.timing === t.id} onClick={() => setMaterial({ timing: t.id })}>{t.label}</Chip>
              ))}
            </div>
          </div>
          <div>
            <Chip active={cfg.material.frequent} onClick={() => setMaterial({ frequent: !cfg.material.frequent })} title="Claude จะพูดได้ว่าครูเห็นบ่อย โดยไม่แต่งตัวเลขหรือเคส">
              {cfg.material.frequent ? <Check size={13} /> : <Plus size={13} />} ครูเจอปัญหานี้กับนักเรียนบ่อยจริง
            </Chip>
          </div>
          <div className="field-group">
            <label className="field-label" htmlFor="detail">
              รายละเอียดเพิ่มเติม <span className="text-[0.68rem]" style={{ color: "var(--color-text-tertiary)" }}>· ไม่กรอกก็ได้</span>
            </label>
            <textarea
              id="detail"
              className="field-textarea"
              style={{ minHeight: 72 }}
              rows={3}
              placeholder="ถ้ามีเรื่องจริง ตัวเลข หรือคำพูดของเด็ก พิมพ์สั้นๆ แบบพูดได้เลย เช่น ห้องละกี่คนผิดข้อไหน เด็กพูดว่าอะไร"
              value={cfg.material.detail}
              onChange={(e) => setMaterial({ detail: e.target.value })}
            />
          </div>
        </Step>

        <p className="text-micro px-1 pt-2" style={{ color: "var(--color-text-tertiary)" }}>
          ปรับละเอียด · ไม่ต้องแตะก็ได้ ปุ่มสไตล์เลือกให้แล้ว
        </p>

        {/* 3 แพตเทิร์น */}
        <Step
          num={3}
          title="เลือกแพตเทิร์นเอง"
          summary={`${labelOf("opening", cfg.opening)} → ${labelOf("arc", cfg.arc)} → ${labelOf("ending", cfg.ending)}`}
          defaultOpen={false}
        >
          <PatternPicker cfg={cfg} history={history} onPick={pickPattern} onReroll={reroll} />
        </Step>

        {/* 4 น้ำเสียง */}
        <Step
          num={4}
          title="น้ำเสียงและความลึก"
          summary={`${labelOf("tone", cfg.tonePrimary)}${cfg.toneSecondary ? ` + ${labelOf("tone", cfg.toneSecondary)}` : ""} · ${DEPTHS.find((d) => d.id === cfg.depth)?.label}`}
          defaultOpen={false}
        >
          <div>
            <SubLabel hint="เลือก 1">น้ำเสียงหลัก</SubLabel>
            <div className="flex flex-wrap gap-2">
              {TONES.map((t) => (
                <Chip
                  key={t.id}
                  active={cfg.tonePrimary === t.id}
                  onClick={() => update({ tonePrimary: t.id, toneSecondary: cfg.toneSecondary === t.id ? "" : cfg.toneSecondary })}
                  title={t.desc}
                >
                  {t.emoji} {t.label}
                </Chip>
              ))}
            </div>
          </div>
          <div>
            <SubLabel hint="ผสมเบาๆ ไม่เลือกก็ได้">น้ำเสียงรอง</SubLabel>
            <div className="flex flex-wrap gap-2">
              <Chip active={cfg.toneSecondary === ""} onClick={() => update({ toneSecondary: "" })}>ไม่ผสม</Chip>
              {TONES.filter((t) => t.id !== cfg.tonePrimary).map((t) => (
                <Chip key={t.id} active={cfg.toneSecondary === t.id} onClick={() => update({ toneSecondary: t.id })} title={t.desc}>
                  {t.emoji} {t.label}
                </Chip>
              ))}
            </div>
          </div>
          <div>
            <SubLabel>ความลึก</SubLabel>
            <div className="grid grid-cols-2 gap-2">
              {DEPTHS.map((d) => (
                <Chip key={d.id} active={cfg.depth === d.id} onClick={() => update({ depth: d.id })} title={d.instruction}>
                  {d.label} <span className="opacity-60 font-normal">· {d.desc}</span>
                </Chip>
              ))}
            </div>
          </div>
          <div>
            <SubLabel hint="อุปมาหนึ่งอย่างที่เทียบได้จริง">แหล่งอุปมา</SubLabel>
            <div className="flex flex-wrap gap-2">
              <Chip active={cfg.analogy === ""} onClick={() => update({ analogy: "" })}>ไม่กำหนด</Chip>
              {ANALOGY_SOURCES.map((a) => (
                <Chip key={a.id} active={cfg.analogy === a.id} onClick={() => update({ analogy: a.id })} title={a.desc}>
                  {a.label}
                </Chip>
              ))}
            </div>
          </div>
          <div>
            <SubLabel hint="เลือกได้หลายข้อ">เทคนิคเสริม</SubLabel>
            <div className="flex flex-wrap gap-2">
              {EXTRAS.map((x) => {
                const missing = x.needs && !hasNeed(cfg.material, x);
                return (
                  <Chip
                    key={x.id}
                    active={cfg.extras.includes(x.id)}
                    onClick={() => update({ extras: toggle(cfg.extras, x.id) })}
                    title={missing ? `ต้องเล่า${NEED_LABEL[x.needs!]}ในข้อมูลเสริม ไม่อย่างนั้นจะข้ามไป` : x.desc}
                  >
                    {x.label}
                    {missing && <span className="tag need missing">ต้องมี{NEED_LABEL[x.needs!]}</span>}
                  </Chip>
                );
              })}
            </div>
          </div>
        </Step>

        {/* 5 หน้าตา */}
        <Step
          num={5}
          title="ความยาวและหน้าตา"
          summary={`${LENGTHS.find((l) => l.id === cfg.length)?.label} · ${FORMATS.find((f) => f.id === cfg.format)?.label} · อีโมจิ${EMOJI_LEVELS.find((e) => e.id === cfg.emoji)?.label}${cfg.versions === 3 ? " · 3 เวอร์ชัน" : ""}`}
          defaultOpen={false}
        >
          <div>
            <SubLabel>ความยาว</SubLabel>
            <Segmented
              value={cfg.length}
              onChange={(v) => update({ length: v })}
              options={LENGTHS.map((l) => ({
                value: l.id,
                label: (
                  <span className="flex flex-col leading-tight">
                    <span>{l.label}</span>
                    <span className="text-[0.62rem] opacity-70">{l.desc}</span>
                  </span>
                ),
              }))}
            />
          </div>
          <div>
            <SubLabel>การจัดบรรทัด</SubLabel>
            <Segmented value={cfg.format} onChange={(v) => update({ format: v })} options={FORMATS.map((f) => ({ value: f.id, label: f.label }))} />
            <p className="text-[0.68rem] mt-1.5" style={{ color: "var(--color-text-tertiary)" }}>
              {FORMATS.find((f) => f.id === cfg.format)?.desc}
            </p>
          </div>
          <div>
            <SubLabel>อีโมจิ</SubLabel>
            <Segmented value={cfg.emoji} onChange={(v) => update({ emoji: v })} options={EMOJI_LEVELS.map((e) => ({ value: e.id, label: e.label }))} />
          </div>
          <div>
            <SubLabel hint="3 เวอร์ชันจะเปิดคนละแบบ ให้ครูเลือกอันที่ชอบ">จำนวนเวอร์ชัน</SubLabel>
            <Segmented<1 | 3>
              value={cfg.versions}
              onChange={setVersions}
              options={[
                { value: 1, label: "1 โพสต์" },
                { value: 3, label: "3 เวอร์ชัน" },
              ]}
            />
          </div>
        </Step>

        {/* 6 ท้ายโพสต์และกันซ้ำ */}
        <Step
          num={6}
          title="ท้ายโพสต์และกันซ้ำ"
          summary={`${cfg.ctas.length ? `ชวน ${cfg.ctas.length} อย่าง` : "ไม่มีคำชวน"}${cfg.interview ? " · ให้ Claude ถามก่อน" : ""}${openings.length ? ` · กันเปิดซ้ำ ${openings.length} บรรทัด` : ""}`}
          defaultOpen={false}
        >
          <div>
            <SubLabel hint="ไม่เลือกก็ได้ ไม่ใช่ทุกโพสต์ต้องชวน">คำชวนท้ายโพสต์</SubLabel>
            <div className="flex flex-wrap gap-2">
              {CTAS.map((c) => (
                <Chip key={c.id} active={cfg.ctas.includes(c.id)} onClick={() => update({ ctas: toggle(cfg.ctas, c.id) })}>
                  {c.label}
                </Chip>
              ))}
            </div>
          </div>
          <label className="flex items-start gap-3 cursor-pointer p-3 rounded-xl" style={{ background: "var(--color-bg-tertiary)" }}>
            <input type="checkbox" className="mt-1 w-4 h-4 accent-[#e8955f]" checked={cfg.interview} onChange={(e) => update({ interview: e.target.checked })} />
            <span>
              <span className="block text-caption font-semibold" style={{ color: "var(--color-text-primary)" }}>
                ให้ Claude สัมภาษณ์ครูก่อนเขียน
              </span>
              <span className="block text-micro" style={{ color: "var(--color-text-tertiary)" }}>
                ใช้ตอนอยากได้โพสต์ลึกเป็นพิเศษ Claude จะถาม 3–5 ข้อ ครูต้องตอบในแชทก่อนถึงจะได้โพสต์
              </span>
            </span>
          </label>
          <RecentOpenings list={openings} onRemove={(s) => setOpenings((prev) => prev.filter((x) => x !== s))} />
        </Step>
      </div>

      <div className="lg:col-span-7 lg:sticky lg:top-20">
        <PromptPanel
          cfg={cfg}
          result={result}
          copied={copied}
          onCopy={handleCopy}
          recentWarnings={recentWarnings}
          justCopied={justCopied}
          autoRolled={autoRolled}
          history={history}
          onDeleteHistory={(id) => setHistory((prev) => prev.filter((h) => h.id !== id))}
          onClearHistory={() => {
            if (window.confirm("ล้างประวัติแพตเทิร์นทั้งหมด? ปุ่มสุ่มจะไม่รู้ว่าเคยใช้อะไรไปแล้ว")) setHistory([]);
          }}
        />
      </div>

      {/* ปุ่มคัดลอกลอยบนมือถือ ไม่ต้องเลื่อนลงไปหา */}
      {result && (
        <div className="mobile-copy-bar">
          <div className="min-w-0 flex-1">
            <p className="text-caption font-semibold truncate" style={{ color: "var(--color-text-primary)" }}>{cfg.topic}</p>
            <p className="text-[0.66rem] truncate" style={{ color: "var(--color-text-tertiary)" }}>
              {labelOf("opening", cfg.opening)} → {labelOf("arc", cfg.arc)}
            </p>
          </div>
          <button type="button" className="btn-copy flex-none" onClick={handleCopy}>
            {copied === "ok" ? <><Check size={16} /> คัดลอกแล้ว</> : copied === "fail" ? <><CircleAlert size={16} /> ไม่สำเร็จ</> : <><Copy size={16} /> คัดลอก</>}
          </button>
        </div>
      )}
    </div>
  );
}
