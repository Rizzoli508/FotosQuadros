/**
 * bot.ts
 * Agente WhatsApp com IA para entrega do PDF "7 Dias Do Jeito Dela"
 * @dojeitodelaps
 */

import fs from 'fs';
import path from 'path';
import {
  appmaxGetOrCreateCustomer,
  appmaxCreateOrder,
  appmaxCreatePix,
  appmaxGetOrderStatus,
} from './appmax';

// ── Tipos ─────────────────────────────────────────────────────────────────────
interface Message {
  role: 'user' | 'model';
  parts: [{ text: string }];
}

interface ConversationState {
  status: 'talking' | 'awaiting_payment' | 'paid';
  history: Message[];
  orderId?: number;
  pixCopyPaste?: string;
  createdAt: number;
  lastActivity: number;
}

const conversations = new Map<string, ConversationState>();

// ── Mensagens fixas de abertura ───────────────────────────────────────────────
const MSG_1 = `Oi 🌸 que bom que você veio até aqui.`;

const MSG_2 = `se você chegou até aqui, é porque alguma parte de você tá pedindo uma pausa. de pensar demais, de se sentir sobrecarregada, de carregar tudo sozinha sem conseguir nem explicar o que tá sentindo. eu entendo isso.`;

const MSG_3 = `esse guia foi feito com muito carinho pra te acompanhar nesses 7 dias. ele pode ser seu agora por R$14,90 💗 aqui está o pix 👇`;

// ── System prompt (usado após o primeiro contato) ─────────────────────────────
const SYSTEM_PROMPT = `Você é a Laps, criadora do @dojeitodelaps — perfil do Instagram sobre amor próprio e autoestima.

TOM DE VOZ:
- Direto e emocional — sem enrolação, mas cada mensagem toca em algo real
- Acolhedor e humano, como se fosse a própria criadora falando
- Nunca robótico, nunca genérico
- Emojis com leveza (🌸 💕 💗) — só quando fizer sentido

CONTEXTO:
A pessoa já recebeu a apresentação do produto e o código PIX.
Ela pode estar com dúvidas, pode ter saído do assunto, pode estar com dificuldade de pagar.

PRODUTO:
- "7 Dias Do Jeito Dela" — guia PDF de autoconhecimento
- 7 dias: 🌀 Pensar Demais | 🌿 Presença | 🌊 Emoções | 🛡️ Limites | 🔥 Burnout | 💛 Gratidão | 🌸 Recomeço
- Cada dia: texto da Laps + reflexão + tarefa pequena
- R$ 14,90 — entrega automática no WhatsApp após o PIX

COMO AGIR:
- Dúvida sobre o produto → responda com honestidade e calor
- Saiu do assunto → acolha o que ela disse e reconecte ao produto com empatia
- Reclamou do preço → reforce o valor, não desconte
- Perguntou sobre o PIX → diga que o código ainda está válido e reenvie se necessário
- Dificuldade técnica → oriente com calma

FORMATO — SIGA EXATAMENTE:
- Cada bloco de texto = no máximo 1 frase curta ou 2 linhas
- Use | para separar cada mensagem. SEMPRE que for dizer mais de uma coisa, use |
- EXEMPLO CERTO: "É um guia de 7 dias de autoconhecimento. 🌸|Cada dia tem um texto meu, uma reflexão e uma tarefa pequena.|Por R$14,90 ele é seu agora 💕"
- EXEMPLO ERRADO: "É um guia de 7 dias de autoconhecimento com texto meu, reflexão e tarefa pequena, por R$14,90."
- Nunca escreva parágrafos. Nunca escreva mais de 2 linhas seguidas sem usar |
- Nunca diga que é bot ou IA
- Nunca mencione "sistema" ou "automático"
- Nunca pressione para comprar`;

// ── Gera CPF válido a partir do telefone ──────────────────────────────────────
function generateCpfFromPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  const base = digits.slice(-9).padStart(9, '0').split('').map(Number);

  let sum = 0;
  for (let i = 0; i < 9; i++) sum += base[i] * (10 - i);
  let d1 = 11 - (sum % 11);
  if (d1 >= 10) d1 = 0;

  sum = 0;
  for (let i = 0; i < 9; i++) sum += base[i] * (11 - i);
  sum += d1 * 2;
  let d2 = 11 - (sum % 11);
  if (d2 >= 10) d2 = 0;

  return `${base.join('')}${d1}${d2}`;
}

