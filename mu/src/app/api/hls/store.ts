// app/api/hls/store.ts
export type Track = { url: string; title?: string; duration: number; discontinuity?: boolean };

const STORE = new Map<string, string>();
export function putM3U8(id: string, body: string) { STORE.set(id, body); }
export function getM3U8(id: string) { return STORE.get(id) ?? null; }
export function makeId() { return Math.random().toString(36).slice(2) + Date.now().toString(36); }
