/**
 * generate.ts
 * Geração de retratos via Vertex AI (Gemini) com autenticação por Service Account
 */

import { createSign } from 'crypto';

const PREAMBLE_2P = `Use the uploaded face photos as the ONLY and EXCLUSIVE identity references for both subjects. Discard EVERYTHING from the original photos EXCEPT the facial identities. Completely ignore and overwrite the original clothing, background, lighting, colors, environment, and any visual elements from the source images. Identity lock — do not change the faces. Preserve 100% each subject's real facial identity: same bone structure, same eyes, nose, mouth shape, teeth shape, wrinkles, pores, natural asymmetry, skin tone. Facial expression and head angle may adapt naturally to the pose. CRITICAL ACCESSORY LOCK: If any subject in the uploaded photos is wearing glasses, a cap, a hat, or any facial accessory, you must keep it in the final generation. `;

const PREAMBLE_3P = `Use the uploaded face photos as the ONLY and EXCLUSIVE identity references for all clients. Discard EVERYTHING from the original photos EXCEPT the facial identities. Completely ignore and overwrite the original clothing, background, lighting, colors, environment, and any visual elements from the source images. Identity lock — do not change the faces. Preserve 100% each client's real facial identity: same bone structure, same eyes, nose, mouth shape, teeth shape, wrinkles, pores, natural asymmetry, beard texture and skin tone. Facial expression and head angle may adapt naturally to the pose. CRITICAL ACCESSORY LOCK: If any client in the uploaded photos is wearing glasses, a cap, a hat, or any facial accessory, you must keep it in the final generation. `;

const PREAMBLE_PET = `Use the uploaded photos as the ONLY and EXCLUSIVE identity references for both the person and the pet. Discard EVERYTHING from the original photos EXCEPT the facial identity of the person and the breed appearance, fur texture, color and facial features of the pet. Completely ignore and overwrite the original clothing, background, lighting, colors, environment, and any visual elements from the source images. Identity lock — do not change the face. Preserve 100% the person's real facial identity: same bone structure, same eyes, nose, mouth shape, teeth shape, wrinkles, pores, natural asymmetry, beard texture and skin tone. Preserve 100% the pet's real appearance: same breed, same fur texture, same face shape, same eyes and markings. Facial expression and head angle may adapt naturally to the pose. CRITICAL ACCESSORY LOCK: If the person in the uploaded photo is wearing glasses, a cap, a hat, or any facial accessory, you must keep it in the final generation. `;

const SUFFIX = `85mm lens, ultra sharp focus on eyes, 8K resolution. Vertical format 1080x1350.`;

