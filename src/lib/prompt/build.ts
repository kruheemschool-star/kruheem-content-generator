import { BAN_RULES, BANNED_ARC, HUMAN_TEXTURE } from "./antiAi";
import { DEFAULT_VOICE } from "./defaults";
import {
  ANALOGY_SOURCES,
  ARCS,
  AUTO_OPENING,
  BELIEF_OPTIONS,
  CTAS,
  DEPTHS,
  DONT_OPTIONS,
  EMOJI_LEVELS,
  ENDINGS,
  EXTRAS,
  FORMATS,
  LENGTHS,
  NEED_QUESTIONS,
  OPENINGS,
  PARENT_TYPES,
  TIMINGS,
  TONES,
  byId,
  endingFits,
} from "./options";
import { hasNeed } from "./randomize";
import type { BuilderConfig, Material, Need, PatternOption, VoiceProfile } from "./types";

export type OpeningMode = "single" | "choose" | "versions";

export interface BuildResult {
  prompt: string;
  openingMode: OpeningMode;
  openingIds: string[];
  /** แพตเทิร์นที่อยากได้ข้อมูลจริงแต่ครูไม่ได้ให้ (คำสั่งจะใช้แบบภาพรวมแทน) */
  unmet: Need[];
  interviewing: boolean;
  notes: string[];
}

const MAX_SAMPLE_POSTS = 3;
const MAX_SAMPLE_CHARS = 2500;
const MAX_RECENT_OPENINGS = 6;

export function resolveOpenings(cfg: BuilderConfig): { mode: OpeningMode; ids: string[] } {
  const extra = cfg.extraOpenings;
  if (cfg.versions === 3) {
    const ids = cfg.opening === AUTO_OPENING ? extra.slice(0, 3) : [cfg.opening, ...extra.filter((id) => id !== cfg.opening).slice(0, 2)];
    return { mode: "versions", ids };
  }
  if (cfg.opening === AUTO_OPENING) return { mode: "choose", ids: extra.slice(0, 3) };
  return { mode: "single", ids: [cfg.opening] };
}

function lines(items: string[]): string {
  return items.map((s) => `- ${s}`).join("\n");
}

function section(title: string, body: string): string {
  return `【${title}】\n${body.trim()}`;
}

function splitList(text: string): string[] {
  return text
    .split("\n")
    .map((s) => s.replace(/^\s*(?:[-•*]|\d+[.)])\s*/, "").trim())
    .filter(Boolean);
}

function splitPosts(text: string): string[] {
  return text
    .split(/\n\s*-{3,}\s*\n/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, MAX_SAMPLE_POSTS)
    .map((s) => (s.length > MAX_SAMPLE_CHARS ? s.slice(0, MAX_SAMPLE_CHARS) + " …" : s));
}

function fill(text: string, products: string): string {
  return text.replaceAll("{products}", products);
}

function describe(o: PatternOption, products: string, material: Material): string {
  if (o.needs && o.fallback) {
    if (!hasNeed(material, o)) return `${o.label} ▸ ${fill(o.fallback, products)}`;
    return `${o.label} ▸ ${fill(o.instruction, products)} ถ้าข้อมูลของครูไม่มีสิ่งที่ต้องใช้ ให้ทำแบบนี้แทน: ${fill(o.fallback, products)}`;
  }
  return `${o.label} ▸ ${fill(o.instruction, products)}`;
}

function collectNeeds(cfg: BuilderConfig, mode: OpeningMode, openingIds: string[]): Need[] {
  const needs = new Set<Need>();
  // โหมดให้ Claude เลือก จะเลือกแบบที่ข้อมูลของครูรองรับเอง ไม่ต้องบังคับถาม
  if (mode !== "choose") {
    for (const id of openingIds) {
      const n = byId(OPENINGS, id)?.needs;
      if (n) needs.add(n);
    }
  }
  const arcNeed = byId(ARCS, cfg.arc)?.needs;
  if (arcNeed) needs.add(arcNeed);
  for (const id of cfg.extras) {
    const n = byId(EXTRAS, id)?.needs;
    if (n) needs.add(n);
  }
  return [...needs];
}

