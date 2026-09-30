import { BAN_RULES, type Severity } from "./prompt/antiAi";
import type { Audience } from "./prompt/types";

export interface Finding {
  id: string;
  group: string;
  label: string;
  fix: string;
  severity: Severity;
  count: number;
  samples: string[];
}

export interface Highlight {
  start: number;
  end: number;
  severity: Severity;
  id: string;
}

export interface Stat {
  id: string;
  label: string;
  value: string;
  status: "pass" | "warn" | "fail";
  hint: string;
}

export interface CheckReport {
  body: string;
  firstLine: string;
  findings: Finding[];
  highlights: Highlight[];
  stats: Stat[];
  fails: number;
  warns: number;
}

// คำว่า "คุณ" ที่ไม่ได้ใช้เรียกผู้อ่าน
const KHUN_OK_AFTER =
  "พ่อ|แม่|ครู|ค่า|ภาพ|สมบัติ|ธรรม|ประโยชน์|ลักษณะ|หมอ|ยาย|ตา|ปู่|ย่า|น้า|ป้า|ลุง|วุฒิ|งาม|ูป|ความดี";
const STANDALONE_KHUN = new RegExp(`(?<!ขอบ|ขอ)คุณ(?!${KHUN_OK_AFTER})`, "g");
const EMOJI = /\p{Extended_Pictographic}/gu;
const WORRY = /กังวล|กลัว|เครียด|ห่วง|ทุกข์|ท้อ|หนักใจ|ใจเสีย|ปวดหัว/;
const REASSURE = /ไม่ใช่ความผิด|ไม่ได้ผิด|ไม่ได้(?:อยู่|เป็น)(?:แค่)?คนเดียว|เป็นเรื่องปกติ|ไม่ต้องโทษตัวเอง|ไม่แปลก(?:เลย)?/;
const QUESTION_END = /(?:\?|？|ไหม|มั้ย|หรือเปล่า|หรือไม่|ใช่ไหม|เหรอ|หรอ)\s*[😅🤔😊🙂]*\s*$/u;

/** ถ้าวางผลลัพธ์ทั้งก้อนจาก Claude มา ให้ตัดเอาเฉพาะส่วน [โพสต์] */
export function extractBody(text: string): string {
  const src = text.replace(/\r\n/g, "\n");
  const m = src.match(/\[โพสต์\][^\n]*\n([\s\S]*?)(?=\n\s*\[(?:แฮชแท็ก|เวอร์ชัน|หัวข้อ)[^\]]*\]|$)/);
  return (m ? m[1] : src).trim();
}

function paragraphs(body: string): string[] {
  const byBlank = body.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  return byBlank.length > 1 ? byBlank : body.split("\n").map((p) => p.trim()).filter(Boolean);
}

/** ความคล้ายของสองบรรทัด วัดจากคู่ตัวอักษรที่ซ้ำกัน (0–1) */
export function similarity(a: string, b: string): number {
  const grams = (s: string) => {
    const t = s.replace(/\s+/g, "");
    const set = new Set<string>();
    for (let i = 0; i < t.length - 1; i++) set.add(t.slice(i, i + 2));
    return set;
  };
  const A = grams(a);
  const B = grams(b);
  if (!A.size || !B.size) return 0;
  let inter = 0;
  A.forEach((g) => {
    if (B.has(g)) inter++;
  });
  return inter / (A.size + B.size - inter);
}

function addMatches(body: string, re: RegExp, onMatch: (start: number, end: number, text: string) => void) {
  const flags = re.flags.includes("g") ? re.flags : re.flags + "g";
  const g = new RegExp(re.source, flags);
  for (const m of body.matchAll(g)) {
    if (m.index === undefined || m[0].length === 0) continue;
    onMatch(m.index, m.index + m[0].length, m[0]);
  }
}