const PROMPTS: Record<string, Record<string, Record<string, string>>> = {
  '2p_1': {
    classico: {
      pb: PREAMBLE_2P + `Ultra-realistic black and white couple portrait. The man is seated in front, fitted plain black t-shirt, looking confidently at the camera. The woman is standing upright directly behind him, her body fully behind his, taller than him in this composition, leaning slightly forward, both arms wrapped around his chest from behind with hands resting on his torso, her face positioned just above and behind his head, looking softly at the camera. Both bodies face the camera directly. She wears an oversized white button-up shirt with sleeves slightly rolled. Her hair must remain completely natural and loose, never tied, never in a bun, never pinned up. Clean light gray seamless background. High-end beauty lighting setup, large soft key light from the front, luminous and flattering skin tones, very gentle shadow definition on jawlines, smooth highlights, elegant cinematic black and white grading. Medium portrait from mid-torso up. ` + SUFFIX,
      color: PREAMBLE_2P + `Ultra-realistic full color couple portrait. The man is seated in front, fitted plain black t-shirt, looking confidently at the camera. The woman is standing upright directly behind him, her body fully behind his, taller than him in this composition, leaning slightly forward, both arms wrapped around his chest from behind with hands resting on his torso, her face positioned just above and behind his head, looking softly at the camera. Both bodies face the camera directly. She wears an oversized white button-up shirt with sleeves slightly rolled. Her hair must remain completely natural and loose, never tied, never in a bun, never pinned up. Clean light gray seamless background. High-end beauty lighting setup, large soft key light from the front, luminous and flattering skin tones, very gentle shadow definition on jawlines, smooth highlights, elegant cinematic full-color grading. Medium portrait from mid-torso up. ` + SUFFIX,
    },
    intimo: {
      pb: PREAMBLE_2P + `Ultra-realistic black and white couple portrait. The man and woman are facing each other in an extremely intimate close-up, their noses almost touching, foreheads nearly together, eyes closed or looking down, both expressions calm, tender and romantic. The composition is a tight close-up centered on both faces filling the frame. Clean light gray seamless background. High-end beauty lighting setup, soft frontal diffused light, luminous and flattering skin tones, very gentle shadow definition, elegant cinematic black and white grading. Tight close-up portrait. 85mm lens, ultra sharp focus, 8K resolution. Vertical format 1080x1350.`,
      color: PREAMBLE_2P + `Ultra-realistic full color couple portrait. The man and woman are facing each other in an extremely intimate close-up, their noses almost touching, foreheads nearly together, eyes closed or looking down, both expressions calm, tender and romantic. The composition is a tight close-up centered on both faces filling the frame. Clean light gray seamless background. High-end beauty lighting setup, soft frontal diffused light, luminous and flattering skin tones, very gentle shadow definition, elegant cinematic full-color grading. Tight close-up portrait. 85mm lens, ultra sharp focus, 8K resolution. Vertical format 1080x1350.`,
    },
  },
  '2p_2': {
    classico: {
      pb: PREAMBLE_2P + `Ultra-realistic black and white mother and baby portrait. Both subjects are in profile facing each other. The mother is positioned on the LEFT side of the frame, the baby is positioned on the RIGHT side of the frame. Their noses are almost touching, foreheads nearly together. The mother holds the baby with both arms, the baby's small hands resting naturally on the mother's chest. The mother has a serene and loving expression, calm and tender, no big smile. The baby has a subtle natural curious expression, alert and facing the mother. The baby is shirtless with natural soft baby skin. The mother wears a simple dark top. Clean light gray seamless background. Soft beauty lighting, luminous and flattering skin tones, gentle shadows, elegant cinematic black and white grading. Medium close-up portrait showing both faces and upper bodies clearly, camera slightly pulled back to show more context. ` + SUFFIX,
      color: PREAMBLE_2P + `Ultra-realistic full color mother and baby portrait. Both subjects are in profile facing each other. The mother is positioned on the LEFT side of the frame, the baby is positioned on the RIGHT side of the frame. Their noses are almost touching, foreheads nearly together. The mother holds the baby with both arms, the baby's small hands resting naturally on the mother's chest. The mother has a serene and loving expression, calm and tender, no big smile. The baby has a subtle natural curious expression, alert and facing the mother. The baby is shirtless with natural soft baby skin. The mother wears a simple dark top. Clean light gray seamless background. Soft beauty lighting, luminous and flattering skin tones, gentle shadows, elegant cinematic full-color grading. Medium close-up portrait showing both faces and upper bodies clearly, camera slightly pulled back to show more context. ` + SUFFIX,
    },
    intimo: {
      pb: PREAMBLE_2P + `EXCEPTION: Do not add any hat, beanie or head accessory to the mother unless she is clearly wearing one in her uploaded photo. Ultra-realistic black and white mother and baby portrait. The mother holds the baby against her chest, both faces pressed cheek to cheek, touching. The mother's face is on the LEFT turned slightly toward the baby, looking at the camera with a serene and loving expression. The baby is on the RIGHT facing the camera directly with a cute curious expression. Their cheeks are touching, heads at the same level, very close together filling the frame. The mother's both arms are clearly visible — one arm supporting the baby from below, the other arm wrapped around the baby's back, both hands fully visible. The baby wears a delicate white linen baby dress with fine lace trim and an elegant wide brim ivory linen bonnet with ribbon tie. The mother wears a simple dark short sleeve top. Dark dramatic background with subtle deep gradient, cinematic and moody. Soft controlled lighting on both faces, gentle shadows. Elegant cinematic black and white grading. Medium portrait from mid-torso up. ` + SUFFIX,
      color: PREAMBLE_2P + `EXCEPTION: Do not add any hat, beanie or head accessory to the mother unless she is clearly wearing one in her uploaded photo. Ultra-realistic full color mother and baby portrait. The mother holds the baby against her chest, both faces pressed cheek to cheek, touching. The mother's face is on the LEFT turned slightly toward the baby, looking at the camera with a serene and loving expression. The baby is on the RIGHT facing the camera directly with a cute curious expression. Their cheeks are touching, heads at the same level, very close together filling the frame. The mother's both arms are clearly visible — one arm supporting the baby from below, the other arm wrapped around the baby's back, both hands fully visible. The baby wears a delicate white linen baby dress with fine lace trim and an elegant wide brim ivory linen bonnet with ribbon tie. The mother wears a simple dark short sleeve top. Clean light gray seamless background. Soft controlled lighting on both faces, gentle shadows. Elegant cinematic full-color grading. Medium portrait from mid-torso up. ` + SUFFIX,
    },
  },
  '2p_3': {
    classico: {
      pb: PREAMBLE_2P + `Ultra-realistic black and white mother and daughter portrait. Both stand closer — shoulders gently touching, both looking at camera with soft smiles. Mother in black tailored jacket, daughter in white blouse. Clean light gray seamless background. High-end beauty lighting setup, large soft key light from the front, luminous and flattering skin tones, very gentle shadow definition on jawlines, smooth highlights, elegant cinematic black and white grading. Medium portrait from mid-torso up. ` + SUFFIX,
      color: PREAMBLE_2P + `Ultra-realistic full color mother and daughter portrait. Both stand closer — shoulders gently touching, both looking at camera with soft smiles. Mother in black tailored jacket, daughter in white blouse. Clean light gray seamless background. High-end beauty lighting setup, large soft key light from the front, luminous and flattering skin tones, very gentle shadow definition on jawlines, smooth highlights, elegant cinematic full-color grading. Medium portrait from mid-torso up. ` + SUFFIX,
    },
    intimo: {
      pb: PREAMBLE_2P + `Ultra-realistic black and white grandmother and granddaughter portrait. The grandmother is positioned on the RIGHT side of the frame, standing upright facing the camera with a visible little closed-mouth smile. The corners of her lips must be gently lifted upward, cheeks slightly raised, creating a clear but delicate expression of warmth and reassurance. The expression must not be neutral — it must show a soft comforting smile. The granddaughter is positioned on the LEFT side, leaning her head gently against the grandmother's upper chest with eyes closed and a peaceful expression. She has one hand resting softly on the grandmother's chest. Her other arm remains down along her own body. The grandmother has only one hand resting lightly on the granddaughter's waist. Her other arm remains relaxed down along her body. No full embrace, no crossed arms. Medium portrait from mid-torso up. Light knitted sweater on the granddaughter, dark elegant blazer on the grandmother. Clean light gray seamless background. Soft frontal beauty lighting, elegant cinematic black and white grading. ` + SUFFIX,
      color: PREAMBLE_2P + `Ultra-realistic full color grandmother and granddaughter portrait. The grandmother is positioned on the RIGHT side of the frame, standing upright facing the camera with a visible little closed-mouth smile. The corners of her lips must be gently lifted upward, cheeks slightly raised, creating a clear but delicate expression of warmth and reassurance. The expression must not be neutral — it must show a soft comforting smile. The granddaughter is positioned on the LEFT side, leaning her head gently against the grandmother's upper chest with eyes closed and a peaceful expression. She has one hand resting softly on the grandmother's chest. Her other arm remains down along her own body. The grandmother has only one hand resting lightly on the granddaughter's waist. Her other arm remains relaxed down along her body. No full embrace, no crossed arms. Medium portrait from mid-torso up. Light knitted sweater on the granddaughter, dark elegant blazer on the grandmother. Clean light gray seamless background. Soft frontal beauty lighting, elegant cinematic full-color grading. ` + SUFFIX,
    },
  },
  '2p_4': {
    classico: {
      pb: PREAMBLE_2P + `Ultra-realistic black and white portrait of elderly father and adult daughter. They stand naturally side by side with shoulders gently touching. The father leans very slightly toward her, creating a relaxed and organic connection. One of his arms rests softly behind her back in a natural, effortless way — not wrapping, not embracing tightly, just lightly placed. The daughter keeps her arms relaxed along her body. Both look directly into the camera with soft, subtle closed-mouth smiles. Expression should feel warm, effortless and calm — as if the photo was taken during a quiet, genuine moment. Wardrobe refined and minimal: Father in dark tailored blazer or dark shirt. Daughter in elegant white structured blouse. Framing from mid torso up. Clean light gray seamless studio background consistent with the collection. Soft diffused lighting with gentle contrast and natural skin texture. High-end black and white grading. ` + SUFFIX,
      color: PREAMBLE_2P + `Ultra-realistic full color portrait of elderly father and adult daughter. They stand naturally side by side with shoulders gently touching. The father leans very slightly toward her, creating a relaxed and organic connection. One of his arms rests softly behind her back in a natural, effortless way — not wrapping, not embracing tightly, just lightly placed. The daughter keeps her arms relaxed along her body. Both look directly into the camera with soft, subtle closed-mouth smiles. Expression should feel warm, effortless and calm — as if the photo was taken during a quiet, genuine moment. Wardrobe refined and minimal: Father in dark tailored blazer or dark shirt. Daughter in elegant white structured blouse. Framing from mid torso up. Clean light gray seamless studio background consistent with the collection. Soft diffused lighting with gentle contrast and natural skin texture. High-end full-color grading. ` + SUFFIX,
    },
    intimo: {
      pb: PREAMBLE_2P + `Ultra-realistic black and white father and adult daughter portrait. Both standing side by side, the father slightly behind the daughter, his arm wrapped around her from behind resting on her shoulder. The daughter looks softly at the father with admiration and love. The father looks directly and proudly at the camera with a warm and protective expression. The father wears a simple dark shirt. The daughter wears a simple light top. Clean light gray seamless background. High-end beauty lighting setup, soft frontal diffused light, subtle shadow definition on jawlines, smooth skin tones, gentle cinematic black and white grading. Medium portrait from mid-torso up. ` + SUFFIX,
      color: PREAMBLE_2P + `Ultra-realistic full color father and adult daughter portrait. Both standing side by side, the father slightly behind the daughter, his arm wrapped around her from behind resting on her shoulder. The daughter looks softly at the father with admiration and love. The father looks directly and proudly at the camera with a warm and protective expression. The father wears a simple dark shirt. The daughter wears a simple light top. Clean light gray seamless background. High-end beauty lighting setup, soft frontal diffused light, subtle shadow definition on jawlines, smooth skin tones, gentle cinematic full-color grading. Medium portrait from mid-torso up. ` + SUFFIX,
    },
  },
  '2p_5': {
    classico: {
      pb: PREAMBLE_2P + `Ultra-realistic black and white mother and son portrait. Mother leaning into son, resting head on his upper chest, son with ONE arm over her shoulders, both looking at camera. Son in white shirt, mother in black top. Clean light gray seamless background. High-end beauty lighting setup, large soft key light from the front, luminous and flattering skin tones, very gentle shadow definition on jawlines, smooth highlights, elegant cinematic black and white grading. Medium portrait from mid-torso up. ` + SUFFIX,
      color: PREAMBLE_2P + `Ultra-realistic full color mother and son portrait. Mother leaning into son, resting head on his upper chest, son with ONE arm over her shoulders, both looking at camera. Son in white shirt, mother in black top. Clean light gray seamless background. High-end beauty lighting setup, large soft key light from the front, luminous and flattering skin tones, very gentle shadow definition on jawlines, smooth highlights, elegant cinematic full-color grading. Medium portrait from mid-torso up. ` + SUFFIX,
    },
    intimo: {
      pb: PREAMBLE_2P + `Ultra-realistic black and white intimate portrait of elderly mother and adult son. They stand very close, bodies angled slightly inward. The mother gently places one hand on her son's face — touching his cheek or jaw in a natural maternal gesture. The son softly holds her wrist or hand with one hand, not restraining, just acknowledging the touch. Their foreheads are close but not touching. Neither of them looks at the camera. They look at each other with calm emotional softness. The mother carries a subtle peaceful smile — warmth and pride. The son has a restrained, masculine micro smile — eyes softened, composed, grounded. No exaggerated embrace. No dramatic emotion. The intimacy comes from proximity and hand-to-face connection. Premium wardrobe: son in tailored white structured shirt. Mother in elegant dark blouse. Timeless, refined styling. Framing from mid torso up, clearly capturing the hand-to-face gesture. Clean light gray seamless studio background. Soft diffused studio lighting with gentle contrast and natural tonal depth. Elegant black and white grading with visible skin texture and sculpted realism. ` + SUFFIX,
      color: PREAMBLE_2P + `Ultra-realistic full color intimate portrait of elderly mother and adult son. They stand very close, bodies angled slightly inward. The mother gently places one hand on her son's face — touching his cheek or jaw in a natural maternal gesture. The son softly holds her wrist or hand with one hand, not restraining, just acknowledging the touch. Their foreheads are close but not touching. Neither of them looks at the camera. They look at each other with calm emotional softness. The mother carries a subtle peaceful smile — warmth and pride. The son has a restrained, masculine micro smile — eyes softened, composed, grounded. No exaggerated embrace. No dramatic emotion. The intimacy comes from proximity and hand-to-face connection. Premium wardrobe: son in tailored white structured shirt. Mother in elegant dark blouse. Timeless, refined styling. Framing from mid torso up, clearly capturing the hand-to-face gesture. Clean light gray seamless studio background. Soft diffused studio lighting with gentle contrast and natural tonal depth. Elegant full-color grading with visible skin texture and sculpted realism. ` + SUFFIX,
    },
  },
  '2p_6': {
    classico: {
      pb: PREAMBLE_2P + `Ultra-realistic black and white portrait of elderly father and adult son. The father is positioned slightly in FRONT and to the LEFT of the frame. The adult son stands half a step behind him on the RIGHT side, creating subtle depth and hierarchy. Their shoulders are slightly angled, not perfectly parallel, giving a strong masculine stance. Both subjects stand upright with firm grounded posture. Their arms remain fully down along their own bodies. No physical contact, no embrace, no touching. Both look directly at the camera with calm, dignified expressions and a subtle closed-mouth micro-smile. The smile must be restrained and natural — slight upward curve at the corners of the lips, relaxed eyes, conveying quiet pride and mutual respect without softness or exaggeration. The father conveys authority, wisdom and serenity. The son conveys strength, continuity and respectful confidence. The son wears a premium tailored white shirt with structured collar. The father wears a refined dark blazer or classic tailored jacket. Wardrobe must feel sophisticated, timeless and high-end editorial. Medium portrait from mid-torso up. Clean light gray seamless background. Strong directional beauty lighting with subtle shadow sculpting to emphasize bone structure and generational contrast. Elegant cinematic black and white grading with deep tonal separation. ` + SUFFIX,
      color: PREAMBLE_2P + `Ultra-realistic full color portrait of elderly father and adult son. The father is positioned slightly in FRONT and to the LEFT of the frame. The adult son stands half a step behind him on the RIGHT side, creating subtle depth and hierarchy. Their shoulders are slightly angled, not perfectly parallel, giving a strong masculine stance. Both subjects stand upright with firm grounded posture. Their arms remain fully down along their own bodies. No physical contact, no embrace, no touching. Both look directly at the camera with calm, dignified expressions and a subtle closed-mouth micro-smile. The smile must be restrained and natural — slight upward curve at the corners of the lips, relaxed eyes, conveying quiet pride and mutual respect without softness or exaggeration. The father conveys authority, wisdom and serenity. The son conveys strength, continuity and respectful confidence. The son wears a premium tailored white shirt with structured collar. The father wears a refined dark blazer or classic tailored jacket. Wardrobe must feel sophisticated, timeless and high-end editorial. Medium portrait from mid-torso up. Clean light gray seamless background. Strong directional beauty lighting with subtle shadow sculpting to emphasize bone structure and generational contrast. Elegant cinematic full-color grading with deep tonal separation. ` + SUFFIX,
    },
    intimo: {
      pb: PREAMBLE_2P + `Ultra-realistic black and white intimate portrait of elderly father and adult son. The father is seated. The son stands close beside him, slightly angled inward. They are positioned closer than in the classic version. The father turns his head slightly upward toward his son with a subtle, contained smile of pride and warmth. The son looks down at his father with calm admiration and protective presence — micro closed-mouth smile, softened eyes. The father gently rests one hand on the son's forearm in a natural, grounded gesture. No embrace. No exaggerated emotion. Premium wardrobe: son in tailored white structured shirt. Father in refined dark blazer with classic shirt. Timeless, high-end aesthetic. Framing from mid torso up including seated posture. Clean light gray seamless studio background, no dark gradient, no vignette. Soft diffused studio lighting with gentle contrast and even tonal balance. Elegant black and white grading with natural skin texture. ` + SUFFIX,
      color: PREAMBLE_2P + `Ultra-realistic full color intimate portrait of elderly father and adult son. The father is seated. The son stands close beside him, slightly angled inward. They are positioned closer than in the classic version. The father turns his head slightly upward toward his son with a subtle, contained smile of pride and warmth. The son looks down at his father with calm admiration and protective presence — micro closed-mouth smile, softened eyes. The father gently rests one hand on the son's forearm in a natural, grounded gesture. No embrace. No exaggerated emotion. Premium wardrobe: son in tailored white structured shirt. Father in refined dark blazer with classic shirt. Timeless, high-end aesthetic. Framing from mid torso up including seated posture. Clean light gray seamless studio background, no dark gradient, no vignette. Soft diffused studio lighting with gentle contrast and even tonal balance. Elegant full-color grading with natural skin texture. ` + SUFFIX,
    },
  },
  '3p_1': {
    classico: {
      pb: PREAMBLE_3P + `Ultra-realistic black and white family portrait in a vertical layered composition. The man stands at the back, his full face clearly visible — eyes, nose, mouth all fully shown — only his chin and jaw are slightly occluded by the top of the woman's head in front of him. The woman is in the middle, her full face clearly visible — eyes, nose, mouth all shown — only her chin is slightly covered by the top of the baby's head below her. The baby is fully in front, their entire face completely unobstructed and closest to the camera. The overlap between each person is minimal — only the chin area of the person behind is hidden by the hairline of the person in front. Each face is nearly complete and fully readable. All three look directly and calmly at the camera. Dark dramatic textured background, deep moody gradient. Strong frontal beauty lighting. Elegant cinematic black and white grading. Medium-wide portrait pulled back to show full heads, shoulders and upper chest of all three subjects clearly, with comfortable breathing room around the entire composition. 85mm lens, ultra sharp focus on all three pairs of eyes, 8K resolution. Vertical format 1080x1350.`,
      color: PREAMBLE_3P + `Ultra-realistic full color family portrait in a vertical layered composition. The man stands at the back, his full face clearly visible — eyes, nose, mouth all fully shown — only his chin and jaw are slightly occluded by the top of the woman's head in front of him. The woman is in the middle, her full face clearly visible — eyes, nose, mouth all shown — only her chin is slightly covered by the top of the baby's head below her. The baby is fully in front, their entire face completely unobstructed and closest to the camera. The overlap between each person is minimal — only the chin area of the person behind is hidden by the hairline of the person in front. Each face is nearly complete and fully readable. All three look directly and calmly at the camera. Clean light gray seamless background. Strong frontal beauty lighting. Elegant cinematic full-color grading. Medium-wide portrait pulled back to show full heads, shoulders and upper chest of all three subjects clearly, with comfortable breathing room around the entire composition. 85mm lens, ultra sharp focus on all three pairs of eyes, 8K resolution. Vertical format 1080x1350.`,
    },
  },
  '3p_3': {
    classico: {
      pb: PREAMBLE_3P + `Ultra-realistic black and white portrait. Three people lying down looking up at the camera, their faces arranged in a diagonal cascade from top to bottom of the frame. All three are lying on their backs, heads tilted, faces pointing upward toward the lens. Father at the TOP of the frame, his face largest and furthest back. Mother in the MIDDLE, her face overlapping slightly in front of his, positioned lower. Child at the BOTTOM, smallest face, closest to the camera, slightly overlapping in front of the mother. The overlap is minimal — each face covers only the forehead/top of the face behind. All three have warm natural open smiles, joyful expressions, looking directly up at the camera. Pure black background. Camera pulled back — full faces and upper shoulders visible with black space around the composition. Soft top-down lighting illuminating all three faces evenly. Cinematic black and white grading. Vertical format 1080x1350.`,
      color: PREAMBLE_3P + `Ultra-realistic full color portrait. Three people lying down looking up at the camera, their faces arranged in a diagonal cascade from top to bottom of the frame. All three are lying on their backs, heads tilted, faces pointing upward toward the lens. Father at the TOP of the frame, his face largest and furthest back. Mother in the MIDDLE, her face overlapping slightly in front of his, positioned lower. Child at the BOTTOM, smallest face, closest to the camera, slightly overlapping in front of the mother. The overlap is minimal — each face covers only the forehead/top of the face behind. All three have warm natural open smiles, joyful expressions, looking directly up at the camera. Clean light gray seamless background. Camera pulled back — full faces and upper shoulders visible with black space around the composition. Soft top-down lighting illuminating all three faces evenly. Cinematic full-color grading. Vertical format 1080x1350.`,
    },
  },
  '3p_4': {
    classico: {
      pb: PREAMBLE_3P + `Ultra-realistic black and white family portrait. The child is at the CENTER BOTTOM of the frame, facing the camera directly with a gentle natural smile — the only person looking at the camera. The father is on the LEFT, his head tilted inward and downward toward the child, his cheek or temple gently resting against the child's head, his eyes looking down at the child with a warm protective expression. The mother is on the RIGHT, her head tilted inward and downward toward the child, her cheek or temple gently resting against the child's head from the other side, her eyes looking down at the child with a tender loving expression. The three heads form a triangle — child at the bottom point, father and mother forming the two upper points leaning into the child. All faces fully visible and clear. Clean light gray seamless background. Soft frontal beauty lighting, luminous skin tones. Elegant cinematic black and white grading. Medium portrait from mid-torso up. 85mm lens, ultra sharp focus on all three faces, 8K resolution. Vertical format 1080x1350.`,
      color: PREAMBLE_3P + `Ultra-realistic full color family portrait. The child is at the CENTER BOTTOM of the frame, facing the camera directly with a gentle natural smile — the only person looking at the camera. The father is on the LEFT, his head tilted inward and downward toward the child, his cheek or temple gently resting against the child's head, his eyes looking down at the child with a warm protective expression. The mother is on the RIGHT, her head tilted inward and downward toward the child, her cheek or temple gently resting against the child's head from the other side, her eyes looking down at the child with a tender loving expression. The three heads form a triangle — child at the bottom point, father and mother forming the two upper points leaning into the child. All faces fully visible and clear. Clean light gray seamless background. Soft frontal beauty lighting, luminous skin tones. Elegant cinematic full-color grading. Medium portrait from mid-torso up. 85mm lens, ultra sharp focus on all three faces, 8K resolution. Vertical format 1080x1350.`,
    },
  },
  '4p_1': {
    classico: {
      pb: PREAMBLE_3P + `Four people arranged in a vertical cascade all facing the camera directly. Father at the TOP — his face highest in the frame, furthest back, his chin slightly covered by the head below him. Mother second — her face below his, her chin slightly covered by the head below her. Child one third — her face below the mother's, chin slightly covered by the smallest child below. Youngest child at the BOTTOM FRONT — face fully visible and unobstructed, closest to the camera. Each person's head covers only the chin/jaw of the person above — all four faces nearly complete and fully readable. All four look directly at the camera with calm composed expressions. Dark dramatic textured background, deep moody gradient. Strong frontal beauty lighting, luminous skin tones. Elegant cinematic black and white grading. Camera pulled back showing all four heads and upper shoulders clearly. No face cropped — all four fully visible. 85mm lens, ultra sharp focus on all four faces, 8K resolution. Vertical format 1080x1620.`,
      color: PREAMBLE_3P + `Four people arranged in a vertical cascade all facing the camera directly. Father at the TOP — his face highest in the frame, furthest back, his chin slightly covered by the head below him. Mother second — her face below his, her chin slightly covered by the head below her. Child one third — her face below the mother's, chin slightly covered by the smallest child below. Youngest child at the BOTTOM FRONT — face fully visible and unobstructed, closest to the camera. Each person's head covers only the chin/jaw of the person above — all four faces nearly complete and fully readable. All four look directly at the camera with calm composed expressions. Clean light gray seamless background. Strong frontal beauty lighting, luminous skin tones. Elegant cinematic full-color grading. Camera pulled back showing all four heads and upper shoulders clearly. No face cropped — all four fully visible. 85mm lens, ultra sharp focus on all four faces, 8K resolution. Vertical format 1080x1620.`,
    },
  },
  '4p_2': {
    classico: {
      pb: PREAMBLE_3P + `Four people in side profile all facing LEFT. All heads completely visible, no cropping. Wide shot with generous black space on all sides. The four heads are arranged on a DIAGONAL LINE from upper-left to lower-right: father's head at upper-left corner of frame, mother's head one third down, first child's head two thirds down, youngest child's head at lower-right corner of frame. Father is furthest from camera and highest. Mother is second depth and second height. First child is third depth and third height. Youngest child is closest to camera and lowest. Each head is offset both downward AND to the right relative to the one behind. The diagonal shift between heads is significant — not stacked vertically, not side by side horizontally, but truly diagonal. Minimal overlap — only the hair of the person in front lightly grazes the face behind. All four faces nearly fully visible. Pure black background. Rim lighting from left. Cinematic black and white. Vertical format 1080x1920.`,
      color: PREAMBLE_3P + `Four people in side profile all facing LEFT. All heads completely visible, no cropping. Wide shot with generous black space on all sides. The four heads are arranged on a DIAGONAL LINE from upper-left to lower-right: father's head at upper-left corner of frame, mother's head one third down, first child's head two thirds down, youngest child's head at lower-right corner of frame. Father is furthest from camera and highest. Mother is second depth and second height. First child is third depth and third height. Youngest child is closest to camera and lowest. Each head is offset both downward AND to the right relative to the one behind. The diagonal shift between heads is significant — not stacked vertically, not side by side horizontally, but truly diagonal. Minimal overlap — only the hair of the person in front lightly grazes the face behind. All four faces nearly fully visible. Clean light gray seamless background. Rim lighting from left. Cinematic full color. Vertical format 1080x1920.`,
    },
  },
  '4p_3': {
    classico: {
      pb: PREAMBLE_3P + `Ultra-realistic black and white family portrait. Four people facing the camera. Father at the BACK, arms hidden, not visible. Mother in front of father, both hands on children's shoulders, gentle smile, looking at camera. Two children at the front side by side, each with one arm around the other's shoulder from behind, crossed behind each other's backs. Both children look at camera with gentle smiles. Dark dramatic background. Strong frontal lighting. Cinematic black and white. Medium portrait. 85mm lens, 8K. Vertical format 1080x1350.`,
      color: PREAMBLE_3P + `Ultra-realistic full color family portrait. Four people facing the camera. Father at the BACK, arms hidden, not visible. Mother in front of father, both hands on children's shoulders, gentle smile, looking at camera. Two children at the front side by side, each with one arm around the other's shoulder from behind, crossed behind each other's backs. Both children look at camera with gentle smiles. Clean light gray seamless background. Strong frontal lighting. Cinematic full color. Medium portrait. 85mm lens, 8K. Vertical format 1080x1350.`,
    },
  },
  '4p_4': {
    classico: {
      pb: PREAMBLE_3P + `Ultra-realistic black and white portrait. Four people lying down looking up at the camera, their faces arranged in a diagonal cascade from top to bottom of the frame. All four are lying on their backs, heads tilted, faces pointing upward toward the lens. Father at the TOP of the frame, his face largest and furthest back. Mother in the MIDDLE-TOP, her face overlapping slightly in front of his, positioned lower. First child in the MIDDLE-BOTTOM, face overlapping slightly in front of the mother. Youngest child at the BOTTOM, smallest face, closest to the camera, slightly overlapping in front of the first child. The overlap is minimal — each face covers only the forehead/top of the face behind. All four have warm natural open smiles, joyful expressions, looking directly up at the camera. Pure black background. Camera pulled back — full faces visible with black space around the composition. Soft top-down lighting illuminating all four faces evenly. Cinematic black and white grading. Vertical format 1080x1350.`,
      color: PREAMBLE_3P + `Ultra-realistic full color portrait. Four people lying down looking up at the camera, their faces arranged in a diagonal cascade from top to bottom of the frame. All four are lying on their backs, heads tilted, faces pointing upward toward the lens. Father at the TOP of the frame, his face largest and furthest back. Mother in the MIDDLE-TOP, her face overlapping slightly in front of his, positioned lower. First child in the MIDDLE-BOTTOM, face overlapping slightly in front of the mother. Youngest child at the BOTTOM, smallest face, closest to the camera, slightly overlapping in front of the first child. The overlap is minimal — each face covers only the forehead/top of the face behind. All four have warm natural open smiles, joyful expressions, looking directly up at the camera. Clean light gray seamless background. Camera pulled back — full faces visible with black space around the composition. Soft top-down lighting illuminating all four faces evenly. Cinematic full-color grading. Vertical format 1080x1350.`,
    },
  },
  'pet_1': {
    classico: {
      pb: PREAMBLE_PET + `Ultra-realistic black and white portrait. The person is on the LEFT in strict side profile facing RIGHT. The pet is on the RIGHT in strict side profile facing LEFT. The person is standing upright and looking DOWNWARD toward the pet. The pet is positioned lower and looking UPWARD toward the person. The person's chin is at the same height as the top of the pet's skull. Their noses almost touch in the center of the frame. The person is clearly taller — this height difference must be obvious and natural. The person has a very subtle, soft closed-mouth smile. The frame is a medium shot: both subjects visible from top of head to mid-torso. Black background, pure and textureless. LIGHTING: Two separate rim lights — one outlining the person's profile, one creating a halo through the pet's fur. Cinematic black and white, deep rich blacks, sharp detail on beard and fur. 85mm lens, ultra sharp focus, 8K. Vertical format 1080x1350.`,
      color: PREAMBLE_PET + `Ultra-realistic full color portrait. The person is on the LEFT in strict side profile facing RIGHT. The pet is on the RIGHT in strict side profile facing LEFT. The person is standing upright and looking DOWNWARD toward the pet. The pet is positioned lower and looking UPWARD toward the person. The person's chin is at the same height as the top of the pet's skull. Their noses almost touch in the center of the frame. The person is clearly taller — this height difference must be obvious and natural. The person has a very subtle, soft closed-mouth smile. The frame is a medium shot: both subjects visible from top of head to mid-torso. Clean light gray seamless background. LIGHTING: Two separate rim lights — one outlining the person's profile, one creating a halo through the pet's fur. Cinematic full color, rich tonal depth, sharp detail on beard and fur. 85mm lens, ultra sharp focus, 8K. Vertical format 1080x1350.`,
    },
  },
  'pet_2': {
    classico: {
      pb: PREAMBLE_PET + `Ultra-realistic black and white portrait. Camera positioned at floor level shooting at a very low angle, nearly horizontal. Three subjects stacked vertically in a diagonal pile. The man is at the BOTTOM — lying on his side on the floor, his cheek resting on his own fist or closed hand, elbow on the floor — masculine and relaxed posture, his face turned fully toward the camera and closest to the lens, calm and confident expression with a subtle natural smile. The woman is in the MIDDLE — lying on top of the man, her chin or cheek resting on his head, her face turned fully toward the camera with a warm natural smile. The dog is at the TOP — its body resting over the woman's back, its chin resting on the woman's head, both front paws draped forward over her shoulders, looking directly at the camera with a happy expression, mouth open with tongue out. Dark gray seamless studio background. Soft frontal studio lighting illuminating all three faces evenly. Elegant cinematic black and white grading. 85mm lens, ultra sharp focus on all three faces, 8K resolution. Vertical format 1080x1350.`,
      color: PREAMBLE_PET + `Ultra-realistic full color portrait. Camera positioned at floor level shooting at a very low angle, nearly horizontal. Three subjects stacked vertically in a diagonal pile. The man is at the BOTTOM — lying on his side on the floor, his cheek resting on his own fist or closed hand, elbow on the floor — masculine and relaxed posture, his face turned fully toward the camera and closest to the lens, calm and confident expression with a subtle natural smile. The woman is in the MIDDLE — lying on top of the man, her chin or cheek resting on his head, her face turned fully toward the camera with a warm natural smile. The dog is at the TOP — its body resting over the woman's back, its chin resting on the woman's head, both front paws draped forward over her shoulders, looking directly at the camera with a happy expression, mouth open with tongue out. Clean light gray seamless studio background. Soft frontal studio lighting illuminating all three faces evenly. Elegant cinematic full-color grading. 85mm lens, ultra sharp focus on all three faces, 8K resolution. Vertical format 1080x1350.`,
    },
  },
  'pet_3': {
    classico: {
      pb: PREAMBLE_PET + `Ultra-realistic black and white portrait. Camera positioned at floor level shooting horizontally. Four subjects stacked in a diagonal cascade from bottom to top. The dog is at the BOTTOM — lying flat on the floor, facing the camera, chin resting on the floor, happy and playful expression, mouth open with tongue out in a natural panting smile. The child is in the MIDDLE-BOTTOM — lying on top of the dog, their chest resting on the dog's back, chin resting on the dog's head or neck, face turned fully toward the camera with a gentle natural smile. The mother is in the MIDDLE-TOP — lying on top of the child, her chin resting on the child's head, face turned fully toward the camera with a warm natural smile. The father is at the TOP — lying on top of the mother, his chin resting on the mother's head, his elbow on the floor beside them, face turned fully toward the camera with a calm confident smile. All four faces visible in a tight vertical diagonal cascade. Dark gray seamless studio background. Soft frontal studio lighting illuminating all four faces evenly. Elegant cinematic black and white grading. Camera pulled back enough to show all four subjects clearly. 85mm lens, ultra sharp focus on all faces, 8K resolution. Vertical format 1080x1350.`,
      color: PREAMBLE_PET + `Ultra-realistic full color portrait. Camera positioned at floor level shooting horizontally. Four subjects stacked in a diagonal cascade from bottom to top. The dog is at the BOTTOM — lying flat on the floor, facing the camera, chin resting on the floor, happy and playful expression, mouth open with tongue out in a natural panting smile. The child is in the MIDDLE-BOTTOM — lying on top of the dog, their chest resting on the dog's back, chin resting on the dog's head or neck, face turned fully toward the camera with a gentle natural smile. The mother is in the MIDDLE-TOP — lying on top of the child, her chin resting on the child's head, face turned fully toward the camera with a warm natural smile. The father is at the TOP — lying on top of the mother, his chin resting on the mother's head, his elbow on the floor beside them, face turned fully toward the camera with a calm confident smile. All four faces visible in a tight vertical diagonal cascade. Clean light gray seamless studio background. Soft frontal studio lighting illuminating all four faces evenly. Elegant cinematic full-color grading. Camera pulled back enough to show all four subjects clearly. 85mm lens, ultra sharp focus on all faces, 8K resolution. Vertical format 1080x1350.`,
    },
  },
};

