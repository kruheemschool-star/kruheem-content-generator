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
  /** สิ่งที่ให้ Claude แก้ ใช้ตอนไม่ผ่าน */
  fix?: string;
}

export interface CheckReport {
  body: string;
  firstLine: string;
  findings: Finding[];
  highlights: Highlight[];
  stats: Stat[];
  fails: number;
  warns: number;
  /** จุดที่ขึ้นบรรทัดใหม่แต่ไม่มีบรรทัดว่างคั่น */
  noGap: number;
  /** ก้อนข้อความตามที่จะเห็นบนมือถือ ใช้ทำตัวอย่างหน้าจอ */
  blocks: Block[];
}

export interface Block {
  text: string;
  /** ยาวเกินจอมือถือ */
  long: boolean;
  /** อยู่ในช่วงประโยคโดดเรียงกันตั้งแต่สามก้อน */
  choppy: boolean;
}

// คำว่า "คุณ" ที่ไม่ได้ใช้เรียกผู้อ่าน
const KHUN_OK_AFTER =
  "พ่อ|แม่|ครู|ค่า|ภาพ|สมบัติ|ธรรม|ประโยชน์|ลักษณะ|หมอ|ยาย|ตา|ปู่|ย่า|น้า|ป้า|ลุง|วุฒิ|งาม|ูป|ความดี";
const STANDALONE_KHUN = new RegExp(`(?<!ขอบ|ขอ)คุณ(?!${KHUN_OK_AFTER})`, "g");
const EMOJI = /\p{Extended_Pictographic}/gu;
const WORRY = /กังวล|กลัว|เครียด|ห่วง|ทุกข์|ท้อ|หนักใจ|ใจเสีย|ปวดหัว/;
const REASSURE = /ไม่ใช่ความผิด|ไม่ได้ผิด|ไม่ได้(?:อยู่|เป็น)(?:แค่)?คนเดียว|เป็นเรื่องปกติ|ไม่ต้องโทษตัวเอง|ไม่แปลก(?:เลย)?/;
const QUESTION_END = /(?:\?|？|ไหม|มั้ย|หรือเปล่า|หรือไม่|ใช่ไหม|เหรอ|หรอ)\s*[😅🤔😊🙂]*\s*$/u;

// ── หน้าตาบนมือถือ ──
/** ตัวอักษรต่อบรรทัดบนจอ Facebook มือถือ (ประมาณ) */
const PHONE_CHARS_PER_LINE = 38;
/** ก้อนยาวเกินกี่บรรทัดบนมือถือถึงนับว่าเป็นพืด แยกตามแบบการจัดบรรทัด เผื่อจากที่สั่ง Claude ไว้หนึ่งบรรทัด */
const BLOCK_LIMIT: Record<string, number> = { airy: 4, mixed: 6, flow: 10 };
/** ก้อนบรรทัดเดียวที่สั้นกว่านี้ นับเป็นประโยคโดด */
const SHORT_BLOCK_CHARS = 30;

/** นับเฉพาะตัวที่กินที่ในบรรทัด สระบนล่างและวรรณยุกต์ไม่นับ */
function displayLength(s: string): number {
  return s.replace(/\p{M}/gu, "").length;
}

function phoneLines(block: string): number {
  return block
    .split("\n")
    .reduce((n, l) => n + Math.max(1, Math.ceil(displayLength(l.trim()) / PHONE_CHARS_PER_LINE)), 0);
}

function quoteStart(text: string): string {
  const t = text.replace(/\s+/g, " ").trim();
  return t.length > 30 ? `${t.slice(0, 30)}…` : t;
}

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

/** เว้นบรรทัดว่างคั่นทุกบรรทัดในส่วนโพสต์ ส่วนอื่นที่วางมาด้วยคงไว้ */
export function spaceLines(text: string): string {
  const src = text.replace(/\r\n/g, "\n");
  const body = extractBody(src);
  const spaced = body
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .join("\n\n");
  const at = src.indexOf(body);
  return at < 0 ? spaced : src.slice(0, at) + spaced + src.slice(at + body.length);
}

