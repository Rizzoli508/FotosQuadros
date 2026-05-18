import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

// ── Moldes disponíveis ─────────────────────────────────────────────────────
const MOLDS = [
  { id: '2p_1',  label: 'Casal — Clássico',       subStyle: 'classico' },
  { id: '2p_1',  label: 'Casal — Íntimo',          subStyle: 'intimo'   },
  { id: '2p_2',  label: 'Mãe & Bebê — Clássico',   subStyle: 'classico' },
  { id: '2p_2',  label: 'Mãe & Bebê — Íntimo',     subStyle: 'intimo'   },
  { id: '2p_3',  label: 'Mãe & Filha — Clássico',  subStyle: 'classico' },
  { id: '2p_3',  label: 'Mãe & Filha — Íntimo',    subStyle: 'intimo'   },
  { id: '2p_4',  label: 'Pai & Filha — Clássico',  subStyle: 'classico' },
  { id: '2p_4',  label: 'Pai & Filha — Íntimo',    subStyle: 'intimo'   },
  { id: '2p_5',  label: 'Mãe & Filho — Clássico',  subStyle: 'classico' },
  { id: '2p_5',  label: 'Mãe & Filho — Íntimo',    subStyle: 'intimo'   },
  { id: '2p_6',  label: 'Pai & Filho — Clássico',  subStyle: 'classico' },
  { id: '2p_6',  label: 'Pai & Filho — Íntimo',    subStyle: 'intimo'   },
  { id: '3p_1',  label: '3 Pessoas — Abraço',       subStyle: 'classico' },
  { id: '3p_3',  label: '3 Pessoas — Ternura',      subStyle: 'classico' },
  { id: '3p_4',  label: '3 Pessoas — Laço',         subStyle: 'classico' },
  { id: '4p_1',  label: '4 Pessoas — Raízes',       subStyle: 'classico' },
  { id: '4p_2',  label: '4 Pessoas — Amor',         subStyle: 'classico' },
  { id: '4p_3',  label: '4 Pessoas — Laços',        subStyle: 'classico' },
  { id: '4p_4',  label: '4 Pessoas — Memória',      subStyle: 'classico' },
  { id: 'pet_1', label: 'Pet — Vocês Dois',         subStyle: 'classico' },
  { id: 'pet_2', label: 'Pet — Amor Peludo',        subStyle: 'classico' },
  { id: 'pet_3', label: 'Pet — Família Completa',   subStyle: 'classico' },
];

// ── Interfaces ─────────────────────────────────────────────────────────────
interface Slot {
  id: number;
  moldIndex: number;
  finish: 'pb' | 'color';
  photos: (string | null)[];
  status: 'idle' | 'generating' | 'done' | 'error';
  results: string[];
  error: string | null;
  log: string;
}

interface CustomOrder {
  prompt: string;
  photos: (string | null)[];
  name: string;
  phone: string;
  cpf: string;
  price: string;
  genStatus: 'idle' | 'generating' | 'done' | 'error';
  genResult: string | null;
  genError: string | null;
  genLog: string;
  pixStatus: 'idle' | 'loading' | 'done' | 'error';
  qrCode: string | null;
  pixCopyPaste: string | null;
  pixOrderId: number | null;
  pixError: string | null;
  pixCopied: boolean;
}

// ── Helpers ────────────────────────────────────────────────────────────────
let nextId = 1;
function newSlot(): Slot {
  return {
    id: nextId++,
    moldIndex: 0,
    finish: 'pb',
    photos: [null, null, null, null],
    status: 'idle',
    results: [],
    error: null,
    log: '',
  };
}

function defaultCustomOrder(): CustomOrder {
  return {
    prompt: '',
    photos: Array(8).fill(null),
    name: '',
    phone: '',
    cpf: '',
    price: '',
    genStatus: 'idle',
    genResult: null,
    genError: null,
    genLog: '',
    pixStatus: 'idle',
    qrCode: null,
    pixCopyPaste: null,
    pixOrderId: null,
    pixError: null,
    pixCopied: false,
  };
}