export function buildPrompt(cfg: BuilderConfig, voiceIn: VoiceProfile, recentOpenings: string[]): BuildResult {
  const voice = { ...voiceIn, products: voiceIn.products.trim() || DEFAULT_VOICE.products };
  const products = voice.products.trim();
  const selfName = voice.selfName.trim() || DEFAULT_VOICE.selfName;
  const studentCall = voice.studentCall.trim() || DEFAULT_VOICE.studentCall;
  const isParent = cfg.audience === "parent";
  const readerCall = isParent ? "คุณพ่อคุณแม่" : studentCall;
  const topic = cfg.topic.trim();

  const { mode: openingMode, ids: openingIds } = resolveOpenings(cfg);
  const needs = collectNeeds(cfg, openingMode, openingIds);
  const unmet = needs.filter((n) => !hasNeed(cfg.material, { needs: n }));
  const interviewing = cfg.interview;
  const notes: string[] = [];

  const arc = byId(ARCS, cfg.arc)!;
  const ending = byId(ENDINGS, cfg.ending)!;
  if (!endingFits(ending, openingIds)) {
    notes.push(`วิธีปิด "${ending.label}" ต้องมีฉาก คำพูด หรือโจทย์ตอนเปิดให้ย้อนกลับไปหา วิธีเปิดที่เลือกไว้ไม่มีสิ่งนี้`);
  }
  if (cfg.ctas.includes("comment") && cfg.ending === "question") {
    notes.push("วิธีปิดเป็นคำถามอยู่แล้ว คำสั่งจะให้ใช้คำถามนั้นเป็นคำชวนคอมเมนต์ไปเลย");
  }

  const parts: string[] = [];

  // ── หัวงาน ──
  const reader = isParent
    ? `คุณพ่อคุณแม่${cfg.grade ? `ที่ลูกเรียนอยู่ชั้น ${cfg.grade}` : ""}`
    : `นักเรียน${cfg.grade ? `ชั้น ${cfg.grade}` : ""}`;
  const what = cfg.versions === 3 ? "โพสต์ Facebook 3 เวอร์ชันให้ครูเลือก" : "โพสต์ Facebook หนึ่งโพสต์";
  parts.push(
    `งานนี้คือเขียน${what}ในนามครูฮีม เรื่อง "${topic}" ถึง${reader}\n` +
      "อ่านคำสั่งให้ครบก่อนเริ่ม ถ้ามีสองข้อที่ดูขัดกัน ให้ยึดกติกาข้อมูลจริงกับรายการห้ามเป็นหลัก",
  );

  // ── ขั้นสัมภาษณ์ (ครูเลือกเปิดเอง) ──
  if (interviewing) {
    const wanted = needs.filter((n): n is Exclude<Need, "timing"> => n !== "timing");
    const rest = (Object.keys(NEED_QUESTIONS) as Exclude<Need, "timing">[]).filter((n) => !wanted.includes(n));
    const asks = [...wanted, ...rest].map((n) => NEED_QUESTIONS[n]);
    parts.push(
      section(
        "ขั้นที่ 1 ถามครูก่อน ยังไม่ต้องเขียนโพสต์",
        "ครูอยากให้โพสต์นี้ลึกและมีเรื่องจริงของครูฮีม ขั้นแรกให้ถามครูสั้นๆ 3–5 ข้อในข้อความเดียว ตอบง่าย ตอบแบบพูดได้ แล้วหยุดรอคำตอบ\n" +
          `เลือกถามจากรายการนี้ ข้อต้นๆ สำคัญกว่า และข้ามข้อที่ครูให้มาแล้วในข้อมูลจริง:\n${lines(asks)}\n` +
          "เมื่อครูตอบแล้ว ค่อยทำขั้นที่ 2 คือเขียนโพสต์ตามคำสั่งทั้งหมดข้างล่าง ถ้าครูข้ามคำถามไหน ให้เขียนโดยไม่ใช้ส่วนนั้น ห้ามแต่งแทน",
      ),
    );
  }

  // ── ตัวตน ──
  const who: string[] = [
    `คุณจะเขียนในนามครูฮีมเอง ใช้มุมมองบุคคลที่หนึ่ง ครูฮีมสอนคณิตศาสตร์ ม.1–ม.6 มีคุณพ่อคุณแม่และนักเรียนติดตามเพจจำนวนมาก และเป็นเจ้าของ ${products}`,
    `เรียกตัวเองว่า "${selfName}" เป็นหลัก`,
    voice.particle.trim()
      ? `ลงท้ายด้วย "${voice.particle.trim()}" แบบคนพูดจริง ไม่ต้องทุกประโยค`
      : "ไม่ต้องใส่คำลงท้ายสุภาพ",
  ];
  const beliefs = [
    ...BELIEF_OPTIONS.filter((b) => voice.beliefIds.includes(b.id)).map((b) => b.label),
    ...splitList(voice.beliefs),
  ];
  if (beliefs.length) who.push(`ความเชื่อของครูฮีม ใช้เป็นเข็มทิศของเนื้อหา ไม่ต้องยกมาพูดตรงๆ ทุกข้อ:\n${lines(beliefs)}`);
  const catchphrases = splitList(voice.catchphrases);
  if (catchphrases.length) who.push(`คำติดปากที่ครูใช้จริง ใส่ได้หนึ่งหรือสองคำถ้าเข้ากับจังหวะ ไม่ต้องใช้ครบ:\n${lines(catchphrases)}`);
  const donts = [
    ...DONT_OPTIONS.filter((d) => voice.dontIds.includes(d.id)).map((d) => d.label),
    ...splitList(voice.donts),
  ];
  if (donts.length) who.push(`สิ่งที่ครูฮีมไม่ทำ:\n${lines(donts)}`);
  parts.push(section("ครูฮีมคือใคร", who.join("\n")));

  // ── ผู้อ่าน ──
  const readerLines: string[] = isParent
    ? [
        "ผู้อ่านคือคุณพ่อคุณแม่ ไม่ใช่ตัวนักเรียน",
        'เรียกผู้อ่านว่า "คุณพ่อคุณแม่" ทุกครั้ง ห้ามใช้คำว่า "คุณ" คำเดียวเรียกผู้อ่าน',
        'เรียกเด็กว่า "ลูก"',
        "คุณพ่อคุณแม่อ่านตอนไถฟีดระหว่างวัน อยากได้สิ่งที่เข้าใจทันทีและเอาไปทำกับลูกได้จริง ไม่ได้ต้องการคำปลอบใจลอยๆ",
      ]
    : [
        `ผู้อ่านคือนักเรียน${cfg.grade ? `ชั้น ${cfg.grade}` : ""}`,
        `เรียกผู้อ่านว่า "${studentCall}"`,
        "พูดเหมือนครูที่นั่งคุยกับเด็กหลังคาบ เป็นกันเองแต่ไม่แกล้งทำเป็นวัยรุ่น ไม่ใช้คำแสลงที่ครูไม่ได้ใช้จริง",
      ];
  if (isParent && cfg.grade) readerLines.push(`ลูกเรียนอยู่ชั้น ${cfg.grade} ใช้เนื้อหาและตัวอย่างที่ตรงกับชั้นนี้`);
  const pt = isParent && cfg.parentType ? byId(PARENT_TYPES, cfg.parentType) : undefined;
  if (pt) readerLines.push(`ผู้อ่านโพสต์นี้คือ${pt.instruction} เขียนให้คนกลุ่มนี้รู้สึกว่าโพสต์นี้เขียนถึงเขาโดยตรง`);
  parts.push(section("เขียนให้ใครอ่าน", lines(readerLines)));

  // ── ข้อมูลจริง ──
  const facts: string[] = [];
  if (cfg.material.detail.trim()) facts.push(`รายละเอียดจากครู: ${cfg.material.detail.trim()}`);
  const timing = cfg.material.timing ? byId(TIMINGS, cfg.material.timing) : undefined;
  if (timing) facts.push(`ช่วงเวลาตอนนี้: ${timing.instruction}`);
  if (cfg.material.frequent) {
    facts.push("ครูยืนยันว่าเจอปัญหานี้กับนักเรียนบ่อยจริง พูดได้ว่าครูเห็นบ่อย แต่ห้ามใส่จำนวนหรือเคสเฉพาะที่ครูไม่ได้เล่า");
  }
  const materialBody = facts.length
    ? lines(facts) + "\nครูพิมพ์มาแบบพูด เก็บรายละเอียดจริงไว้ให้ครบ แต่เรียบเรียงใหม่เป็นภาษาของโพสต์ได้"
    : interviewing
      ? "ครูยังไม่ได้ให้ข้อมูล จะได้จากคำตอบในขั้นที่ 1"
      : "ครูไม่ได้ให้ข้อมูลเพิ่ม ให้เขียนจากความรู้คณิตศาสตร์และภาพรวมเท่านั้น ห้ามเล่าเหตุการณ์หรือเคสเฉพาะเหมือนครูเจอมาเอง";
  parts.push(
    section(
      "ข้อมูลจริงจากครูฮีม",
      materialBody +
        "\n\nกติกาข้อมูล (สำคัญที่สุด): ใช้ข้อเท็จจริงเฉพาะที่อยู่ในข้อมูลของครู หรือความรู้คณิตศาสตร์ที่ถูกต้อง ห้ามแต่งตัวเลขสถิติ เปอร์เซ็นต์ งานวิจัย ชื่อคน ชื่อโรงเรียน ผลสอบ หรือเหตุการณ์ในห้องเรียนที่ครูไม่ได้เล่า ถ้าต้องพูดถึงเด็ก ให้พูดแบบภาพรวม เช่น เด็กหลายคน แทนการแต่งเคส ถ้าไม่แน่ใจว่าข้อมูลไหนจริง ให้ตัดทิ้ง\n" +
        "เหตุผล: ผู้ติดตามของครูเป็นผู้ปกครองที่ไว้ใจครู ถ้าเจอเรื่องแต่งแม้แต่ครั้งเดียว ความน่าเชื่อถือจะหายทั้งเพจ",
    ),
  );

  // ── วิธีเปิด ──
  const openings = openingIds.map((id) => byId(OPENINGS, id)!).filter(Boolean);
  let openingBody: string;
  if (openingMode === "single") {
    openingBody = describe(openings[0], products, cfg.material);
  } else if (openingMode === "choose") {
    openingBody =
      "เลือกหนึ่งแบบจากสามแบบนี้ ที่ข้อมูลของครูรองรับและเข้ากับเรื่องที่สุด\n" +
      openings.map((o, i) => `${i + 1}. ${describe(o, products, cfg.material)}`).join("\n");
  } else {
    openingBody = openings.map((o, i) => `เวอร์ชัน ${i + 1} เปิดแบบ ${describe(o, products, cfg.material)}`).join("\n");
  }
  openingBody += "\nไม่ว่าเปิดแบบไหน ห้ามทักทาย ห้ามแนะนำตัว ห้ามเกริ่นว่าโพสต์นี้จะพูดเรื่องอะไร";
  const recent = recentOpenings.map((s) => s.trim()).filter(Boolean).slice(0, MAX_RECENT_OPENINGS);
  if (recent.length) {
    openingBody += `\n\nบรรทัดแรกของโพสต์ก่อนๆ ของครู ห้ามเปิดด้วยคำ ทรงประโยค หรือจังหวะแบบเดียวกับบรรทัดเหล่านี้:\n${lines(recent.map((s) => `"${s}"`))}`;
  }
  parts.push(section("วิธีเปิดโพสต์", openingBody));

  // ── โครงเรื่อง / วิธีปิด ──
  parts.push(
    section(
      "โครงเรื่อง",
      `${describe(arc, products, cfg.material)}\nนี่คือทิศทางของเรื่อง ไม่ใช่หัวข้อ ห้ามเขียนชื่อช่วงเป็นหัวข้อ สัดส่วนของแต่ละช่วงปรับตามเนื้อหาได้`,
    ),
  );
  parts.push(section("วิธีปิดโพสต์", describe(ending, products, cfg.material)));

  // ── น้ำเสียง ความลึก เทคนิค ──
  const tone1 = byId(TONES, cfg.tonePrimary)!;
  const tone2 = cfg.toneSecondary && cfg.toneSecondary !== cfg.tonePrimary ? byId(TONES, cfg.toneSecondary) : undefined;
  const depth = byId(DEPTHS, cfg.depth)!;
  const style: string[] = [`น้ำเสียงหลัก ${tone1.label} ▸ ${tone1.instruction}`];
  if (tone2) style.push(`ผสมน้ำเสียง ${tone2.label} เบาๆ ▸ ${tone2.instruction}`);
  style.push(`ความลึก ${depth.label} ▸ ${depth.instruction}`);
  const analogy = cfg.analogy ? byId(ANALOGY_SOURCES, cfg.analogy) : undefined;
  if (analogy) {
    style.push(
      `อุปมา ▸ ใช้อุปมาหนึ่งอย่างจาก${analogy.instruction} ที่เทียบกับเรื่องนี้ได้จริงทุกส่วน ใช้ครั้งเดียวให้คม ถ้าเทียบแล้วไม่ตรง ให้ตัดทิ้งดีกว่าฝืน`,
    );
  }
  for (const id of cfg.extras) {
    const x = byId(EXTRAS, id);
    if (x) style.push(describe(x, products, cfg.material));
  }
  parts.push(section("น้ำเสียงและความลึก", lines(style)));

  // ── ความยาว หน้าตา ──
  parts.push(
    section(
      "ความยาวและหน้าตา",
      lines([
        `ความยาว ▸ ${byId(LENGTHS, cfg.length)!.instruction}${cfg.versions === 3 ? " ต่อเวอร์ชัน" : ""}`,
        `การจัดบรรทัด ▸ ${byId(FORMATS, cfg.format)!.instruction}`,
        `อีโมจิ ▸ ${byId(EMOJI_LEVELS, cfg.emoji)!.instruction}`,
        "ภาษาไทยทั้งหมด ไม่ใช้คำภาษาอังกฤษในโพสต์",
      ]),
    ),
  );

  // ── เสียงครูฮีม ──
  const voiceLines = [
    `คำว่า "ครูฮีม" เต็มๆ ให้มี 2–4 ครั้งทั้งโพสต์ วางคนละตำแหน่ง บางครั้งต้นประโยค บางครั้งกลางหรือท้าย ที่เหลือใช้ "${selfName}" หรือละประธานตามภาษาพูด`,
    "ครูพูดเมื่อมีอะไรจะพูดจริงๆ ตรงไหนที่ครูตัวจริงจะเงียบ ก็ไม่ต้องใส่เสียงครู",
    "ห้ามอ้างจำนวนปีที่สอน ถ้าอยากแสดงประสบการณ์ ให้เล่าเหตุการณ์เฉพาะหนึ่งเรื่องแทน",
    "ท่าที่เข้ากับโพสต์แบบนี้ คือเล่าสิ่งที่ครูเห็นมากับตาในฐานะพยาน ให้กำลังใจแบบมีเหตุผลรองรับ และอุปมาที่เทียบได้จริง",
    "ใช้คำพูดแทนภาษาเขียน ก่อนส่งให้ลองอ่านออกเสียงในใจ ถ้าครูไม่พูดแบบนี้จริง ให้เขียนใหม่",
  ];
  let voiceBody = lines(voiceLines);
  const samples = splitPosts(voice.samplePosts);
  if (samples.length) {
    voiceBody +=
      "\n\nตัวอย่างโพสต์จริงของครูฮีมด้านล่าง ใช้จับจังหวะการพูด ความยาวประโยค และระดับภาษาเท่านั้น ห้ามลอกประโยค ห้ามลอกโครงเรื่อง ห้ามลอกวิธีเปิด\n" +
      samples.map((s, i) => `<<< โพสต์จริงที่ ${i + 1}\n${s}\n>>>`).join("\n");
  }
  parts.push(section("เสียงครูฮีม", voiceBody));

  // ── รายการห้าม ──
  const groups = new Map<string, string[]>();
  for (const r of BAN_RULES) {
    if (r.checkOnly) continue;
    const g = groups.get(r.group) ?? [];
    g.push(`${r.label} ▸ ${r.fix}`);
    groups.set(r.group, g);
  }
  const structural = [
    "ตั้งคำถามติดกันเกินสองประโยค",
    "ใส่อีโมจิไว้หัวย่อหน้า",
    "จัดทุกอย่างเป็นกลุ่มละสามข้อ",
  ];
  let banBody =
    "ผู้ติดตามของครูอ่านโพสต์มาเยอะจนจำทรงของ AI ได้แล้ว สิ่งต่อไปนี้ห้ามใช้ ถ้าเผลอเขียนออกมาให้เปลี่ยนตามวิธีที่บอก\n\n" +
    `โครงที่ห้ามใช้เด็ดขาด ▸ ${BANNED_ARC}\n`;
  for (const [g, items] of groups) banBody += `\n${g}\n${lines(items)}`;
  banBody += `\nทรงของโพสต์\n${lines(structural)}`;
  parts.push(section("ห้ามใช้ เพราะทำให้คนจับได้ว่า AI เขียน", banBody));
  parts.push(section("ทำแบบนี้แทน", lines(HUMAN_TEXTURE)));

  // ── คำชวนท้ายโพสต์ ──
  const ctas = cfg.ctas.map((id) => byId(CTAS, id)).filter((c): c is NonNullable<typeof c> => !!c);
  parts.push(
    section(
      "คำชวนท้ายโพสต์",
      ctas.length
        ? `ใส่คำชวนต่อท้ายโพสต์ รวมกันไม่เกินสองบรรทัด เขียนเป็นภาษาพูดธรรมดา\n${lines(ctas.map((c) => c.instruction))}` +
            (cfg.ending === "question" && cfg.ctas.includes("comment")
              ? "\nวิธีปิดเป็นคำถามอยู่แล้ว ให้ใช้คำถามนั้นเป็นคำชวนคอมเมนต์ ไม่ต้องถามซ้ำ"
              : "")
        : "ไม่ต้องมีคำชวนให้ทำอะไรท้ายโพสต์ จบตามวิธีปิดที่กำหนด",
    ),
  );

  // ── รูปแบบที่ส่งกลับ ──
  const headlineRule =
    "ห้ามคำโฆษณาเกินจริง เช่น ห้ามพลาด ต้องรู้ เปลี่ยนชีวิต สูตรลับ ความลับที่ไม่มีใครบอก";
  const outputBody =
    cfg.versions === 3
      ? "ข้อความล้วนที่ก๊อปลง Facebook บนมือถือได้ทันที ห้ามใช้ Markdown ห้ามตัวหนา ห้ามเครื่องหมาย # หน้าหัวข้อ ห้าม bullet หรือเลขข้อในตัวโพสต์ ห้ามตาราง\n" +
        "แบ่งเป็นส่วนตามนี้ แต่ละป้ายอยู่ในวงเล็บเหลี่ยมบรรทัดของมันเอง\n" +
        "[เวอร์ชัน 1] แล้วตามด้วย [หัวข้อ] หนึ่งบรรทัด และ [โพสต์] เนื้อโพสต์ทั้งหมดรวมคำชวนท้ายโพสต์\n" +
        "[เวอร์ชัน 2] และ [เวอร์ชัน 3] ทำแบบเดียวกัน\n" +
        "[แฮชแท็ก] ท้ายสุดครั้งเดียว 2–4 อัน ภาษาไทย ต้องมี #ครูฮีม\n" +
        `หัวข้อของสามเวอร์ชันต้องใช้วิธีต่างกัน ${headlineRule} ทั้งสามเวอร์ชันใช้โครงเรื่องและวิธีปิดตามที่กำหนด แต่ห้ามใช้ประโยคซ้ำกัน`
      : "ข้อความล้วนที่ก๊อปลง Facebook บนมือถือได้ทันที ห้ามใช้ Markdown ห้ามตัวหนา ห้ามเครื่องหมาย # หน้าหัวข้อ ห้าม bullet หรือเลขข้อในตัวโพสต์ ห้ามตาราง\n" +
        "แบ่งเป็นส่วนตามนี้ แต่ละป้ายอยู่ในวงเล็บเหลี่ยมบรรทัดของมันเอง\n" +
        `[หัวข้อ] 3 แบบ บรรทัดละแบบ แต่ละแบบใช้วิธีต่างกัน แบบแรกใช้ตัวเลขหรือข้อเท็จจริงจากเรื่อง แบบที่สองเป็นคำถาม แบบที่สามเป็นประโยคบอกเล่าที่สรุปใจความหรือค้านความเชื่อ ${headlineRule}\n` +
        "[โพสต์] เนื้อโพสต์ทั้งหมด รวมคำชวนท้ายโพสต์\n" +
        "[แฮชแท็ก] 2–4 อัน ภาษาไทย ต้องมี #ครูฮีม";
  parts.push(section("สิ่งที่ต้องส่งกลับ", outputBody));

  // ── ตรวจเอง ──
  const checks = [
    "บรรทัดแรกใช้วิธีเปิดที่กำหนด และไม่คล้ายบรรทัดแรกของโพสต์ก่อนๆ",
    "ไม่มีคำหรือทรงประโยคในรายการห้าม โดยเฉพาะโครงความกังวล แล้วบอกว่าไม่ใช่ความผิด แล้วชวนอ่านต่อ",
    "ไม่มีตัวเลข เคส คำพูด หรืองานวิจัยที่ครูไม่ได้ให้มา",
    `เรียกผู้อ่านว่า "${readerCall}" ถูกทุกครั้ง`,
    'คำว่า "ครูฮีม" มี 2–4 ครั้ง',
    "ย่อหน้ายาวไม่เท่ากัน และไม่ได้จบทุกย่อหน้าด้วยประโยคคม",
    "ไม่มี Markdown และไม่มีขีดยาว",
  ];
  parts.push(
    section(
      interviewing ? "ก่อนส่งโพสต์ในขั้นที่ 2 ตรวจเอง" : "ก่อนส่ง ตรวจเอง",
      "ตรวจทีละข้อ ข้อไหนไม่ผ่านให้แก้ก่อนส่ง\n" +
        checks.map((c, i) => `${i + 1}. ${c}`).join("\n") +
        "\nส่งกลับมาเฉพาะงาน ไม่ต้องอธิบายว่าใช้เทคนิคอะไร ไม่ต้องรายงานผลการตรวจ",
    ),
  );

  return {
    prompt: parts.join("\n\n"),
    openingMode,
    openingIds,
    unmet,
    interviewing,
    notes,
  };
}
