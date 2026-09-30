export type Audience = "parent" | "student";
export type Emotion = "low" | "mid" | "high";

/** วัตถุดิบจริงที่แพตเทิร์นบางแบบต้องใช้ ถ้าไม่มีจะให้ Claude ถามครูก่อน */
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
}

export type Material = Record<Need | "extra", string>;

export interface VoiceProfile {
  selfName: string;
  particle: string;
  studentCall: string;
  catchphrases: string;
  beliefs: string;
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
