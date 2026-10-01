"use client";

import { Check, CircleAlert, CircleCheck, CircleX, Copy, Rows3, Save, ScanSearch } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import { buildFixPrompt, checkPost, spaceLines, type CheckReport } from "@/lib/checker";
import { copyText } from "@/lib/clipboard";
import { AUDIENCES, FORMATS } from "@/lib/prompt/options";
import type { Audience } from "@/lib/prompt/types";
import { addRecentOpening, configStore, openingsStore, useStore } from "@/lib/store";
import { Notice, Segmented } from "../ui";

function Highlighted({ report }: { report: CheckReport }) {
  const { body, highlights } = report;
  const out: ReactNode[] = [];
  let pos = 0;
  highlights.forEach((h, i) => {
    if (h.start > pos) out.push(body.slice(pos, h.start));
    out.push(
      <mark key={i} className={h.severity === "fail" ? "mark-fail" : "mark-warn"}>
        {body.slice(h.start, h.end)}
      </mark>,
    );
    pos = h.end;
  });
  if (pos < body.length) out.push(body.slice(pos));
  return <div className="prompt-pre">{out}</div>;
}

const STATUS_ICON = {
  pass: <CircleCheck size={15} style={{ color: "var(--color-success)" }} />,
  warn: <CircleAlert size={15} style={{ color: "var(--color-warning)" }} />,
  fail: <CircleX size={15} style={{ color: "var(--color-error)" }} />,
};

