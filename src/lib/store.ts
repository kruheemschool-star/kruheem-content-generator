"use client";

import { useCallback, useSyncExternalStore } from "react";
import { DEFAULT_CONFIG, DEFAULT_VOICE, normalizeConfig, normalizeVoice } from "./prompt/defaults";
import type { BuilderConfig, HistoryEntry, VoiceProfile } from "./prompt/types";

// ข้อมูลทั้งหมดเก็บในเบราว์เซอร์เครื่องนี้เท่านั้น ไม่ส่งไปที่ไหน
// ถ้าเบราว์เซอร์ไม่ให้เขียน (โหมดส่วนตัว) แอปยังใช้งานได้ในหน้านั้น แค่ไม่จำ

export interface Store<T> {
  get: () => T;
  getServer: () => T;
  set: (next: T | ((prev: T) => T)) => void;
  subscribe: (listener: () => void) => () => void;
}

function createStore<T>(key: string, fallback: T, normalize: (raw: unknown) => T, crossTab = true): Store<T> {
  let cachedRaw: string | null | undefined;
  let cached: T = fallback;
  let memoryOnly = false;
  const listeners = new Set<() => void>();

  function get(): T {
    if (memoryOnly || (!crossTab && cachedRaw !== undefined)) return cached;
    let raw: string | null = null;
    try {
      raw = localStorage.getItem(key);
    } catch {
      memoryOnly = true;
      return cached;
    }
    if (raw !== cachedRaw) {
      cachedRaw = raw;
      try {
        cached = raw ? normalize(JSON.parse(raw)) : fallback;
      } catch {
        cached = fallback;
      }
    }
    return cached;
  }

  function set(next: T | ((prev: T) => T)) {
    const value = typeof next === "function" ? (next as (p: T) => T)(get()) : next;
    const raw = JSON.stringify(value);
    cached = value;
    cachedRaw = raw;
    try {
      localStorage.setItem(key, raw);
    } catch {
      memoryOnly = true;
    }
    listeners.forEach((l) => l());
  }

  function subscribe(listener: () => void) {
    listeners.add(listener);
    const onStorage = (e: StorageEvent) => {
      if (e.key === key) listener();
    };
    if (crossTab) window.addEventListener("storage", onStorage);
    return () => {
      listeners.delete(listener);
      if (crossTab) window.removeEventListener("storage", onStorage);
    };
  }

  return { get, getServer: () => fallback, set, subscribe };
}

export function useStore<T>(store: Store<T>): [T, Store<T>["set"]] {
  const value = useSyncExternalStore(store.subscribe, store.get, store.getServer);
  const set = useCallback((next: T | ((prev: T) => T)) => store.set(next), [store]);
  return [value, set];
}

const MAX_HISTORY = 30;
const MAX_RECENT_OPENINGS = 10;

function normalizeHistory(raw: unknown): HistoryEntry[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(
      (h): h is HistoryEntry =>
        !!h && typeof h === "object" && typeof h.id === "string" && typeof h.at === "number" && typeof h.opening === "string",
    )
    .slice(0, MAX_HISTORY);
}

function normalizeStrings(raw: unknown): string[] {
  return Array.isArray(raw) ? raw.filter((s): s is string => typeof s === "string").slice(0, MAX_RECENT_OPENINGS) : [];
}

export const configStore = createStore<BuilderConfig>("kh-builder-v2", DEFAULT_CONFIG, normalizeConfig);
export const voiceStore = createStore<VoiceProfile>("kh-voice-v1", DEFAULT_VOICE, normalizeVoice);
export const historyStore = createStore<HistoryEntry[]>("kh-history-v1", [], normalizeHistory);
export const openingsStore = createStore<string[]>("kh-openings-v1", [], normalizeStrings);

/** เวอร์ชันที่ครูเลือกใช้ล่าสุด: ใหม่ / เดิม (ก่อนปรับ) / หน้าเปรียบเทียบ
 * ไม่ตามแท็บอื่น เพราะเปิดสองแท็บแล้วสลับเวอร์ชันในแท็บหนึ่ง อีกแท็บจะสลับตามจนงานที่พิมพ์ค้างหาย */
export type AppMode = "new" | "old" | "compare";
export const modeStore = createStore<AppMode>(
  "kh-mode-v1",
  "new",
  (raw) => (raw === "old" || raw === "compare" ? raw : "new"),
  false,
);

/** บันทึกแพตเทิร์นที่ใช้ ข้ามถ้าเพิ่งบันทึกชุดเดียวกันไปไม่ถึง 10 นาที */
export function recordHistory(entry: Omit<HistoryEntry, "id" | "at">) {
  historyStore.set((prev) => {
    const last = prev[0];
    const same =
      last &&
      last.topic === entry.topic &&
      last.opening === entry.opening &&
      last.arc === entry.arc &&
      last.ending === entry.ending &&
      Date.now() - last.at < 10 * 60 * 1000;
    if (same) return prev;
    const id = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
    return [{ ...entry, id, at: Date.now() }, ...prev].slice(0, MAX_HISTORY);
  });
}

export function addRecentOpening(line: string) {
  const clean = line.trim();
  if (!clean) return;
  openingsStore.set((prev) => [clean, ...prev.filter((s) => s !== clean)].slice(0, MAX_RECENT_OPENINGS));
}

export interface Backup {
  app: "kruheem-prompt-builder";
  version: 1;
  voice: VoiceProfile;
  history: HistoryEntry[];
  openings: string[];
}

export function exportBackup(): Backup {
  return {
    app: "kruheem-prompt-builder",
    version: 1,
    voice: voiceStore.get(),
    history: historyStore.get(),
    openings: openingsStore.get(),
  };
}

export function importBackup(raw: unknown): boolean {
  if (!raw || typeof raw !== "object" || (raw as Backup).app !== "kruheem-prompt-builder") return false;
  const b = raw as Backup;
  voiceStore.set(normalizeVoice(b.voice));
  historyStore.set(normalizeHistory(b.history));
  openingsStore.set(normalizeStrings(b.openings));
  return true;
}