// ── PhotoSlot ──────────────────────────────────────────────────────────────
function PhotoSlot({
  index, preview, onUpload, onRemove, size = 'md',
}: {
  index: number;
  preview: string | null;
  onUpload: (file: File) => void;
  onRemove: () => void;
  size?: 'sm' | 'md';
}) {
  const onDrop = useCallback((files: File[]) => { if (files[0]) onUpload(files[0]); }, [onUpload]);
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: { 'image/*': [] }, maxFiles: 1,
  });
  const dim = size === 'sm' ? 'w-16 h-16' : 'w-20 h-20';

  if (preview) {
    return (
      <div className="relative">
        <img src={preview} className={`${dim} object-cover rounded-lg border border-gray-300`} />
        <button
          onClick={onRemove}
          className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full w-4 h-4 text-[10px] flex items-center justify-center"
        >
          ✕
        </button>
      </div>
    );
  }
  return (
    <div
      {...getRootProps()}
      className={`${dim} border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer text-gray-400 text-xs text-center ${isDragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}`}
    >
      <input {...getInputProps()} />
      <span className="text-lg leading-none mb-0.5">+</span>
      <span>{index + 1}</span>
    </div>
  );
}

// ── Lógica de geração padrão ───────────────────────────────────────────────
async function runGeneration(slot: Slot, onUpdate: (patch: Partial<Slot>) => void) {
  const images = slot.photos.filter(Boolean) as string[];
  if (images.length === 0) {
    onUpdate({ status: 'error', error: 'Envie pelo menos uma foto.' });
    return;
  }
  const mold = MOLDS[slot.moldIndex];
  onUpdate({ status: 'generating', log: 'Iniciando...', error: null });

  try {
    const startRes = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ moldId: mold.id, subStyle: mold.subStyle, finish: slot.finish, images }),
    });
    const { jobId } = await startRes.json();
    onUpdate({ log: `Job ${jobId.slice(0, 8)}...` });

    for (let i = 0; i < 300; i++) {
      await new Promise(r => setTimeout(r, 2000));
      const poll = await fetch(`/api/generate/status/${jobId}`);
      const data = await poll.json();
      onUpdate({ log: `Aguardando... ${i * 2}s` });
      if (data.status === 'done') {
        onUpdate({
          status: 'done',
          results: [...(slot.results || []), `data:${data.mimeType};base64,${data.imageBase64}`],
          log: 'Pronto!',
        });
        return;
      }
      if (data.status === 'error') {
        onUpdate({ status: 'error', error: data.message || 'Erro.', log: '' });
        return;
      }
    }
    onUpdate({ status: 'error', error: 'Timeout.', log: '' });
  } catch (e: any) {
    onUpdate({ status: 'error', error: e.message, log: '' });
  }
}

// ── Lógica de geração personalizada ───────────────────────────────────────
async function runCustomGeneration(
  prompt: string,
  photos: (string | null)[],
  prevResults: string[],
  onUpdate: (patch: Partial<CustomOrder>) => void
) {
  const images = photos.filter(Boolean) as string[];
  if (images.length === 0) {
    onUpdate({ genStatus: 'error', genError: 'Envie pelo menos uma foto.' });
    return;
  }
  if (!prompt.trim()) {
    onUpdate({ genStatus: 'error', genError: 'Escreva o prompt personalizado.' });
    return;
  }
  onUpdate({ genStatus: 'generating', genLog: 'Iniciando...', genError: null });

  try {
    const startRes = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rawPrompt: prompt, images }),
    });
    const { jobId } = await startRes.json();
    onUpdate({ genLog: `Job ${jobId.slice(0, 8)}...` });

    for (let i = 0; i < 300; i++) {
      await new Promise(r => setTimeout(r, 2000));
      const poll = await fetch(`/api/generate/status/${jobId}`);
      const data = await poll.json();
      onUpdate({ genLog: `Aguardando... ${i * 2}s` });
      if (data.status === 'done') {
        onUpdate({
          genStatus: 'done',
          genResult: `data:${data.mimeType};base64,${data.imageBase64}`,
          genLog: 'Pronto!',
        });
        return;
      }
      if (data.status === 'error') {
        onUpdate({ genStatus: 'error', genError: data.message || 'Erro.', genLog: '' });
        return;
      }
    }
    onUpdate({ genStatus: 'error', genError: 'Timeout.', genLog: '' });
  } catch (e: any) {
    onUpdate({ genStatus: 'error', genError: e.message, genLog: '' });
  }
}

