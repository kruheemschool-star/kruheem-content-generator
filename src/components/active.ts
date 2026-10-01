import { createContext } from "react";

/** หน้าที่ซ่อนอยู่ (เวอร์ชันที่ไม่ได้เลือก) ได้ค่า false เพื่อหยุดแอนิเมชันที่วนไม่รู้จบ */
export const ActiveContext = createContext(true);
