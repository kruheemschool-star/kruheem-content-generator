import { ARCS, ENDINGS, OPENINGS, TONES, endingFits, forAudience } from "./options";
import type { Audience, BuilderConfig, HistoryEntry, Material, PatternOption } from "./types";

export type Lean = "emotion" | "direct" | "any";

/** จำนวนโพสต์ล่าสุดที่ห้ามใช้ชิ้นเดิมซ้ำ */
export const RECENT_OPENINGS = 5;
const RECENT_ARCS = 3;
const RECENT_ENDINGS = 3;

// วิธีเปิดอารมณ์กลางที่จริงๆ แล้วเข้าเรื่องเร็ว นับเป็นฝั่ง "ตรง"
const DIRECT_MID = ["myth", "oneliner"];

interface Ctx {
  audience: Audience;
  material: Material;
  history: HistoryEntry[];
}

export function hasNeed(material: Material, o: { needs?: keyof Material }): boolean {
  return !o.needs || material[o.needs].trim() !== "";
}

export function recentIds(history: HistoryEntry[], key: "opening" | "arc" | "ending" | "tone", n: number): string[] {
  return history.slice(0, n).map((h) => h[key]);
}

// มีวัตถุดิบรองรับ = น่าเลือกที่สุด / ไม่ต้องใช้วัตถุดิบ = ปกติ / ต้องใช้แต่ยังไม่มี = สุ่มเจอได้แต่น้อย (Claude จะต้องถามก่อน)
function weight(o: PatternOption, material: Material): number {
  if (!o.needs) return 2;
  return hasNeed(material, o) ? 3 : 0.5;
}

function pickWeighted<T>(items: T[], w: (t: T) => number): T | undefined {
  const total = items.reduce((s, t) => s + w(t), 0);
  let r = Math.random() * total;
  for (const t of items) {
    r -= w(t);
    if (r <= 0) return t;
  }
  return items[items.length - 1];
}

/** กรองของที่เพิ่งใช้ออก แต่ถ้ากรองแล้วเหลือน้อยเกินไป ให้คืนรายการเดิม */
function avoid<T extends { id: string }>(items: T[], recent: string[], min: number): T[] {
  const kept = items.filter((o) => !recent.includes(o.id));
  return kept.length >= min ? kept : items;
}

function leanOpenings(lean: Lean): PatternOption[] {
  if (lean === "emotion") return OPENINGS.filter((o) => o.emotion !== "low" && !DIRECT_MID.includes(o.id));
  if (lean === "direct") return OPENINGS.filter((o) => o.emotion === "low" || DIRECT_MID.includes(o.id));
  return OPENINGS;
}

export function pickOpenings(count: number, ctx: Ctx, exclude: string[] = [], lean: Lean = "any"): string[] {
  let pool = leanOpenings(lean).filter((o) => !exclude.includes(o.id));
  if (pool.length < count) pool = OPENINGS.filter((o) => !exclude.includes(o.id));
  pool = avoid(pool, recentIds(ctx.history, "opening", RECENT_OPENINGS), count);
  const picked: string[] = [];
  while (picked.length < count && pool.length > 0) {
    const o = pickWeighted(pool, (x) => weight(x, ctx.material))!;
    picked.push(o.id);
    pool = pool.filter((x) => x.id !== o.id);
  }
  return picked;
}

function pickArc(ctx: Ctx, lean: Lean): string {
  let pool = forAudience(ARCS, ctx.audience);
  if (lean !== "any") pool = pool.filter((a) => a.lean === lean);
  pool = avoid(pool, recentIds(ctx.history, "arc", RECENT_ARCS), 1);
  return pickWeighted(pool, (a) => weight(a, ctx.material))!.id;
}

function pickEnding(ctx: Ctx, openingIds: string[]): string {
  let pool = ENDINGS.filter((e) => endingFits(e, openingIds));
  pool = avoid(pool, recentIds(ctx.history, "ending", RECENT_ENDINGS), 1);
  // การชวนคอร์สให้ครูเลือกเองเป็นหลัก สุ่มเจอได้แต่น้อย
  return pickWeighted(pool, (e) => (e.id === "offer" ? 0.4 : e.pairsWith ? 1.5 : 1))!.id;
}

const EMOTION_TONES = ["warm", "story", "moving"];
const DIRECT_TONES = ["direct", "wow", "persuade", "challenge"];

function pickTones(ctx: Ctx, lean: Lean): { tonePrimary: string; toneSecondary: string } {
  const base = lean === "emotion" ? EMOTION_TONES : lean === "direct" ? DIRECT_TONES : TONES.map((t) => t.id);
  const last = recentIds(ctx.history, "tone", 1);
  const pool = base.filter((t) => !last.includes(t));
  const primary = (pool.length ? pool : base)[Math.floor(Math.random() * (pool.length || base.length))];
  const others = TONES.map((t) => t.id).filter((t) => t !== primary && t !== "urgent");
  const secondary = Math.random() < 0.5 ? others[Math.floor(Math.random() * others.length)] : "";
  return { tonePrimary: primary, toneSecondary: secondary };
}

function pickDepth(lean: Lean): string {
  const pool = lean === "emotion" ? ["cause", "root"] : lean === "direct" ? ["cause", "root", "insider"] : ["surface", "cause", "root", "insider"];
  return pool[Math.floor(Math.random() * pool.length)];
}

/** สุ่มแพตเทิร์นทั้งชุด โดยไม่ซ้ำกับโพสต์ล่าสุด */
export function randomizeCombo(cfg: BuilderConfig, history: HistoryEntry[], lean: Lean): Partial<BuilderConfig> {
  const ctx: Ctx = { audience: cfg.audience, material: cfg.material, history };
  const opening = pickOpenings(1, ctx, [], lean)[0];
  return {
    opening,
    extraOpenings: pickOpenings(3, ctx, [opening]),
    arc: pickArc(ctx, lean),
    ending: pickEnding(ctx, [opening]),
    depth: pickDepth(lean),
    ...pickTones(ctx, lean),
  };
}

export function rerollExtraOpenings(cfg: BuilderConfig, history: HistoryEntry[]): string[] {
  const ctx: Ctx = { audience: cfg.audience, material: cfg.material, history };
  return pickOpenings(3, ctx, [cfg.opening]);
}
