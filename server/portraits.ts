/**
 * portraits.ts
 * Salva retratos no Supabase Storage (produção Railway).
 * Metadata de estado (sending/sent) fica em memória — dura enquanto o processo viver.
 */
import { createClient } from '@supabase/supabase-js';

const BUCKET = 'portraits';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// Metadata em memória (suficiente para o ciclo de vida de um retrato)
const memMeta: Record<string, { sent: boolean; sending: boolean; createdAt: number }> = {};

export interface PortraitMeta {
  id: string;
  sent: boolean;
  sending: boolean;
  publicUrl: string;
  createdAt: number;
}

export async function ensureBucket(): Promise<void> {
  const { data: buckets } = await supabase.storage.listBuckets();
  const exists = buckets?.some(b => b.name === BUCKET);
  if (!exists) {
    await supabase.storage.createBucket(BUCKET, { public: true });
    console.log(`[Supabase] Bucket "${BUCKET}" criado.`);
  }
}

export function cleanupOldPortraits(): void {
  // Limpeza em memória — arquivos no Supabase expiram por policy do bucket
  const cutoff = Date.now() - 48 * 60 * 60 * 1000;
  for (const [id, m] of Object.entries(memMeta)) {
    if (m.createdAt < cutoff) delete memMeta[id];
  }
}

export async function savePortrait(imageBase64: string): Promise<string> {
  const { randomUUID } = await import('crypto');
  const id = randomUUID();
  const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
  const buffer = Buffer.from(base64Data, 'base64');

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(`${id}.png`, buffer, { contentType: 'image/png', upsert: false });

  if (error) throw new Error(`Supabase upload error: ${error.message}`);

  memMeta[id] = { sent: false, sending: false, createdAt: Date.now() };
  return id;
}

export function getPortrait(id: string): PortraitMeta | null {
  if (!/^[0-9a-f-]{36}$/.test(id)) return null;
  const m = memMeta[id];
  if (!m) return null;
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(`${id}.png`);
  return { id, ...m, publicUrl: data.publicUrl };
}

export async function getPortraitPath(id: string): Promise<Buffer | null> {
  if (!/^[0-9a-f-]{36}$/.test(id)) return null;
  const { data, error } = await supabase.storage.from(BUCKET).download(`${id}.png`);
  if (error || !data) return null;
  return Buffer.from(await data.arrayBuffer());
}

export function markPortraitSending(id: string): void {
  if (memMeta[id]) memMeta[id].sending = true;
}

export function markPortraitSent(id: string): void {
  if (memMeta[id]) { memMeta[id].sent = true; memMeta[id].sending = false; }
}

export function markPortraitSendFailed(id: string): void {
  if (memMeta[id]) memMeta[id].sending = false;
}
