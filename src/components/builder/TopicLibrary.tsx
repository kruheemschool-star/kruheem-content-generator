"use client";

import { Dice5 } from "lucide-react";
import { useState } from "react";
import { DEFAULT_MATH_GRADE, MATH_TOPICS, TOPIC_GROUPS } from "@/lib/prompt/options";
import { pickOne } from "@/lib/prompt/randomize";
import type { Audience } from "@/lib/prompt/types";
import { Chip } from "../ui";

const MATH = "math";

export default function TopicLibrary({
  audience,
  grade,
  current,
  onPick,
}: {
  audience: Audience;
  grade: string;
  current: string;
  onPick: (topic: string, gradeHint?: string) => void;
}) {
  const groups = TOPIC_GROUPS.filter((g) => g.audiences.includes(audience));
  const [picked, setPicked] = useState(groups[0].id);
  const groupId = picked === MATH || groups.some((g) => g.id === picked) ? picked : groups[0].id;
  const mathGrade = MATH_TOPICS[grade] ? grade : DEFAULT_MATH_GRADE;
  const topics = groupId === MATH ? MATH_TOPICS[mathGrade] : groups.find((g) => g.id === groupId)!.topics;

  function pick(topic: string) {
    onPick(topic, groupId === MATH && !grade ? mathGrade : undefined);
  }

  function random() {
    const topic = pickOne(topics.filter((t) => t !== current));
    if (topic) pick(topic);
  }

  return (
    <div className="topic-lib">
      <div className="flex items-center gap-1.5 flex-wrap">
        {groups.map((g) => (
          <button key={g.id} type="button" className={`topic-group ${groupId === g.id ? "active" : ""}`} onClick={() => setPicked(g.id)}>
            {g.label}
          </button>
        ))}
        <button type="button" className={`topic-group ${groupId === MATH ? "active" : ""}`} onClick={() => setPicked(MATH)}>
          เนื้อหาคณิต {groupId === MATH && <span className="opacity-70">· {mathGrade}</span>}
        </button>
        <button type="button" className="topic-group ml-auto" onClick={random} title="สุ่มหัวข้อจากกลุ่มนี้">
          <Dice5 size={13} /> สุ่ม
        </button>
      </div>
      <div className="flex flex-wrap gap-1.5 mt-2.5">
        {topics.map((t) => (
          <Chip key={t} active={current === t} onClick={() => pick(t)}>
            {t}
          </Chip>
        ))}
      </div>
    </div>
  );
}
