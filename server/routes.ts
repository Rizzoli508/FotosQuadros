import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import {
  appmaxGetOrCreateCustomer,
  appmaxCreateOrder,
  appmaxCreatePix,
  appmaxCreateBoleto,
  appmaxCreateCreditCard,
  appmaxGetOrderStatus,
} from "./appmax";
import {
  savePortrait,
  getPortrait,
  getPortraitPath,
  markPortraitSending,
  markPortraitSent,
  markPortraitSendFailed,
  cleanupOldPortraits,
  ensureBucket,
} from "./portraits";
import { generatePortrait } from "./generate";
import { generatePortraitFal } from "./generate-fal";
import { appendOrderToSheet, ensureSheetHeaders } from "./sheets";

const VALID_PRICES = new Set([29, 49, 89, 79, 99, 139, 219, 329, 119, 159, 199, 349, 599, 1]);

function validatePrice(amount: number): boolean {
  return VALID_PRICES.has(Number(amount));
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  app.post(api.orders.create.path, async (req, res) => {
    try {
      const input = api.orders.create.input.parse(req.body);
      const order = await storage.createOrder(input);
      res.status(201).json(order);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  // ── Entregas via webhook (pessoa recebe sem precisar estar no site) ─────────
  const deliveries = new Map<number, {
    imageBase64: string;
    phone: string;
    name: string;
    sent: boolean;
    createdAt: number;
  }>();

  setInterval(() => {
    const cutoff = Date.now() - 2 * 60 * 60 * 1000; // 2 horas
    for (const [id, d] of deliveries) {
      if (d.createdAt < cutoff) deliveries.delete(id);
    }
  }, 30 * 60 * 1000);

  // Registra retrato + contato para entrega automática via webhook
  app.post('/api/deliveries/:orderId', (req, res) => {
    const orderId = parseInt(req.params.orderId);
    const { imageBase64, phone, name } = req.body;
    if (!orderId || !imageBase64 || !phone) {
      return res.status(400).json({ message: 'orderId, imageBase64 e phone são obrigatórios.' });
    }
    deliveries.set(orderId, { imageBase64, phone, name: name || '', sent: false, createdAt: Date.now() });
    return res.json({ ok: true });
  });

  // Webhook AppMax — dispara quando pagamento é aprovado, envia WhatsApp sem a pessoa estar no site
  app.post('/api/webhooks/appmax', async (req, res) => {
    res.json({ ok: true }); // responde imediatamente para o AppMax não retentar

    const body = req.body || {};
    const orderId = parseInt(body.id || body.order_id || body.order?.id || 0);
    const rawStatus = (body.status || body.order?.status || '').toString().toUpperCase();
    const isPaid = ['APPROVED', 'PAID', 'APROVADO', 'COMPLETE', 'COMPLETED', 'CAPTURED'].includes(rawStatus);

    console.log(`[Webhook AppMax] orderId=${orderId} status=${rawStatus} isPaid=${isPaid}`);
    if (!orderId || !isPaid) return;

    const delivery = deliveries.get(orderId);
    if (!delivery || delivery.sent) return;
    delivery.sent = true;

    const { ZAPI_INSTANCE_ID, ZAPI_TOKEN, ZAPI_CLIENT_TOKEN } = process.env;
    if (!ZAPI_INSTANCE_ID || !ZAPI_TOKEN || !ZAPI_CLIENT_TOKEN) return;

    const rawPhone = delivery.phone.replace(/\D/g, '');
    const normalizedPhone = rawPhone.startsWith('55') ? rawPhone : `55${rawPhone}`;

    try {
      const zapiUrl = `https://api.z-api.io/instances/${ZAPI_INSTANCE_ID}/token/${ZAPI_TOKEN}/send-image`;
      await fetch(zapiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Client-Token': ZAPI_CLIENT_TOKEN },
        body: JSON.stringify({
          phone: normalizedPhone,
          image: delivery.imageBase64,
          caption: `Olá ${delivery.name || ''}! 🎨\n\nSeu retrato *retravium* está pronto! ✨\n\nQualquer dúvida é só falar aqui. 😊`.replace('Olá !', 'Olá!'),
        }),
        signal: AbortSignal.timeout(30_000),
      });
      console.log(`[Webhook AppMax] WhatsApp enviado para pedido ${orderId}`);
    } catch (err: any) {
      delivery.sent = false; // permite nova tentativa
      console.error(`[Webhook AppMax] Erro no pedido ${orderId}:`, err.message);
    }
  });

  // ── Jobs de geração (evita timeout do proxy Railway) ─────────────────────
  const generateJobs = new Map<string, {
    status: 'pending' | 'done' | 'error';
    result?: { imageBase64: string; mimeType: string };
    error?: string;
    createdAt: number;
  }>();

  // Limpa jobs com mais de 30 minutos a cada 10 minutos
  setInterval(() => {
    const cutoff = Date.now() - 30 * 60 * 1000;
    for (const [id, job] of generateJobs) {
      if (job.createdAt < cutoff) generateJobs.delete(id);
    }
  }, 10 * 60 * 1000);

  // ── Geração de retrato via fal.ai (teste) ────────────────────────────────
  app.post('/api/generate-fal', async (req, res) => {
    if (!process.env.FAL_KEY) return res.status(500).json({ message: 'FAL_KEY não configurada.' });
    const { moldId, subStyle = 'classico', finish = 'pb', images = [] } = req.body;
    if (!moldId) return res.status(400).json({ message: 'moldId é obrigatório.' });
    if (!Array.isArray(images) || images.length === 0) return res.status(400).json({ message: 'Envie pelo menos uma imagem.' });

    const { randomUUID } = await import('crypto');
    const jobId = randomUUID();
    generateJobs.set(jobId, { status: 'pending', createdAt: Date.now() });

    generatePortraitFal(moldId, subStyle, finish, images)
      .then(result => generateJobs.set(jobId, { status: 'done', result, createdAt: Date.now() }))
      .catch(err => generateJobs.set(jobId, { status: 'error', error: err?.message || 'Erro fal.ai', createdAt: Date.now() }));

    return res.json({ jobId });
  });

  // ── Geração de retrato via Gemini (inicia job e responde imediatamente) ───
  app.post('/api/generate', async (req, res) => {
    const { moldId, subStyle = 'classico', finish = 'pb', images = [] } = req.body;
    if (!moldId) return res.status(400).json({ message: 'moldId é obrigatório.' });
    if (!Array.isArray(images) || images.length === 0) return res.status(400).json({ message: 'Envie pelo menos uma imagem.' });

    const { randomUUID } = await import('crypto');
    const jobId = randomUUID();
    generateJobs.set(jobId, { status: 'pending', createdAt: Date.now() });

    // Processa em background — não bloqueia a resposta HTTP
    generatePortraitFal(moldId, subStyle, finish, images)
      .then(result => generateJobs.set(jobId, { status: 'done', result, createdAt: Date.now() }))
      .catch(err  => {
        const isTimeout = err?.name === 'TimeoutError' || (err?.message || '').includes('aborted');
        const message = isTimeout
          ? 'A geração demorou mais que o esperado. Tente novamente.'
          : (err?.message || 'Erro ao gerar retrato.');
        generateJobs.set(jobId, { status: 'error', error: message, createdAt: Date.now() });
      });

    return res.json({ jobId }); // responde em <100ms, sem risco de timeout
  });

  // ── Polling do status do job de geração ──────────────────────────────────
  app.get('/api/generate/status/:jobId', (req, res) => {
    const job = generateJobs.get(req.params.jobId);
    if (!job) return res.status(404).json({ message: 'Job não encontrado.' });
    if (job.status === 'pending') return res.json({ status: 'pending' });
    if (job.status === 'error')   return res.status(500).json({ status: 'error', message: job.error });
    return res.json({ status: 'done', ...job.result });
  });

  // ── Pix via AppMax ──
  app.post('/api/payments/pix', async (req, res) => {
    try {
      const { name, cpf, phone, amount, description } = req.body;
      let { email } = req.body;
      if (!name || !cpf || !amount || !description) {
        return res.status(400).json({ message: 'Preencha todos os campos obrigatórios.' });
      }
      if (!validatePrice(amount)) {
        return res.status(400).json({ message: 'Valor inválido.' });
      }
      // Gera email placeholder se não informado
      if (!email) email = `${cpf.replace(/\D/g, '')}@cliente.retravium.com`;
      const customer = await appmaxGetOrCreateCustomer({ name, email, cpf, phone: phone || '11999999999' });
      const order = await appmaxCreateOrder(customer.id, description, amount);
      const pix = await appmaxCreatePix(order.id, customer.id, cpf);
      return res.json({ qrCode: pix.qrCode, pixCopyPaste: pix.pixCopyPaste, expiresAt: pix.expiresAt, orderId: order.id });
    } catch (err: any) {
      console.error('AppMax Pix error:', err.message);
      res.status(500).json({ message: err.message || 'Erro ao gerar Pix.' });
    }
  });

  // ── Consulta status do pagamento ──
  app.get('/api/payments/status/:orderId', async (req, res) => {
    try {
      const orderId = parseInt(req.params.orderId);
      if (!orderId) return res.status(400).json({ message: 'orderId inválido.' });
      const status = await appmaxGetOrderStatus(orderId);
      const paid = status === 'paid' || status === 'PAID' || status === 'aprovado' || status === 'APPROVED';
      return res.json({ status, paid });
    } catch (err: any) {
      return res.status(500).json({ message: err.message });
    }
  });

  // ── Boleto via AppMax ──
  app.post('/api/payments/boleto', async (req, res) => {
    try {
      const { name, email, cpf, phone, amount, description } = req.body;
      if (!name || !email || !cpf || !amount || !description) {
        return res.status(400).json({ message: 'Preencha todos os campos obrigatórios.' });
      }
      if (!validatePrice(amount)) {
        return res.status(400).json({ message: 'Valor inválido.' });
      }
      const customer = await appmaxGetOrCreateCustomer({ name, email, cpf, phone: phone || '11999999999' });
      const order = await appmaxCreateOrder(customer.id, description, amount);
      const boleto = await appmaxCreateBoleto(order.id, customer.id, cpf);
      return res.json({ bankSlipUrl: boleto.boletoUrl, digitableLine: boleto.digitableLine, dueDate: boleto.dueDate });
    } catch (err: any) {
      console.error('AppMax Boleto error:', err.message);
      res.status(500).json({ message: err.message || 'Erro ao gerar boleto.' });
    }
  });

  // ── Cartão via AppMax ──
  app.post('/api/payments/card', async (req, res) => {
    try {
      const { name, email, cpf, phone, amount, description, card } = req.body;
      if (!name || !email || !cpf || !amount || !description || !card) {
        return res.status(400).json({ message: 'Preencha todos os campos obrigatórios.' });
      }
      if (!validatePrice(amount)) {
        return res.status(400).json({ message: 'Valor inválido.' });
      }
      const customer = await appmaxGetOrCreateCustomer({ name, email, cpf, phone: phone || '11999999999' });
      const order = await appmaxCreateOrder(customer.id, description, amount);
      await appmaxCreateCreditCard(order.id, customer.id, cpf, card);
      return res.json({ status: 'APPROVED', orderId: order.id });
    } catch (err: any) {
      console.error('AppMax Card error:', err.message);
      res.status(400).json({ message: err.message || 'Cartão recusado. Verifique os dados.' });
    }
  });

  // ── Retratos: redireciona para URL pública no Supabase ───────────────────────
  app.get('/portraits/:id', (req, res) => {
    const portrait = getPortrait(req.params.id);
    if (!portrait) return res.status(404).json({ message: 'Retrato não encontrado.' });
    res.redirect(portrait.publicUrl);
  });

  // ── Retratos: salvar imagem ────────────────────────────────────────────────────
  app.post('/api/portraits', async (req, res) => {
    try {
      const { imageBase64 } = req.body;
      if (!imageBase64 || typeof imageBase64 !== 'string') {
        return res.status(400).json({ message: 'Imagem não informada.' });
      }
      const id = await savePortrait(imageBase64);
      return res.json({ id });
    } catch (err: any) {
      console.error('Portrait save error:', err.message);
      return res.status(500).json({ message: 'Erro ao salvar retrato.' });
    }
  });

  // ── Retratos: enviar via WhatsApp (Z-API direto) ──────────────────────────────
  app.post('/api/portraits/:id/send', async (req, res) => {
    const { id } = req.params;
    const { phone, name, caption: sendCaption = true } = req.body;

    if (!phone) return res.status(400).json({ message: 'Número de WhatsApp não informado.' });

    const portrait = getPortrait(id);
    if (!portrait)        return res.status(404).json({ message: 'Retrato não encontrado. Gere novamente.' });
    if (portrait.sent)    return res.json({ success: true, alreadySent: true });
    if (portrait.sending) return res.status(409).json({ message: 'Já está sendo enviado. Aguarde.' });

    // Baixa a imagem do Supabase Storage
    const imageBuffer = await getPortraitPath(id);
    if (!imageBuffer) return res.status(404).json({ message: 'Arquivo do retrato não encontrado. Gere novamente.' });

    const imageBase64 = `data:image/png;base64,${imageBuffer.toString('base64')}`;

    // Normaliza telefone: só dígitos + DDI 55
    const rawPhone = phone.replace(/\D/g, '');
    const normalizedPhone = rawPhone.startsWith('55') ? rawPhone : `55${rawPhone}`;

    const { ZAPI_INSTANCE_ID, ZAPI_TOKEN, ZAPI_CLIENT_TOKEN } = process.env;
    if (!ZAPI_INSTANCE_ID || !ZAPI_TOKEN || !ZAPI_CLIENT_TOKEN) {
      return res.status(500).json({ message: 'Z-API não configurado.' });
    }

    markPortraitSending(id);

    try {
      const zapiUrl = `https://api.z-api.io/instances/${ZAPI_INSTANCE_ID}/token/${ZAPI_TOKEN}/send-image`;

      const response = await fetch(zapiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Client-Token': ZAPI_CLIENT_TOKEN,
        },
        body: JSON.stringify({
          phone: normalizedPhone,
          image: imageBase64,
          caption: sendCaption ? `Olá ${name || ''}! 🎨\n\nSeu retrato *retravium* está pronto! ✨\n\nQualquer dúvida é só falar aqui. 😊`.replace('Olá !', 'Olá!') : undefined,
        }),
        signal: AbortSignal.timeout(30_000),
      });

      if (!response.ok) {
        const text = await response.text().catch(() => '');
        throw new Error(`Z-API retornou ${response.status}: ${text}`);
      }

      markPortraitSent(id);
      return res.json({ success: true });
    } catch (err: any) {
      markPortraitSendFailed(id);
      console.error('[WhatsApp] Erro ao enviar:', err.message);
      return res.status(502).json({ message: 'Erro ao enviar para o WhatsApp. Tente novamente.' });
    }
  });

  // ── WhatsApp: envia retrato direto por base64 (sem depender do Supabase) ─────
  app.post('/api/whatsapp/portrait', async (req, res) => {
    const { phone, imageBase64, name } = req.body;
    if (!phone || !imageBase64) return res.status(400).json({ message: 'phone e imageBase64 são obrigatórios.' });
    const { ZAPI_INSTANCE_ID, ZAPI_TOKEN, ZAPI_CLIENT_TOKEN } = process.env;
    if (!ZAPI_INSTANCE_ID || !ZAPI_TOKEN || !ZAPI_CLIENT_TOKEN) return res.status(500).json({ message: 'Z-API não configurado.' });
    const rawPhone = phone.replace(/\D/g, '');
    const normalizedPhone = rawPhone.startsWith('55') ? rawPhone : `55${rawPhone}`;
    try {
      const zapiUrl = `https://api.z-api.io/instances/${ZAPI_INSTANCE_ID}/token/${ZAPI_TOKEN}/send-image`;
      const response = await fetch(zapiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Client-Token': ZAPI_CLIENT_TOKEN },
        body: JSON.stringify({
          phone: normalizedPhone,
          image: imageBase64,
          caption: `Olá ${name || ''}! 🎨\n\nSeu retrato *retravium* está pronto! ✨\n\nQualquer dúvida é só falar aqui. 😊`.replace('Olá !', 'Olá!'),
        }),
        signal: AbortSignal.timeout(30_000),
      });
      if (!response.ok) {
        const text = await response.text().catch(() => '');
        throw new Error(`Z-API retornou ${response.status}: ${text}`);
      }
      return res.json({ success: true });
    } catch (err: any) {
      console.error('[WhatsApp portrait] Erro:', err.message);
      return res.status(502).json({ message: 'Erro ao enviar para o WhatsApp. Tente novamente.' });
    }
  });

  // ── WhatsApp: mensagem de texto (pedidos físicos) ─────────────────────────────
  app.post('/api/whatsapp/text', async (req, res) => {
    const { phone, message } = req.body;
    if (!phone || !message) return res.status(400).json({ message: 'phone e message são obrigatórios.' });
    const { ZAPI_INSTANCE_ID, ZAPI_TOKEN, ZAPI_CLIENT_TOKEN } = process.env;
    if (!ZAPI_INSTANCE_ID || !ZAPI_TOKEN || !ZAPI_CLIENT_TOKEN) return res.status(500).json({ message: 'Z-API não configurado.' });
    const rawPhone = phone.replace(/\D/g, '');
    const normalizedPhone = rawPhone.startsWith('55') ? rawPhone : `55${rawPhone}`;
    try {
      const zapiUrl = `https://api.z-api.io/instances/${ZAPI_INSTANCE_ID}/token/${ZAPI_TOKEN}/send-text`;
      const response = await fetch(zapiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Client-Token': ZAPI_CLIENT_TOKEN },
        body: JSON.stringify({ phone: normalizedPhone, message }),
        signal: AbortSignal.timeout(15_000),
      });
      if (!response.ok) throw new Error(`Z-API ${response.status}`);
      return res.json({ success: true });
    } catch (err: any) {
      return res.status(502).json({ message: err.message });
    }
  });

  // ── Salvar pedido no Google Sheets ───────────────────────────────────────────
  app.post('/api/orders/sheet', async (req, res) => {
    try {
      const { nome, cpf, telefone, produto, cep, rua, numero, complemento, cidade, estado, portraitId, orderId } = req.body;
      if (!nome || !cpf || !telefone || !produto) {
        return res.status(400).json({ message: 'Dados incompletos.' });
      }
      await appendOrderToSheet({ nome, cpf, telefone, produto, cep, rua, numero, complemento, cidade, estado, portraitId, orderId });
      return res.json({ success: true });
    } catch (err: any) {
      return res.status(500).json({ message: err.message });
    }
  });

  // Inicialização: cria bucket no Supabase e limpa metadados antigos
  ensureBucket();
  cleanupOldPortraits();
  ensureSheetHeaders();

  return httpServer;
}
