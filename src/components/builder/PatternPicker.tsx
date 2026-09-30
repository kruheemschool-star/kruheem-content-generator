"use client";

import { RefreshCw, Sparkles } from "lucide-react";
import { ARCS, AUTO_OPENING, ENDINGS, NEED_LABEL, OPENINGS, endingFits, forAudience } from "@/lib/prompt/options";
import { RECENT_OPENINGS, hasNeed, recentIds } from "@/lib/prompt/randomize";
import { labelOf } from "@/lib/prompt/defaults";
import type { BuilderConfig, HistoryEntry, PatternOption } from "@/lib/prompt/types";
import { OptionCard, SubLabel } from "../ui";

const EMO_LABEL = { low: "เข้าเรื่องเร็ว", mid: "อารมณ์กลาง", high: "อารมณ์สูง" } as const;

function recentRank(history: HistoryEntry[], key: "opening" | "arc" | "ending", id: string, n: number): number {
  const i = recentIds(history, key, n).indexOf(id);
  return i === -1 ? 0 : i + 1;
}

function Tags({
  o,
  cfg,
  rank,
}: {
  o: PatternOption;
  cfg: BuilderConfig;
  rank: number;
}) {
  const needMissing = o.needs && !hasNeed(cfg.material, o);
  return (
    <>
      {o.needs && (
        <span
          className={`tag need ${needMissing ? "missing" : ""}`}
          title={needMissing ? "ไม่ใส่ก็ได้ จะเขียนแบบภาพรวมแทน ไม่แต่งเคส" : "มีข้อมูลแล้ว"}
        >
          {needMissing ? `ดีขึ้นถ้ามี${NEED_LABEL[o.needs]}` : `ใช้${NEED_LABEL[o.needs]}ของครู`}
        </span>
      )}
      {rank > 0 && <span className="tag recent">ใช้เมื่อ {rank} โพสต์ก่อน</span>}
    </>
  );
}

export default function PatternPicker({
  cfg,
  history,
  onPick,
  onReroll,
}: {
  cfg: BuilderConfig;
  history: HistoryEntry[];
  onPick: (patch: Partial<BuilderConfig>) => void;
  onReroll: () => void;
}) {
  const arcs = forAudience(ARCS, cfg.audience);
  const openingIdsForFit = cfg.opening === AUTO_OPENING ? cfg.extraOpenings : [cfg.opening];
  const showExtras = cfg.opening === AUTO_OPENING || cfg.versions === 3;

  return (
    <>
      <div>
        <SubLabel
          hint={
            <span className="inline-flex items-center gap-2">
              <span className="inline-flex items-center gap-1"><span className="emo-dot low" /> เร็ว</span>
              <span className="inline-flex items-center gap-1"><span className="emo-dot mid" /> กลาง</span>
              <span className="inline-flex items-center gap-1"><span className="emo-dot high" /> อารมณ์สูง</span>
            </span>
          }
        >
          วิธีเปิด
        </SubLabel>
        <div className="grid grid-cols-2 gap-2">
          <OptionCard
            active={cfg.opening === AUTO_OPENING}
            onClick={() => onPick({ opening: AUTO_OPENING })}
            lead={<Sparkles size={13} />}
            title="ให้ Claude เลือก"
            desc="ส่ง 3 แบบที่ไม่ซ้ำโพสต์ล่าสุด ให้ Claude เลือกแบบที่เข้ากับเรื่อง"
          />
          {OPENINGS.map((o) => (
            <OptionCard
              key={o.id}
              active={cfg.opening === o.id}
              onClick={() => onPick({ opening: o.id })}
              lead={o.emotion && <span className={`emo-dot ${o.emotion}`} title={EMO_LABEL[o.emotion]} />}
              title={o.label}
              desc={o.desc}
              tags={<Tags o={o} cfg={cfg} rank={recentRank(history, "opening", o.id, RECENT_OPENINGS)} />}
            />
          ))}
        </div>
        {showExtras && (
          <div className="mt-3 flex flex-wrap items-center gap-2 text-micro" style={{ color: "var(--color-text-tertiary)" }}>
            <span>{cfg.versions === 3 ? "วิธีเปิดของ 3 เวอร์ชัน:" : "3 แบบที่ส่งให้ Claude เลือก:"}</span>
            {(cfg.versions === 3 && cfg.opening !== AUTO_OPENING
              ? [cfg.opening, ...cfg.extraOpenings.filter((id) => id !== cfg.opening).slice(0, 2)]
              : cfg.extraOpenings
            ).map((id) => (
              <span key={id} className="tag">{labelOf("opening", id)}</span>
            ))}
            <button type="button" className="chip" style={{ padding: "4px 10px" }} onClick={onReroll}>
              <RefreshCw size={12} /> สุ่มใหม่
            </button>
          </div>
        )}
      </div>

      <div>
        <SubLabel hint="เป็นทิศทางของเรื่อง ไม่ใช่หัวข้อในโพสต์">โครงเรื่อง</SubLabel>
        <div className="grid grid-cols-2 gap-2">
          {arcs.map((o) => (
            <OptionCard
              key={o.id}
              active={cfg.arc === o.id}
              onClick={() => onPick({ arc: o.id })}
              title={o.label}
              desc={o.desc}
              tags={<Tags o={o} cfg={cfg} rank={recentRank(history, "arc", o.id, 3)} />}
            />
          ))}
        </div>
      </div>

      <div>
        <SubLabel>วิธีปิด</SubLabel>
        <div className="grid grid-cols-2 gap-2">
          {ENDINGS.map((o) => {
            const fits = endingFits(o, openingIdsForFit);
            return (
              <OptionCard
                key={o.id}
                active={cfg.ending === o.id}
                onClick={() => onPick({ ending: o.id })}
                title={o.label}
                desc={fits ? o.desc : "ต้องเปิดด้วยฉาก คำพูด หรือโจทย์"}
                tags={<Tags o={o} cfg={cfg} rank={recentRank(history, "ending", o.id, 3)} />}
              />
            );
          })}
        </div>
      </div>
    </>
  );
}