// ─── Vertex AI config ─────────────────────────────────────────────────────────
const VERTEX_PROJECT  = process.env.GOOGLE_PROJECT_ID ?? 'gen-lang-client-0149214197';
const VERTEX_LOCATION = 'us-central1';
const VERTEX_MODEL    = 'gemini-2.0-flash-001';
const VERTEX_URL      = `https://${VERTEX_LOCATION}-aiplatform.googleapis.com/v1/projects/${VERTEX_PROJECT}/locations/${VERTEX_LOCATION}/publishers/google/models/${VERTEX_MODEL}:generateContent`;

// Cache do access token (válido ~1h)
let tokenCache: { token: string; expiresAt: number } | null = null;

async function getVertexToken(): Promise<string> {
  if (tokenCache && tokenCache.expiresAt > Date.now() + 60_000) {
    return tokenCache.token;
  }

  const rawJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!rawJson) throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON não configurada.');
  const creds = JSON.parse(rawJson);

  const now = Math.floor(Date.now() / 1000);
  const headerB64  = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
  const payloadB64 = Buffer.from(JSON.stringify({
    iss:   creds.client_email,
    scope: 'https://www.googleapis.com/auth/cloud-platform',
    aud:   creds.token_uri,
    iat:   now,
    exp:   now + 3600,
  })).toString('base64url');

  const sign = createSign('RSA-SHA256');
  sign.update(`${headerB64}.${payloadB64}`);
  const signature = sign.sign(creds.private_key, 'base64url');
  const jwt = `${headerB64}.${payloadB64}.${signature}`;

  const tokenRes = await fetch(creds.token_uri, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion:  jwt,
    }),
  });

  if (!tokenRes.ok) {
    const err = await tokenRes.text().catch(() => '');
    throw new Error(`Vertex AI auth falhou (${tokenRes.status}): ${err}`);
  }

  const tokenData = await tokenRes.json();
  tokenCache = { token: tokenData.access_token, expiresAt: Date.now() + 3_500_000 }; // ~58 min
  console.log('[Vertex AI] Access token obtido com sucesso.');
  return tokenData.access_token;
}

