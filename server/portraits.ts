/**
 * portraits.ts
 * Salva retratos no disco local (desenvolvimento).
 * Em produção, trocar para Supabase Storage.
 */
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export const UPLOADS_DIR = path.join(process.cwd(), 'server', 'uploads');
const META_FILE = path.join(UPLOADS_DIR, 'portraits.json');
const MAX_AGE_MS = 48 * 60 * 60 * 1000;

export interface PortraitMeta {
  id: string;
  sent: boolean;
  sending: boolean;
  publicUrl: string;
  createdAt: number;
}

if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

function loadMeta(): Record<string, PortraitMeta> {
  try {
    if (fs.existsSync(META_FILE)) return JSON.parse(fs.readFileSync(META_FILE, 'utf8'));
  } catch {}
  return {};
}

function saveMeta(meta: Record<string, PortraitMeta>): void {
  fs.writeFileSync(META_FILE, JSON.stringify(meta, null, 2), 'utf8');
}

export function cleanupOldPortraits(): void {
  const meta = loadMeta();
  const now = Date.now();
  let changed = false;
  for (const [id, p] of Object.entries(meta)) {
    if (now - p.createdAt > MAX_AGE_MS) {
      try { fs.unlinkSync(path.join(UPLOADS_DIR, `${id}.png`)); } catch {}
      delete meta[id];
      changed = true;
    }
  }
  if (changed) saveMeta(meta);
}

export async function ensureBucket(): Promise<void> {
  // No-op em modo local
}

export async function savePortrait(imageBase64: string): Promise<string> {
  const id = crypto.randomUUID();
  const filePath = path.join(UPLOADS_DIR, `${id}.png`);
  const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
  fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));

  // URL pública local (funciona em desenvolvimento)
  const host = process.env.PUBLIC_URL || 'http://localhost:5000';
  const publicUrl = `${host}/portraits/${id}`;

  const meta = loadMeta();
  meta[id] = { id, sent: false, sending: false, publicUrl, createdAt: Date.now() };
  saveMeta(meta);
  return id;
}

export function getPortrait(id: string): PortraitMeta | null {
  if (!/^[0-9a-f-]{36}$/.test(id)) return null;
  return loadMeta()[id] ?? null;
}

export function getPortraitPath(id: string): string | null {
  if (!/^[0-9a-f-]{36}$/.test(id)) return null;
  const p = path.join(UPLOADS_DIR, `${id}.png`);
  return fs.existsSync(p) ? p : null;
}

export function markPortraitSending(id: string): void {
  const meta = loadMeta();
  if (meta[id]) { meta[id].sending = true; saveMeta(meta); }
}

export function markPortraitSent(id: string): void {
  const meta = loadMeta();
  if (meta[id]) { meta[id].sent = true; meta[id].sending = false; saveMeta(meta); }
}

export function markPortraitSendFailed(id: string): void {
  const meta = loadMeta();
  if (meta[id]) { meta[id].sending = false; saveMeta(meta); }
}
