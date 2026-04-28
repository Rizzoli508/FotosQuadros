import type { Express } from "express";
import type { Server } from "http";
import fs from "fs";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import {
  appmaxGetOrCreateCustomer,
  appmaxCreateOrder,
  appmaxCreatePix,
  appmaxCreateBoleto,
  appmaxCreateCreditCard,
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

  // ── Geração de retrato via Gemini ──────────────────────────────────────────
  app.post('/api/generate', async (req, res) => {
    try {
      const { moldId, subStyle = 'classico', finish = 'pb', images = [] } = req.body;
      if (!moldId) return res.status(400).json({ message: 'moldId é obrigatório.' });
      if (!Array.isArray(images) || images.length === 0) return res.status(400).json({ message: 'Envie pelo menos uma imagem.' });

      const result = await generatePortrait(moldId, subStyle, finish, images);
      return res.json(result);
    } catch (err: any) {
      console.error('[Gemini] Erro:', err.message);
      return res.status(500).json({ message: err.message || 'Erro ao gerar retrato.' });
    }
  });

  // ── Pix via AppMax ──
  app.post('/api/payments/pix', async (req, res) => {
    try {
      const { name, cpf, phone, amount, description } = req.body;
      let { email } = req.body;
      if (!name || !cpf || !amount || !description) {
        return res.status(400).json({ message: 'Preencha todos os campos obrigatórios.' });
      }
      // Gera email placeholder se não informado
      if (!email) email = `${cpf.replace(/\D/g, '')}@cliente.retravium.com`;
      const customer = await appmaxGetOrCreateCustomer({ name, email, cpf, phone: phone || '11999999999' });
      const order = await appmaxCreateOrder(customer.id, description, amount);
      const pix = await appmaxCreatePix(order.id, customer.id, cpf);
      return res.json({ qrCode: pix.qrCode, pixCopyPaste: pix.pixCopyPaste, expiresAt: pix.expiresAt });
    } catch (err: any) {
      console.error('AppMax Pix error:', err.message);
      res.status(500).json({ message: err.message || 'Erro ao gerar Pix.' });
    }
  });

  // ── Boleto via AppMax ──
  app.post('/api/payments/boleto', async (req, res) => {
    try {
      const { name, email, cpf, phone, amount, description } = req.body;
      if (!name || !email || !cpf || !amount || !description) {
        return res.status(400).json({ message: 'Preencha todos os campos obrigatórios.' });
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
      const customer = await appmaxGetOrCreateCustomer({ name, email, cpf, phone: phone || '11999999999' });
      const order = await appmaxCreateOrder(customer.id, description, amount);
      await appmaxCreateCreditCard(order.id, customer.id, cpf, card);
      return res.json({ status: 'APPROVED' });
    } catch (err: any) {
      console.error('AppMax Card error:', err.message);
      res.status(400).json({ message: err.message || 'Cartão recusado. Verifique os dados.' });
    }
  });

  // ── Retratos: servir arquivo local ────────────────────────────────────────────
  app.get('/portraits/:id', (req, res) => {
    const { getPortraitPath } = require('./portraits');
    const filePath = getPortraitPath(req.params.id);
    if (!filePath) return res.status(404).json({ message: 'Retrato não encontrado.' });
    res.sendFile(filePath);
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
    // Lê a imagem do disco e converte para base64 (não depende de URL pública)
    const filePath = getPortraitPath(id);
    if (!filePath) return res.status(404).json({ message: 'Arquivo do retrato não encontrado. Gere novamente.' });

    const imageBase64 = `data:image/png;base64,${fs.readFileSync(filePath).toString('base64')}`;

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

  // Inicialização: cria bucket no Supabase e limpa metadados antigos
  ensureBucket();
  cleanupOldPortraits();

  return httpServer;
}
