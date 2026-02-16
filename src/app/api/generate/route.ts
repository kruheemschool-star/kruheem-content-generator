import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

// ── Mock Response Generator ──
function generateMockResponse(topic: string, mode: string, tone: string, length: string, keyDetail: string): string {
    const ismath = mode === "Math Explainer";

    const headlines = ismath
        ? [
            `เลิกท่องจำ! เทคนิคเข้าใจ "${topic}" ที่โรงเรียนอาจไม่ได้สอน`,
            `"${topic}" ง่ายกว่าที่คิด ถ้ารู้วิธีคิดแบบนี้ 🧠`,
            `สูตรลับ "${topic}" ที่ทำให้เรื่องยาก กลายเป็นเรื่องกล้วยๆ 🍌`,
        ]
        : [
            `ครูรู้ว่าเหนื่อยแค่ไหน... แต่ "${topic}" จะช่วยเปลี่ยนทุกอย่าง 💪`,
            `บอกลาคะแนนต่ำ! เคล็ดลับ "${topic}" ที่ต้องรู้ก่อนสอบ`,
            `90% ของคนที่ลองวิธีนี้ ผลการเรียนดีขึ้นจริง "${topic}" 🎯`,
        ];

    let body = "";
    if (ismath) {
        body = `### 🔥 Hook

เคยรู้สึกไหมว่า "${topic}" มันยากเกินไป? ทำแล้วก็ผิดตลอด? ครูฮีมเข้าใจเลยนะ — เพราะครูก็เคยเป็นแบบนั้นมาก่อนเหมือนกัน!

### 💡 Concept

เรื่อง "${topic}" จริงๆ แล้วมันมีหลักการแค่ไม่กี่ข้อเท่านั้น ถ้าเราจับหลักได้ ที่เหลือก็แค่ฝึกทำ

### 🎯 Analogy

ลองนึกภาพ "${topic}" เหมือนการต่อจิ๊กซอว์ — เราต้องหาชิ้นมุมก่อน แล้วค่อยๆ ต่อชิ้นข้างๆ ไปเรื่อยๆ ไม่ต้องรีบ ทำทีละชิ้น เดี๋ยวก็เห็นภาพรวม!

### 📝 Example

**โจทย์ตัวอย่าง:** 
สมมุติว่าเราเจอโจทย์เกี่ยวกับ "${topic}"...

**วิธีทำ:**
1. อ่านโจทย์ให้จบก่อน อย่าเพิ่งทำ!
2. หาว่าโจทย์ "ถาม" อะไร
3. เขียนสิ่งที่ "รู้" ออกมา
4. เลือกวิธีที่เหมาะ → ลงมือทำ
5. ตรวจคำตอบ ✅

### ⚡ Trick

> 💜 **เคล็ดลับครูฮีม:** อย่าข้ามขั้นตอน! เขียนทุกบรรทัด แม้จะรู้สึกว่า "ง่าย" — เพราะคะแนนซ่อนอยู่ในรายละเอียดนะหนู`;
    } else {
        body = `### 💜 Empathy

ครูรู้นะว่าช่วงนี้มันเหนื่อยแค่ไหน... เรื่อง "${topic}" นี่หลายคนเคยเครียดกันมาก 

**ครูฮีมเข้าใจ** — ไม่มีใครเก่งได้ทุกอย่างตั้งแต่แรก และการที่หนูๆ ยังพยายามอยู่ตอนนี้ มันแสดงว่าหนูแกร่งมากแล้ว 💪

### 🎯 Solution

มาลองวิธีนี้กันดูนะ:

1. **ตั้งเป้าหมายเล็กๆ** — อย่าตั้งเป้าว่า "ต้องเก่ง" แต่ตั้งว่า "วันนี้ทำโจทย์สัก 5 ข้อ"
2. **ใช้เทคนิค Pomodoro** — ตั้งเวลา 25 นาที ทำ 1 เรื่อง แล้วพัก 5 นาที
3. **สอนตัวเอง** — ลองอธิบายสิ่งที่อ่านให้ตัวเองฟัง ถ้าพูดได้ = เข้าใจจริง
4. **ทำซ้ำ ≠ ท่องจำ** — อย่าท่องสูตร แต่ลองใช้สูตรจนชิน

### 🧪 Reasoning

งานวิจัยด้านจิตวิทยาการเรียนรู้บอกว่า **Active Recall** (การดึงข้อมูลจากสมอง) ช่วยให้จำได้ดีกว่าการอ่านซ้ำถึง 3 เท่า!

### 🌟 Outcome

ลองทำสัก 7 วัน แล้วจะรู้สึกเองว่า — **"เอ๊ะ มันไม่ยากอย่างที่คิดนะ!"**

ครูฮีมเชื่อมั่นในตัวหนูๆ เสมอ 💜`;
    }

    const detailNote = keyDetail ? `\n\n> 📌 **จุดเน้นพิเศษ:** ${keyDetail}` : "";

    const ctas = ismath
        ? [
            "ใครลองวิธีนี้แล้วได้ผล คอมเมนต์บอกครูหน่อยนะ! 💬",
            "แชร์เก็บไว้ดูหน้าสอบเลย! 📌",
        ]
        : [
            "พิมพ์ \"สู้ๆ\" ไว้ใต้โพสต์ ครูจะมาให้กำลังใจทุกคน! 💜",
            "แชร์ให้เพื่อนที่กำลังท้อด้วยนะ 🤝",
        ];

    const hashtags = `#ครูฮีม #คณิตศาสตร์ #${topic.replace(/\s+/g, "")} #เรียนเลข #StudyGram #DEK68 #สอบผ่าน #Tcas`;

    const imagePrompt = ismath
        ? `A friendly male Thai teacher wearing glasses, standing at a whiteboard explaining "${topic}" with colorful diagrams. 3D Pixar-style cartoon character, warm lighting, vibrant purple and blue color palette, educational classroom setting, cheerful expression, clean detailed render`
        : `A 3D Pixar-style cartoon of a Thai male teacher with glasses giving encouragement to a group of students who are studying happily. Warm cozy lighting, purple and orange color palette, motivational atmosphere, books and notebooks on desk, cheerful and warm mood`;

    return `## 🎯 หัวข้อแนะนำ (3 ตัวเลือก)

1. ${headlines[0]}
2. ${headlines[1]}
3. ${headlines[2]}

---

## 📝 เนื้อหาบทความ

${body}${detailNote}

---

## 🔥 Call to Action

1. ${ctas[0]}
2. ${ctas[1]}

---

## #️⃣ Hashtags

${hashtags}

---

## 🎨 Nano Banana Image Prompt

\`${imagePrompt}\``;
}

