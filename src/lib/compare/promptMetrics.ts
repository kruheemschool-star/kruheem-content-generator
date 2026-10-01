import { BAN_RULES, BANNED_ARC } from "../prompt/antiAi";

// เทียบคำสั่งสองเวอร์ชันด้วยการตรวจข้อความจริงของคำสั่ง ไม่ใช่การเขียนบอกเอาเอง

export type Better = "old" | "new" | "same" | null;

export interface Metric {
  id: string;
  label: string;
  hint: string;
  old: string;
  new: string;
  better: Better;
}

// ชื่อเฉพาะและคำที่ไม่ใช่ศัพท์การตลาด ไม่นับเป็นคำอังกฤษ
const ENGLISH_OK = new Set(["claude", "facebook", "vod", "kruheemmath", "com", "a-level", "kru", "heem", "t-a-e-c-m", "vs", "ai"]);
const URL_RE = /https?:\/\/\S+|www\.\S+|\S+\.(?:com|co\.th|net|org|in\.th)\S*/g;

function englishWords(text: string): string[] {
  return (text.replace(URL_RE, " ").match(/[A-Za-z][A-Za-z-]*/g) ?? []).filter((w) => !ENGLISH_OK.has(w.toLowerCase()));
}

/** "forced" = โครงบังคับเปิดด้วย Empathy · "pushed" = สั่งให้เน้นความกังวลของผู้ปกครอง · "none" */
function feelingPush(p: string): "forced" | "pushed" | "none" {
  if (/Empathy\s*→/.test(p)) return "forced";
  if (p.includes("ความกังวลของผู้ปกครอง")) return "pushed";
  return "none";
}

const FEELING_TEXT = {
  forced: "บังคับเปิดด้วยการเข้าใจความรู้สึก (Empathy)",
  pushed: "สั่งให้เน้นความกังวลของผู้ปกครอง",
  none: "ไม่มี",
};

