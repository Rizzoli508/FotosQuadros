const ASAAS_BASE_URL = process.env.ASAAS_BASE_URL || 'https://sandbox.asaas.com/api/v3';
const ASAAS_API_KEY = process.env.ASAAS_API_KEY || '';

const headers = {
  'Content-Type': 'application/json',
  'access_token': ASAAS_API_KEY,
};

// Cria ou busca cliente no Asaas
export async function getOrCreateCustomer(data: {
  name: string;
  email: string;
  cpfCnpj: string;
}) {
  // Busca cliente existente pelo CPF
  const searchRes = await fetch(
    `${ASAAS_BASE_URL}/customers?cpfCnpj=${data.cpfCnpj.replace(/\D/g, '')}`,
    { headers }
  );
  const searchData = await searchRes.json() as any;

  if (searchData.data && searchData.data.length > 0) {
    return searchData.data[0];
  }

  // Cria novo cliente
  const createRes = await fetch(`${ASAAS_BASE_URL}/customers`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      name: data.name,
      email: data.email,
      cpfCnpj: data.cpfCnpj.replace(/\D/g, ''),
    }),
  });
  return createRes.json();
}

// Cria link de pagamento (checkout externo)
export async function createPaymentLink(amount: number, description: string) {
  const res = await fetch(`${ASAAS_BASE_URL}/paymentLinks`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      name: description,
      value: amount,
      billingType: 'UNDEFINED', // aceita todos os métodos
      chargeType: 'DETACHED',
      dueDateLimitDays: 1,
    }),
  });
  const data = await res.json() as any;
  console.log('[Asaas] paymentLink:', JSON.stringify(data).substring(0, 200));
  return data;
}

// Cria cobrança Pix
export async function createPixPayment(customerId: string, amount: number, description: string) {
  const res = await fetch(`${ASAAS_BASE_URL}/payments`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      customer: customerId,
      billingType: 'PIX',
      value: amount,
      dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      description,
    }),
  });
  const payment = await res.json() as any;

  // Busca QR Code do Pix
  const qrRes = await fetch(`${ASAAS_BASE_URL}/payments/${payment.id}/pixQrCode`, { headers });
  const qrData = await qrRes.json() as any;

  // Remove quebras de linha e espaços do base64
  const cleanedImage = qrData.encodedImage?.replace(/\s/g, '') ?? '';
  console.log('[Asaas] QR length:', cleanedImage.length, '| payload:', qrData.payload?.substring(0, 20));

  return { payment, qrCode: cleanedImage, pixCopyPaste: qrData.payload };
}

// Cria cobrança Boleto
export async function createBoletoPayment(customerId: string, amount: number, description: string) {
  const res = await fetch(`${ASAAS_BASE_URL}/payments`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      customer: customerId,
      billingType: 'BOLETO',
      value: amount,
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      description,
    }),
  });
  const payment = await res.json() as any;
  return { payment, bankSlipUrl: payment.bankSlipUrl };
}

// Cria cobrança Cartão de Crédito
export async function createCreditCardPayment(
  customerId: string,
  amount: number,
  description: string,
  card: {
    holderName: string;
    number: string;
    expiryMonth: string;
    expiryYear: string;
    ccv: string;
  },
  holderInfo: {
    name: string;
    email: string;
    cpfCnpj: string;
    phone: string;
    postalCode: string;
    addressNumber: string;
  }
) {
  const res = await fetch(`${ASAAS_BASE_URL}/payments`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      customer: customerId,
      billingType: 'CREDIT_CARD',
      value: amount,
      dueDate: new Date().toISOString().split('T')[0],
      description,
      creditCard: {
        holderName: card.holderName,
        number: card.number.replace(/\s/g, ''),
        expiryMonth: card.expiryMonth,
        expiryYear: card.expiryYear,
        ccv: card.ccv,
      },
      creditCardHolderInfo: {
        name: holderInfo.name,
        email: holderInfo.email,
        cpfCnpj: holderInfo.cpfCnpj.replace(/\D/g, ''),
        phone: holderInfo.phone.replace(/\D/g, ''),
        postalCode: holderInfo.postalCode.replace(/\D/g, ''),
        addressNumber: holderInfo.addressNumber,
      },
    }),
  });
  return res.json();
}
