/**
 * generate-openai.ts
 * Geração direta via OpenAI gpt-image-2 (sem passar pelo fal.ai)
 * Low quality — ~$0.011-0.015/imagem, aceita múltiplas fotos de referência
 */

import OpenAI, { toFile } from 'openai';
import { PROMPTS } from './generate';

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function generatePortraitOpenAI(
  moldId: string,
  subStyle: string,
  finish: string,
  images: string[]
): Promise<{ imageBase64: string; mimeType: string }> {
  const promptMap = PROMPTS[moldId];
  if (!promptMap) throw new Error(`Mold ID não encontrado: ${moldId}`);

  const styleKey = promptMap[subStyle] ? subStyle : Object.keys(promptMap)[0];
  const finishMap = promptMap[styleKey];
  const prompt = finishMap[finish] || finishMap['pb'];
  if (!prompt) throw new Error(`Prompt não encontrado: ${moldId}/${styleKey}/${finish}`);

  console.log(`[openai] Iniciando geração — moldId=${moldId} quality=low`);

  // Converte base64 → File para upload multipart
  const imageFiles = await Promise.all(
    images.map(async (base64: string, i: number) => {
      const clean = base64.replace(/^data:image\/[a-z]+;base64,/, '');
      const buffer = Buffer.from(clean, 'base64');
      return await toFile(buffer, `ref-${i}.jpg`, { type: 'image/jpeg' });
    })
  );

  console.log(`[openai] ${imageFiles.length} imagem(ns) preparada(s) para envio`);

  const response = await client.images.edit({
    model: 'gpt-image-2',
    image: imageFiles as any,
    prompt,
    quality: 'low',
  });

  console.log(`[openai] Geração concluída (gpt-image-2) — moldId=${moldId}`);

  const imageBase64 = response.data[0].b64_json;
  if (!imageBase64) throw new Error('OpenAI não retornou imagem na resposta.');

  return { imageBase64, mimeType: 'image/png' };
}

/** Geração com prompt livre — sem lookup de PROMPTS, sem moldId */
export async function generatePortraitCustom(
  prompt: string,
  images: string[]
): Promise<{ imageBase64: string; mimeType: string }> {
  const imageFiles = await Promise.all(
    images.map(async (base64: string, i: number) => {
      const clean = base64.replace(/^data:image\/[a-z]+;base64,/, '');
      const buffer = Buffer.from(clean, 'base64');
      return await toFile(buffer, `ref-${i}.jpg`, { type: 'image/jpeg' });
    })
  );

  console.log(`[openai] Custom generation — ${imageFiles.length} imagem(ns), prompt: ${prompt.slice(0, 80)}...`);

  const response = await client.images.edit({
    model: 'gpt-image-2',
    image: imageFiles as any,
    prompt,
    quality: 'low',
  });

  console.log(`[openai] Custom generation concluída`);

  const imageBase64 = response.data[0].b64_json;
  if (!imageBase64) throw new Error('OpenAI não retornou imagem na resposta.');

  return { imageBase64, mimeType: 'image/png' };
}
