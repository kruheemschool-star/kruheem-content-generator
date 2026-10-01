// ตัดหัวข้อแนะนำและแฮชแท็กออก ให้โพสต์จากทั้งสองเวอร์ชันถูกตรวจเฉพาะเนื้อโพสต์ (รวมคำชวนท้ายโพสต์) เหมือนกัน
// เวอร์ชันใหม่ส่งกลับเป็น [หัวข้อ] [โพสต์] [แฮชแท็ก] ส่วนเวอร์ชันเดิมเป็น [หัวข้อแนะนำ] [เนื้อหาบทความ] [Call to Action] [Hashtags]
// Claude วางป้ายไม่เป๊ะทุกครั้ง (มีอีโมจินำ ตัวหนา ต่อท้าย "3 ตัวเลือก" มีโคลอน ไม่มีวงเล็บ) จึงต้องรับหลายทรง
// แต่ต้องไม่หลงคิดว่าประโยคในเนื้อโพสต์ที่ขึ้นต้นด้วย "หัวข้อ:" หรือ "เนื้อหา:" เป็นป้าย

type Kind = "headline" | "body" | "cta" | "hashtags" | "version";

// ป้ายที่ไม่มีทางเป็นประโยคธรรมดา
const CLEAR = "หัวข้อแนะนำ|เนื้อหาบทความ|call\\s*to\\s*action|hashtags?|แฮชแท็ก|เวอร์ชัน(?:ที่)?\\s*\\d+";
// คำที่อาจเป็นได้ทั้งป้ายและต้นประโยค รับเป็นป้ายเฉพาะตอนอยู่ในวงเล็บ หรืออยู่โดดๆ ทั้งบรรทัด
const AMBIG = "หัวข้อ|เนื้อหา|โพสต์";
const DESC = "(?:\\s*\\(?\\s*\\d+\\s*(?:ตัวเลือก|แบบ|ข้อ|อัน)\\s*\\)?)?";
// อีโมจินำหน้าป้าย รวมแบบปุ่มตัวเลข/สัญลักษณ์อย่าง #️⃣ (ต้องมี \\u20E3 จึงไม่ชนกับแฮชแท็กจริง)
const DECO_START = "^[\\s*_>•\\-–—|]*(?:(?:\\p{Extended_Pictographic}|[#*0-9]\\uFE0F?\\u20E3)\\uFE0F?\\s*)*[\\s*_]*";
const DECO_END = "[\\s*_]*";

const BRACKETED = new RegExp(`${DECO_START}\\[\\s*(${CLEAR}|${AMBIG})${DESC}\\s*\\]${DECO_END}:?\\s*(.*)$`, "iu");
const PLAIN_CLEAR = new RegExp(`${DECO_START}(${CLEAR})${DESC}${DECO_END}(?::\\s*(.*))?$`, "iu");
const PLAIN_AMBIG = new RegExp(`${DECO_START}(${AMBIG})${DECO_END}:?\\s*$`, "iu");

function kindOf(label: string): Kind {
  const l = label.trim().toLowerCase();
  if (l.startsWith("หัวข้อ")) return "headline";
  if (l.startsWith("โพสต์") || l.startsWith("เนื้อหา")) return "body";
  if (l.startsWith("call")) return "cta";
  if (l.startsWith("hashtag") || l.startsWith("แฮชแท็ก")) return "hashtags";
  return "version";
}

interface Section {
  kind: Kind | "preamble";
  lines: string[];
}

function parse(src: string): Section[] {
  const lines = src.split("\n");
  const usesBrackets = lines.some((l) => BRACKETED.test(l));
  const out: Section[] = [{ kind: "preamble", lines: [] }];
  for (const line of lines) {
    const current = out[out.length - 1];
    let m = line.match(BRACKETED) ?? line.match(PLAIN_CLEAR);
    // ถ้าโพสต์ใช้ป้ายแบบวงเล็บ คำโดดๆ อย่าง "เนื้อหา" ในเนื้อโพสต์ไม่ใช่ป้าย
    if (!m && !(usesBrackets && current.kind === "body")) m = line.match(PLAIN_AMBIG);
    if (m) {
      out.push({ kind: kindOf(m[1]), lines: m[2] ? [m[2]] : [] });
    } else {
      current.lines.push(line);
    }
  }
  return out;
}

const HASHTAG_LINE = /^\s*(?:#\S+\s*)+$/;
const ITEM = /^\s*(?:\d+[.)]|[-•*])\s/;

/** ตัดเฉพาะรายการหัวข้อช่วงแรกที่ติดกัน (ข้ามบรรทัดว่างด้านบน) รายการที่อยู่ในเนื้อโพสต์ทีหลังไม่แตะ */
function dropLeadingItems(lines: string[], min: number, max = Infinity): string[] {
  let i = 0;
  while (i < lines.length && !lines[i].trim()) i++;
  let j = i;
  while (j < lines.length && ITEM.test(lines[j])) j++;
  const run = j - i;
  if (run < min || run > max) return lines;
  if (!lines.slice(j).some((l) => l.trim())) return lines; // ไม่มีอะไรต่อจากรายการ แปลว่ารายการคือเนื้อ
  return lines.slice(j);
}

export function postBody(text: string): string {
  const sections = parse(text.replace(/\r\n/g, "\n"));
  const hasLabels = sections.length > 1;
  const nonEmpty = (s: Section) => s.lines.some((l) => l.trim());
  let picked: Section[];
  const firstBody = sections.findIndex((s) => s.kind === "body" && nonEmpty(s));
  if (firstBody !== -1) {
    // เอาเนื้อโพสต์ก้อนแรก (ถ้ามีหลายเวอร์ชันจะตรวจเวอร์ชันแรก) และคำชวนท้ายโพสต์ที่ตามมาทันที
    picked = [sections[firstBody]];
    const next = sections[firstBody + 1];
    if (next?.kind === "cta") picked.push(next);
  } else if (hasLabels) {
    // มีป้ายแต่ไม่มีป้ายเนื้อโพสต์ เนื้อมักต่อท้ายหัวข้อแนะนำ จึงตัดแค่รายการหัวข้อช่วงแรก แล้วเก็บที่เหลือ
    picked = sections
      .filter((s) => s.kind !== "hashtags" && s.kind !== "version")
      .map((s) => (s.kind === "headline" ? { ...s, lines: dropLeadingItems(s.lines, 1) } : s));
  } else {
    // ไม่มีป้ายเลย ถ้าบนสุดเป็นรายการ 2–5 บรรทัดแล้วมีเนื้อต่อ ถือว่าเป็นหัวข้อแนะนำ
    picked = [{ kind: "preamble", lines: dropLeadingItems(sections[0].lines, 2, 5) }];
  }
  return picked
    .map((s) => s.lines.join("\n").trim())
    .filter(Boolean)
    .join("\n\n")
    .split("\n")
    .filter((l) => !HASHTAG_LINE.test(l))
    .join("\n")
    .trim();
}
