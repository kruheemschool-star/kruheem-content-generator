"use client";

import { Eraser, Plus, X } from "lucide-react";
import { useMemo, useState } from "react";
import { buildPrompt } from "@/lib/prompt/build";
import { EMPTY_MATERIAL, labelOf } from "@/lib/prompt/defaults";
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
  MATERIAL_FIELDS,
  NEED_LABEL,
  PARENT_TYPES,
  TONES,
  forAudience,
} from "@/lib/prompt/options";
import { RECENT_OPENINGS, hasNeed, randomizeCombo, recentIds, rerollExtraOpenings, type Lean } from "@/lib/prompt/randomize";
import type { Audience, BuilderConfig, Material } from "@/lib/prompt/types";
import { addRecentOpening, configStore, historyStore, openingsStore, recordHistory, useStore, voiceStore } from "@/lib/store";
import { Chip, Segmented, Step, SubLabel } from "../ui";
import PatternPicker from "./PatternPicker";
import PromptPanel from "./PromptPanel";

const NEED_FIELDS = MATERIAL_FIELDS.filter((f) => f.id !== "extra");

function RecentOpenings({ list, onRemove }: { list: string[]; onRemove: (s: string) => void }) {
  const [draft, setDraft] = useState("");
  function add() {
    addRecentOpening(draft);
    setDraft("");
  }
  return (
    <div>
      <SubLabel hint="คำสั่งจะบอก Claude ห้ามเปิดคล้ายบรรทัดเหล่านี้ (ใส่ได้จากแท็บตรวจบทความด้วย)">บรรทัดแรกของโพสต์ก่อนๆ</SubLabel>
      <div className="flex gap-2">
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
      {list.length > 0 && (
        <ul className="mt-2 space-y-1.5">
          {list.map((s) => (
            <li key={s} className="flex items-start gap-2 text-caption px-3 py-2 rounded-lg" style={{ background: "var(--color-bg-tertiary)", color: "var(--color-text-secondary)" }}>
              <span className="flex-1 min-w-0 break-words">{s}</span>
              <button type="button" onClick={() => onRemove(s)} aria-label="เอาออก" className="flex-none opacity-60 hover:opacity-100">
                <X size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function Builder() {
  const [cfg, setCfg] = useStore(configStore);
  const [voice] = useStore(voiceStore);
  const [history, setHistory] = useStore(historyStore);
  const [openings, setOpenings] = useStore(openingsStore);

  const update = (patch: Partial<BuilderConfig>) => setCfg((prev) => ({ ...prev, ...patch }));
  const setMaterial = (key: keyof Material, value: string) =>
    setCfg((prev) => ({ ...prev, material: { ...prev.material, [key]: value } }));

  function setAudience(audience: Audience) {
    setCfg((prev) => {
      const arcs = forAudience(ARCS, audience);
      const arc = arcs.some((a) => a.id === prev.arc) ? prev.arc : arcs[0].id;
      return { ...prev, audience, arc };
    });
  }

  function pickPattern(patch: Partial<BuilderConfig>) {
    setCfg((prev) => {
      const next = { ...prev, ...patch };
      if (patch.opening && patch.opening !== AUTO_OPENING && next.extraOpenings.includes(patch.opening)) {
        next.extraOpenings = rerollExtraOpenings(next, history);
      }
      return next;
    });
  }

  function preset(lean: Lean) {
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

  const result = useMemo(
    () => (cfg.topic.trim() ? buildPrompt(cfg, voice, openings) : null),
    [cfg, voice, openings],
  );

  const last = history[0];
  // เพิ่งกดคัดลอกชุดนี้ไป ไม่ต้องเตือนว่าซ้ำกับตัวเอง
  const justCopied =
    !!last &&
    last.topic === cfg.topic.trim() &&
    last.opening === cfg.opening &&
    last.arc === cfg.arc &&
    last.ending === cfg.ending;

  const recentWarnings = useMemo(() => {
    if (justCopied) return [];
    const out: string[] = [];
    if (cfg.opening !== AUTO_OPENING && cfg.versions === 1) {
      const i = recentIds(history, "opening", RECENT_OPENINGS).indexOf(cfg.opening);
      if (i !== -1) out.push(`วิธีเปิด "${labelOf("opening", cfg.opening)}" เพิ่งใช้ไปเมื่อ ${i + 1} โพสต์ก่อน ลองเปลี่ยน หรือกดสุ่มทั้งชุด`);
    }
    if (last && last.arc === cfg.arc && last.ending === cfg.ending) {
      out.push("โครงเรื่องและวิธีปิดเหมือนโพสต์ล่าสุดทั้งคู่ คนอ่านจะรู้สึกว่าทรงเดิม");
    }
    return out;
  }, [justCopied, cfg.opening, cfg.versions, cfg.arc, cfg.ending, history, last]);

  function handleCopied() {
    recordHistory({
      topic: cfg.topic.trim(),
      audience: cfg.audience,
      opening: cfg.opening,
      arc: cfg.arc,
      ending: cfg.ending,
      tone: cfg.tonePrimary,
    });
  }

  const filledNeeds = NEED_FIELDS.filter((f) => cfg.material[f.id].trim() !== "").length;
  const isParent = cfg.audience === "parent";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      <div className="lg:col-span-5 space-y-3">
        {/* 1 เรื่องและผู้อ่าน */}
        <Step
          num={1}
          title="เรื่องและผู้อ่าน"
          summary={`${isParent ? "คุณพ่อคุณแม่" : "นักเรียน"}${cfg.grade ? ` · ${cfg.grade}` : ""}`}
        >
          <div className="field-group">
            <label className="field-label" htmlFor="topic">หัวข้อ</label>
            <input
              id="topic"
              className="field-input h-12 text-base"
              placeholder='เช่น "ลูกทำการบ้านได้ แต่สอบไม่ได้" หรือ "เศษส่วน ม.1"'
              value={cfg.topic}
              onChange={(e) => update({ topic: e.target.value })}
            />
          </div>
          <div>
            <SubLabel>เขียนถึงใคร</SubLabel>
            <Segmented<Audience>
              value={cfg.audience}
              onChange={setAudience}
              options={AUDIENCES.map((a) => ({ value: a.id, label: a.label }))}
            />
          </div>
          <div className="field-group">
            <label className="field-label" htmlFor="grade">ชั้นของ{isParent ? "ลูก" : "นักเรียน"}</label>
            <select id="grade" className="field-input" value={cfg.grade} onChange={(e) => update({ grade: e.target.value })}>
              <option value="">ไม่ระบุ</option>
              {GRADES.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>
          {isParent && (
            <div>
              <SubLabel hint="เลือกแล้วเนื้อหาจะเจาะถึงคนกลุ่มนี้">คุณพ่อคุณแม่แบบไหน</SubLabel>
              <div className="flex flex-wrap gap-2">
                <Chip active={cfg.parentType === ""} onClick={() => update({ parentType: "" })}>ทั่วไป</Chip>
                {PARENT_TYPES.map((p) => (
                  <Chip key={p.id} active={cfg.parentType === p.id} onClick={() => update({ parentType: p.id })} title={p.desc}>
                    {p.label}
                  </Chip>
                ))}
              </div>
            </div>
          )}
        </Step>

        {/* 2 วัตถุดิบจริง */}
        <Step
          num={2}
          title="วัตถุดิบจริงจากครู"
          summary={`กรอกแล้ว ${filledNeeds}/${NEED_FIELDS.length} · ยิ่งมีเรื่องจริง ยิ่งไม่เหมือน AI`}
        >
          <p className="text-micro -mt-1" style={{ color: "var(--color-text-tertiary)" }}>
            ไม่ต้องเรียบเรียง พิมพ์แบบพูดได้เลย ช่องไหนไม่มีก็เว้นไว้ Claude จะไม่แต่งแทน และถ้าแพตเทิร์นที่เลือกต้องใช้ช่องไหน Claude จะถามครูก่อน
          </p>
          {MATERIAL_FIELDS.map((f) => (
            <div key={f.id} className="field-group">
              <label className="field-label" htmlFor={`m-${f.id}`}>{f.label}</label>
              <textarea
                id={`m-${f.id}`}
                className="field-textarea"
                style={{ minHeight: 60 }}
                rows={2}
                placeholder={f.placeholder}
                value={cfg.material[f.id]}
                onChange={(e) => setMaterial(f.id, e.target.value)}
              />
            </div>
          ))}
          <div className="flex justify-end">
            <button type="button" className="btn-small" onClick={() => update({ material: EMPTY_MATERIAL })}>
              <Eraser size={12} /> ล้างวัตถุดิบ
            </button>
          </div>
        </Step>

        {/* 3 แพตเทิร์น */}
        <Step
          num={3}
          title="แพตเทิร์นของโพสต์"
          summary={`${labelOf("opening", cfg.opening)} → ${labelOf("arc", cfg.arc)} → ${labelOf("ending", cfg.ending)}`}
        >
          <PatternPicker cfg={cfg} history={history} onPick={pickPattern} onPreset={preset} onReroll={reroll} />
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
                    title={missing ? `ต้องมี${NEED_LABEL[x.needs!]} ถ้าไม่กรอก Claude จะถามก่อน` : x.desc}
                  >
                    {x.label}
                    {missing && <span className="tag need missing">ใช้{NEED_LABEL[x.needs!]}</span>}
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
            <input
              type="checkbox"
              className="mt-1 w-4 h-4 accent-[#e8955f]"
              checked={cfg.interview}
              onChange={(e) => update({ interview: e.target.checked })}
            />
            <span>
              <span className="block text-caption font-semibold" style={{ color: "var(--color-text-primary)" }}>
                ให้ Claude สัมภาษณ์ครูก่อนเขียน
              </span>
              <span className="block text-micro" style={{ color: "var(--color-text-tertiary)" }}>
                Claude จะถาม 3–5 ข้อเพื่อขุดเรื่องจริง ครูตอบสั้นๆ แล้วค่อยได้โพสต์ ได้เนื้อที่ลึกและเป็นของครูจริง
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
          recentWarnings={recentWarnings}
          justCopied={justCopied}
          history={history}
          onCopied={handleCopied}
          onDeleteHistory={(id) => setHistory((prev) => prev.filter((h) => h.id !== id))}
          onClearHistory={() => {
            if (window.confirm("ล้างประวัติแพตเทิร์นทั้งหมด? ปุ่มสุ่มจะไม่รู้ว่าเคยใช้อะไรไปแล้ว")) setHistory([]);
          }}
        />
      </div>
    </div>
  );
}