async function callVertexAI(
  parts: any[],
  attemptTimeout = 120_000,
): Promise<{ imageBase64: string; mimeType: string }> {
  const accessToken = await getVertexToken();

  const response = await fetch(VERTEX_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      contents: [{ parts }],
      generationConfig: { responseModalities: ['IMAGE', 'TEXT'] },
    }),
    signal: AbortSignal.timeout(attemptTimeout),
  });

  if (!response.ok) {
    const err = await response.text().catch(() => '');
    throw new Error(`Vertex AI retornou ${response.status}: ${err}`);
  }

  const data = await response.json();

  const candidates = data?.candidates ?? [];
  for (const candidate of candidates) {
    for (const part of candidate?.content?.parts ?? []) {
      const img = part.inlineData || part.inline_data;
      if (img?.data) {
        return {
          imageBase64: img.data,
          mimeType: img.mimeType || img.mime_type || 'image/png',
        };
      }
    }
  }

  throw new Error('Vertex AI não retornou imagem na resposta.');
}

export async function generatePortrait(
  moldId: string,
  subStyle: string,
  finish: string,
  images: string[]
): Promise<{ imageBase64: string; mimeType: string }> {
  if (!process.env.GOOGLE_SERVICE_ACCOUNT_JSON) throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON não configurada.');

  const promptMap = PROMPTS[moldId];
  if (!promptMap) throw new Error(`Mold ID não encontrado: ${moldId}`);

  // Fallback para o primeiro estilo disponível se o subStyle não existir
  const styleKey = promptMap[subStyle] ? subStyle : Object.keys(promptMap)[0];
  const finishMap = promptMap[styleKey];
  const prompt = finishMap[finish] || finishMap['pb'];

  if (!prompt) throw new Error(`Prompt não encontrado: ${moldId}/${styleKey}/${finish}`);

  // Monta partes da requisição (camelCase para Vertex AI)
  const parts: any[] = [{ text: prompt }];
  for (const imgBase64 of images) {
    const cleanBase64 = imgBase64.replace(/^data:image\/[a-z]+;base64,/, '');
    parts.push({
      inlineData: { mimeType: 'image/jpeg', data: cleanBase64 },
    });
  }

  // Tenta até 3 vezes
  const MAX_ATTEMPTS = 3;
  let lastError: Error = new Error('Erro desconhecido.');

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      console.log(`[Vertex AI] Tentativa ${attempt}/${MAX_ATTEMPTS} — moldId=${moldId}`);
      const result = await callVertexAI(parts, 120_000);
      console.log(`[Vertex AI] Sucesso na tentativa ${attempt}`);
      return result;
    } catch (err: any) {
      lastError = err;
      console.warn(`[Vertex AI] Tentativa ${attempt} falhou: ${err.message}`);
      if (attempt < MAX_ATTEMPTS) {
        await new Promise(r => setTimeout(r, 3_000));
      }
    }
  }

  throw lastError;
}
