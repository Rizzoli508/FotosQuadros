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

function PhotoSlot({ index, preview, onUpload, onRemove }: {
  index: number;
  preview: string | null;
  onUpload: (file: File) => void;
  onRemove: () => void;
}) {
  const onDrop = useCallback((files: File[]) => { if (files[0]) onUpload(files[0]); }, [onUpload]);
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: { 'image/*': [] }, maxFiles: 1,
  });

  if (preview) {
    return (
      <div className="relative">
        <img src={preview} className="w-24 h-24 object-cover rounded-lg border border-gray-300" />
        <button
          onClick={onRemove}
          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center"
        >✕</button>
      </div>
    );
  }

  return (
    <div
      {...getRootProps()}
      className={`w-24 h-24 border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer text-gray-400 text-xs text-center
        ${isDragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}`}
    >
      <input {...getInputProps()} />
      <span className="text-2xl mb-1">+</span>
      <span>Foto {index + 1}</span>
    </div>
  );
}

export default function Admin() {
  const [selectedMold, setSelectedMold] = useState(MOLDS[0]);
  const [finish, setFinish] = useState<'pb' | 'color'>('pb');
  const [photos, setPhotos] = useState<(string | null)[]>([null, null, null, null]);
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [log, setLog] = useState<string>('');

  const handleUpload = (index: number, file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const updated = [...photos];
      updated[index] = e.target?.result as string;
      setPhotos(updated);
    };
    reader.readAsDataURL(file);
  };

  const handleRemove = (index: number) => {
    const updated = [...photos];
    updated[index] = null;
    setPhotos(updated);
  };

  const handleGenerate = async () => {
    const images = photos.filter(Boolean) as string[];
    if (images.length === 0) { setError('Envie pelo menos uma foto.'); return; }
    setGenerating(true);
    setResult(null);
    setError(null);
    setLog('Iniciando geração...');

    try {
      const startRes = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          moldId: selectedMold.id,
          subStyle: selectedMold.subStyle,
          finish,
          images,
        }),
      });
      const { jobId } = await startRes.json();
      setLog(`Job iniciado: ${jobId}`);

      for (let i = 0; i < 300; i++) {
        await new Promise(r => setTimeout(r, 2000));
        const poll = await fetch(`/api/generate/status/${jobId}`);
        const data = await poll.json();
        setLog(`Status: ${data.status} (tentativa ${i + 1})`);
        if (data.status === 'done') {
          setResult(`data:${data.mimeType};base64,${data.imageBase64}`);
          setLog('Concluído!');
          break;
        }
        if (data.status === 'error') {
          setError(data.message || 'Erro na geração.');
          break;
        }
      }
    } catch (e: any) {
      setError(e.message || 'Erro de conexão.');
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!result) return;
    const a = document.createElement('a');
    a.href = result;
    a.download = `retravium_${selectedMold.id}_${finish}.png`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Admin — Geração</h1>
        <p className="text-gray-500 text-sm mb-8">Sem limites de tentativas · Sem watermark · Sem checkout</p>

        {/* Molde */}
        <div className="bg-white rounded-xl p-6 mb-4 shadow-sm">
          <label className="block text-sm font-semibold text-gray-700 mb-3">Molde</label>
          <div className="grid grid-cols-2 gap-2">
            {MOLDS.map((m, i) => (
              <button
                key={i}
                onClick={() => setSelectedMold(m)}
                className={`text-left px-3 py-2 rounded-lg text-sm border transition-all
                  ${selectedMold === m
                    ? 'border-blue-500 bg-blue-50 text-blue-700 font-semibold'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Acabamento */}
        <div className="bg-white rounded-xl p-6 mb-4 shadow-sm">
          <label className="block text-sm font-semibold text-gray-700 mb-3">Acabamento</label>
          <div className="flex gap-3">
            {(['pb', 'color'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFinish(f)}
                className={`px-5 py-2 rounded-lg text-sm border transition-all
                  ${finish === f
                    ? 'border-blue-500 bg-blue-50 text-blue-700 font-semibold'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
              >
                {f === 'pb' ? 'Preto e Branco' : 'Colorido'}
              </button>
            ))}
          </div>
        </div>

        {/* Fotos */}
        <div className="bg-white rounded-xl p-6 mb-4 shadow-sm">
          <label className="block text-sm font-semibold text-gray-700 mb-3">Fotos de referência</label>
          <div className="flex gap-3 flex-wrap">
            {photos.map((preview, i) => (
              <PhotoSlot
                key={i}
                index={i}
                preview={preview}
                onUpload={(f) => handleUpload(i, f)}
                onRemove={() => handleRemove(i)}
              />
            ))}
          </div>
        </div>

        {/* Gerar */}
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="w-full py-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all mb-4"
        >
          {generating ? 'Gerando...' : 'Gerar Retrato'}
        </button>

        {log && <p className="text-xs text-gray-400 mb-4 font-mono">{log}</p>}
        {error && <p className="text-sm text-red-500 mb-4">{error}</p>}

        {/* Resultado */}
        {result && (
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold text-gray-700">Resultado</span>
              <button
                onClick={handleDownload}
                className="px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 transition-all"
              >
                ⬇ Baixar
              </button>
            </div>
            <img
              src={result}
              alt="Retrato gerado"
              className="w-full rounded-lg"
              onContextMenu={e => e.stopPropagation()} // permite clique direito
            />
          </div>
        )}
      </div>
    </div>
  );
}