// ── Chama o Gemini Flash (texto) ──────────────────────────────────────────────
async function callGemini(history: Message[], userMessage: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY não configurada');

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  // Conversa: histórico + nova mensagem do usuário
  const contents = [
    ...history,
    { role: 'user', parts: [{ text: userMessage }] },
  ];

  const body = {
    systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
    contents,
    generationConfig: { temperature: 0.75, maxOutputTokens: 300 },
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(30_000),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`Gemini error ${res.status}: ${errText.slice(0, 400)}`);
  }

  const data = await res.json() as any;
  const candidate = data?.candidates?.[0];

  if (!candidate) {
    console.error('[Bot] Gemini sem candidatos:', JSON.stringify(data).slice(0, 500));
    return '';
  }

  const text = candidate?.content?.parts?.[0]?.text?.trim() || '';
  if (!text) {
    console.error('[Bot] Gemini texto vazio. finishReason:', candidate?.finishReason,
      '| safetyRatings:', JSON.stringify(candidate?.safetyRatings));
  }
  return text;
}

// ── Envia texto via Z-API com indicador "digitando..." embutido ──────────────
// delayTyping = segundos exibindo "digitando" antes de entregar a mensagem (0-15)
async function sendText(phone: string, message: string) {
  const { ZAPI_INSTANCE_ID, ZAPI_TOKEN, ZAPI_CLIENT_TOKEN } = process.env;
  const parts = message.split('|').map(p => p.trim()).filter(Boolean);

  for (const part of parts) {
    // ~1s para cada 25 chars, mínimo 2s, máximo 10s
    const delayTyping = Math.min(Math.max(Math.ceil(part.length / 25), 2), 10);

    const res = await fetch(
      `https://api.z-api.io/instances/${ZAPI_INSTANCE_ID}/token/${ZAPI_TOKEN}/send-text`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Client-Token': ZAPI_CLIENT_TOKEN! },
        body: JSON.stringify({ phone, message: part, delayTyping }),
        // timeout maior pois a API espera o delayTyping antes de responder
        signal: AbortSignal.timeout(30_000),
      }
    );
    if (!res.ok) throw new Error(`Z-API send-text error: ${res.status}`);
    // Pequena pausa extra entre partes
    if (parts.length > 1) await new Promise(r => setTimeout(r, 800));
  }
}

