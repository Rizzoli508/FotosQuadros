/**
 * generate-fal.ts
 * Protótipo de geração via fal.ai (FLUX Kontext Max)
 * Substitui o Gemini para testes de velocidade e qualidade
 */

import { fal } from '@fal-ai/client';
import { PROMPTS } from './generate';

// Configura credenciais no nível do módulo
fal.config({ credentials: process.env.FAL_KEY! });

async function uploadToFal(base64: string): Promise<string> {
  const cleanBase64 = base64.replace(/^data:image\/[a-z]+;base64,/, '');
  const buffer = Buffer.from(cleanBase64, 'base64');
  const blob = new Blob([buffer], { type: 'image/jpeg' });
  const url = await fal.storage.upload(blob as any);
  return url;
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

  // Chama FLUX Pro Kontext com as imagens de referência
  const result = await fal.subscribe('fal-ai/flux-pro/kontext', {
    input: {
      prompt,
      image_url: imageUrls[0],
      num_images: 1,
      output_format: 'jpeg',
    },
  }) as any;

  console.log(`[fal.ai] Geração concluída — moldId=${moldId}`);

  const imageUrl: string = result.data?.images?.[0]?.url;
  if (!imageUrl) throw new Error('fal.ai não retornou imagem na resposta.');

  // Baixa a imagem e converte para base64
  const imgRes = await fetch(imageUrl);
  const imgBuffer = await imgRes.arrayBuffer();
  const imageBase64 = Buffer.from(imgBuffer).toString('base64');

  return { imageBase64, mimeType: 'image/jpeg' };
}