function exampleHooks(p: string): number {
  const line = p.split("\n").find((l) => l.includes("ตัวอย่างที่ดี"));
  return line ? (line.match(/"[^"]+"/g) ?? []).length : 0;
}

// ห้ามทักทายมีทั้งสองเวอร์ชันอยู่แล้ว จึงไม่นับ
function bannedPhrases(p: string): number {
  return BAN_RULES.filter((r) => !r.checkOnly && r.id !== "greet" && p.includes(r.label)).length;
}

function readerConflict(p: string): boolean {
  return p.includes('เรียกคนอ่านว่า "หนูๆ"') && p.includes('"คุณพ่อคุณแม่"');
}

function recentGuard(p: string): number {
  const at = p.indexOf("บรรทัดแรกของโพสต์ก่อนๆ");
  if (at === -1) return 0;
  let n = 0;
  for (const l of p.slice(at).split("\n").slice(1)) {
    if (!l.startsWith('- "')) break;
    n++;
  }
  return n;
}

// หัวข้อย่อยที่ buildPrompt ใส่เฉพาะเมื่อครูตั้งค่าตัวตนไว้
const VOICE_MARKERS = ["ความเชื่อของครูฮีม ใช้เป็นเข็มทิศ", "คำติดปากที่ครูใช้จริง", "สิ่งที่ครูฮีมไม่ทำ:", "ตัวอย่างโพสต์จริงของครูฮีม"];

function hasVoice(p: string): boolean {
  return VOICE_MARKERS.some((m) => p.includes(m));
}

function structureOf(p: string): string {
  const old = p.match(/โครงสร้างบทความ:\s*(.+)/);
  if (old) return old[1].trim();
  const at = p.indexOf("【โครงเรื่อง】");
  if (at !== -1) return p.slice(at).split("\n")[1]?.split("▸")[0].trim() ?? "";
  return "";
}

function yesNo(v: boolean, yes = "มี", no = "ไม่มี"): string {
  return v ? yes : no;
}

/**
 * bare = คำสั่งแบบเดียวกันแต่สร้างโดยไม่มีข้อความของครู (หัวข้อสมมติ ไม่มีรายละเอียด โพสต์ตัวอย่าง คำติดปาก ฯลฯ)
 * ใช้นับคำอังกฤษและตัวเลขเปอร์เซ็นต์ เพื่อไม่นับสิ่งที่ครูพิมพ์เองว่าเป็นของคำสั่ง
 */
export function comparePrompts(oldP: string, newP: string, bare?: { old: string; new: string }): Metric[] {
  const oldBare = bare?.old ?? oldP;
  const newBare = bare?.new ?? newP;
  const oldEn = englishWords(oldBare);
  const newEn = englishWords(newBare);
  const oldHooks = exampleHooks(oldP);
  const newHooks = exampleHooks(newP);
  const oldStats = (oldBare.match(/\d+\s?%/g) ?? []).length;
  const newStats = (newBare.match(/\d+\s?%/g) ?? []).length;
  const oldBans = bannedPhrases(oldP);
  const newBans = bannedPhrases(newP);
  const oldGuard = recentGuard(oldP);
  const newGuard = recentGuard(newP);
  const newBansArc = newP.includes(BANNED_ARC);
  const oldFeel = feelingPush(oldP);
  const newFeel = feelingPush(newP);
  const newEmotionOpening = newP.includes("อารมณ์นำ ▸");
  const oldVoice = hasVoice(oldP);
  const newVoice = hasVoice(newP);

  const pick = (oldBad: boolean, newBad: boolean): Better => (oldBad === newBad ? "same" : oldBad ? "new" : "old");

  return [
    {
      id: "structure",
      label: "โครงเรื่องที่สั่ง",
      hint: "เวอร์ชันเดิมได้โครงเดิมทุกครั้งตามโหมด เวอร์ชันใหม่เปลี่ยนตามแพตเทิร์นที่เลือกหรือสุ่ม",
      old: structureOf(oldP) || "-",
      new: structureOf(newP) || "-",
      better: null,
    },
    {
      id: "feeling",
      label: "ดันให้เข้าแพตเทิร์น กังวล → ปลอบ",
      hint: "แพตเทิร์นที่ผู้ติดตามเริ่มจับได้ว่า AI เขียน: กังวล → ไม่ใช่ความผิด → ชวนอ่านต่อ",
      old: FEELING_TEXT[oldFeel],
      new: newBansArc
        ? newEmotionOpening
          ? "มีวิธีเปิดแบบอารมณ์นำ แต่สั่งห้ามถามว่ากังวลไหมและห้ามปลอบ"
          : "สั่งห้ามโครงนี้ไว้ชัดเจน"
        : FEELING_TEXT[newFeel],
      better: pick(oldFeel !== "none", newFeel !== "none" && !newBansArc),
    },
    {
      id: "hooks",
      label: "ประโยคตัวอย่างที่ Claude มักลอกไปใช้",
      hint: "ตัวอย่างในคำสั่งกลายเป็นแม่พิมพ์ โพสต์เลยเปิดคล้ายกัน",
      old: oldHooks ? `${oldHooks} ประโยค` : "ไม่มี",
      new: newHooks ? `${newHooks} ประโยค` : "ไม่มี",
      better: pick(oldHooks > 0, newHooks > 0),
    },
    {
      id: "stats",
      label: "ตัวเลขเปอร์เซ็นต์ในคำสั่งที่ไม่ได้มาจากครู",
      hint: "Claude มักเลียนแบบการอ้างตัวเลขลอยๆ (ไม่นับตัวเลขที่ครูพิมพ์เอง)",
      old: oldStats ? `${oldStats} จุด` : "ไม่มี",
      new: newStats ? `${newStats} จุด` : "ไม่มี",
      better: pick(oldStats > 0, newStats > 0),
    },
    {
      id: "invent",
      label: "สั่งห้ามแต่งตัวเลข เคสนักเรียน งานวิจัย",
      hint: "กันโพสต์มีเรื่องแต่งที่ผู้ปกครองจับได้",
      old: yesNo(oldP.includes("ห้ามแต่งตัวเลข"), "สั่งห้าม", "ไม่ได้สั่ง"),
      new: yesNo(newP.includes("ห้ามแต่งตัวเลข"), "สั่งห้าม", "ไม่ได้สั่ง"),
      better: pick(!oldP.includes("ห้ามแต่งตัวเลข"), !newP.includes("ห้ามแต่งตัวเลข")),
    },
    {
      id: "bans",
      label: "สำนวน AI ที่สั่งห้าม (ไม่นับห้ามทักทาย ซึ่งมีทั้งสองเวอร์ชัน)",
      hint: "เช่น ความจริงคือ ท้ายที่สุดแล้ว ไม่ใช่ความผิดของคุณ",
      old: `${oldBans} รายการ`,
      new: `${newBans} รายการ`,
      better: oldBans === newBans ? "same" : oldBans > newBans ? "old" : "new",
    },
    {
      id: "english",
      label: "คำภาษาอังกฤษในคำสั่ง",
      hint: "ศัพท์การตลาดอังกฤษดึงให้ Claude เขียนเหมือนนักการตลาด (ไม่นับชื่อเฉพาะ ลิงก์ และข้อความที่ครูพิมพ์หรือตั้งเอง)",
      old: `${oldEn.length} คำ`,
      new: `${newEn.length} คำ`,
      better: oldEn.length === newEn.length ? "same" : oldEn.length < newEn.length ? "old" : "new",
    },
    {
      id: "reader",
      label: "เรียกผู้อ่านขัดกันเอง",
      hint: "สั่งให้เรียกหนูๆ และคุณพ่อคุณแม่ในคำสั่งเดียวกัน",
      old: yesNo(readerConflict(oldP), "ขัดกัน", "ไม่ขัด"),
      new: yesNo(readerConflict(newP), "ขัดกัน", "ไม่ขัด"),
      better: pick(readerConflict(oldP), readerConflict(newP)),
    },
    {
      id: "repeat",
      label: "กันเปิดซ้ำกับโพสต์ก่อนๆ",
      hint: newGuard ? "" : "บันทึกบรรทัดแรกได้ในเวอร์ชันใหม่ แท็บตรวจบทความ",
      old: oldGuard ? `กัน ${oldGuard} บรรทัด` : "ไม่มี",
      new: newGuard ? `กัน ${newGuard} บรรทัด` : "ยังไม่ได้บันทึกบรรทัดแรก",
      better: oldGuard === newGuard ? "same" : newGuard > oldGuard ? "new" : "old",
    },
    {
      id: "voice",
      label: "ตัวตนเฉพาะของครูฮีม",
      hint: newVoice ? "" : "ตั้งได้ในเวอร์ชันใหม่ แท็บตัวตนครูฮีม",
      old: oldVoice ? "มี" : "บุคลิกครูทั่วไป",
      new: newVoice ? "ตั้งตัวตนไว้แล้ว (ความเชื่อ คำติดปาก สิ่งที่ไม่ทำ หรือโพสต์จริง)" : "ยังไม่ได้ตั้งค่า",
      better: pick(!oldVoice, !newVoice),
    },
    {
      id: "selfcheck",
      label: "ให้ Claude ตรวจงานตัวเองก่อนส่ง",
      hint: "",
      old: yesNo(oldP.includes("ตรวจเอง"), "มี", "ไม่มี"),
      new: yesNo(newP.includes("ตรวจเอง"), "มี", "ไม่มี"),
      better: pick(!oldP.includes("ตรวจเอง"), !newP.includes("ตรวจเอง")),
    },
    {
      id: "length",
      label: "ความยาวคำสั่ง",
      hint: "ยาวกว่าแปลว่ากำกับละเอียดกว่า ไม่ได้แปลว่าดีกว่าเสมอ ครูแค่ก๊อปไปวาง",
      old: `${oldP.length.toLocaleString("th-TH")} ตัวอักษร`,
      new: `${newP.length.toLocaleString("th-TH")} ตัวอักษร`,
      better: null,
    },
  ];
}
