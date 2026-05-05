/**
 * bot.ts
 * WhatsApp bot para entrega automática do PDF "7 Dias Do Jeito Dela"
 * Projeto: @dojeitodelaps
 */

import fs from 'fs';
import path from 'path';
import {
  appmaxGetOrCreateCustomer,
  appmaxCreateOrder,
  appmaxCreatePix,
  appmaxGetOrderStatus,
} from './appmax';

interface ConversationState {
  status: 'awaiting_payment' | 'paid';
  orderId: number;
  pixCopyPaste: string;
  createdAt: number;
}

const conversations = new Map<string, ConversationState>();

// ── Gera CPF matematicamente válido a partir do número de telefone ────────────
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

// ── Envia texto via Z-API ─────────────────────────────────────────────────────
async function sendText(phone: string, message: string) {
  const { ZAPI_INSTANCE_ID, ZAPI_TOKEN, ZAPI_CLIENT_TOKEN } = process.env;
  const url = `https://api.z-api.io/instances/${ZAPI_INSTANCE_ID}/token/${ZAPI_TOKEN}/send-text`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Client-Token': ZAPI_CLIENT_TOKEN! },
    body: JSON.stringify({ phone, message }),
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) throw new Error(`Z-API send-text error: ${res.status}`);
}

// ── Envia PDF via Z-API (base64) ─────────────────────────────────────────────
async function sendPdf(phone: string) {
  const { ZAPI_INSTANCE_ID, ZAPI_TOKEN, ZAPI_CLIENT_TOKEN } = process.env;

  const pdfPath = path.join(process.cwd(), 'server', 'assets', '7dias_do_jeito_dela.pdf');
  const pdfBase64 = `data:application/pdf;base64,${fs.readFileSync(pdfPath).toString('base64')}`;

  const url = `https://api.z-api.io/instances/${ZAPI_INSTANCE_ID}/token/${ZAPI_TOKEN}/send-document/pdf`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Client-Token': ZAPI_CLIENT_TOKEN! },
    body: JSON.stringify({
      phone,
      document: pdfBase64,
      fileName: '7 Dias Do Jeito Dela.pdf',
    }),
    signal: AbortSignal.timeout(60_000),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Z-API send-document error: ${res.status} ${text}`);
  }
}

// ── Polling de pagamento (verifica a cada 5s por até 30 min) ─────────────────
function startPaymentPolling(phone: string, orderId: number) {
  const MAX_ATTEMPTS = 360;
  let attempts = 0;

  const interval = setInterval(async () => {
    attempts++;

    if (attempts > MAX_ATTEMPTS) {
      clearInterval(interval);
      conversations.delete(phone);
      try {
        await sendText(phone, '⏰ Seu PIX expirou. Manda uma mensagem aqui para gerar um novo! 💕');
      } catch {}
      return;
    }

    try {
      const status = await appmaxGetOrderStatus(orderId);
      const paid = ['paid', 'PAID', 'aprovado', 'APPROVED'].includes(status);

      if (paid) {
        clearInterval(interval);
        const state = conversations.get(phone);
        if (state && state.status !== 'paid') {
          state.status = 'paid';
          await sendText(phone, '✅ *Pagamento confirmado!* Obrigada pela compra 🌸\n\nAqui está seu guia:');
          await sendPdf(phone);
          await sendText(phone, '💕 Aproveite cada página com carinho.\n\nSe quiser compartilhar sua jornada, me marca lá no Instagram:\n*@dojeitodelaps* 🌸');
        }
      }
    } catch (err: any) {
      console.error('[Bot] Erro ao verificar pagamento:', err.message);
    }
  }, 5_000);
}

// ── Handler principal de mensagens recebidas ──────────────────────────────────
export async function handleIncomingMessage(phone: string) {
  const rawPhone = phone.replace(/\D/g, '');
  const normalizedPhone = rawPhone.startsWith('55') ? rawPhone : `55${rawPhone}`;

  const existing = conversations.get(normalizedPhone);

  // Já tem PIX pendente → reenvia o código
  if (existing?.status === 'awaiting_payment') {
    await sendText(
      normalizedPhone,
      `Seu PIX ainda está aguardando pagamento! ⏳\n\n📋 *Copia e cola:*\n\n${existing.pixCopyPaste}\n\n_Após o pagamento o PDF chega automaticamente aqui!_ 🌸`
    );
    return;
  }

  // Já pagou → informa
  if (existing?.status === 'paid') {
    await sendText(
      normalizedPhone,
      'Você já adquiriu o guia! 🌸 Verifique as mensagens anteriores para encontrar o PDF.\n\nQualquer dúvida é só chamar aqui. 💕'
    );
    return;
  }

  // Novo cliente → gera PIX
  try {
    const cpf = generateCpfFromPhone(normalizedPhone);
    const email = `${rawPhone}@cliente.dojeitodelaps.com`;

    const customer = await appmaxGetOrCreateCustomer({
      name: 'Cliente',
      email,
      cpf,
      phone: normalizedPhone,
    });

    const order = await appmaxCreateOrder(customer.id, '7 Dias Do Jeito Dela', 14.90);
    const pix = await appmaxCreatePix(order.id, customer.id, cpf);

    conversations.set(normalizedPhone, {
      status: 'awaiting_payment',
      orderId: order.id,
      pixCopyPaste: pix.pixCopyPaste,
      createdAt: Date.now(),
    });

    await sendText(
      normalizedPhone,
      `Oi! 🌸 Que bom ter você aqui!\n\n` +
      `*7 Dias Do Jeito Dela* é um guia de autoconhecimento com 7 temas que vão te ajudar a se ouvir mais, se cobrar menos e se cuidar de verdade. 💕\n\n` +
      `📖 *7 dias · 7 temas · 7 tarefas*\n` +
      `Pensar Demais · Presença · Emoções · Limites · Burnout · Gratidão · Recomeço\n\n` +
      `💰 *Valor: R$ 14,90*`
    );

    await sendText(
      normalizedPhone,
      `📋 *Pague via PIX — copia e cola:*\n\n${pix.pixCopyPaste}\n\n` +
      `_Válido por 30 minutos_ ⏳\n\n` +
      `Assim que o pagamento for confirmado, o PDF chega automaticamente aqui! 🌸`
    );

    startPaymentPolling(normalizedPhone, order.id);

  } catch (err: any) {
    console.error('[Bot] Erro ao gerar PIX:', err.message);
    await sendText(normalizedPhone, 'Ops, tive um probleminha 😅 Manda uma mensagem de novo em alguns segundos!').catch(() => {});
  }
}
