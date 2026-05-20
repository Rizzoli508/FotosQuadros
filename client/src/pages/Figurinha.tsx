import { useState, useRef, useCallback } from "react";
import { useDropzone } from "react-dropzone";

// ── Tipos ────────────────────────────────────────────────────────────────────
type Step = "landing" | "step1" | "step2" | "step3" | "review" | "loading" | "preview" | "pix";

interface FormData {
  nome: string;
  photo: string | null;
  photoName: string;
  dia: string;
  mes: string;
  ano: string;
  phone: string;
  clube: string;
  peso: string;
  altura: string;
}

const DIAS = Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, "0"));
const MESES = [
  { v: "01", l: "Janeiro" }, { v: "02", l: "Fevereiro" }, { v: "03", l: "Março" },
  { v: "04", l: "Abril" }, { v: "05", l: "Maio" }, { v: "06", l: "Junho" },
  { v: "07", l: "Julho" }, { v: "08", l: "Agosto" }, { v: "09", l: "Setembro" },
  { v: "10", l: "Outubro" }, { v: "11", l: "Novembro" }, { v: "12", l: "Dezembro" },
];
const ANOS = Array.from({ length: 100 }, (_, i) => String(2025 - i));

const LOADING_MSGS = [
  "Colocando a chuteira no craque...",
  "Ajustando o número na camisa...",
  "Passando gel no cabelo...",
  "Esse tem cara de jogador caro hein",
  "Pedindo pra Panini assinar embaixo...",
  "Convocando para a seleção...",
];

function toBase64(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result as string);
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}

// ── Componente de progress bar ───────────────────────────────────────────────
function ProgressBar({ step }: { step: number }) {
  const pct = step * 25;
  return (
    <div className="w-full px-4 pt-4 pb-2">
      <div className="flex justify-between text-xs font-bold text-[#1a3a8f] mb-1">
        <span>Passo {step} de 4</span>
        <span>{pct}%</span>
      </div>
      <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-[#1a3a8f] rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ── Dots de navegação ────────────────────────────────────────────────────────
function StepDots({ current }: { current: number }) {
  return (
    <div className="flex justify-center gap-2 mt-4">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className={`w-3 h-3 rounded-full transition-all ${
            i <= current ? "bg-[#1a3a8f]" : "bg-gray-300"
          }`}
        />
      ))}
    </div>
  );
}

