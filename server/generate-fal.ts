/**
 * generate-fal.ts
 * Geração via fal.ai usando GPT Image 2 Edit (openai/gpt-image-2/edit)
 * Low quality — ~$0.015/imagem, aceita múltiplas fotos de referência
 */

import { fal } from '@fal-ai/client';
import { PROMPTS } from './generate';

// Configura credenciais no nível do módulo
fal.config({ credentials: process.env.FAL_KEY! });

async function uploadToFal(base64: string): Promise<string> {
  const cleanBase64 = base64.replace(/^data:image\/[a-z]+;base64,/, '');
  const buffer = Buffer.from(cleanBase64, 'base64');
  const blob = new Blob([buffer], { type: 'image/jpeg' });
  return await fal.storage.upload(blob as any);
}

export async function generatePortraitFal(
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

  console.log(`[fal.ai] Iniciando geração — moldId=${moldId}`);

  // Faz upload das imagens de referência pro fal.storage
  const imageUrls = await Promise.all(images.map(uploadToFal));
  console.log(`[fal.ai] ${imageUrls.length} imagem(ns) enviada(s) ao storage`);

  // GPT Image 2 Edit — low quality (~$0.015), aceita fotos de referência via image_urls
  const result = await fal.subscribe('openai/gpt-image-2/edit', {
    input: {
      prompt,
      image_urls: imageUrls,       // fotos de referência das pessoas
      quality: 'low',              // ~$0.015/imagem (vs $0.08 anterior)
      image_size: 'portrait_4_3',  // formato retrato
      output_format: 'jpeg',
    },
  }) as any;

  console.log(`[fal.ai] Geração concluída (gpt-image-2/edit) — moldId=${moldId}`);

  const imageUrl: string = result.data?.images?.[0]?.url;
  if (!imageUrl) throw new Error('fal.ai não retornou imagem na resposta.');

  // Baixa a imagem e converte para base64
  const imgRes = await fetch(imageUrl);
  const imgBuffer = await imgRes.arrayBuffer();
  const imageBase64 = Buffer.from(imgBuffer).toString('base64');

  return { imageBase64, mimeType: 'image/jpeg' };
}