export function checkPost(
  text: string,
  opts: { audience: Audience; format: string; recentOpenings: string[] },
): CheckReport {
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
    fix: 'ปรับให้มีคำว่า "ครูฮีม" 2–4 ครั้ง วางคนละตำแหน่ง ที่เหลือใช้คำแทนตัวหรือละประธาน',
  });

  if (opts.audience === "parent") {
    const kpm = (body.match(/คุณพ่อคุณแม่/g) ?? []).length;
    stats.push({
      id: "kpm",
      label: 'คำว่า "คุณพ่อคุณแม่"',
      value: `${kpm} ครั้ง`,
      status: kpm >= 1 ? "pass" : "fail",
      hint: "โพสต์ถึงผู้ปกครองต้องเรียกผู้อ่านว่าคุณพ่อคุณแม่",
      fix: "เรียกผู้อ่านว่าคุณพ่อคุณแม่",
    });
  }

  const emojis = body.match(EMOJI) ?? [];
  const leadEmoji = paras.filter((p) => /^\p{Extended_Pictographic}/u.test(p)).length;
  const trailEmoji = paras.filter((p) => /\p{Extended_Pictographic}\uFE0F?\s*$/u.test(p)).length;
  const emojiNotes = [leadEmoji && `หัวย่อหน้า ${leadEmoji}`, trailEmoji && `ท้ายย่อหน้า ${trailEmoji}`].filter(Boolean);
  stats.push({
    id: "emoji",
    label: "อีโมจิ",
    value: `${emojis.length} ตัว${emojiNotes.length ? ` (${emojiNotes.join(" · ")})` : ""}`,
    status: leadEmoji >= 2 ? "fail" : emojis.length > 8 || trailEmoji >= 3 ? "warn" : "pass",
    hint: "อีโมจิหัวย่อหน้าหรือท้ายย่อหน้าหลายย่อหน้าคือทรงของ AI",
    fix: "ลดอีโมจิลง ไม่วางอีโมจิไว้หัวย่อหน้า และไม่ปิดท้ายหลายย่อหน้าด้วยอีโมจิ",
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
    // เว้นบรรทัดถี่คุมทุกก้อนไว้ไม่เกินสามบรรทัด ความยาวจึงใกล้กันเองโดยธรรมชาติ
    status: lens.length >= 4 && cv < (opts.format === "airy" ? 0.15 : 0.25) ? "warn" : "pass",
    hint: "ย่อหน้ายาวใกล้เคียงกันหมดจะอ่านแล้วเหมือนเครื่องเขียน",
    fix: "ทำให้ย่อหน้ายาวสั้นไม่เท่ากัน ตามจังหวะของเนื้อเรื่อง",
  });

  const allBlocks = body
    .split(/\n\s*\n/)
    .map((b) => b.trim())
    .filter(Boolean);
  const blocks = allBlocks.filter((b) => !b.startsWith("#"));
  const limit = BLOCK_LIMIT[opts.format] ?? BLOCK_LIMIT.mixed;
  const longBlocks = blocks.filter((b) => phoneLines(b) > limit);
  stats.push({
    id: "long-blocks",
    label: "ก้อนยาวเกินจอ",
    value: `${longBlocks.length} ก้อน`,
    status: longBlocks.length === 0 ? "pass" : longBlocks.length <= 2 ? "warn" : "fail",
    hint: longBlocks.length
      ? `ยาวเกินราว ${limit} บรรทัดบนมือถือ เช่นก้อนที่ขึ้นต้นว่า "${quoteStart(longBlocks[0])}"`
      : `ทุกก้อนไม่เกินราว ${limit} บรรทัดบนมือถือ`,
    fix: `ก้อนที่ขึ้นต้นว่า ${longBlocks.map((b) => `"${quoteStart(b)}"`).join(" ")} ยาวเกินจอมือถือ แบ่งให้สั้นลงตรงรอยต่อของความคิด เว้นบรรทัดว่างคั่น โดยไม่ตัดคำเชื่อมทิ้ง`,
  });

  let shortRun = 0;
  let maxShort = 0;
  let worst = -1;
  const choppy = new Set<string>();
  blocks.forEach((b, i) => {
    shortRun = !b.includes("\n") && displayLength(b) <= SHORT_BLOCK_CHARS ? shortRun + 1 : 0;
    if (shortRun >= 3) for (let k = i - shortRun + 1; k <= i; k++) choppy.add(blocks[k]);
    if (shortRun > maxShort) {
      maxShort = shortRun;
      worst = i - shortRun + 1;
    }
  });
  stats.push({
    id: "choppy",
    label: "ประโยคโดดเรียงกัน",
    value: `ติดกันสูงสุด ${maxShort} ก้อน`,
    status: maxShort >= 5 ? "fail" : maxShort >= 3 ? "warn" : "pass",
    hint: maxShort >= 3
      ? `เริ่มที่ "${quoteStart(blocks[worst])}" ประโยคสั้นแยกก้อนเรียงกันอ่านแล้วขาดตอน`
      : "ประโยคสั้นแยกก้อนเรียงกันหลายก้อนจะอ่านแล้วขาดตอน",
    fix: worst >= 0
      ? `ช่วงที่เริ่มว่า "${quoteStart(blocks[worst])}" เป็นประโยคสั้นแยกก้อนเรียงกัน ${maxShort} ก้อน รวมประโยคที่เป็นความคิดเดียวกันไว้ก้อนเดียว ใส่คำเชื่อมให้อ่านต่อกันลื่น`
      : undefined,
  });

  const noGap = blocks.reduce((n, b) => n + b.split("\n").filter((l) => l.trim()).length - 1, 0);
  stats.push({
    id: "no-gap",
    label: "ขึ้นบรรทัดแต่ไม่เว้น",
    value: `${noGap} จุด`,
    status: noGap ? "warn" : "pass",
    hint: noGap ? "บนมือถือจะดูติดกัน กดปุ่มเว้นบรรทัดให้ใต้ช่องวางโพสต์ได้เลย" : "ทุกก้อนมีบรรทัดว่างคั่น",
    fix: "เว้นบรรทัดว่างหนึ่งบรรทัดระหว่างทุกก้อน",
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
    fix: "อย่าตั้งคำถามติดกันเกินสองประโยค เปลี่ยนบางข้อเป็นประโยคบอกเล่า",
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
      fix: `เปลี่ยนบรรทัดแรกให้ไม่คล้าย "${quoteStart(best.line)}" ทั้งคำและทรงประโยค`,
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

  const shown: Block[] = allBlocks.map((text) => ({ text, long: longBlocks.includes(text), choppy: choppy.has(text) }));

  return { body, firstLine, findings, highlights: merged, stats, fails, warns, noGap, blocks: shown };
}

/** คำสั่งสั้นๆ ให้วางกลับในแชท Claude เดิม แก้เฉพาะจุดที่ตรวจเจอ */
export function buildFixPrompt(report: CheckReport): string {
  const items: string[] = [];
  for (const f of report.findings) {
    const seen = f.samples.length ? ` เช่น ${f.samples.map((s) => `"${s}"`).join(" ")}` : "";
    items.push(`${f.label}${seen} ▸ ${f.fix}`);
  }
  for (const s of report.stats) {
    if (s.status !== "pass" && s.fix) items.push(`${s.label} (${s.value}) ▸ ${s.fix}`);
  }
  return [
    `แก้โพสต์ที่ขึ้นต้นว่า "${quoteStart(report.firstLine)}" เฉพาะจุดต่อไปนี้ ส่วนอื่นคงไว้ตามเดิม ห้ามเขียนใหม่ทั้งโพสต์`,
    "",
    items.map((t, i) => `${i + 1}. ${t}`).join("\n"),
    "",
    "แก้แล้วส่งกลับมาเฉพาะ [โพสต์] ทั้งโพสต์ฉบับแก้ ไม่ต้องอธิบายว่าแก้อะไร",
  ].join("\n");
}
