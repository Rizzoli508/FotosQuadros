/**
 * server/figurinha/routes.ts
 * Rotas exclusivas do produto Copa Figurinha — separadas do Retravium
 */

import type { Express } from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import OpenAI, { toFile } from "openai";
import {
  appmaxGetOrCreateCustomer,
  appmaxCreateOrder,
  appmaxCreatePix,
} from "../appmax";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Imagem de referência fixa (figurinha do Vinícius)
const REFERENCIA_PATH = path.resolve(__dirname, "../../client/public/figurinha/referencia.jpg");

// Pedidos pendentes aguardando pagamento: orderId → dados
const pendingFigurinhas = new Map<number, {
  phone: string;
  nome: string;
  dataNascimento: string;
  altura: string;
  peso: string;
  clube: string;
  selecao: string;
  photoBase64: string;
  generated: boolean;
}>();

// Conjunto para deduplicação de webhooks
const processedWebhooks = new Set<number>();

function buildPrompt(nome: string, dataNascimento: string, altura: string, peso: string, clube: string, selecao: string): string {
  return `Na primeira imagem anexada aparece uma figurinha do álbum da Copa do Mundo de 2026. Quero que você faça uma nova figurinha com as seguintes características: Quero que remova a imagem do jogador e coloque a imagem da pessoa que anexo na segunda imagem. Quero que ela tenha a camisa da Seleção Brasileira, como a que aparece na figurinha original. Quero que a imagem da pessoa tenha a textura, sombras, luzes e cor da foto original. Quero que em vez do nome do jogador apareça o nome: ${nome.toUpperCase()}. Quero que a parte da data de nascimento, altura e peso apareça: [ ${dataNascimento} / ${altura} / ${peso}]. Quero que na parte da equipe apareça: [${clube.toUpperCase()} (${selecao})]. A imagem deve ter as mesmas medidas que a primeira imagem que lhe anexo. Não deve adicionar nada, nem alterar nada dela. Apenas realize as mudanças que peço.`;
}

async function generateFigurinha(data: {
  nome: string;
  dataNascimento: string;
  altura: string;
  peso: string;
  clube: string;
  selecao: string;
  photoBase64: string;
}): Promise<string> {
  // Carrega imagem de referência
  const refBuffer = fs.readFileSync(REFERENCIA_PATH);
  const refFile = await toFile(refBuffer, "referencia.jpg", { type: "image/jpeg" });

  // Converte foto do cliente
  const clean = data.photoBase64.replace(/^data:image\/[a-z]+;base64,/, "");
  const clientBuffer = Buffer.from(clean, "base64");
  const clientFile = await toFile(clientBuffer, "cliente.jpg", { type: "image/jpeg" });

  const prompt = buildPrompt(data.nome, data.dataNascimento, data.altura, data.peso, data.clube, data.selecao);

  console.log(`[Figurinha] Gerando para ${data.nome}...`);

  const response = await client.images.edit({
    model: "gpt-image-2",
    image: [refFile, clientFile] as any,
    prompt,
    quality: "high",
  });

  const b64 = response.data?.[0]?.b64_json;
  if (!b64) throw new Error("OpenAI não retornou imagem.");

  console.log(`[Figurinha] Geração concluída para ${data.nome}`);
  return b64;
}

async function sendWhatsApp(phone: string, imageBase64: string, nome: string) {
  const instanceId = process.env.ZAPI_INSTANCE_ID;
  const token = process.env.ZAPI_TOKEN;
  const clientToken = process.env.ZAPI_CLIENT_TOKEN;

  const cleanPhone = phone.replace(/\D/g, "");
  const phoneWithCountry = cleanPhone.startsWith("55") ? cleanPhone : `55${cleanPhone}`;

  // Mensagem de texto
  await fetch(`https://api.z-api.io/instances/${instanceId}/token/${token}/send-text`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "client-token": clientToken! },
    body: JSON.stringify({
      phone: phoneWithCountry,
      message: `🏆 *Sua figurinha da Copa chegou, ${nome.split(" ")[0]}!*\n\nVocê virou craque do álbum Panini 2026! ⚽🇧🇷\n\nSalve a imagem e mostre pra todo mundo! 😄`,
    }),
  });

  // Imagem
  await fetch(`https://api.z-api.io/instances/${instanceId}/token/${token}/send-image`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "client-token": clientToken! },
    body: JSON.stringify({
      phone: phoneWithCountry,
      image: `data:image/png;base64,${imageBase64}`,
      caption: "Sua figurinha personalizada Copa 2026 ⚽",
    }),
  });

  console.log(`[Figurinha] WhatsApp enviado para ${phoneWithCountry}`);
}

