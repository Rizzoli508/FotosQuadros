const BASE = 'https://admin.appmax.com.br/api/v3';
const TOKEN = process.env.APPMAX_TOKEN || '';

const headers = {
  'Content-Type': 'application/json',
  'access-token': TOKEN,
};

// Cria ou busca cliente
export async function appmaxGetOrCreateCustomer(data: {
  name: string;
  email: string;
  cpf: string;
  phone: string;
}) {
  const parts = data.name.trim().split(' ');
  const firstname = parts[0];
  const lastname = parts.slice(1).join(' ') || parts[0];
  const phone = data.phone.replace(/\D/g, '');

  const res = await fetch(`${BASE}/customer`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      firstname,
      lastname,
      email: data.email,
      telephone: phone,
      tax_id: data.cpf.replace(/\D/g, ''),
    }),
  });
  const json = await res.json() as any;
  if (!json.success && json.success !== true) throw new Error(json.text || 'Erro ao criar cliente');
  return json.data;
}

// Cria pedido
export async function appmaxCreateOrder(customerId: number, description: string, amount: number) {
  const res = await fetch(`${BASE}/order`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      customer_id: customerId,
      products: [{
        sku: 'RETRAVIUM-001',
        name: description,
        description,
        price: amount,
        qty: 1,
      }],
    }),
  });
  const json = await res.json() as any;
  if (!json.success) throw new Error(json.text || 'Erro ao criar pedido');
  return json.data;
}

// Pix
export async function appmaxCreatePix(orderId: number, customerId: number, cpf: string) {
  const res = await fetch(`${BASE}/payment/pix`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      cart: { order_id: orderId },
      customer: { customer_id: customerId },
      payment: { pix: { document_number: cpf.replace(/\D/g, '') } },
    }),
  });
  const json = await res.json() as any;
  if (json.success !== 'ATIVA' && json.success !== true) throw new Error(json.text || 'Erro ao gerar Pix');
  return {
    qrCode: json.data.pix_qrcode,       // base64 imagem
    pixCopyPaste: json.data.pix_emv,    // código copia e cola
    expiresAt: json.data.pix_expiration_date,
  };
}

// Boleto
export async function appmaxCreateBoleto(orderId: number, customerId: number, cpf: string) {
  const res = await fetch(`${BASE}/payment/boleto`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      cart: { order_id: orderId },
      customer: { customer_id: customerId },
      payment: { Boleto: { document_number: cpf.replace(/\D/g, '') } },
    }),
  });
  const json = await res.json() as any;
  if (!json.success) throw new Error(json.text || 'Erro ao gerar boleto');
  return {
    boletoUrl: json.data.pdf,
    digitableLine: json.data.digitable_line,
    dueDate: json.data.due_date,
  };
}

// Cartão de crédito
export async function appmaxCreateCreditCard(
  orderId: number,
  customerId: number,
  cpf: string,
  card: {
    holderName: string;
    number: string;
    expiryMonth: string;
    expiryYear: string;
    ccv: string;
  }
) {
  const res = await fetch(`${BASE}/payment/credit-card`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      cart: { order_id: orderId },
      customer: { customer_id: customerId },
      payment: {
        CreditCard: {
          document_number: cpf.replace(/\D/g, ''),
          installments: 1,
          number: card.number.replace(/\s/g, ''),
          name: card.holderName,
          month: card.expiryMonth,
          year: card.expiryYear,
          cvv: card.ccv,
        },
      },
    }),
  });
  const json = await res.json() as any;
  if (!json.success && json.success !== 'ATIVA') throw new Error(json.text || 'Cartão recusado. Verifique os dados.');
  return json.data;
}
