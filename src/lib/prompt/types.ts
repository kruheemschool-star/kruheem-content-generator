export type Audience = "parent" | "student";
export type Emotion = "low" | "mid" | "high";

/** ข้อมูลจริงที่แพตเทิร์นบางแบบต้องใช้ ถ้าครูไม่ได้ให้ จะใช้ fallback ที่ไม่แต่งเรื่องแทน */
export type Need = "story" | "quote" | "number" | "stance" | "mistake" | "timing";

export interface Option {
  id: string;
  label: string;
  desc: string;
  instruction: string;
  emoji?: string;
}

export interface PatternOption extends Option {
  emotion?: Emotion;
  needs?: Need;
  /** ไม่ระบุ = ใช้ได้ทั้งสองกลุ่ม */
  audiences?: Audience[];
  /** สำหรับวิธีปิด: ใช้ได้เฉพาะเมื่อวิธีเปิดเป็นหนึ่งในนี้ */
  pairsWith?: string[];
  /** กลุ่มโครงเรื่อง ใช้ตอนสุ่มแบบอารมณ์/ตรง */
  lean?: "emotion" | "direct";
  /** ใช้แทน instruction เมื่อครูไม่ได้ให้ข้อมูลที่ต้องใช้ (กันการแต่งเรื่อง) */
  fallback?: string;
}

export type Lean = "emotion" | "direct" | "any";

export interface Material {
  /** ช่องเดียวที่ครูพิมพ์ เรื่องจริง ตัวเลข คำพูด หรือประเด็นที่อยากเน้น */
  detail: string;
  /** id จาก TIMINGS หรือ "" */
  timing: string;
  /** ครูกดยืนยันว่าเจอปัญหานี้กับนักเรียนบ่อยจริง */
  frequent: boolean;
}

export interface VoiceProfile {
  selfName: string;
  particle: string;
  studentCall: string;
  catchphrases: string;
  beliefIds: string[];
  beliefs: string;
  dontIds: string[];
  donts: string;
  samplePosts: string;
  products: string;
}

export interface BuilderConfig {
  topic: string;
  audience: Audience;
  grade: string;
  parentType: string;
  material: Material;
  /** id ของวิธีเปิด หรือ "auto" ให้ Claude เลือกจาก extraOpenings */
  opening: string;
  /** วิธีเปิดสำรอง 3 แบบ ใช้ตอน auto หรือเขียน 3 เวอร์ชัน */
  extraOpenings: string[];
  arc: string;
  ending: string;
  tonePrimary: string;
  toneSecondary: string;
  depth: string;
  length: string;
  format: string;
  emoji: string;
  versions: 1 | 3;
  analogy: string;
  extras: string[];
  ctas: string[];
  interview: boolean;
  /** สไตล์ล่าสุดที่กด ใช้สุ่มใหม่อัตโนมัติเมื่อเริ่มโพสต์ใหม่ */
  lean: Lean;
}

export interface HistoryEntry {
  id: string;
  at: number;
  topic: string;
  audience: Audience;
  opening: string;
  arc: string;
  ending: string;
  tone: string;
}