// ── Main Handler ──
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { topic, mode, tone, length, keyDetail } = body;

        const apiKey = process.env.GEMINI_API_KEY;

        // If no API key, return mock data
        if (!apiKey) {
            const mockContent = generateMockResponse(topic, mode, tone, length, keyDetail);
            return NextResponse.json({
                content: mockContent,
                promptUsed: "(Mock — set GEMINI_API_KEY in .env.local for real AI generation)",
                isMock: true,
            });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        // ── Kru Heem System Prompt ──
        const persona = `คุณคือ "ครูฮีม" (Kru Heem) ครูสอนคณิตศาสตร์ผู้ใจดี อบอุ่น มีอารมณ์ขัน และเชี่ยวชาญการเล่าเรื่องยากให้เป็นเรื่องง่าย
บุคลิก:
- เป็นกันเอง: ใช้คำแทนตัวว่า "ครูฮีม" หรือ "ครู" เรียกคนอ่านว่า "หนูๆ" "ลูกศิษย์" หรือ "พวกเรา"
- เข้าใจง่าย: เกลียดศัพท์วิชาการ ชอบเปรียบเทียบกับชีวิตจริง (Analogy) ให้เห็นภาพ
- ให้กำลังใจ: เข้าใจความเจ็บปวดของคนที่ไม่เก่งเลข
- มีเหตุผล: อธิบายเป็นลำดับ 1, 2, 3...`;

        let modeStructure = "";
        if (mode === "Math Explainer") {
            modeStructure = `โหมด: วิชาการคณิตศาสตร์ (Math Explainer)
โครงสร้าง: 1.Hook → 2.Concept → 3.Analogy → 4.Example → 5.Trick`;
        } else {
            modeStructure = `โหมด: เทคนิคการเรียนและแรงบันดาลใจ (Study & Motivation)
โครงสร้าง: 1.Empathy → 2.Solution → 3.Reasoning → 4.Outcome`;
        }

        let toneInstruction = "";
        switch (tone) {
            case "ตลกขำขัน": toneInstruction = "Tone: ตลกขำขัน มีมุก ใส่อีโมจิเยอะ"; break;
            case "จริงจังแต่อบอุ่น": toneInstruction = "Tone: จริงจังแต่อบอุ่น เหมือนพี่ที่เชื่อถือได้"; break;
            case "ปลุกใจ": toneInstruction = "Tone: ปลุกใจ สร้างแรงบันดาลใจ เหมือนโค้ช"; break;
            default: toneInstruction = `Tone: ${tone}`;
        }

        let lengthInstruction = "";
        switch (length) {
            case "สั้น": lengthInstruction = "ความยาว: สั้นกระชับ (~150-200 คำ)"; break;
            case "ปานกลาง": lengthInstruction = "ความยาว: ปานกลาง (~300-500 คำ)"; break;
            case "ยาว": lengthInstruction = "ความยาว: ยาวเจาะลึก (~600-1000 คำ)"; break;
            default: lengthInstruction = `ความยาว: ${length}`;
        }

        const keyDetailInstruction = keyDetail ? `\nเน้นเป็นพิเศษ: ${keyDetail}` : "";

        const prompt = `${persona}\n\n${modeStructure}\n${toneInstruction}\n${lengthInstruction}${keyDetailInstruction}

ข้อกำหนด Output (Markdown):
1. หัวข้อแนะนำ 3 ตัวเลือก (Clickbait ที่มีสาระ)
2. เนื้อหาฉบับสมบูรณ์ตามโครงสร้าง ใช้อีโมจิตามเหมาะสม
3. Call to Action 2 ทางเลือก
4. Hashtags 5-10 คำ (ต้องมี #ครูฮีม)
5. Image Prompt ภาษาอังกฤษ สไตล์ 3D Pixar, ครูผู้ชายใส่แว่น, Vibrant, Warm lighting

หัวข้อ: "${topic}"

Format:
## 🎯 หัวข้อแนะนำ (3 ตัวเลือก)
## 📝 เนื้อหาบทความ
## 🔥 Call to Action
## #️⃣ Hashtags
## 🎨 Nano Banana Image Prompt`;

        const result = await model.generateContent(prompt);
        const response = result.response;
        const text = response.text();

        return NextResponse.json({
            content: text,
            promptUsed: prompt,
            isMock: false,
        });
    } catch (error) {
        console.error("Gemini API Error:", error);

        // Fallback to mock if API fails
        try {
            const body = await req.clone().json();
            const mockContent = generateMockResponse(body.topic, body.mode, body.tone, body.length, body.keyDetail);
            return NextResponse.json({
                content: mockContent,
                promptUsed: "(Fallback Mock — API error occurred)",
                isMock: true,
            });
        } catch {
            return NextResponse.json(
                { error: "Failed to generate content" },
                { status: 500 }
            );
        }
    }
}
