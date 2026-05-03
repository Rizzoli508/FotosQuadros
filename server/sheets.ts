import { google } from 'googleapis';

const SHEET_ID = process.env.GOOGLE_SHEETS_ID || '';

function getAuth() {
  return new google.auth.JWT({
    email: process.env.GOOGLE_CLIENT_EMAIL,
    key: (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
}

export async function appendOrderToSheet(data: {
  nome: string;
  cpf: string;
  telefone: string;
  produto: string;
  cep?: string;
  rua?: string;
  numero?: string;
  complemento?: string;
  cidade?: string;
  estado?: string;
  portraitId?: string;
  orderId?: number;
}) {
  if (!SHEET_ID) return;
  try {
    const auth = getAuth();
    const sheets = google.sheets({ version: 'v4', auth });

    const now = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });

    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: 'A:L',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[
          now,
          data.nome,
          data.cpf,
          data.telefone,
          data.produto,
          data.cep || '',
          data.rua || '',
          data.numero || '',
          data.complemento || '',
          data.cidade || '',
          data.estado || '',
          data.orderId || '',
        ]],
      },
    });
  } catch (err: any) {
    console.error('[Sheets] Erro ao salvar pedido:', err.message);
  }
}

export async function ensureSheetHeaders() {
  if (!SHEET_ID) return;
  try {
    const auth = getAuth();
    const sheets = google.sheets({ version: 'v4', auth });

    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: 'A1:L1',
    });

    if (!res.data.values || res.data.values.length === 0) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: SHEET_ID,
        range: 'A1:L1',
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [[
            'Data/Hora', 'Nome', 'CPF', 'Telefone', 'Produto',
            'CEP', 'Rua', 'Número', 'Complemento', 'Cidade', 'Estado', 'ID Pedido'
          ]],
        },
      });
    }
  } catch (err: any) {
    console.error('[Sheets] Erro ao criar cabeçalhos:', err.message);
  }
}
