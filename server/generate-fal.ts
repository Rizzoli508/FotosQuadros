/**
 * generate-fal.ts
 * Protótipo de geração via fal.ai (FLUX Kontext Max)
 * Substitui o Gemini para testes de velocidade e qualidade
 */

import { fal } from '@fal-ai/client';

// Configura credenciais no nível do módulo
fal.config({ credentials: process.env.FAL_KEY! });

// Reutiliza os mesmos prompts do generate.ts
const PREAMBLE_2P = `Two people portrait. Use the uploaded face photos as identity references for both subjects. Preserve 100% each subject's real facial identity: same bone structure, eyes, nose, mouth shape, skin tone. `;

const PREAMBLE_3P = `Family portrait. Use the uploaded face photos as identity references for all subjects. Preserve 100% each subject's real facial identity: same bone structure, eyes, nose, mouth shape, skin tone. `;

const PREAMBLE_PET = `Person and pet portrait. Use the uploaded photos as identity references for both the person and the pet. Preserve the person's facial identity and the pet's breed, fur texture and face shape. `;

const SUFFIX = `85mm lens, ultra sharp focus on eyes, 8K resolution. Vertical format 4:5.`;

const PROMPTS: Record<string, Record<string, Record<string, string>>> = {
  '2p_1': {
    classico: {
      pb: PREAMBLE_2P + `Ultra-realistic black and white couple portrait. The man is seated in front, fitted plain black t-shirt, looking confidently at the camera. The woman is standing directly behind him, both arms wrapped around his chest from behind, her face just above and behind his head, looking softly at the camera. She wears an oversized white button-up shirt. Clean light gray seamless background. High-end beauty lighting, elegant cinematic black and white grading. Medium portrait from mid-torso up. ` + SUFFIX,
      color: PREAMBLE_2P + `Ultra-realistic full color couple portrait. The man is seated in front, fitted plain black t-shirt, looking confidently at the camera. The woman is standing directly behind him, both arms wrapped around his chest from behind, her face just above and behind his head, looking softly at the camera. She wears an oversized white button-up shirt. Clean light gray seamless background. High-end beauty lighting, elegant cinematic full-color grading. Medium portrait from mid-torso up. ` + SUFFIX,
    },
  },
  '2p_2': {
    classico: {
      pb: PREAMBLE_2P + `Ultra-realistic black and white mother and baby portrait. Both in profile facing each other, noses almost touching. Mother on the LEFT, baby on the RIGHT. Mother holds the baby with both arms. Mother wears a simple dark top, baby is shirtless. Clean light gray seamless background. Soft beauty lighting, elegant cinematic black and white grading. Medium close-up portrait. ` + SUFFIX,
      color: PREAMBLE_2P + `Ultra-realistic full color mother and baby portrait. Both in profile facing each other, noses almost touching. Mother on the LEFT, baby on the RIGHT. Mother holds the baby with both arms. Mother wears a simple dark top, baby is shirtless. Clean light gray seamless background. Soft beauty lighting, elegant cinematic full-color grading. Medium close-up portrait. ` + SUFFIX,
    },
    intimo: {
      pb: PREAMBLE_2P + `Ultra-realistic black and white mother and baby portrait. Mother holds the baby against her chest, both faces cheek to cheek. Mother's face on the LEFT looking at the camera with a serene loving expression. Baby on the RIGHT facing the camera. Baby in a simple white baby dress with a soft bonnet. Mother in a simple dark short sleeve top. Dark dramatic background. Soft controlled lighting on both faces. Elegant cinematic black and white grading. Medium portrait from mid-torso up. ` + SUFFIX,
      color: PREAMBLE_2P + `Ultra-realistic full color mother and baby portrait. Mother holds the baby against her chest, both faces cheek to cheek. Mother's face on the LEFT looking at the camera with a serene loving expression. Baby on the RIGHT facing the camera. Baby in a simple white baby dress with a soft bonnet. Mother in a simple dark short sleeve top. Clean light gray seamless background. Soft controlled lighting on both faces. Elegant cinematic full-color grading. Medium portrait from mid-torso up. ` + SUFFIX,
    },
  },
  '2p_5': {
    classico: {
      pb: PREAMBLE_2P + `Ultra-realistic black and white mother and son portrait. Mother leaning into son, resting head on his upper chest, son with ONE arm over her shoulders, both looking at camera. Son in white shirt, mother in black top. Clean light gray seamless background. High-end beauty lighting, elegant cinematic black and white grading. Medium portrait from mid-torso up. ` + SUFFIX,
      color: PREAMBLE_2P + `Ultra-realistic full color mother and son portrait. Mother leaning into son, resting head on his upper chest, son with ONE arm over her shoulders, both looking at camera. Son in white shirt, mother in black top. Clean light gray seamless background. High-end beauty lighting, elegant cinematic full-color grading. Medium portrait from mid-torso up. ` + SUFFIX,
    },
  },
};

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