async function generateAdminPix(
  name: string, cpf: string, phone: string, price: string,
  onUpdate: (patch: Partial<CustomOrder>) => void
) {
  const amount = parseFloat(price.replace(',', '.'));
  if (!name.trim() || !cpf.trim() || isNaN(amount) || amount <= 0) {
    onUpdate({ pixError: 'Preencha nome, CPF e valor corretamente.' });
    return;
  }
  onUpdate({ pixStatus: 'loading', pixError: null });
  try {
    const res = await fetch('/api/admin/pix', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        cpf,
        phone: phone || '11999999999',
        amount,
        description: 'Retrato personalizado retravium',
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Erro ao gerar Pix.');
    onUpdate({
      pixStatus: 'done',
      qrCode: data.qrCode,
      pixCopyPaste: data.pixCopyPaste,
      pixOrderId: data.orderId,
    });
  } catch (e: any) {
    onUpdate({ pixStatus: 'error', pixError: e.message });
  }
}

function handleDownload(result: string, label: string, index: number) {
  const a = document.createElement('a');
  a.href = result;
  a.download = `retravium_${label.replace(/[^a-z0-9]/gi, '_')}_${index + 1}.png`;
  a.click();
}

// ── Admin principal ────────────────────────────────────────────────────────
export default function Admin() {
  const [slots, setSlots] = useState<Slot[]>([newSlot()]);
  const [customOrder, setCustomOrder] = useState<CustomOrder>(defaultCustomOrder());

  const updateSlot = (id: number, patch: Partial<Slot>) => {
    setSlots(prev => prev.map(s => s.id === id ? { ...s, ...patch } : s));
  };
  const updateCustom = (patch: Partial<CustomOrder>) => {
    setCustomOrder(prev => ({ ...prev, ...patch }));
  };

  const addSlot = () => setSlots(prev => [...prev, newSlot()]);
  const removeSlot = (id: number) => setSlots(prev => prev.filter(s => s.id !== id));

  const handleGenerateAll = () => {
    slots.forEach(slot => {
      if (slot.status === 'generating') return;
      runGeneration(slot, (patch) => updateSlot(slot.id, patch));
    });
  };

  const anyGenerating = slots.some(s => s.status === 'generating');

  const uploadPhoto = (slotId: number, photoIndex: number, file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setSlots(prev => prev.map(s => {
        if (s.id !== slotId) return s;
        const updated = [...s.photos];
        updated[photoIndex] = e.target?.result as string;
        return { ...s, photos: updated };
      }));
    };
    reader.readAsDataURL(file);
  };

  const removePhoto = (slotId: number, photoIndex: number) => {
    setSlots(prev => prev.map(s => {
      if (s.id !== slotId) return s;
      const updated = [...s.photos];
      updated[photoIndex] = null;
      return { ...s, photos: updated };
    }));
  };

  const uploadCustomPhoto = (photoIndex: number, file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setCustomOrder(prev => {
        const updated = [...prev.photos];
        updated[photoIndex] = e.target?.result as string;
        return { ...prev, photos: updated };
      });
    };
    reader.readAsDataURL(file);
  };

  const removeCustomPhoto = (photoIndex: number) => {
    setCustomOrder(prev => {
      const updated = [...prev.photos];
      updated[photoIndex] = null;
      return { ...prev, photos: updated };
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* ── Header ── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Admin — Geração</h1>
            <p className="text-gray-400 text-sm">Sem limites · Sem watermark · Paralelo</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={addSlot}
              className="px-4 py-2 border-2 border-blue-500 text-blue-600 font-semibold rounded-lg hover:bg-blue-50 transition-all text-sm"
            >
              + Adicionar geração
            </button>
            <button
              onClick={handleGenerateAll}
              disabled={anyGenerating}
              className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm"
            >
              {anyGenerating ? 'Gerando...' : `▶ Gerar ${slots.length > 1 ? 'todas' : ''}`}
            </button>
          </div>
        </div>

        {/* ── Slots de geração padrão ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {slots.map((slot, slotIdx) => (
            <div key={slot.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">

              {/* Header do slot */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
                <span className="text-sm font-semibold text-gray-600">Geração {slotIdx + 1}</span>
                <div className="flex items-center gap-2">
                  {slot.status === 'generating' && (
                    <span className="text-xs text-blue-500 font-medium animate-pulse">● {slot.log}</span>
                  )}
                  {slot.status === 'done' && (
                    <span className="text-xs text-green-500 font-medium">✓ {slot.results.length} geração(ões)</span>
                  )}
                  {slot.status === 'error' && (
                    <span className="text-xs text-red-500 font-medium">✗ Erro</span>
                  )}
                  {slots.length > 1 && (
                    <button
                      onClick={() => removeSlot(slot.id)}
                      className="text-gray-300 hover:text-red-400 text-lg leading-none"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              <div className="p-4 space-y-4">

                {/* Molde — grade completa */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    Molde
                  </label>
                  <div className="grid grid-cols-3 gap-1.5 max-h-44 overflow-y-auto pr-1">
                    {MOLDS.map((m, i) => (
                      <button
                        key={i}
                        onClick={() => updateSlot(slot.id, { moldIndex: i })}
                        className={`text-left px-2 py-1.5 rounded-lg border text-[11px] leading-tight transition-all ${
                          slot.moldIndex === i
                            ? 'border-blue-500 bg-blue-50 text-blue-700 font-semibold'
                            : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Acabamento */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    Acabamento
                  </label>
                  <div className="flex gap-2">
                    {(['pb', 'color'] as const).map(f => (
                      <button
                        key={f}
                        onClick={() => updateSlot(slot.id, { finish: f })}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                          slot.finish === f
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-200 text-gray-500 hover:border-gray-300'
                        }`}
                      >
                        {f === 'pb' ? 'P&B' : 'Colorido'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Fotos */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    Fotos de referência
                  </label>
                  <div className="flex gap-2 flex-wrap">
                    {slot.photos.map((preview, i) => (
                      <PhotoSlot
                        key={i}
                        index={i}
                        preview={preview}
                        onUpload={(f) => uploadPhoto(slot.id, i, f)}
                        onRemove={() => removePhoto(slot.id, i)}
                      />
                    ))}
                  </div>
                </div>

                {/* Erro */}
                {slot.error && <p className="text-xs text-red-500">{slot.error}</p>}

                {/* Loading skeleton */}
                {slot.status === 'generating' && slot.results.length === 0 && (
                  <div className="w-full aspect-[3/4] bg-gray-100 rounded-lg animate-pulse flex items-center justify-center text-gray-300 text-sm">
                    Gerando...
                  </div>
                )}

                {/* Resultados empilhados */}
                {slot.results.length > 0 && (
                  <div className="space-y-4">
                    {slot.results.map((result, i) => (
                      <div key={i}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-gray-400 font-medium">Geração {i + 1}</span>
                          <button
                            onClick={() => handleDownload(result, MOLDS[slot.moldIndex].label, i)}
                            className="px-3 py-1 bg-green-600 text-white text-xs font-semibold rounded-lg hover:bg-green-700 transition-all"
                          >
                            ⬇ Baixar
                          </button>
                        </div>
                        <img src={result} alt={`Resultado ${i + 1}`} className="w-full rounded-lg" />
                      </div>
                    ))}
                    {/* Botão gerar novamente enquanto gerando mais */}
                    {slot.status === 'generating' && (
                      <div className="w-full aspect-[3/4] bg-gray-100 rounded-lg animate-pulse flex items-center justify-center text-gray-300 text-sm">
                        Gerando nova versão...
                      </div>
                    )}
                  </div>
                )}

                {/* Gerar individual */}
                <button
                  onClick={() => runGeneration(slot, (patch) => updateSlot(slot.id, patch))}
                  disabled={slot.status === 'generating'}
                  className="w-full py-2 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {slot.status === 'generating' ? `Gerando... ${slot.log}` : slot.results.length > 0 ? '↺ Gerar novamente' : '▶ Gerar'}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* ── Pedido Personalizado ── */}
        <div className="bg-white rounded-xl shadow-sm border-2 border-purple-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-purple-100 bg-purple-50 flex items-center gap-2">
            <span className="text-lg">✦</span>
            <div>
              <h2 className="text-base font-bold text-purple-800">Pedido Personalizado</h2>
              <p className="text-xs text-purple-500">Prompt livre · qualquer número de pessoas · Pix com valor customizado</p>
            </div>
          </div>

          <div className="p-5 space-y-5">

            {/* Fotos — 8 slots */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Fotos de referência (até 8)
              </label>
              <div className="flex gap-2 flex-wrap">
                {customOrder.photos.map((preview, i) => (
                  <PhotoSlot
                    key={i}
                    index={i}
                    preview={preview}
                    onUpload={(f) => uploadCustomPhoto(i, f)}
                    onRemove={() => removeCustomPhoto(i)}
                    size="sm"
                  />
                ))}
              </div>
            </div>

            {/* Prompt personalizado */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Prompt personalizado
              </label>
              <textarea
                value={customOrder.prompt}
                onChange={e => updateCustom({ prompt: e.target.value })}
                rows={6}
                placeholder="Descreva aqui o retrato que o cliente pediu. Ex: Ultra-realistic black and white portrait of a family of 7 people: grandparents, parents and 3 children. Use the uploaded reference photos as identity references..."
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-200 resize-none font-mono"
              />
              <p className="text-[10px] text-gray-400 mt-1">
                {customOrder.prompt.length} caracteres · O preamble de identidade NÃO é adicionado automaticamente — inclua no prompt se necessário
              </p>
            </div>

            {/* Botão gerar retrato */}
            <button
              onClick={() => {
                const snap = { ...customOrder };
                runCustomGeneration(snap.prompt, snap.photos, [], updateCustom);
              }}
              disabled={customOrder.genStatus === 'generating'}
              className="w-full py-2.5 bg-purple-600 text-white font-bold rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm"
            >
              {customOrder.genStatus === 'generating'
                ? `Gerando... ${customOrder.genLog}`
                : customOrder.genResult
                ? '↺ Gerar novamente'
                : '▶ Gerar retrato'}
            </button>

            {/* Erro de geração */}
            {customOrder.genError && (
              <p className="text-xs text-red-500 -mt-2">{customOrder.genError}</p>
            )}

            {/* Resultado */}
            {customOrder.genStatus === 'generating' && !customOrder.genResult && (
              <div className="w-full aspect-[3/4] bg-gray-100 rounded-lg animate-pulse flex items-center justify-center text-gray-300 text-sm">
                Gerando retrato personalizado...
              </div>
            )}

            {customOrder.genResult && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Resultado</span>
                  <button
                    onClick={() => handleDownload(customOrder.genResult!, 'personalizado', 0)}
                    className="px-3 py-1 bg-green-600 text-white text-xs font-semibold rounded-lg hover:bg-green-700 transition-all"
                  >
                    ⬇ Baixar
                  </button>
                </div>
                <img src={customOrder.genResult} alt="Retrato personalizado" className="w-full rounded-lg mb-4" />

                {/* ── Seção de Pix ── */}
                <div className="border border-gray-200 rounded-xl p-4 space-y-3 bg-gray-50">
                  <h3 className="text-sm font-bold text-gray-700">Gerar Pix para este pedido</h3>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Nome do cliente</label>
                      <input
                        type="text"
                        value={customOrder.name}
                        onChange={e => updateCustom({ name: e.target.value })}
                        placeholder="Ex: João Silva"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-purple-400"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Telefone (WhatsApp)</label>
                      <input
                        type="text"
                        value={customOrder.phone}
                        onChange={e => updateCustom({ phone: e.target.value })}
                        placeholder="11999999999"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-purple-400"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">CPF</label>
                      <input
                        type="text"
                        value={customOrder.cpf}
                        onChange={e => updateCustom({ cpf: e.target.value })}
                        placeholder="000.000.000-00"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-purple-400"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 items-end">
                    <div className="flex-1">
                      <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Valor (R$)</label>
                      <input
                        type="number"
                        min="1"
                        step="0.01"
                        value={customOrder.price}
                        onChange={e => updateCustom({ price: e.target.value })}
                        placeholder="Ex: 150"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-purple-400"
                      />
                    </div>
                    <button
                      onClick={() => generateAdminPix(
                        customOrder.name,
                        customOrder.cpf,
                        customOrder.phone,
                        customOrder.price,
                        updateCustom
                      )}
                      disabled={customOrder.pixStatus === 'loading'}
                      className="px-5 py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 disabled:opacity-50 transition-all text-sm whitespace-nowrap"
                    >
                      {customOrder.pixStatus === 'loading' ? 'Gerando...' : 'Gerar Pix'}
                    </button>
                  </div>

                  {customOrder.pixError && (
                    <p className="text-xs text-red-500">{customOrder.pixError}</p>
                  )}

                  {/* QR Code Pix */}
                  {customOrder.pixStatus === 'done' && customOrder.qrCode && (
                    <div className="space-y-3 pt-1">
                      <div className="flex flex-col items-center gap-3">
                        <img
                          src={`data:image/png;base64,${customOrder.qrCode}`}
                          alt="QR Code Pix"
                          className="w-48 h-48 rounded-lg border border-gray-200"
                        />
                        <p className="text-xs text-gray-500 font-medium">
                          Pedido #{customOrder.pixOrderId}
                        </p>
                      </div>
                      {customOrder.pixCopyPaste && (
                        <div className="space-y-1">
                          <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wide">
                            Pix copia e cola
                          </label>
                          <div className="flex gap-2">
                            <input
                              readOnly
                              value={customOrder.pixCopyPaste}
                              className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-xs text-gray-600 bg-gray-50 font-mono"
                            />
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(customOrder.pixCopyPaste!);
                                updateCustom({ pixCopied: true });
                                setTimeout(() => updateCustom({ pixCopied: false }), 2000);
                              }}
                              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                                customOrder.pixCopied
                                  ? 'bg-green-500 text-white'
                                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                              }`}
                            >
                              {customOrder.pixCopied ? '✓ Copiado' : 'Copiar'}
                            </button>
                          </div>
                        </div>
                      )}
                      <button
                        onClick={() => updateCustom({
                          pixStatus: 'idle',
                          qrCode: null,
                          pixCopyPaste: null,
                          pixOrderId: null,
                          pixError: null,
                          pixCopied: false,
                        })}
                        className="text-xs text-gray-400 hover:text-gray-600 underline"
                      >
                        Gerar novo Pix com valor diferente
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
