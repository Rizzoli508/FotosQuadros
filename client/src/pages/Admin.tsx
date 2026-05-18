import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

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

interface Slot {
  id: number;
  moldIndex: number;
  finish: 'pb' | 'color';
  photos: (string | null)[];
  status: 'idle' | 'generating' | 'done' | 'error';
  results: string[];   // empilha todas as gerações
  error: string | null;
  log: string;
}

let nextId = 1;
function newSlot(): Slot {
  return { id: nextId++, moldIndex: 0, finish: 'pb', photos: [null, null, null, null], status: 'idle', results: [], error: null, log: '' };
}

function PhotoSlot({ index, preview, onUpload, onRemove }: {
  index: number; preview: string | null;
  onUpload: (file: File) => void; onRemove: () => void;
}) {
  const onDrop = useCallback((files: File[]) => { if (files[0]) onUpload(files[0]); }, [onUpload]);
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: { 'image/*': [] }, maxFiles: 1 });
  if (preview) {
    return (
      <div className="relative">
        <img src={preview} className="w-20 h-20 object-cover rounded-lg border border-gray-300" />
        <button onClick={onRemove} className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full w-4 h-4 text-[10px] flex items-center justify-center">✕</button>
      </div>
    );
  }
  return (
    <div {...getRootProps()} className={`w-20 h-20 border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer text-gray-400 text-xs text-center ${isDragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}`}>
      <input {...getInputProps()} />
      <span className="text-xl mb-0.5">+</span>
      <span>Foto {index + 1}</span>
    </div>
  );
}

async function runGeneration(slot: Slot, onUpdate: (patch: Partial<Slot>) => void) {
  const images = slot.photos.filter(Boolean) as string[];
  if (images.length === 0) { onUpdate({ status: 'error', error: 'Envie pelo menos uma foto.' }); return; }

  const mold = MOLDS[slot.moldIndex];
  onUpdate({ status: 'generating', log: 'Iniciando...', result: null, error: null });

  try {
    const startRes = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ moldId: mold.id, subStyle: mold.subStyle, finish: slot.finish, images }),
    });
    const { jobId } = await startRes.json();
    onUpdate({ log: `Job: ${jobId.slice(0, 8)}...` });

    for (let i = 0; i < 300; i++) {
      await new Promise(r => setTimeout(r, 2000));
      const poll = await fetch(`/api/generate/status/${jobId}`);
      const data = await poll.json();
      onUpdate({ log: `Aguardando... ${i * 2}s` });
      if (data.status === 'done') {
        onUpdate({ status: 'done', results: [...(slot.results || []), `data:${data.mimeType};base64,${data.imageBase64}`], log: 'Pronto!' });
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

export default function Admin() {
  const [slots, setSlots] = useState<Slot[]>([newSlot()]);
  const [showMoldPicker, setShowMoldPicker] = useState<number | null>(null);

  const updateSlot = (id: number, patch: Partial<Slot>) => {
    setSlots(prev => prev.map(s => s.id === id ? { ...s, ...patch } : s));
  };

  const addSlot = () => setSlots(prev => [...prev, newSlot()]);
  const removeSlot = (id: number) => setSlots(prev => prev.filter(s => s.id !== id));

  const handleGenerateAll = () => {
    slots.forEach(slot => {
      if (slot.status === 'generating') return;
      runGeneration(slot, (patch) => updateSlot(slot.id, patch));
    });
  };

  const handleDownload = (slot: Slot, result: string, index: number) => {
    const a = document.createElement('a');
    a.href = result;
    a.download = `retravium_${MOLDS[slot.moldIndex].id}_${slot.finish}_${index + 1}.png`;
    a.click();
  };

  const anyGenerating = slots.some(s => s.status === 'generating');

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Admin — Geração</h1>
            <p className="text-gray-400 text-sm">Sem limites · Sem watermark · Paralelo</p>
          </div>
          <div className="flex gap-3">
            <button onClick={addSlot} className="px-4 py-2 border-2 border-blue-500 text-blue-600 font-semibold rounded-lg hover:bg-blue-50 transition-all text-sm">
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
                  {slot.status === 'done' && <span className="text-xs text-green-500 font-medium">✓ {slot.results.length} geração(ões)</span>}
                  {slot.status === 'error' && <span className="text-xs text-red-500 font-medium">✗ Erro</span>}
                  {slots.length > 1 && (
                    <button onClick={() => removeSlot(slot.id)} className="text-gray-300 hover:text-red-400 text-lg leading-none">✕</button>
                  )}
                </div>
              </div>

              <div className="p-4 space-y-4">
                {/* Molde */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Molde</label>
                  <button
                    onClick={() => setShowMoldPicker(showMoldPicker === slot.id ? null : slot.id)}
                    className="w-full text-left px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 hover:border-blue-300 transition-all"
                  >
                    {MOLDS[slot.moldIndex].label} ▾
                  </button>
                  {showMoldPicker === slot.id && (
                    <div className="mt-1 border border-gray-200 rounded-lg overflow-hidden shadow-lg z-10 bg-white max-h-48 overflow-y-auto">
                      {MOLDS.map((m, i) => (
                        <button
                          key={i}
                          onClick={() => { updateSlot(slot.id, { moldIndex: i }); setShowMoldPicker(null); }}
                          className={`w-full text-left px-3 py-2 text-sm hover:bg-blue-50 transition-all ${slot.moldIndex === i ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-600'}`}
                        >
                          {m.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Acabamento */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Acabamento</label>
                  <div className="flex gap-2">
                    {(['pb', 'color'] as const).map(f => (
                      <button
                        key={f}
                        onClick={() => updateSlot(slot.id, { finish: f })}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border transition-all ${slot.finish === f ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}
                      >
                        {f === 'pb' ? 'P&B' : 'Colorido'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Fotos */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Fotos</label>
                  <div className="flex gap-2 flex-wrap">
                    {slot.photos.map((preview, i) => (
                      <PhotoSlot
                        key={i} index={i} preview={preview}
                        onUpload={(f) => {
                          const reader = new FileReader();
                          reader.onload = (e) => {
                            const updated = [...slot.photos];
                            updated[i] = e.target?.result as string;
                            updateSlot(slot.id, { photos: updated });
                          };
                          reader.readAsDataURL(f);
                        }}
                        onRemove={() => {
                          const updated = [...slot.photos];
                          updated[i] = null;
                          updateSlot(slot.id, { photos: updated });
                        }}
                      />
                    ))}
                  </div>
                </div>

                {/* Erro */}
                {slot.error && <p className="text-xs text-red-500">{slot.error}</p>}

                {/* Resultados empilhados */}
                {slot.results.length > 0 && (
                  <div className="space-y-4">
                    {slot.results.map((result, i) => (
                      <div key={i}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-gray-400 font-medium">Geração {i + 1}</span>
                          <button
                            onClick={() => handleDownload(slot, result, i)}
                            className="px-3 py-1 bg-green-600 text-white text-xs font-semibold rounded-lg hover:bg-green-700 transition-all"
                          >
                            ⬇ Baixar
                          </button>
                        </div>
                        <img src={result} alt={`Resultado ${i + 1}`} className="w-full rounded-lg" />
                      </div>
                    ))}
                  </div>
                )}

                {/* Loading skeleton */}
                {slot.status === 'generating' && !slot.result && (
                  <div className="w-full aspect-[3/4] bg-gray-100 rounded-lg animate-pulse flex items-center justify-center text-gray-300 text-sm">
                    Gerando...
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