// ── Botão padrão ─────────────────────────────────────────────────────────────
function Btn({ onClick, children, outline = false, disabled = false }: {
  onClick: () => void; children: React.ReactNode; outline?: boolean; disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full py-4 rounded-2xl font-black text-base tracking-widest uppercase transition disabled:opacity-50 ${
        outline
          ? "border-2 border-[#1a3a8f] text-[#1a3a8f] bg-white"
          : "bg-[#1a3a8f] text-white hover:bg-[#0f2d6e]"
      }`}
    >
      {children}
    </button>
  );
}

// ── Input padrão ─────────────────────────────────────────────────────────────
function Input({ label, placeholder, value, onChange, type = "text" }: {
  label?: string; placeholder: string; value: string;
  onChange: (v: string) => void; type?: string;
}) {
  return (
    <div className="space-y-1">
      {label && <p className="text-xs font-black text-[#1a3a8f] uppercase tracking-wider">{label}</p>}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border-2 border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-[#1a3a8f] placeholder-gray-400"
      />
    </div>
  );
}

// ── Componente principal ─────────────────────────────────────────────────────
export default function Figurinha() {
  const [step, setStep] = useState<Step>("landing");
  const [loadingPct, setLoadingPct] = useState(0);
  const [loadingMsg, setLoadingMsg] = useState(LOADING_MSGS[0]);
  const [error, setError] = useState("");
  const [form, setForm] = useState<FormData>({
    nome: "", photo: null, photoName: "",
    dia: "", mes: "", ano: "",
    phone: "", clube: "", peso: "", altura: "",
  });

  const set = (k: keyof FormData, v: string) => setForm(f => ({ ...f, [k]: v }));

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { "image/*": [] },
    maxFiles: 1,
    onDrop: async (files) => {
      if (!files[0]) return;
      const b64 = await toBase64(files[0]);
      setForm(f => ({ ...f, photo: b64, photoName: files[0].name }));
    },
  });

  // Simula loading de geração
  const startLoading = () => {
    setStep("loading");
    setLoadingPct(0);
    let pct = 0;
    let msgIdx = 0;
    const interval = setInterval(() => {
      pct += Math.random() * 8 + 2;
      if (pct >= 100) { pct = 100; clearInterval(interval); setTimeout(() => setStep("preview"), 500); }
      setLoadingPct(Math.min(Math.round(pct), 100));
      if (pct > (msgIdx + 1) * 16) {
        msgIdx = Math.min(msgIdx + 1, LOADING_MSGS.length - 1);
        setLoadingMsg(LOADING_MSGS[msgIdx]);
      }
    }, 400);
  };

  // Validações por passo
  const validateStep1 = () => {
    if (!form.nome.trim()) return "Digite o nome do craque.";
    if (!form.photo) return "Envie uma foto do craque.";
    return "";
  };
  const validateStep2 = () => {
    if (!form.dia || !form.mes || !form.ano) return "Preencha a data de nascimento.";
    if (!form.phone.replace(/\D/g, "").match(/^\d{10,11}$/)) return "WhatsApp inválido.";
    return "";
  };
  const validateStep3 = () => {
    if (!form.clube.trim()) return "Digite o clube do coração.";
    if (!form.peso.trim()) return "Digite o peso.";
    if (!form.altura.trim()) return "Digite a altura.";
    return "";
  };

  const next = (validator: () => string, nextStep: Step) => {
    const err = validator();
    if (err) { setError(err); return; }
    setError("");
    setStep(nextStep);
  };

  // ── LANDING ──────────────────────────────────────────────────────────────
  if (step === "landing") {
    return (
      <div className="min-h-screen bg-[#FFD700] flex flex-col items-center justify-center px-6 py-10 text-center">
        <h1
          className="text-4xl font-black uppercase leading-tight text-gray-900 mb-2"
          style={{ fontFamily: "'Anton', sans-serif", textShadow: "2px 2px 0px rgba(0,0,0,0.15)" }}
        >
          Transforme seu filho em uma{" "}
          <span className="text-[#1a3a8f]">figurinha personalizada</span>{" "}
          da Copa do Mundo
        </h1>

        {/* Figurinhas empilhadas */}
        <div className="relative w-64 h-64 my-6 mx-auto">
          <img src="/figurinha/referencia.jpg" className="absolute left-0 top-4 w-40 rounded-xl shadow-lg rotate-[-8deg] opacity-80" />
          <img src="/figurinha/referencia.jpg" className="absolute right-0 top-4 w-40 rounded-xl shadow-lg rotate-[8deg] opacity-80" />
          <img src="/figurinha/referencia.jpg" className="absolute left-1/2 top-0 w-44 rounded-xl shadow-xl -translate-x-1/2 z-10" />
        </div>

        <p className="text-gray-700 text-base mb-8 max-w-xs italic">
          Responda algumas perguntas rápidas e veja como criar uma figurinha exclusiva, com o nome, foto e estilo do seu pequeno craque.
        </p>

        <button
          onClick={() => setStep("step1")}
          className="w-full max-w-xs bg-[#1a3a8f] text-white font-black text-lg py-5 rounded-2xl tracking-widest uppercase shadow-lg hover:bg-[#0f2d6e] transition"
        >
          INICIAR
        </button>
      </div>
    );
  }

  // ── STEP 1: Nome + Foto ───────────────────────────────────────────────────
  if (step === "step1") {
    return (
      <div className="min-h-screen bg-[#FFD700] flex flex-col px-4 py-4">
        <ProgressBar step={1} />
        <div className="bg-white rounded-3xl shadow-xl p-6 mt-3 space-y-5">
          <div className="text-center">
            <div className="text-4xl mb-2">✏️</div>
            <h2 className="text-2xl font-black text-[#1a3a8f] uppercase">Qual o nome do craque?</h2>
            <p className="text-gray-400 text-sm mt-1">O nome que vai aparecer na figurinha</p>
          </div>

          <Input placeholder="Nome e sobrenome" value={form.nome} onChange={v => set("nome", v)} />

          {/* Upload de foto */}
          <div>
            <p className="text-xs font-black text-[#1a3a8f] uppercase tracking-wider mb-2">Foto do craque</p>
            <div className="grid grid-cols-2 gap-3">
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-2xl p-4 flex flex-col items-center justify-center cursor-pointer text-center transition ${
                  isDragActive ? "border-[#1a3a8f] bg-blue-50" : "border-gray-300 hover:border-[#1a3a8f]"
                }`}
              >
                <input {...getInputProps()} />
                {form.photo ? (
                  <img src={form.photo} className="h-20 w-20 object-cover rounded-xl mb-1" />
                ) : (
                  <span className="text-3xl">🖼️</span>
                )}
                <p className="text-xs text-gray-500 mt-1 font-bold">
                  {form.photo ? form.photoName : "Enviar foto DO ROSTO, não de corpo"}
                </p>
              </div>

              <div
                onClick={() => {
                  const input = document.createElement("input");
                  input.type = "file";
                  input.accept = "image/*";
                  input.capture = "environment";
                  input.onchange = async (e: any) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const b64 = await toBase64(file);
                    setForm(f => ({ ...f, photo: b64, photoName: file.name }));
                  };
                  input.click();
                }}
                className="border-2 border-dashed border-gray-300 rounded-2xl p-4 flex flex-col items-center justify-center cursor-pointer hover:border-[#1a3a8f] transition"
              >
                <span className="text-3xl">📷</span>
                <p className="text-xs text-gray-500 mt-1 font-bold">Câmera</p>
              </div>
            </div>
          </div>

          {error && <p className="text-red-500 text-sm text-center">{error}</p>}

          <Btn onClick={() => next(validateStep1, "step2")}>Próximo →</Btn>
        </div>
        <StepDots current={1} />
      </div>
    );
  }

  // ── STEP 2: Data + WhatsApp ───────────────────────────────────────────────
  if (step === "step2") {
    return (
      <div className="min-h-screen bg-[#FFD700] flex flex-col px-4 py-4">
        <ProgressBar step={2} />
        <div className="bg-white rounded-3xl shadow-xl p-6 mt-3 space-y-5">
          <div className="text-center">
            <div className="text-4xl mb-2">🎂</div>
            <h2 className="text-2xl font-black text-[#1a3a8f] uppercase">Data de Nascimento</h2>
            <p className="text-gray-400 text-sm mt-1">Pra aparecer na figurinha</p>
          </div>

          <div>
            <p className="text-xs font-black text-[#1a3a8f] uppercase tracking-wider mb-2">Data de nascimento</p>
            <div className="grid grid-cols-3 gap-2">
              <select value={form.dia} onChange={e => set("dia", e.target.value)}
                className="border-2 border-gray-200 rounded-2xl px-2 py-3 text-sm focus:outline-none focus:border-[#1a3a8f]">
                <option value="">Dia</option>
                {DIAS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              <select value={form.mes} onChange={e => set("mes", e.target.value)}
                className="border-2 border-gray-200 rounded-2xl px-2 py-3 text-sm focus:outline-none focus:border-[#1a3a8f]">
                <option value="">Mês</option>
                {MESES.map(m => <option key={m.v} value={m.v}>{m.l}</option>)}
              </select>
              <select value={form.ano} onChange={e => set("ano", e.target.value)}
                className="border-2 border-gray-200 rounded-2xl px-2 py-3 text-sm focus:outline-none focus:border-[#1a3a8f]">
                <option value="">Ano</option>
                {ANOS.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
          </div>

          <Input
            label="WhatsApp para receber"
            placeholder="(11) 99999-9999"
            value={form.phone}
            onChange={v => set("phone", v)}
            type="tel"
          />

          {error && <p className="text-red-500 text-sm text-center">{error}</p>}

          <div className="grid grid-cols-2 gap-3">
            <Btn outline onClick={() => { setError(""); setStep("step1"); }}>Voltar</Btn>
            <Btn onClick={() => next(validateStep2, "step3")}>Próximo →</Btn>
          </div>
        </div>
        <StepDots current={2} />
      </div>
    );
  }

  // ── STEP 3: Clube + Peso + Altura ─────────────────────────────────────────
  if (step === "step3") {
    return (
      <div className="min-h-screen bg-[#FFD700] flex flex-col px-4 py-4">
        <ProgressBar step={3} />
        <div className="bg-white rounded-3xl shadow-xl p-6 mt-3 space-y-5">
          <div className="text-center">
            <div className="text-4xl mb-2">⭐</div>
            <h2 className="text-2xl font-black text-[#1a3a8f] uppercase">Clube e Dados</h2>
            <p className="text-gray-400 text-sm mt-1">O clube do coração e os dados pra figurinha</p>
          </div>

          <Input label="Clube do coração" placeholder="Digite o nome do clube..." value={form.clube} onChange={v => set("clube", v)} />

          <div className="grid grid-cols-2 gap-3">
            <Input label="Peso (kg)" placeholder="ex: 25" value={form.peso} onChange={v => set("peso", v)} />
            <Input label="Altura (cm)" placeholder="ex: 120" value={form.altura} onChange={v => set("altura", v)} />
          </div>

          {error && <p className="text-red-500 text-sm text-center">{error}</p>}

          <div className="grid grid-cols-2 gap-3">
            <Btn outline onClick={() => { setError(""); setStep("step2"); }}>Voltar</Btn>
            <Btn onClick={() => next(validateStep3, "review")}>Próximo →</Btn>
          </div>
        </div>
        <StepDots current={3} />
      </div>
    );
  }

  // ── STEP 4: Revisão ───────────────────────────────────────────────────────
  if (step === "review") {
    const dataNasc = `${form.dia}/${form.mes}/${form.ano}`;
    return (
      <div className="min-h-screen bg-[#FFD700] flex flex-col px-4 py-4">
        <ProgressBar step={4} />
        <div className="bg-white rounded-3xl shadow-xl p-6 mt-3 space-y-5">
          <div className="text-center">
            <div className="text-3xl mb-1">⚠️</div>
            <h2 className="text-2xl font-black text-[#1a3a8f] uppercase">Confira seus dados</h2>
            <p className="text-gray-400 text-sm mt-1">A figurinha será gerada em breve. Revise com atenção.</p>
            <p className="text-[#1a3a8f] text-xs font-bold mt-1">Não fazemos alterações após a aprovação e pagamento.</p>
          </div>

          {/* Preview da foto */}
          {form.photo && (
            <div className="flex items-center gap-3 bg-gray-50 rounded-2xl p-3">
              <img src={form.photo} className="w-16 h-16 object-cover rounded-full border-4 border-[#1a3a8f]" />
              <p className="text-xs text-gray-500 font-bold">VERIFIQUE SE O ROSTO ESTÁ BEM VISÍVEL</p>
            </div>
          )}

          {/* Dados */}
          <div className="space-y-2">
            {[
              { l: "Nome", v: form.nome },
              { l: "Nascimento", v: dataNasc },
              { l: "Peso", v: `${form.peso} kg` },
              { l: "Altura", v: `${form.altura} cm` },
              { l: "Clube", v: form.clube },
              { l: "WhatsApp", v: form.phone },
            ].map(({ l, v }) => (
              <div key={l} className="flex justify-between items-center border-b border-gray-100 pb-2">
                <span className="text-xs font-black text-[#1a3a8f] uppercase">{l}</span>
                <span className="text-sm text-gray-700 font-semibold">{v}</span>
              </div>
            ))}
          </div>

          <Btn onClick={startLoading}>Entendi, gerar figurinha ⚽</Btn>
          <Btn outline onClick={() => setStep("step3")}>Corrigir dados</Btn>
        </div>
        <StepDots current={4} />
      </div>
    );
  }

  // ── LOADING ───────────────────────────────────────────────────────────────
  if (step === "loading") {
    return (
      <div className="min-h-screen bg-[#FFD700] flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl shadow-xl p-8 w-full max-w-sm text-center space-y-6">
          <h2 className="text-2xl font-black text-[#1a3a8f] uppercase">Gerando sua figurinha</h2>
          <p className="text-gray-400 text-sm italic">Não saia dessa tela, leva até 2 minutos.</p>

          {form.photo && (
            <img src={form.photo} className="w-28 h-28 object-cover rounded-2xl mx-auto border-4 border-[#FFD700] shadow" />
          )}

          <p className="text-gray-600 text-sm font-semibold italic min-h-[40px]">{loadingMsg}</p>

          <div>
            <div className="flex justify-between text-xs font-bold text-[#1a3a8f] mb-1">
              <span>Carregando...</span>
              <span>{loadingPct}%</span>
            </div>
            <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#1a3a8f] rounded-full transition-all duration-300"
                style={{ width: `${loadingPct}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── PREVIEW com watermark ─────────────────────────────────────────────────
  if (step === "preview") {
    return (
      <div className="min-h-screen bg-[#FFD700] flex flex-col items-center justify-center px-4 py-8 space-y-6">
        {/* Figurinha com watermark */}
        <div className="relative">
          <img src="/figurinha/referencia.jpg" className="w-56 rounded-2xl shadow-2xl" />
          {/* Watermark overlay */}
          <div className="absolute inset-0 flex items-center justify-center rounded-2xl overflow-hidden">
            {Array.from({ length: 12 }).map((_, i) => (
              <span
                key={i}
                className="absolute text-white text-xs font-bold opacity-40 rotate-[-35deg] select-none pointer-events-none whitespace-nowrap"
                style={{ top: `${(i % 4) * 28}%`, left: `${Math.floor(i / 4) * 35 - 10}%` }}
              >
                artedacopa.com
              </span>
            ))}
          </div>
          {/* Nome e dados sobrepostos (simulado) */}
          <div className="absolute bottom-0 left-0 right-0 bg-[#1a7a6e] rounded-b-2xl px-3 py-2">
            <p className="text-white font-black text-sm uppercase">{form.nome}</p>
            <p className="text-white text-xs">{form.dia}/{form.mes}/{form.ano} | {form.altura} cm | {form.peso} kg</p>
            <p className="text-white text-xs uppercase">{form.clube}</p>
          </div>
        </div>

        <div className="text-center">
          <h2
            className="text-5xl font-black text-[#1a3a8f]"
            style={{ fontFamily: "'Anton', sans-serif" }}
          >
            GOOLL!
          </h2>
          <p className="text-gray-800 font-bold text-lg">Sua figurinha está pronta!</p>
          <p className="text-gray-600 text-sm mt-1">Pague para receber sem marca d'água no WhatsApp 📲</p>
        </div>

        <div className="w-full max-w-xs space-y-3">
          <div className="text-center">
            <span className="text-4xl font-black text-[#009C3B]">R$ 9,99</span>
          </div>
          <Btn onClick={() => setStep("pix")}>⚽ Receber minha figurinha</Btn>
        </div>
      </div>
    );
  }

  // ── PIX ───────────────────────────────────────────────────────────────────
  if (step === "pix") {
    return (
      <div className="min-h-screen bg-[#FFD700] flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl shadow-xl p-6 w-full max-w-sm text-center space-y-4">
          <div className="text-4xl">⚽</div>
          <h2 className="text-2xl font-black text-[#1a3a8f] uppercase">Quase lá!</h2>
          <p className="text-gray-400 text-sm">Pague o Pix abaixo. Sua figurinha sem marca d'água será enviada no WhatsApp em instantes.</p>

          {/* QR Code placeholder — será preenchido pela API */}
          <div className="w-44 h-44 bg-gray-100 rounded-2xl mx-auto flex items-center justify-center">
            <span className="text-gray-400 text-sm">QR Code aqui</span>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-3 text-left">
            <p className="text-xs text-gray-400 mb-1">Pix copia e cola:</p>
            <p className="text-xs text-gray-500 font-mono break-all">Aguardando geração...</p>
          </div>

          <button className="w-full bg-[#009C3B] text-white font-black py-4 rounded-2xl uppercase tracking-widest">
            📋 Copiar código Pix
          </button>

          <p className="text-2xl font-black text-[#009C3B]">R$ 9,99</p>
          <p className="text-xs text-gray-400">Após o pagamento, você receberá no WhatsApp em até 2 minutos 🚀</p>
        </div>
      </div>
    );
  }

  return null;
}
