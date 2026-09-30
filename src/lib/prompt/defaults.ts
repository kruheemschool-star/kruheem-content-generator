import {
  ANALOGY_SOURCES,
  ARCS,
  AUDIENCES,
  AUTO_OPENING,
  CTAS,
  DEPTHS,
  EMOJI_LEVELS,
  ENDINGS,
  EXTRAS,
  FORMATS,
  GRADES,
  LENGTHS,
  OPENINGS,
  PARENT_TYPES,
  TONES,
  byId,
} from "./options";
import type { BuilderConfig, Material, VoiceProfile } from "./types";

export const EMPTY_MATERIAL: Material = {
  story: "",
  quote: "",
  number: "",
  stance: "",
  mistake: "",
  timing: "",
  extra: "",
};

export const DEFAULT_CONFIG: BuilderConfig = {
  topic: "",
  audience: "parent",
  grade: "",
  parentType: "",
  material: EMPTY_MATERIAL,
  opening: "direct",
  extraOpenings: ["scene", "myth", "problem"],
  arc: "qa",
  ending: "action",
  tonePrimary: "warm",
  toneSecondary: "direct",
  depth: "cause",
  length: "medium",
  format: "mixed",
  emoji: "few",
  versions: 1,
  analogy: "",
  extras: [],
  ctas: ["comment"],
  interview: false,
};

export const DEFAULT_VOICE: VoiceProfile = {
  selfName: "ครู",
  particle: "ครับ",
  studentCall: "หนูๆ",
  catchphrases: "",
  beliefs: "",
  donts: "",
  samplePosts: "",
  products: "คอร์สเรียน VOD และคลังข้อสอบออนไลน์ที่ kruheemmath.com",
};

function str(v: unknown, fallback: string): string {
  return typeof v === "string" ? v : fallback;
}

function oneOf(v: unknown, ids: string[], fallback: string): string {
  return typeof v === "string" && ids.includes(v) ? v : fallback;
}

function subset(v: unknown, ids: string[]): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string" && ids.includes(x)) : [];
}

const ids = (list: { id: string }[]) => list.map((o) => o.id);

/** ค่าที่อ่านจาก localStorage อาจเก่าหรือเสีย ให้กรองทุกช่องก่อนใช้ */
export function normalizeConfig(raw: unknown): BuilderConfig {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const d = DEFAULT_CONFIG;
  const m = (r.material && typeof r.material === "object" ? r.material : {}) as Record<string, unknown>;
  const openingIds = ids(OPENINGS);
  const extra = subset(r.extraOpenings, openingIds);
  return {
    topic: str(r.topic, d.topic),
    audience: oneOf(r.audience, ids(AUDIENCES), d.audience) as BuilderConfig["audience"],
    grade: oneOf(r.grade, ["", ...GRADES], d.grade),
    parentType: oneOf(r.parentType, ["", ...ids(PARENT_TYPES)], d.parentType),
    material: {
      story: str(m.story, ""),
      quote: str(m.quote, ""),
      number: str(m.number, ""),
      stance: str(m.stance, ""),
      mistake: str(m.mistake, ""),
      timing: str(m.timing, ""),
      extra: str(m.extra, ""),
    },
    opening: oneOf(r.opening, [AUTO_OPENING, ...openingIds], d.opening),
    extraOpenings: extra.length === 3 ? extra : d.extraOpenings,
    arc: oneOf(r.arc, ids(ARCS), d.arc),
    ending: oneOf(r.ending, ids(ENDINGS), d.ending),
    tonePrimary: oneOf(r.tonePrimary, ids(TONES), d.tonePrimary),
    toneSecondary: oneOf(r.toneSecondary, ["", ...ids(TONES)], d.toneSecondary),
    depth: oneOf(r.depth, ids(DEPTHS), d.depth),
    length: oneOf(r.length, ids(LENGTHS), d.length),
    format: oneOf(r.format, ids(FORMATS), d.format),
    emoji: oneOf(r.emoji, ids(EMOJI_LEVELS), d.emoji),
    versions: r.versions === 3 ? 3 : 1,
    analogy: oneOf(r.analogy, ["", ...ids(ANALOGY_SOURCES)], d.analogy),
    extras: subset(r.extras, ids(EXTRAS)),
    ctas: Array.isArray(r.ctas) ? subset(r.ctas, ids(CTAS)) : d.ctas,
    interview: r.interview === true,
  };
}

export function normalizeVoice(raw: unknown): VoiceProfile {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const d = DEFAULT_VOICE;
  return {
    selfName: str(r.selfName, d.selfName),
    particle: str(r.particle, d.particle),
    studentCall: str(r.studentCall, d.studentCall),
    catchphrases: str(r.catchphrases, d.catchphrases),
    beliefs: str(r.beliefs, d.beliefs),
    donts: str(r.donts, d.donts),
    samplePosts: str(r.samplePosts, d.samplePosts),
    products: str(r.products, d.products),
  };
}

export function isVoiceSetUp(v: VoiceProfile): boolean {
  return v.beliefs.trim() !== "" || v.samplePosts.trim() !== "";
}

export function labelOf(kind: "opening" | "arc" | "ending" | "tone", id: string): string {
  if (kind === "opening") return id === AUTO_OPENING ? "ให้ Claude เลือก" : byId(OPENINGS, id)?.label ?? id;
  if (kind === "arc") return byId(ARCS, id)?.label ?? id;
  if (kind === "ending") return byId(ENDINGS, id)?.label ?? id;
  return byId(TONES, id)?.label ?? id;
}
