"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Copy,
  Check,
  BookOpen,
  Target,
  Zap,
  FileText,
  BookMarked,
  Wand2,
  MessageSquare,
  Share2,
  Bookmark,
  UserPlus,
  Link,
  Heart,
  Users,
  GraduationCap,
  Flame,
  Film,
  Tv,
  Atom,
  AlignJustify,
  AlignLeft,
  Calculator,
  Pencil,
  AlertTriangle,
  Brain,
  PlayCircle,
  Trophy,
} from "lucide-react";

type Mode = "Math Explainer" | "Study & Motivation";

interface ToneOption {
  value: string;
  emoji: string;
  label: string;
  desc: string;
}

interface CTAOption {
  value: string;
  icon: React.ReactNode;
  label: string;
}

export default function PromptBuilderPage() {
  const [topic, setTopic] = useState("");
  const [mode, setMode] = useState<Mode>("Math Explainer");
  const [selectedTones, setSelectedTones] = useState<string[]>(["อบอุ่น"]);
  const [length, setLength] = useState<string>("ปานกลาง");
  const [selectedCTAs, setSelectedCTAs] = useState<string[]>(["คอมเมนต์"]);
  const [selectedSpecials, setSelectedSpecials] = useState<string[]>([]);
  const [writingFormat, setWritingFormat] = useState<string>("ต่อเนื่อง");
  const [keyDetail, setKeyDetail] = useState("");

  const [generatedPrompt, setGeneratedPrompt] = useState("");
  const [copied, setCopied] = useState(false);

  // ── Toggle helpers ──
  function toggleTone(tone: string) {
    setSelectedTones((prev) =>
      prev.includes(tone) ? prev.filter((t) => t !== tone) : [...prev, tone]
    );
  }

  function toggleCTA(cta: string) {
    setSelectedCTAs((prev) =>
      prev.includes(cta) ? prev.filter((c) => c !== cta) : [...prev, cta]
    );
  }

  function toggleSpecial(s: string) {
    setSelectedSpecials((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  }

  // ── Build Prompt ──
  function handleBuildPrompt() {
    if (!topic.trim()) return;

    const persona = `คุณคือ "ครูฮีม" (Kru Heem) ครูสอนคณิตศาสตร์ผู้ใจดี อบอุ่น มีอารมณ์ขัน เชี่ยวชาญการเล่าเรื่องยากให้เป็นเรื่องง่าย
บุคลิก:
- เป็นกันเอง: ใช้คำแทนตัวว่า "ครูฮีม" หรือ "ครู" เรียกคนอ่านว่า "หนูๆ" "ลูกศิษย์" หรือ "พวกเรา"
- เข้าใจง่ายที่สุด: เขียนให้อ่านแล้วเข้าใจในทันที ไม่ใช้ศัพท์วิชาการที่ยาก ใช้คำพื้นบ้านบ้านที่คนทั่วไปเข้าใจได้ง่ายที่สุด (No Complex Jargon)
- เกลียดศัพท์วิชาการ: ชอบเปรียบเทียบกับชีวิตจริง (Analogy) ให้เห็นภาพ
- ให้กำลังใจ: เข้าใจความเจ็บปวดของคนที่ไม่เก่งเลข
- มีเหตุผล: อธิบายเป็นลำดับ 1, 2, 3...
- ห้ามทักทาย ห้ามแนะนำตัว: ห้ามขึ้นต้นด้วย "สวัสดี" "หวัดดี" "สวัสดีครับ/ค่ะ" "Hello" หรือคำทักทายใดๆ ห้ามแนะนำตัวเองว่า "ครูฮีมขอแนะนำตัว..." "วันนี้ครูจะมาเล่า..." ห้ามเกริ่นว่าจะเขียนเรื่องอะไร ให้กระโดดเข้าเนื้อหาทันทีด้วยประโยคทรงพลังที่หยุดสายตา (Scroll-Stopping Hook)`;

    let modeBlock = "";
    if (mode === "Math Explainer") {
      modeBlock = `โหมด: วิชาการคณิตศาสตร์ (Math Explainer)
โครงสร้างบทความ: Hook → Concept → Analogy → Example → Trick`;
    } else {
      modeBlock = `โหมด: เทคนิคการเรียนและแรงบันดาลใจ (Study & Motivation)
โครงสร้างบทความ: Empathy → Solution → Reasoning → Outcome`;
    }

    // Tones
    const toneMap: Record<string, string> = {
      "ขำขัน": "ตลกขำขัน มีมุก ใส่อีโมจิเยอะ ดึงคนเลื่อนผ่านให้หยุดดู",
      "อบอุ่น": "จริงจังแต่อบอุ่น เหมือนพี่ที่เชื่อถือได้ สร้างความไว้วางใจ",
      "ปลุกใจ": "ปลุกใจ สร้างแรงบันดาลใจ เหมือนโค้ช กระตุ้นให้ลงมือทำ",
      "เชิญชวน/โน้มน้าว": "เชิญชวน โน้มน้าว Persuasive ทำให้อยากทำตาม ใช้เหตุผลและอารมณ์ร่วม",
      "FOMO/เร่งด่วน": "สร้างความกลัวพลาด (FOMO) เน้นเร่งด่วน จำกัดเวลา ทำให้รู้สึกว่าต้องรีบตัดสินใจ",
      "ท้าทาย/โต้แย้ง": "ท้าทาย โต้แย้ง Controversial ตั้งคำถามที่คนอยากเข้ามาถกเถียง → Algorithm Boost",
      "เล่าเรื่อง": "เล่าเรื่อง Storytelling ดึง Attention ยาว เล่าเป็นเรื่องราวต่อเนื่องจนคนอ่านจนจบ",
      "ตรงไปตรงมา": "ตรงไปตรงมา พูดตรง ไม่อ้อมค้อม จริงใจ เข้าประเด็นทันที สื่อสารชัดเจนแบบไม่ต้องเกริ่นนาน สะใจคนอ่าน",
      "ว้าว/ทึ่ง": "สร้างความว้าว ทึ่ง เผยมุมมหัศจรรย์ของเรื่องนี้ กระตุ้นความอยากรู้ ทำให้ผู้อ่านรู้สึกว่า 'เรื่องนี้น่าทึ่งกว่าที่คิด'",
    };
    const toneLines = selectedTones.map((t) => `- ${toneMap[t] || t}`).join("\n");
    const toneBlock = `โทนเสียง (ผสมผสานโทนเหล่านี้อย่างกลมกลืน):\n${toneLines}`;

    // Length
    const lengthMap: Record<string, string> = {
      "สั้น": "สั้นกระชับ 500–600 คำ",
      "ปานกลาง": "ปานกลาง 1,000–1,500 คำ",
      "ยาว": "ยาวเจาะลึก 3,000–4,000 คำ",
    };
    const lengthBlock = `ความยาว: ${lengthMap[length] || length}`;

    // CTA
    const ctaMap: Record<string, string> = {
      "คอมเมนต์": "กระตุ้นให้ตอบคำถาม / คอมเมนต์ (เพิ่ม Engagement)",
      "แชร์": "กระตุ้นให้แชร์โพสต์ต่อ (เพิ่ม Reach)",
      "Save": "กระตุ้นให้เก็บไว้ดู / บันทึก (เพิ่ม Algorithm Signal)",
      "แท็กเพื่อน": "กระตุ้นให้แท็กเพื่อนที่ต้องรู้ (Organic Reach)",
      "กดลิงก์": "กระตุ้นให้กดลิงก์ / สมัคร (Conversion)",
      "กดติดตาม": "กระตุ้นให้กดไลค์ / กดติดตาม (เพิ่ม Followers)",
    };
    const ctaLines = selectedCTAs.map((c) => `- ${ctaMap[c] || c}`).join("\n");
    const ctaBlock = `Call to Action ที่ต้องใส่ท้ายบทความ:\n${ctaLines}`;

    const detailBlock = keyDetail.trim()
      ? `\nเน้นเป็นพิเศษ: ${keyDetail.trim()}`
      : "";

    // Special Instructions
    const specialMap: Record<string, string> = {
      "ผู้ปกครอง":
        'กลุ่มเป้าหมายผู้อ่าน: "ผู้ปกครอง" — เขียนสื่อสารถึงพ่อแม่ผู้ปกครองโดยตรง เรียกผู้อ่านว่า "คุณพ่อคุณแม่" เสมอ (ห้ามใช้คำว่า "คุณ" เฉยๆ ในการเรียกผู้อ่าน ให้ใช้ "คุณพ่อคุณแม่" แทนทุกครั้ง) เน้นมุมมองการสนับสนุนลูก ความกังวลของผู้ปกครอง วิธีช่วยลูกที่บ้าน และผลลัพธ์ระยะยาวต่อพัฒนาการของเด็ก หลีกเลี่ยงการพูดกับเด็กโดยตรง',
      "นักเรียน":
        'กลุ่มเป้าหมายผู้อ่าน: "เด็กนักเรียน" — เขียนสื่อสารถึงนักเรียนโดยตรง ใช้สรรพนาม "หนูๆ" "เพื่อนๆ" หรือ "ลูกศิษย์" ใช้ภาษาวัยรุ่นที่เข้าใจง่าย เป็นกันเอง สนุก และให้กำลังใจ เหมือนพี่หรือครูที่คุยกับน้อง',
      "ดราม่า":
        'สไตล์การเขียน: "ดราม่าเรียกยอดวิว" — เปิดเรื่องด้วย Hook ที่ทรงพลัง สะเทือนอารมณ์ หรือชวนตกใจ ใช้ประโยคสั้นกระชับเร้าอารมณ์ ใส่จุดพลิก (Plot Twist) หรือเรื่องเล่าสะเทือนใจที่เกี่ยวกับหัวข้อ เน้นเรียกความสนใจให้คนอ่านหยุดเลื่อนและอ่านจนจบ แต่ยังคงสาระและความถูกต้องของเนื้อหาไว้',
      "ภาพยนตร์":
        'เทคนิคการอธิบาย: ใช้ "การอ้างอิงภาพยนตร์/ซีรีส์" ประกอบความเข้าใจ — ยกตัวอย่างฉากหรือพล็อตจากภาพยนตร์/ซีรีส์ที่คนไทยรู้จักกันดี (เช่น Marvel, Harry Potter, Squid Game, หนังไทยยอดนิยม ฯลฯ) มาเปรียบเทียบกับแนวคิดในหัวข้อ อย่างน้อย 1 ตัวอย่างที่ชัดเจน ทำให้ผู้อ่านเห็นภาพและจำได้ง่าย',
      "การ์ตูน":
        'เทคนิคการอธิบาย: ใช้ "การอ้างอิงการ์ตูน/อนิเมะ" ประกอบความเข้าใจ — ยกตัวอย่างตัวละครหรือสถานการณ์จากการ์ตูน/อนิเมะยอดนิยม (เช่น Doraemon, One Piece, Naruto, Conan, Dragon Ball ฯลฯ) มาเปรียบเทียบกับแนวคิดในหัวข้อ อย่างน้อย 1 ตัวอย่างที่ชัดเจน ทำให้ผู้อ่านเห็นภาพและสนุกไปกับเนื้อหา',
      "บุคคลสำคัญ":
        'เทคนิคการอธิบาย: ใช้ "การอ้างอิงบุคคลสำคัญ — นักวิทยาศาสตร์/นักคณิตศาสตร์" ประกอบความเข้าใจ — ยกเรื่องราว เกร็ดประวัติ หรือผลงานของบุคคลที่เกี่ยวข้องกับหัวข้อ (เช่น Albert Einstein, Isaac Newton, Pythagoras, Euclid, Carl Friedrich Gauss, Marie Curie, Alan Turing, Srinivasa Ramanujan ฯลฯ) มาเชื่อมโยงเข้ากับแนวคิด อย่างน้อย 1 ตัวอย่างที่ชัดเจน เน้นเล่าเป็นเรื่องเล่าที่น่าสนใจ ทำให้ผู้อ่านรู้สึกว่าเรื่องนี้มีที่มาน่าทึ่งและจดจำได้ง่าย',
      "จุดพลาดบ่อย":
        'เทคนิคการสอน: "เตือนจุดที่นักเรียนพลาดบ่อย (Catch Mistakes)" — ชี้ข้อผิดพลาดยอดฮิตที่นักเรียนมักทำผิดในหัวข้อนี้ อย่างน้อย 1-2 จุด อธิบายว่าทำไมถึงผิด และบอกวิธีหลีกเลี่ยงหรือแก้ให้ถูก เพื่อให้ผู้อ่านระวังตัวและเข้าใจลึกขึ้น',
      "เทคนิคช่วยจำ":
        'เทคนิคการสอน: "ใส่เทคนิคช่วยจำหรือสูตรลัด (Memorize)" — เพิ่มวิธีจำง่ายๆ เช่น คำคล้องจอง ตัวย่อ ภาพจำ หรือสูตรลัด อย่างน้อย 1 อย่าง ที่ช่วยให้ผู้อ่านจำแนวคิดสำคัญได้โดยไม่ต้องท่องจำแบบเดิมๆ',
      "ขายคอร์ส":
        'มุมการตลาด: "สอดแทรกการขายคอร์สแบบเนียน (Soft-sell)" — ปิดท้ายด้วยการเชื่อมโยงไปยังคอร์สเรียน VOD หรือคลังข้อสอบของครูฮีมอย่างแนบเนียน เน้นว่าช่วยแก้ปัญหาให้ผู้อ่านได้อย่างไร ห้ามฮาร์ดเซลหรือยัดเยียด ให้รู้สึกเป็นทางเลือกที่ช่วยได้จริง',
      "เคสศิษย์เก่า":
        'เทคนิคสร้างความน่าเชื่อถือ: "เล่าเคสศิษย์เก่าที่ประสบความสำเร็จ (Testimonial)" — ยกเรื่องราวของนักเรียนที่เคยมีปัญหาคล้ายผู้อ่าน แล้วพัฒนาขึ้นจนสำเร็จ (เช่น จากเกลียดเลขกลายเป็นชอบเลข จากคะแนนน้อยจนสอบติด) เล่าให้เห็นภาพและสร้างแรงบันดาลใจ ให้ผู้อ่านเชื่อว่าตัวเองก็ทำได้',
    };
    const specialBlock =
      selectedSpecials.length > 0
        ? `\nคำสั่งพิเศษเพิ่มเติม (ต้องปฏิบัติตามทุกข้อ):\n${selectedSpecials
            .map((s) => `- ${specialMap[s] || s}`)
            .join("\n")}`
        : "";

    // Writing Format
    const formatMap: Record<string, string> = {
      "ต่อเนื่อง":
        'รูปแบบการเขียน: "บทความยาวต่อเนื่อง" — เขียนเป็นย่อหน้ายาวต่อเนื่องเหมือนบทความ มีการเชื่อมโยงประโยคและความคิดอย่างลื่นไหล ใช้คำเชื่อมเพื่อร้อยเรียงเนื้อหาให้เป็นเรื่องเดียวกัน ไม่ตัดบรรทัดถี่ๆ',
      "เว้นบรรทัด":
        'รูปแบบการเขียน: "เว้นบรรทัดให้อ่านง่าย" — ตัดประโยคให้สั้น กระชับ บรรทัดละ 1 ใจความ เว้นบรรทัดบ่อยๆ เพื่อให้อ่านง่ายบนมือถือ เน้นการสแกนสายตาได้รวดเร็ว เหมาะกับการเลื่อนอ่านบน Facebook (ห้ามเขียนเป็นย่อหน้ายาว)',
    };
    const formatBlock = `\nรูปแบบการนำเสนอเนื้อหา: ${formatMap[writingFormat] || writingFormat}`;

    const outputFormat = `ข้อกำหนด Output (Plain Text สำหรับ Facebook):
1. หัวข้อแนะนำ 3 ตัวเลือก (Clickbait ที่มีสาระ ดึงดูดสายตา)
2. เนื้อหาฉบับสมบูรณ์ตามโครงสร้าง ใช้อีโมจิตามเหมาะสม
3. **กฎเหล็กเรื่อง Format**: ขอแบบ Plain Text เท่านั้น **ห้ามใช้ Markdown, ห้ามใช้ตัวหนา (**), ห้ามใช้ #หน้าหัวข้อ** (ให้ใช้ภาษาคนปกติเขียนเพื่อลง Facebook ได้ทันทีโดยไม่มีสัญลักษณ์แปลกปลอม)
4. **กฎเหล็กเรื่องการเปิดบทความ (Opening Hook)**:
   - ห้ามขึ้นต้นด้วยคำทักทาย ("สวัสดี", "หวัดดี", "Hello") ในทุกกรณี
   - ห้ามแนะนำตัวเอง หรือเกริ่นว่า "วันนี้จะมาเล่าเรื่อง..." "บทความนี้จะพูดถึง..."
   - บรรทัดแรกของเนื้อหาต้องเป็น "ประโยคทรงพลัง 1 ประโยค" ที่หยุดสายตาคนเลื่อนผ่าน (Scroll-Stopping Hook)
   - รูปแบบ Hook ที่ใช้ได้: คำถามชวนคิด / ตัวเลขชวนช็อก / ประโยคปฏิเสธความเชื่อเดิม / ข้อเท็จจริงที่ขัดสามัญสำนึก / ฉากเปิดเร้าอารมณ์ / คำพูดสั้นทรงพลัง
   - ตัวอย่างที่ดี: "90% ของเด็กไทยเกลียดเลข...เพราะครูสอนผิดวิธี" หรือ "ถ้าคุณบอกว่าเลขยาก แสดงว่ายังไม่เจอวิธีนี้" หรือ "เลข 1 ตัวที่จะเปลี่ยนชีวิตการเรียนของหนูตลอดไป"
5. Call to Action ตามที่กำหนด
6. Hashtags 5–10 คำ (ต้องมี #ครูฮีม)

Format (ห้ามใส่สัญลักษณ์ Markdown):
[หัวข้อแนะนำ]
[เนื้อหาบทความ]
[Call to Action]
[Hashtags]`;

    const fullPrompt = `${persona}

${modeBlock}

${toneBlock}

${lengthBlock}${detailBlock}${specialBlock}${formatBlock}

${ctaBlock}

${outputFormat}

หัวข้อ: "${topic}"`;

    setGeneratedPrompt(fullPrompt);
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(generatedPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // ── Data ──
  const modes: { value: Mode; icon: React.ReactNode; label: string; sub: string }[] = [
    { value: "Math Explainer", icon: <BookOpen size={20} strokeWidth={1.5} />, label: "วิชาการ", sub: "อธิบายคณิตศาสตร์" },
    { value: "Study & Motivation", icon: <Target size={20} strokeWidth={1.5} />, label: "เทคนิค & แรงบันดาลใจ", sub: "จูงใจ ให้กำลังใจ" },
  ];

  const tones: ToneOption[] = [
    { value: "ขำขัน", emoji: "😂", label: "ขำขัน", desc: "ดึงคนหยุดดู" },
    { value: "อบอุ่น", emoji: "🤗", label: "อบอุ่น", desc: "สร้างไว้วางใจ" },
    { value: "ปลุกใจ", emoji: "🔥", label: "ปลุกใจ", desc: "กระตุ้น Action" },
    { value: "เชิญชวน/โน้มน้าว", emoji: "📢", label: "โน้มน้าว", desc: "อยากทำตาม" },
    { value: "FOMO/เร่งด่วน", emoji: "⚠️", label: "FOMO", desc: "กลัวพลาด" },
    { value: "ท้าทาย/โต้แย้ง", emoji: "🎯", label: "ท้าทาย", desc: "อยากถกเถียง" },
    { value: "เล่าเรื่อง", emoji: "📖", label: "เล่าเรื่อง", desc: "อ่านจนจบ" },
    { value: "ตรงไปตรงมา", emoji: "💬", label: "ตรงไปตรงมา", desc: "พูดตรงๆ" },
    { value: "ว้าว/ทึ่ง", emoji: "🤯", label: "ว้าว/ทึ่ง", desc: "ชวนทึ่ง" },
  ];

  const ctaOptions: CTAOption[] = [
    { value: "คอมเมนต์", icon: <MessageSquare size={14} strokeWidth={1.5} />, label: "คอมเมนต์" },
    { value: "แชร์", icon: <Share2 size={14} strokeWidth={1.5} />, label: "แชร์" },
    { value: "Save", icon: <Bookmark size={14} strokeWidth={1.5} />, label: "เก็บไว้ดู" },
    { value: "แท็กเพื่อน", icon: <UserPlus size={14} strokeWidth={1.5} />, label: "แท็กเพื่อน" },
    { value: "กดลิงก์", icon: <Link size={14} strokeWidth={1.5} />, label: "กดลิงก์/สมัคร" },
    { value: "กดติดตาม", icon: <Heart size={14} strokeWidth={1.5} />, label: "ไลค์/ติดตาม" },
  ];

  const specialOptions: { value: string; icon: React.ReactNode; label: string; desc: string }[] = [
    { value: "ผู้ปกครอง", icon: <Users size={16} strokeWidth={1.5} />, label: "เขียนถึงผู้ปกครอง", desc: "สื่อสารกับพ่อแม่โดยตรง" },
    { value: "นักเรียน", icon: <GraduationCap size={16} strokeWidth={1.5} />, label: "เขียนถึงนักเรียน", desc: "พูดกับเด็กๆ เป็นกันเอง" },
    { value: "ดราม่า", icon: <Flame size={16} strokeWidth={1.5} />, label: "สไตล์ดราม่า", desc: "เร้าอารมณ์ เรียกยอดวิว" },
    { value: "ภาพยนตร์", icon: <Film size={16} strokeWidth={1.5} />, label: "อ้างอิงภาพยนตร์", desc: "ยกตัวอย่างจากหนัง/ซีรีส์" },
    { value: "การ์ตูน", icon: <Tv size={16} strokeWidth={1.5} />, label: "อ้างอิงการ์ตูน", desc: "ยกตัวอย่างจากอนิเมะ" },
    { value: "บุคคลสำคัญ", icon: <Atom size={16} strokeWidth={1.5} />, label: "อ้างอิงบุคคลสำคัญ", desc: "นักวิทย์/นักคณิตศาสตร์" },
    { value: "จุดพลาดบ่อย", icon: <AlertTriangle size={16} strokeWidth={1.5} />, label: "เตือนจุดพลาดบ่อย", desc: "เด็กพลาดตรงไหนซ้ำๆ" },
    { value: "เทคนิคช่วยจำ", icon: <Brain size={16} strokeWidth={1.5} />, label: "เทคนิคช่วยจำ", desc: "สูตรลัด จำแบบไม่ลืม" },
    { value: "ขายคอร์ส", icon: <PlayCircle size={16} strokeWidth={1.5} />, label: "สอดแทรกขายคอร์ส", desc: "Soft-sell VOD เนียนๆ" },
    { value: "เคสศิษย์เก่า", icon: <Trophy size={16} strokeWidth={1.5} />, label: "เคสศิษย์เก่าสำเร็จ", desc: "เรื่องจริงสร้างแรงบันดาลใจ" },
  ];

  const formatOptions: { value: string; icon: React.ReactNode; label: string; desc: string }[] = [
    { value: "ต่อเนื่อง", icon: <AlignJustify size={16} strokeWidth={1.5} />, label: "บทความยาวต่อเนื่อง", desc: "ย่อหน้ายาว ลื่นไหล" },
    { value: "เว้นบรรทัด", icon: <AlignLeft size={16} strokeWidth={1.5} />, label: "เว้นบรรทัดอ่านง่าย", desc: "ประโยคสั้น สแกนเร็ว" },
  ];

  const lengths: { value: string; icon: React.ReactNode; label: string; words: string }[] = [
    { value: "สั้น", icon: <Zap size={14} strokeWidth={1.5} />, label: "สั้น", words: "500–600" },
    { value: "ปานกลาง", icon: <FileText size={14} strokeWidth={1.5} />, label: "ปานกลาง", words: "1,000–1,500" },
    { value: "ยาว", icon: <BookMarked size={14} strokeWidth={1.5} />, label: "ยาว", words: "3,000–4,000" },
  ];

  return (
    <div className="max-w-6xl mx-auto px-6 py-12 relative z-10">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="text-center mb-16"
      >
        <div className="inline-flex items-center gap-2 mb-6">
          <span
            className="badge px-4 py-1.5 rounded-full"
            style={{
              background: "rgba(255, 183, 137, 0.1)",
              color: "var(--color-apricot-400)",
              border: "1px solid rgba(255, 183, 137, 0.2)",
              backdropFilter: "blur(8px)"
            }}
          >
            <Sparkles size={14} className="animate-pulse" />
            <span className="font-semibold tracking-wider uppercase text-[10px]">AI-Powered Creativity</span>
          </span>
        </div>

        <h1 className="display-xl mb-6 tracking-tight">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ffb789] via-[#ffd1b3] to-[#e8955f]">
            Turn Complexity Into Clarity
          </span>
        </h1>

        <p className="text-body max-w-xl mx-auto text-tertiary leading-relaxed">
          เปลี่ยนเรื่องยากให้เป็นเรื่องง่าย ด้วยระบบ AI อัจฉริยะที่ช่วยออกแบบ Prompt <br />
          ให้คุณสร้างคอนเทนต์การสอนที่มีพลังและน่าประทับใจ
        </p>
      </motion.div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Control Panel */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="lg:col-span-5"
        >
          <div className="surface p-8 space-y-8 backdrop-blur-xl bg-opacity-40">
            {/* Header */}
            <div className="flex items-center gap-4">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center bg-gradient-to-br from-[#ffb789] to-[#e8955f] shadow-lg shadow-[#ffb789]/20"
              >
                <Wand2 size={24} className="text-[#0a0a0c]" />
              </div>
              <div>
                <h2 className="heading-md text-primary">ตั้งค่า Prompt</h2>
                <p className="text-micro text-tertiary">ปรับแต่งเอกลักษณ์เฉพาะตัวของคุณ</p>
              </div>
            </div>

            <div className="divider" />

            {/* Inputs Section */}
            <div className="space-y-6">
              {/* Topic Input */}
              <div className="field-group">
                <label className="field-label flex items-center gap-2">
                  <BookOpen size={14} /> หัวข้อที่ต้องการ
                </label>
                <input
                  className="field-input h-12 text-base"
                  placeholder='เช่น "สมการเชิงเส้น" หรือ "วิธีอ่านหนังสือ"'
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                />
              </div>

              {/* Mode Selection */}
              <div className="field-group">
                <label className="field-label">รูปแบบการนำเสนอ</label>
                <div className="grid grid-cols-2 gap-3">
                  {modes.map((m) => (
                    <button
                      key={m.value}
                      onClick={() => setMode(m.value)}
                      className={`mode-option group transition-all duration-500 ${mode === m.value ? "selected" : ""}`}
                    >
                      <div className={`p-3 rounded-xl transition-colors duration-500 ${mode === m.value ? "bg-[#ffb789] text-[#0a0a0c]" : "bg-bg-elevated text-tertiary group-hover:text-secondary"}`}>
                        {m.icon}
                      </div>
                      <span className="font-bold mt-2">{m.label}</span>
                      <span className="text-[10px] opacity-60 font-medium">{m.sub}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Tone Multi-select */}
              <div className="field-group">
                <label className="field-label">บุคลิกและน้ำเสียง <span className="opacity-50 text-[10px] ml-1">(เลือกได้หลายแบบ)</span></label>
                <div className="grid grid-cols-2 gap-2">
                  {tones.map((t) => {
                    const isActive = selectedTones.includes(t.value);
                    return (
                      <button
                        key={t.value}
                        onClick={() => toggleTone(t.value)}
                        className={`tone-option text-left px-4 py-3 transition-all duration-300 ${isActive ? "selected" : "opacity-70 grayscale hover:grayscale-0 hover:opacity-100"}`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{t.emoji}</span>
                          <div className="leading-tight">
                            <p className="text-micro font-bold">{t.label}</p>
                            <p className="text-[9px] opacity-60">{t.desc}</p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Length Selection */}
              <div className="field-group">
                <label className="field-label">ความยาวของเนื้อหา</label>
                <div className="segmented p-1.5 bg-bg-elevated/50">
                  {lengths.map((l) => (
                    <button
                      key={l.value}
                      onClick={() => setLength(l.value)}
                      className={`segmented-item py-2.5 font-bold transition-all duration-500 ${length === l.value ? "active" : ""}`}
                    >
                      {l.icon}
                      <span className="ml-1.5">{l.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* CTA Multi-select */}
              <div className="field-group">
                <label className="field-label">Action ท้ายบทความ</label>
                <div className="flex flex-wrap gap-2">
                  {ctaOptions.map((c) => {
                    const isActive = selectedCTAs.includes(c.value);
                    return (
                      <button
                        key={c.value}
                        onClick={() => toggleCTA(c.value)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full border-2 transition-all duration-300 font-bold text-micro ${isActive ? "bg-[#ffb789]/10 border-[#ffb789] text-[#ffb789]" : "bg-bg-elevated border-transparent opacity-60 hover:opacity-100 font-medium"}`}
                      >
                        {c.icon}
                        {c.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Special Instructions Multi-select */}
              <div className="field-group">
                <label className="field-label">
                  คำสั่งพิเศษ
                  <span className="opacity-50 text-[10px] ml-1">(ติ๊กเลือกได้หลายข้อ หรือไม่เลือกเลยก็ได้)</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {specialOptions.map((s) => {
                    const isActive = selectedSpecials.includes(s.value);
                    return (
                      <button
                        key={s.value}
                        type="button"
                        onClick={() => toggleSpecial(s.value)}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border-2 text-left transition-all duration-300 ${
                          isActive
                            ? "bg-[#ffb789]/10 border-[#ffb789] text-[#ffb789]"
                            : "bg-bg-elevated/60 border-transparent opacity-70 hover:opacity-100"
                        }`}
                      >
                        <span
                          className={`flex items-center justify-center w-5 h-5 rounded-md border-2 transition-colors ${
                            isActive ? "bg-[#ffb789] border-[#ffb789]" : "border-white/20"
                          }`}
                        >
                          {isActive && <Check size={12} strokeWidth={3} className="text-[#0a0a0c]" />}
                        </span>
                        <span className={isActive ? "text-[#ffb789]" : "text-tertiary"}>{s.icon}</span>
                        <div className="leading-tight flex-1 min-w-0">
                          <p className="text-micro font-bold truncate">{s.label}</p>
                          <p className="text-[9px] opacity-60 truncate">{s.desc}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Writing Format */}
              <div className="field-group">
                <label className="field-label">
                  รูปแบบการเขียนเนื้อหา
                  <span className="opacity-50 text-[10px] ml-1">(เลือก 1 แบบ)</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {formatOptions.map((f) => {
                    const isActive = writingFormat === f.value;
                    return (
                      <button
                        key={f.value}
                        type="button"
                        onClick={() => setWritingFormat(f.value)}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border-2 text-left transition-all duration-300 ${
                          isActive
                            ? "bg-[#ffb789]/10 border-[#ffb789] text-[#ffb789]"
                            : "bg-bg-elevated/60 border-transparent opacity-70 hover:opacity-100"
                        }`}
                      >
                        <span className={isActive ? "text-[#ffb789]" : "text-tertiary"}>{f.icon}</span>
                        <div className="leading-tight flex-1 min-w-0">
                          <p className="text-micro font-bold truncate">{f.label}</p>
                          <p className="text-[9px] opacity-60 truncate">{f.desc}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Detail Input */}
              <div className="field-group">
                <label className="field-label">ข้อมูลเพิ่มเติม <span className="opacity-50 text-[10px] ml-1">(ออปชันเสริม)</span></label>
                <textarea
                  className="field-textarea min-h-[100px] border-none bg-bg-elevated/50"
                  placeholder="เช่น ต้องการเน้นเด็ก ม.ปลาย, มีโจทย์ประกอบ 2 ข้อ..."
                  value={keyDetail}
                  onChange={(e) => setKeyDetail(e.target.value)}
                />
              </div>

              <button
                className="btn-generate group overflow-hidden"
                onClick={handleBuildPrompt}
                disabled={!topic.trim() || selectedTones.length === 0 || selectedCTAs.length === 0}
              >
                <span className="relative z-10 flex items-center gap-3">
                  <Sparkles size={20} className="group-hover:rotate-12 transition-transform" />
                  สร้าง Prompt อัจฉริยะ
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-[#ffd1b3] to-[#e8955f] opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            </div>
          </div>
        </motion.div>

        {/* Right Preview Panel */}
        <div className="lg:col-span-7 lg:sticky lg:top-12">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="output-surface min-h-[600px] flex flex-col bg-bg-secondary/40 backdrop-blur-2xl relative overflow-hidden group shadow-2xl"
          >
            {/* Background Decorative Pattern */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#ffb789_1px,transparent_1px)] [background-size:20px_20px]" />

            {/* Header */}
            <div className="output-header px-8 py-6 flex items-center justify-between border-b border-white/5 relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-[#ffb789] animate-pulse" />
                <span className="heading-md font-bold tracking-tight">AI Output Preview</span>
              </div>

              <AnimatePresence>
                {generatedPrompt && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    onClick={handleCopy}
                    className="btn-ghost bg-[#ffb789] text-[#0a0a0c] hover:bg-[#ffd1b3] border-none px-6 rounded-full font-bold h-10"
                  >
                    {copied ? <><Check size={16} /> คัดลอกสำเร็จ!</> : <><Copy size={16} /> คัดลอกผลลัพธ์</>}
                  </motion.button>
                )}
              </AnimatePresence>
            </div>

            {/* Content Body */}
            <div className="flex-1 p-8 relative z-10">
              <AnimatePresence mode="wait">
                {generatedPrompt ? (
                  <motion.div
                    key="prompt"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="relative"
                  >
                    <div className="absolute -inset-1 bg-gradient-to-r from-[#ffb789]/10 to-[#e8955f]/5 blur-2xl rounded-3xl" />
                    <pre
                      className="relative p-8 rounded-3xl bg-bg-elevated/40 border border-white/5 text-body leading-loose whitespace-pre-wrap selection:bg-[#ffb789]/30"
                      style={{ fontFamily: "var(--font-sans)" }}
                    >
                      {generatedPrompt}
                    </pre>
                  </motion.div>
                ) : (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="h-full flex flex-col items-center justify-center space-y-8 pt-16"
                  >
                    {/* Orbit System */}
                    <div className="relative w-44 h-44 flex items-center justify-center">

                      {/* Ambient glow */}
                      <div className="absolute inset-4 bg-[#ffb789]/15 blur-3xl animate-pulse rounded-full" />

                      {/* Dashed orbit ring */}
                      <div
                        className="absolute rounded-full border border-dashed border-[#ffb789]/25"
                        style={{ width: 128, height: 128, top: 24, left: 24 }}
                      />

                      {/* Center icon */}
                      <div className="w-20 h-20 rounded-2xl flex items-center justify-center relative z-10 shadow-xl"
                        style={{
                          background: "var(--color-bg-elevated)",
                          border: "1px solid rgba(255,183,137,0.18)",
                          boxShadow: "0 0 32px rgba(255,183,137,0.12)",
                        }}
                      >
                        <motion.div
                          animate={{ rotate: [0, 10, -8, 6, 0] }}
                          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                        >
                          <Wand2 size={36} style={{ color: "#ffb789", opacity: 0.7 }} />
                        </motion.div>
                      </div>

                      {/* Orbiting icons */}
                      {(
                        [
                          { Icon: Calculator, initialDeg: 0,   color: "#ffb789", label: "คำนวณ" },
                          { Icon: BookOpen,   initialDeg: 120,  color: "#ffd1b3", label: "อ่าน"  },
                          { Icon: Pencil,     initialDeg: 240,  color: "#e8955f", label: "เขียน" },
                        ] as const
                      ).map(({ Icon, initialDeg, color }) => (
                        <motion.div
                          key={initialDeg}
                          className="absolute inset-0"
                          style={{ rotate: initialDeg }}
                          animate={{ rotate: initialDeg + 360 }}
                          transition={{ duration: 9, repeat: Infinity, ease: "linear" }}
                        >
                          {/* Icon positioned at top of orbit radius */}
                          <div
                            className="absolute left-1/2"
                            style={{ top: 6, transform: "translateX(-50%)" }}
                          >
                            <motion.div
                              className="w-9 h-9 rounded-xl flex items-center justify-center shadow-md"
                              style={{
                                background: "var(--color-bg-secondary)",
                                border: `1px solid ${color}30`,
                                boxShadow: `0 4px 16px ${color}22`,
                                rotate: -initialDeg,
                              }}
                              animate={{ rotate: -(initialDeg + 360) }}
                              transition={{ duration: 9, repeat: Infinity, ease: "linear" }}
                            >
                              <Icon size={15} style={{ color }} strokeWidth={1.75} />
                            </motion.div>
                          </div>
                        </motion.div>
                      ))}
                    </div>

                    <div className="text-center space-y-2">
                      <h3 className="heading-lg font-bold">รอการสร้างสรรค์...</h3>
                      <p className="text-body max-w-[280px] mx-auto" style={{ color: "var(--color-text-tertiary)" }}>
                        กรอกข้อมูลด้านซ้ายเพื่อรับ Prompt ในสไตล์ครูฮีมที่ไม่เหมือนใคร
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Hint Footer */}
            {generatedPrompt && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="px-8 py-6 border-t border-white/5 bg-bg-elevated/20"
              >
                <div className="flex items-start gap-4 p-4 rounded-2xl bg-[#ffb789]/5 border border-[#ffb789]/10">
                  <div className="p-2 rounded-lg bg-[#ffb789]/10 text-[#ffb789]">
                    <Zap size={16} />
                  </div>
                  <p className="text-micro text-secondary leading-relaxed">
                    ก๊อปปี้ไปวางใน <span className="text-[#ffb789] font-bold">ChatGPT, Gemini</span> หรือ <span className="text-[#ffb789] font-bold">Claude</span> ได้ทันที
                    บอทจะกลร่างเป็นครูฮีมสุดใจดีคอยช่วยเหลือคุณอย่างเต็มที่ครับ!
                  </p>
                </div>
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