export function registerFigurinhaRoutes(app: Express) {

  // ── Gerar Pix para figurinha ───────────────────────────────────────────
  app.post("/api/figurinha/pix", async (req, res) => {
    try {
      const { nome, dataNascimento, altura, peso, clube, selecao, phone, photo } = req.body;

      if (!nome || !dataNascimento || !altura || !peso || !clube || !phone || !photo) {
        return res.status(400).json({ message: "Preencha todos os campos e envie uma foto." });
      }

      const cpf = "00000000000"; // CPF genérico para produto digital
      const email = `${phone.replace(/\D/g, "")}@figurinha.artedacopa.com`;

      const customer = await appmaxGetOrCreateCustomer({ name: nome, email, cpf, phone });
      const order = await appmaxCreateOrder(customer.id, "Figurinha Copa 2026 - Arte da Copa", 9.99);
      const pix = await appmaxCreatePix(order.id, customer.id, cpf);

      // Salva dados pendentes
      pendingFigurinhas.set(order.id, {
        phone,
        nome,
        dataNascimento,
        altura,
        peso,
        clube,
        selecao: selecao || "BRA",
        photoBase64: photo,
        generated: false,
      });

      console.log(`[Figurinha] Pix gerado — orderId=${order.id} nome=${nome}`);

      return res.json({
        qrCode: pix.qrCode,
        pixCopyPaste: pix.pixCopyPaste,
        expiresAt: pix.expiresAt,
        orderId: order.id,
      });
    } catch (err: any) {
      console.error("[Figurinha] Erro ao gerar Pix:", err.message);
      return res.status(500).json({ message: err.message || "Erro ao gerar Pix." });
    }
  });

  // ── Webhook AppMax — pagamento confirmado ──────────────────────────────
  app.post("/api/figurinha/webhook", async (req, res) => {
    try {
      const body = req.body;
      const orderId = body?.data?.order?.id || body?.order_id || body?.id;
      const status = body?.data?.order?.status || body?.status || body?.data?.status;

      if (!orderId) return res.json({ ok: true });

      const paid =
        status === "paid" ||
        status === "PAID" ||
        status === "aprovado" ||
        status === "APPROVED" ||
        status === "Aprovado";

      if (!paid) return res.json({ ok: true });

      // Deduplicação
      if (processedWebhooks.has(orderId)) {
        console.log(`[Figurinha] Webhook duplicado ignorado — orderId=${orderId}`);
        return res.json({ ok: true });
      }
      processedWebhooks.add(orderId);
      setTimeout(() => processedWebhooks.delete(orderId), 60 * 60 * 1000);

      const dados = pendingFigurinhas.get(orderId);
      if (!dados) {
        console.log(`[Figurinha] Dados não encontrados — orderId=${orderId}`);
        return res.json({ ok: true });
      }

      if (dados.generated) return res.json({ ok: true });
      dados.generated = true;

      res.json({ ok: true }); // Responde imediatamente

      // Gera e envia em background
      (async () => {
        try {
          const imageBase64 = await generateFigurinha(dados);
          await sendWhatsApp(dados.phone, imageBase64, dados.nome);
          pendingFigurinhas.delete(orderId);
        } catch (err: any) {
          console.error(`[Figurinha] Erro na geração/envio — orderId=${orderId}:`, err.message);
        }
      })();
    } catch (err: any) {
      console.error("[Figurinha] Erro no webhook:", err.message);
      return res.status(500).json({ message: err.message });
    }
  });

  // ── Status do pagamento (polling do frontend) ──────────────────────────
  app.get("/api/figurinha/status/:orderId", async (req, res) => {
    try {
      const orderId = parseInt(req.params.orderId);
      const dados = pendingFigurinhas.get(orderId);
      return res.json({ generated: dados?.generated || false });
    } catch (err: any) {
      return res.status(500).json({ message: err.message });
    }
  });

  console.log("[Figurinha] Rotas registradas.");
}
