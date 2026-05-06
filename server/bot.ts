/**
 * bot.ts
 * Agente WhatsApp com IA para entrega do PDF "7 Dias Do Jeito Dela"
 * @dojeitodelaps
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
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
const MSG_1 = `isso já diz muito sobre você, querer saber mais sobre si mesma já é um passo. 🌸`;

const MSG_2 = `às vezes a gente tá tão sobrecarregada que nem consegue explicar o que tá sentindo. carregando tudo sozinha, pensando demais, sem conseguir pausar. eu entendo isso. 💕`;

const MSG_3 = `O *7 Dias Do Jeito Dela* é um guia de autoconhecimento que eu criei pra ser leve e honesto, do jeito que eu sempre falo por aqui.
São 7 dias, cada um com um tema diferente:
🌀 Pensar Demais
🌿 Presença
🌊 Emoções
🛡️ Limites
🔥 Burnout
💛 Gratidão
🌸 Recomeço
Cada dia tem um texto meu, uma reflexão e uma tarefa pequena. Nada pesado, prometo.`;

const MSG_4 = `esse guia foi feito com muito carinho pra te acompanhar nesses 7 dias. ele pode ser seu agora por R$14,90 💗 aqui está o pix 👇`;

// ── System prompt (usado após o primeiro contato) ─────────────────────────────
const SYSTEM_PROMPT = `Você é a Laps, criadora do @dojeitodelaps — perfil sobre amor próprio e autoestima.

TOM DE VOZ:
- Humano, direto e acolhedor — como se fosse uma amiga que entende de verdade
- Cada mensagem toca em algo real, nunca é genérica
- Emojis com leveza (🌸 💕 💗) — só quando cair bem naturalmente
- Nunca robótico. Nunca "posso te ajudar com algo mais?"
- Nunca diga que é IA, bot ou sistema

QUEM É A LAPS:
- Fala sobre sentimentos difíceis com leveza e honestidade
- Não julga, não pressiona, não dá sermão
- É direta mas gentil — diz o que a pessoa precisa ouvir
- Acredita que autoconhecimento é um processo, não uma solução rápida

PRODUTO (se vier à tona):
- "7 Dias Do Jeito Dela" — guia PDF de autoconhecimento, R$14,90
- 7 dias: 🌀 Pensar Demais | 🌿 Presença | 🌊 Emoções | 🛡️ Limites | 🔥 Burnout | 💛 Gratidão | 🌸 Recomeço
- Cada dia: texto da Laps + reflexão + tarefa pequena
- Entrega automática no WhatsApp após o PIX

COMO AGIR EM CADA SITUAÇÃO:
- Agradeceu ou elogiou → celebre junto com calor genuíno, deseje uma boa jornada
- Desabafou ou contou algo difícil → acolha primeiro, sem pressa de reconectar ao produto
- Perguntou sobre o guia → responda com entusiasmo e honestidade
- Perguntou sobre o PIX → diga que o código ainda está válido
- Reclamou do preço → reforce o valor com calma, sem desconto
- Saiu do assunto → acompanhe o que ela trouxe, reconecte só se for natural
- Falou algo aleatório → responda de forma humana, como a Laps faria no direct

RITMO DAS MENSAGENS — MUITO IMPORTANTE:
- Nunca atropele — se for dizer 2 ou mais coisas, separe com |
- Cada parte separada por | será enviada como uma mensagem diferente, com pausa e "digitando..." entre elas
- Use isso a seu favor: primeiro acolha, depois complemente
- EXEMPLO: "que bom que você veio 🌸|fico feliz de saber que chegou bem 💕"
- Nunca coloque tudo numa frase só só pra ser breve — prefira 2 mensagens curtas e humanas

FORMATO — SIGA SEMPRE:
- Máximo 1 frase curta ou 2 linhas por bloco
- Use | para separar mensagens. SEMPRE que for dizer mais de uma coisa, use |
- Nunca escreva parágrafos longos
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
      body: JSON.stringify({ phone, document: pdfBase64, fileName: '7 Dias Do Jeito Dela' }),
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
          // Dispara evento de compra na Meta CAPI (em background, sem bloquear entrega)
          sendCapiPurchaseEvent(phone).catch(() => {});
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

// ── Dispara evento Purchase na Meta Conversions API ──────────────────────────
async function sendCapiPurchaseEvent(phone: string) {
  const pixelId = process.env.CAPI_PIXEL_ID;
  const accessToken = process.env.CAPI_ACCESS_TOKEN;
  if (!pixelId || !accessToken) {
    console.warn('[CAPI] Variáveis não configuradas, evento não enviado.');
    return;
  }

  // Normaliza telefone para E.164 sem "+" (ex: 5511999990000) e aplica SHA-256
  const normalized = phone.replace(/\D/g, '');
  const hashedPhone = crypto.createHash('sha256').update(normalized).digest('hex');

  const payload = {
    data: [{
      event_name: 'Purchase',
      event_time: Math.floor(Date.now() / 1000),
      action_source: 'other',
      user_data: {
        ph: [hashedPhone],
      },
      custom_data: {
        value: 14.90,
        currency: 'BRL',
        content_name: '7 Dias Do Jeito Dela',
        content_type: 'product',
      },
    }],
  };

  try {
    const res = await fetch(
      `https://graph.facebook.com/v19.0/${pixelId}/events?access_token=${accessToken}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(10_000),
      }
    );
    const data = await res.json() as any;
    if (data?.events_received) {
      console.log(`[CAPI] ✅ Purchase event enviado — events_received: ${data.events_received}`);
    } else {
      console.warn('[CAPI] Resposta inesperada:', JSON.stringify(data));
    }
  } catch (err: any) {
    console.error('[CAPI] Erro ao enviar evento Purchase:', err.message);
  }
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

  // ── Gatilhos secretos de teste (antes de qualquer outra lógica) ──────────
  const lowerMsg = userMessage.toLowerCase();

  // "farinhha" ou "farinha" → reseta a conversa
  if (lowerMsg.includes('farinhha') || lowerMsg.includes('farinha')) {
    conversations.set(normalizedPhone, {
      status: 'talking',
      history: [],
      createdAt: Date.now(),
      lastActivity: Date.now(),
    });
    return;
  }

  // "feijão" ou "feijao" → simula pagamento e entrega o PDF
  if (lowerMsg.includes('feijão') || lowerMsg.includes('feijao')) {
    state.status = 'paid';
    try {
      await sendText(normalizedPhone, 'Pagamento confirmado 💗\n\nAqui está o seu guia 👇');
      await sendPdf(normalizedPhone);
      await sendText(normalizedPhone, 'Abre com calma, sem pressa. Esse espaço é só seu. 🌸');
    } catch (err: any) {
      console.error('[Bot] Erro no gatilho feijão:', err.message);
      await sendText(normalizedPhone, 'Tive um problema ao enviar o PDF 😅').catch(() => {});
    }
    return;
  }

  // Já pagou
  if (state.status === 'paid') {
    const lower = userMessage.toLowerCase();
    const pedindoArquivo = lower.includes('pdf') || lower.includes('guia') || lower.includes('arquivo') ||
      lower.includes('mandar') || lower.includes('manda') || lower.includes('link') ||
      lower.includes('onde') || lower.includes('não recebi') || lower.includes('nao recebi') ||
      lower.includes('cadê') || lower.includes('cade') || lower.includes('baixar');
    if (pedindoArquivo) {
      await sendText(normalizedPhone, 'Seu guia está nas mensagens anteriores aqui no WhatsApp! 🌸\n\nÉ o arquivo PDF chamado *7 Dias Do Jeito Dela*. Qualquer dúvida é só chamar. 💕');
      return;
    }
    // Para qualquer outra mensagem, deixa o Gemini responder naturalmente
  }

  // ── PRIMEIRO CONTATO: mensagens fixas + PIX automático ───────────────────
  if (state.history.length === 0 && state.status === 'talking') {
    // Marca histórico imediatamente para evitar execução concorrente
    // (Z-API pode disparar webhook duplicado para confirmação de entrega)
    state.history.push({ role: 'user', parts: [{ text: userMessage }] });
    state.history.push({ role: 'model', parts: [{ text: 'iniciando fluxo...' }] });

    try {
      // Espera inicial de 5s antes de começar a responder
      await new Promise(r => setTimeout(r, 5000));
      await sendText(normalizedPhone, MSG_1);
      await new Promise(r => setTimeout(r, 1200));
      await sendText(normalizedPhone, MSG_2);
      await new Promise(r => setTimeout(r, 4000));
      await sendText(normalizedPhone, MSG_3);
      await new Promise(r => setTimeout(r, 26000));
      await sendText(normalizedPhone, MSG_4);
      await new Promise(r => setTimeout(r, 3500));

      const pixCode = await generatePix(normalizedPhone, state);
      await sendText(normalizedPhone, pixCode);
      await new Promise(r => setTimeout(r, 3500));
      await sendText(normalizedPhone, `e se depois dos 7 dias você sentir que o guia não te ajudou em nada, é só me chamar que eu devolvo teu dinheiro sem perguntas 🤍`);
      await new Promise(r => setTimeout(r, 3500));
      await sendText(normalizedPhone, `mal posso esperar pra você começar 🌸 assim que você fizer o pix eu já mando tudo na hora, não precisa nem enviar comprovante.`);

      // Atualiza histórico real ao final
      state.history = [
        { role: 'user', parts: [{ text: userMessage }] },
        { role: 'model', parts: [{ text: `${MSG_1}\n\n${MSG_2}\n\n${MSG_3}\n\nEnviei o código PIX. Assim que confirmar mando o PDF.` }] },
      ];
    } catch (err: any) {
      console.error('[Bot] Erro no fluxo de abertura:', err.message);
      // Reseta histórico para permitir nova tentativa
      state.history = [];
      await sendText(normalizedPhone, 'Tive um probleminha aqui 😅 Pode mandar oi de novo?').catch(() => {});
    }
    return;
  }

  // ── MENSAGENS SEGUINTES: agente com Gemini ────────────────────────────────

  // PIX expirou e pessoa quer pagar de novo → gera novo PIX
  if (state.status === 'talking' && state.history.length > 0) {
    const lower = userMessage.toLowerCase();
    const querPagar = lower.includes('pix') || lower.includes('pagar') || lower.includes('quero') ||
      lower.includes('sim') || lower.includes('novo') || lower.includes('de novo') ||
      lower.includes('dnv') || lower.includes('comprar') || lower.includes('gerar') ||
      lower.includes('pode') || lower.includes('bora') || lower.includes('vamo');
    if (querPagar) {
      try {
        await sendText(normalizedPhone, 'Claro! Gerando um novo PIX pra você 🌸');
        const pixCode = await generatePix(normalizedPhone, state);
        await sendText(normalizedPhone, pixCode);
        await new Promise(r => setTimeout(r, 800));
        await sendText(normalizedPhone, `assim que confirmar, eu já mando tudo pra você. o link fica disponível por 30 minutinhos 🌸`);
        state.history.push({ role: 'user', parts: [{ text: userMessage }] });
        state.history.push({ role: 'model', parts: [{ text: 'Gerei um novo código PIX. Assim que o pagamento confirmar mando o PDF.' }] });
      } catch (err: any) {
        console.error('[Bot] Erro ao gerar novo PIX:', err.message);
        await sendText(normalizedPhone, 'Tive um probleminha pra gerar o PIX 😅 Tenta de novo em alguns segundos!').catch(() => {});
      }
      return;
    }
  }

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