export default function Checker() {
  const [cfg] = useStore(configStore);
  const [openings] = useStore(openingsStore);
  const [text, setText] = useState("");
  const [audience, setAudience] = useState<Audience>(cfg.audience);
  const [format, setFormat] = useState(cfg.format);
  const [saved, setSaved] = useState(false);
  const [fixCopied, setFixCopied] = useState<"ok" | "fail" | null>(null);

  const report = useMemo(
    () => (text.trim() ? checkPost(text, { audience, format, recentOpenings: openings }) : null),
    [text, audience, format, openings],
  );

  async function copyFix() {
    if (!report) return;
    const ok = await copyText(buildFixPrompt(report));
    setFixCopied(ok ? "ok" : "fail");
    setTimeout(() => setFixCopied(null), 2000);
  }

  function saveOpening() {
    if (!report?.firstLine) return;
    addRecentOpening(report.firstLine);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const alreadySaved = !!report?.firstLine && openings.includes(report.firstLine);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      <div className="lg:col-span-5 space-y-4">
        <div className="surface p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "var(--color-accent-soft)" }}>
              <ScanSearch size={20} className="text-accent" />
            </div>
            <div>
              <p className="heading-md">ตรวจกลิ่น AI ก่อนโพสต์</p>
              <p className="text-micro" style={{ color: "var(--color-text-tertiary)" }}>
                วางโพสต์ที่ Claude เขียนมา แอปจะไฮไลต์จุดที่คนอ่านจับได้
              </p>
            </div>
          </div>
          <div>
            <p className="sub-label">โพสต์นี้เขียนถึง</p>
            <Segmented<Audience> value={audience} onChange={setAudience} options={AUDIENCES.map((a) => ({ value: a.id, label: a.label }))} />
          </div>
          <div>
            <p className="sub-label">จัดบรรทัดแบบ</p>
            <Segmented value={format} onChange={setFormat} options={FORMATS.map((f) => ({ value: f.id, label: f.label }))} />
          </div>
          <textarea
            className="field-textarea"
            style={{ minHeight: 360 }}
            placeholder="วางโพสต์ตรงนี้ จะวางทั้งก้อนที่มี [หัวข้อ] [โพสต์] [แฮชแท็ก] ก็ได้ แอปจะตัดเอาเฉพาะส่วนโพสต์ ถ้ามี 3 เวอร์ชัน ให้วางทีละเวอร์ชัน"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          {text && (
            <div className="flex justify-end gap-2 flex-wrap">
              {!!report?.noGap && (
                <button type="button" className="btn-small" onClick={() => setText(spaceLines(text))}>
                  <Rows3 size={13} /> เว้นบรรทัดให้ ({report.noGap} จุด)
                </button>
              )}
              <button type="button" className="btn-small" onClick={() => setText("")}>ล้างข้อความ</button>
            </div>
          )}
        </div>
      </div>

      <div className="lg:col-span-7 space-y-4">
        {!report ? (
          <div className="surface p-8 text-center space-y-2">
            <p className="heading-md">ยังไม่มีโพสต์ให้ตรวจ</p>
            <p className="text-caption max-w-md mx-auto" style={{ color: "var(--color-text-tertiary)" }}>
              ตัวตรวจจะดูคำและทรงที่ห้ามในคำสั่ง จับแพตเทิร์นกังวลแล้วปลอบ นับคำว่าครูฮีม ดูจังหวะย่อหน้า
              ดูว่าก้อนไหนยาวเกินจอมือถือหรือขาดตอน และเทียบบรรทัดแรกกับโพสต์ก่อนๆ ที่ครูบันทึกไว้
            </p>
          </div>
        ) : (
          <>
            <div className="surface p-5 space-y-4">
              <div className="flex items-center gap-3 flex-wrap">
                {report.fails === 0 && report.warns === 0 ? (
                  <Notice kind="ok" icon={<CircleCheck size={16} />}>
                    <b>ผ่านทุกข้อ</b> ไม่เจอทรงที่คนอ่านจับได้ อ่านออกเสียงอีกรอบแล้วโพสต์ได้เลย
                  </Notice>
                ) : (
                  <Notice kind={report.fails ? "fail" : "warn"} icon={report.fails ? <CircleX size={16} /> : <CircleAlert size={16} />}>
                    เจอ <b>{report.fails} จุดที่ควรแก้</b> และ <b>{report.warns} จุดที่ควรดู</b> กดคัดลอกคำสั่งแก้ แล้ววางในแชท Claude เดิม
                  </Notice>
                )}
                {(report.fails > 0 || report.warns > 0) && (
                  <button type="button" className="btn-copy" onClick={copyFix}>
                    {fixCopied === "ok" ? (
                      <>
                        <Check size={16} /> คัดลอกแล้ว
                      </>
                    ) : fixCopied === "fail" ? (
                      <>
                        <CircleAlert size={16} /> คัดลอกไม่ได้
                      </>
                    ) : (
                      <>
                        <Copy size={16} /> คัดลอกคำสั่งแก้
                      </>
                    )}
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {report.stats.map((s) => (
                  <div key={s.id} className="flex items-start gap-2.5 p-3 rounded-xl" style={{ background: "var(--color-bg-tertiary)" }}>
                    <span className="mt-0.5">{STATUS_ICON[s.status]}</span>
                    <div className="min-w-0">
                      <p className="text-caption font-semibold" style={{ color: "var(--color-text-primary)" }}>
                        {s.label} <span className="font-normal" style={{ color: "var(--color-text-secondary)" }}>· {s.value}</span>
                      </p>
                      <p className="text-[0.68rem]" style={{ color: "var(--color-text-tertiary)" }}>{s.hint}</p>
                    </div>
                  </div>
                ))}
              </div>

              {report.findings.length > 0 && (
                <div className="space-y-2">
                  {report.findings.map((f) => (
                    <div key={f.id} className="flex items-start gap-2.5 p-3 rounded-xl" style={{ background: "var(--color-bg-tertiary)" }}>
                      <span className="mt-0.5">{STATUS_ICON[f.severity]}</span>
                      <div className="min-w-0">
                        <p className="text-caption" style={{ color: "var(--color-text-primary)" }}>
                          <span className="tag mr-1.5">{f.group}</span>
                          {f.label} {f.count > 1 && <b>×{f.count}</b>}
                        </p>
                        {f.samples.length > 0 && (
                          <p className="text-micro mt-1" style={{ color: "var(--color-text-secondary)" }}>
                            เจอ: {f.samples.map((s) => `“${s}”`).join("  ")}
                          </p>
                        )}
                        <p className="text-micro mt-0.5" style={{ color: "var(--color-text-tertiary)" }}>แก้: {f.fix}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {report.firstLine && (
                <div className="flex items-center gap-3 p-3 rounded-xl flex-wrap" style={{ border: "1px dashed var(--color-border-default)" }}>
                  <div className="min-w-0 flex-1">
                    <p className="text-[0.68rem]" style={{ color: "var(--color-text-tertiary)" }}>บรรทัดแรกของโพสต์นี้</p>
                    <p className="text-caption truncate" style={{ color: "var(--color-text-primary)" }}>{report.firstLine}</p>
                  </div>
                  <button type="button" className="btn-ghost flex-none" onClick={saveOpening} disabled={alreadySaved}>
                    <Save size={14} /> {alreadySaved ? "บันทึกไว้แล้ว" : saved ? "บันทึกแล้ว" : "บันทึกไว้กันเปิดซ้ำ"}
                  </button>
                </div>
              )}
            </div>

            <div className="surface p-5">
              <p className="sub-label">
                โพสต์ที่ไฮไลต์แล้ว
                <span className="hint inline-flex items-center gap-2">
                  <mark className="mark-fail">ควรแก้</mark>
                  <mark className="mark-warn">ควรดู</mark>
                </span>
              </p>
              <Highlighted report={report} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