export function checkPost(text: string, opts: { audience: Audience; recentOpenings: string[] }): CheckReport {
  const body = extractBody(text);
  const paras = paragraphs(body);
  const firstLine = body.split("\n").find((l) => l.trim())?.trim() ?? "";
  const findings: Finding[] = [];
  const highlights: Highlight[] = [];

  for (const rule of BAN_RULES) {
    const samples: string[] = [];
    let count = 0;
    for (const re of rule.patterns) {
      addMatches(body, re, (start, end, t) => {
        count++;
        if (samples.length < 3 && !samples.includes(t)) samples.push(t);
        highlights.push({ start, end, severity: rule.severity, id: rule.id });
      });
    }
    if (count) findings.push({ id: rule.id, group: rule.group, label: rule.label, fix: rule.fix, severity: rule.severity, count, samples });
  }

  // โครงเดิม: ย่อหน้าต้นๆ มีทั้งความกังวลและคำปลอบ
  const head = paras.slice(0, 3).join("\n");
  const worryArc = WORRY.test(head) && REASSURE.test(head);
  if (worryArc) {
    findings.unshift({
      id: "worry-arc",
      group: "แพตเทิร์นเดิม",
      label: "เปิดด้วยความกังวล แล้วปลอบว่าไม่ใช่ความผิด",
      fix: "เปลี่ยนวิธีเปิด เป็นแพตเทิร์นที่คนจับได้แล้ว",
      severity: "fail",
      count: 1,
      samples: [],
    });
  }

  if (opts.audience === "parent") {
    const samples: string[] = [];
    let count = 0;
    addMatches(body, STANDALONE_KHUN, (start, end) => {
      count++;
      const ctx = body.slice(Math.max(0, start - 8), Math.min(body.length, end + 8)).replace(/\n/g, " ");
      if (samples.length < 3) samples.push(`…${ctx}…`);
      highlights.push({ start, end, severity: "warn", id: "khun" });
    });
    if (count) {
      findings.push({
        id: "khun",
        group: "เรียกผู้อ่าน",
        label: 'ใช้คำว่า "คุณ" คำเดียวเรียกผู้อ่าน',
        fix: 'เปลี่ยนเป็น "คุณพ่อคุณแม่"',
        severity: "warn",
        count,
        samples,
      });
    }
  }

  // ── ตัวเลขสรุป ──
  const stats: Stat[] = [];
  const kh = (body.match(/ครูฮีม/g) ?? []).length;
  stats.push({
    id: "kh",
    label: 'คำว่า "ครูฮีม"',
    value: `${kh} ครั้ง`,
    status: kh >= 2 && kh <= 4 ? "pass" : kh === 0 || kh > 6 ? "fail" : "warn",
    hint: "โพสต์ Facebook ควรมี 2–4 ครั้ง",
  });

  if (opts.audience === "parent") {
    const kpm = (body.match(/คุณพ่อคุณแม่/g) ?? []).length;
    stats.push({
      id: "kpm",
      label: 'คำว่า "คุณพ่อคุณแม่"',
      value: `${kpm} ครั้ง`,
      status: kpm >= 1 ? "pass" : "fail",
      hint: "โพสต์ถึงผู้ปกครองต้องเรียกผู้อ่านว่าคุณพ่อคุณแม่",
    });
  }

  const emojis = body.match(EMOJI) ?? [];
  const leadEmoji = paras.filter((p) => /^\p{Extended_Pictographic}/u.test(p)).length;
  stats.push({
    id: "emoji",
    label: "อีโมจิ",
    value: `${emojis.length} ตัว${leadEmoji ? ` (หัวย่อหน้า ${leadEmoji})` : ""}`,
    status: leadEmoji >= 2 ? "fail" : emojis.length > 8 ? "warn" : "pass",
    hint: "อีโมจิหัวย่อหน้าหลายย่อหน้าคือทรงของ AI",
  });

  const lens = paras.map((p) => p.length);
  let cv = 1;
  if (lens.length >= 4) {
    const mean = lens.reduce((s, n) => s + n, 0) / lens.length;
    const sd = Math.sqrt(lens.reduce((s, n) => s + (n - mean) ** 2, 0) / lens.length);
    cv = mean ? sd / mean : 1;
  }
  stats.push({
    id: "rhythm",
    label: "จังหวะย่อหน้า",
    value: `${paras.length} ย่อหน้า`,
    status: lens.length >= 4 && cv < 0.25 ? "warn" : "pass",
    hint: "ย่อหน้ายาวใกล้เคียงกันหมดจะอ่านแล้วเหมือนเครื่องเขียน",
  });

  const lineList = body.split("\n").map((l) => l.trim()).filter(Boolean);
  let run = 0;
  let maxRun = 0;
  for (const l of lineList) {
    run = QUESTION_END.test(l) ? run + 1 : 0;
    maxRun = Math.max(maxRun, run);
  }
  stats.push({
    id: "questions",
    label: "คำถามติดกัน",
    value: `สูงสุด ${maxRun} บรรทัด`,
    status: maxRun >= 3 ? "warn" : "pass",
    hint: "ตั้งคำถามรัวๆ หลายบรรทัดติดกันคือทรงของ AI",
  });

  const recent = opts.recentOpenings.map((s) => s.trim()).filter(Boolean);
  if (firstLine && recent.length) {
    let best = { line: "", score: 0 };
    for (const r of recent) {
      const score = r.slice(0, 6) === firstLine.slice(0, 6) ? 1 : similarity(firstLine, r);
      if (score > best.score) best = { line: r, score };
    }
    const pct = Math.round(best.score * 100);
    stats.push({
      id: "opening",
      label: "บรรทัดแรกเทียบโพสต์ก่อนๆ",
      value: `คล้ายสุด ${pct}%`,
      status: best.score >= 0.5 ? "fail" : best.score >= 0.3 ? "warn" : "pass",
      hint: best.line ? `ใกล้กับ "${best.line.slice(0, 40)}${best.line.length > 40 ? "…" : ""}"` : "",
    });
  }

  // เรียงไฮไลต์และตัดตัวที่ทับกัน
  highlights.sort((a, b) => a.start - b.start || b.end - a.end);
  const merged: Highlight[] = [];
  for (const h of highlights) {
    const last = merged[merged.length - 1];
    if (last && h.start < last.end) {
      if (h.severity === "fail" && last.severity === "warn") last.severity = "fail";
      last.end = Math.max(last.end, h.end);
      continue;
    }
    merged.push({ ...h });
  }

  findings.sort((a, b) => (a.severity === b.severity ? 0 : a.severity === "fail" ? -1 : 1));
  const fails = findings.filter((f) => f.severity === "fail").length + stats.filter((s) => s.status === "fail").length;
  const warns = findings.filter((f) => f.severity === "warn").length + stats.filter((s) => s.status === "warn").length;

  return { body, firstLine, findings, highlights: merged, stats, fails, warns };
}