// ── Envia PDF via Z-API ───────────────────────────────────────────────────────
async function sendPdf(phone: string) {
  const { ZAPI_INSTANCE_ID, ZAPI_TOKEN, ZAPI_CLIENT_TOKEN } = process.env;
  const pdfPath = path.join(process.cwd(), 'server', 'assets', '7dias_do_jeito_dela.pdf');
  const pdfBase64 = `data:application/pdf;base64,${fs.readFileSync(pdfPath).toString('base64')}`;

  const res = await fetch(
    `https://api.z-api.io/instances/${ZAPI_INSTANCE_ID}/token/${ZAPI_TOKEN}/send-document/pdf`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Client-Token': ZAPI_CLIENT_TOKEN! },
      body: JSON.stringify({ phone, document: pdfBase64, fileName: '7 Dias Do Jeito Dela.pdf' }),
      signal: AbortSignal.timeout(60_000),
    }
  );
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Z-API send-document error: ${res.status} ${text}`);
  }
}

// ── Gera PIX via AppMax ───────────────────────────────────────────────────────
async function generatePix(phone: string, state: ConversationState): Promise<string> {
  const rawPhone = phone.replace(/\D/g, '');
  const cpf = generateCpfFromPhone(phone);
  const email = `${rawPhone}@cliente.dojeitodelaps.com`;

  const customer = await appmaxGetOrCreateCustomer({ name: 'Cliente', email, cpf, phone });
  const order = await appmaxCreateOrder(customer.id, '7 Dias Do Jeito Dela', 14.90);
  const pix = await appmaxCreatePix(order.id, customer.id, cpf);

  state.status = 'awaiting_payment';
  state.orderId = order.id;
  state.pixCopyPaste = pix.pixCopyPaste;

  startPaymentPolling(phone, order.id, state);

  return pix.pixCopyPaste;
}

// ── Polling de pagamento ──────────────────────────────────────────────────────
function startPaymentPolling(phone: string, orderId: number, state: ConversationState) {
  const MAX_ATTEMPTS = 360; // 30 min
  let attempts = 0;

  const interval = setInterval(async () => {
    attempts++;

    if (attempts > MAX_ATTEMPTS) {
      clearInterval(interval);
      state.status = 'talking';
      state.orderId = undefined;
      state.pixCopyPaste = undefined;
      try {
        await sendText(phone, 'Seu PIX expirou ⏰\n\nSe ainda quiser o guia, é só me falar e eu gero um novo! 💕');
      } catch {}
      return;
    }

    try {
      const status = await appmaxGetOrderStatus(orderId);
      const paid = ['paid', 'PAID', 'aprovado', 'APPROVED'].includes(status);

      if (paid) {
        clearInterval(interval);
        if (state.status !== 'paid') {
          state.status = 'paid';
          await sendText(phone, 'Pagamento confirmado 💗\n\nAqui está o seu guia 👇');
          await sendPdf(phone);
          await sendText(phone, 'Abre com calma, sem pressa. Esse espaço é só seu. 🌸');
          // Follow-up após 5 minutos
          setTimeout(async () => {
            try {
              await sendText(phone, 'Conseguiu abrir certinho? 🌸\n\nQualquer dúvida é só falar aqui.');
            } catch {}
          }, 5 * 60 * 1000);
        }
      }
    } catch (err: any) {
      console.error('[Bot] Erro ao verificar pagamento:', err.message);
    }
  }, 5_000);
}

// ── Garante que respostas longas sejam quebradas em mensagens curtas ──────────
function autoSplit(text: string): string {
  // Se já usa | ou é curto o suficiente, usa como está
  if (text.includes('|') || text.length <= 140) return text;

  // Divide nas pontuações de fim de frase
  const sentences = text.split(/(?<=[.!?])\s+/);
  const parts: string[] = [];
  let current = '';

  for (const s of sentences) {
    if (current && (current + ' ' + s).length > 140) {
      parts.push(current.trim());
      current = s;
    } else {
      current = current ? current + ' ' + s : s;
    }
  }
  if (current.trim()) parts.push(current.trim());

  return parts.length > 1 ? parts.join('|') : text;
}

// ── Handler principal de mensagens ────────────────────────────────────────────
export async function handleIncomingMessage(phone: string, userMessage: string) {
  const rawPhone = phone.replace(/\D/g, '');
  const normalizedPhone = rawPhone.startsWith('55') ? rawPhone : `55${rawPhone}`;

  // Inicializa conversa se não existir
  if (!conversations.has(normalizedPhone)) {
    conversations.set(normalizedPhone, {
      status: 'talking',
      history: [],
      createdAt: Date.now(),
      lastActivity: Date.now(),
    });
  }

  const state = conversations.get(normalizedPhone)!;
  state.lastActivity = Date.now();;

  // Já pagou
  if (state.status === 'paid') {
    await sendText(normalizedPhone, 'Você já tem o guia! 🌸 Está nas mensagens anteriores por aqui.\n\nQualquer dúvida é só chamar. 💕');
    return;
  }

  // ── PRIMEIRO CONTATO: mensagens fixas + PIX automático ───────────────────
  if (state.history.length === 0 && state.status === 'talking') {
    // Espera inicial de 5s antes de começar a responder
    await new Promise(r => setTimeout(r, 5000));
    await sendText(normalizedPhone, MSG_1);
    await new Promise(r => setTimeout(r, 1200));
    await sendText(normalizedPhone, MSG_2);
    await new Promise(r => setTimeout(r, 1200));
    await sendText(normalizedPhone, MSG_3);
    await new Promise(r => setTimeout(r, 800));

    try {
      const pixCode = await generatePix(normalizedPhone, state);
      // Código PIX sozinho para facilitar cópia
      await sendText(normalizedPhone, pixCode);
      await new Promise(r => setTimeout(r, 800));
      await sendText(normalizedPhone, `assim que confirmar, eu já mando tudo pra você. o link fica disponível por 30 minutinhos 🌸`);
    } catch (err: any) {
      console.error('[Bot] Erro ao gerar PIX:', err.message);
      await sendText(normalizedPhone, 'Tive um probleminha pra gerar o PIX 😅 Tenta de novo em alguns segundos!').catch(() => {});
    }

    // Salva histórico do primeiro contato para o agente ter contexto
    state.history.push({ role: 'user', parts: [{ text: userMessage }] });
    state.history.push({ role: 'model', parts: [{ text: `${MSG_1}\n\n${MSG_2}\n\nPor R$14,90 o guia é seu agora. Enviei o código PIX. Assim que confirmar mando o PDF.` }] });
    return;
  }

  // ── MENSAGENS SEGUINTES: agente com Gemini ────────────────────────────────

  // Se tem PIX pendente e a pessoa pede o código
  if (state.status === 'awaiting_payment' && state.pixCopyPaste) {
    const lower = userMessage.toLowerCase();
    if (lower.includes('pix') || lower.includes('código') || lower.includes('codigo') || lower.includes('pagar') || lower.includes('copiar')) {
      await sendText(normalizedPhone, `Aqui está o código PIX 👇\n\n${state.pixCopyPaste}\n\n_Válido por 30 minutos_ ⏳`);
      return;
    }
  }

  // Chama o Gemini
  let aiResponse = '';
  try {
    aiResponse = await callGemini(state.history, userMessage);
  } catch (err: any) {
    console.error('[Bot] Erro Gemini:', err.message);
    await sendText(normalizedPhone, 'Oi! 🌸 Tive um probleminha aqui, pode mandar de novo?').catch(() => {});
    return;
  }

  const cleanResponse = autoSplit(aiResponse.trim());

  // Atualiza histórico
  state.history.push({ role: 'user', parts: [{ text: userMessage }] });
  state.history.push({ role: 'model', parts: [{ text: cleanResponse }] });
  if (state.history.length > 20) state.history = state.history.slice(-20);

  if (cleanResponse) await sendText(normalizedPhone, cleanResponse);
}
