const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN || '';
const MP_BASE_URL = 'https://api.mercadopago.com';

export async function createMPPreference(title: string, amount: number) {
  const res = await fetch(`${MP_BASE_URL}/checkout/preferences`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${MP_ACCESS_TOKEN}`,
    },
    body: JSON.stringify({
      items: [
        {
          title,
          quantity: 1,
          unit_price: amount,
          currency_id: 'BRL',
        },
      ],
      payment_methods: {
        excluded_payment_types: [],
        installments: 1,
      },
      back_urls: {
        success: 'https://retravium.com.br/sucesso',
        failure: 'https://retravium.com.br',
        pending: 'https://retravium.com.br',
      },
    }),
  });

  const data = await res.json() as any;
  console.log('[MP] preference:', JSON.stringify(data).substring(0, 300));
  return data;
}
