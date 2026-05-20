import { useState, useRef } from "react";
import { useDropzone } from "react-dropzone";

// ── Tipos ────────────────────────────────────────────────────────────────────
type Step = "form" | "pix" | "generating" | "done";

interface FormData {
  nome: string;
  dataNascimento: string;
  altura: string;
  peso: string;
  clube: string;
  selecao: string;
  phone: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function toBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ── Componente principal ─────────────────────────────────────────────────────
export default function Figurinha() {
  const [step, setStep] = useState<Step>("form");
  const [form, setForm] = useState<FormData>({
    nome: "",
    dataNascimento: "",
    altura: "",
    peso: "",
    clube: "",
    selecao: "BRA",
    phone: "",
  });
  const [photo, setPhoto] = useState<string | null>(null);
  const [photoName, setPhotoName] = useState<string>("");
  const [pixData, setPixData] = useState<{ qrCode: string; pixCopyPaste: string; orderId: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { "image/*": [] },
    maxFiles: 1,
    onDrop: async (files) => {
      if (!files[0]) return;
      const b64 = await toBase64(files[0]);
      setPhoto(b64);
      setPhotoName(files[0].name);
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    if (!photo) return setError("Envie uma foto sua.");
    if (!form.nome || !form.dataNascimento || !form.altura || !form.peso || !form.clube || !form.phone) {
      return setError("Preencha todos os campos.");
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/figurinha/pix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, photo }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Erro ao gerar Pix.");
      setPixData(data);
      setStep("pix");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyPix = () => {
    navigator.clipboard.writeText(pixData?.pixCopyPaste || "");
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  // ── Render: Formulário ───────────────────────────────────────────────────
  if (step === "form") {
    return (
      <div className="min-h-screen bg-[#009C3B] flex flex-col items-center px-4 py-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">⚽</div>
          <h1 className="text-3xl font-black text-yellow-400 drop-shadow">Vire uma Figurinha da Copa!</h1>
          <p className="text-white mt-2 text-sm">Envie sua foto e receba sua figurinha Panini no WhatsApp</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">

          {/* Upload foto */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Sua foto *</label>
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition ${
                isDragActive ? "border-green-500 bg-green-50" : "border-gray-300 hover:border-green-400"
              }`}
            >
              <input {...getInputProps()} />
              {photo ? (
                <div className="space-y-2">
                  <img src={photo} className="h-32 mx-auto rounded-lg object-cover" />
                  <p className="text-xs text-gray-500">{photoName} — clique para trocar</p>
                </div>
              ) : (
                <div className="space-y-1">
                  <p className="text-3xl">📷</p>
                  <p className="text-sm text-gray-500">Clique ou arraste sua foto aqui</p>
                  <p className="text-xs text-gray-400">Use uma foto com rosto bem visível</p>
                </div>
              )}
            </div>
          </div>

          {/* Nome */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Nome completo *</label>
            <input
              name="nome"
              value={form.nome}
              onChange={handleChange}
              placeholder="Ex: João Pedro Silva"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          {/* Data de nascimento */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Data de nascimento *</label>
            <input
              name="dataNascimento"
              value={form.dataNascimento}
              onChange={handleChange}
              placeholder="DD/MM/AAAA"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          {/* Altura e Peso */}
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-sm font-bold text-gray-700 mb-1">Altura *</label>
              <input
                name="altura"
                value={form.altura}
                onChange={handleChange}
                placeholder="Ex: 1,75m"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-bold text-gray-700 mb-1">Peso *</label>
              <input
                name="peso"
                value={form.peso}
                onChange={handleChange}
                placeholder="Ex: 75 kg"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>

          {/* Clube */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Seu clube do coração *</label>
            <input
              name="clube"
              value={form.clube}
              onChange={handleChange}
              placeholder="Ex: Flamengo, Corinthians, Grêmio..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          {/* Seleção */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Seleção</label>
            <select
              name="selecao"
              value={form.selecao}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="BRA">🇧🇷 Brasil</option>
              <option value="ARG">🇦🇷 Argentina</option>
              <option value="POR">🇵🇹 Portugal</option>
              <option value="FRA">🇫🇷 França</option>
              <option value="ESP">🇪🇸 Espanha</option>
              <option value="ENG">🏴󠁧󠁢󠁥󠁮󠁧󠁿 Inglaterra</option>
            </select>
          </div>

          {/* WhatsApp */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">WhatsApp para receber *</label>
            <input
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder="(11) 99999-9999"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          {error && <p className="text-red-500 text-sm text-center">{error}</p>}

          {/* Preço e botão */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-3">
              <span className="text-gray-600 text-sm">Sua figurinha personalizada</span>
              <span className="text-2xl font-black text-green-700">R$ 9,99</span>
            </div>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-black py-4 rounded-xl text-lg transition disabled:opacity-60"
            >
              {loading ? "Gerando Pix..." : "⚽ Gerar minha figurinha!"}
            </button>
            <p className="text-xs text-gray-400 text-center mt-2">Você receberá no WhatsApp após o pagamento</p>
          </div>
        </div>
      </div>
    );
  }

  // ── Render: Pix ──────────────────────────────────────────────────────────
  if (step === "pix") {
    return (
      <div className="min-h-screen bg-[#009C3B] flex flex-col items-center justify-center px-4 py-10">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 text-center space-y-4">
          <div className="text-4xl">⚽</div>
          <h2 className="text-2xl font-black text-gray-800">Quase lá!</h2>
          <p className="text-gray-500 text-sm">Pague o Pix abaixo. Sua figurinha será gerada automaticamente e enviada no WhatsApp.</p>

          {pixData?.qrCode && (
            <img src={`data:image/png;base64,${pixData.qrCode}`} className="mx-auto w-48 h-48" alt="QR Code Pix" />
          )}

          <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-left">
            <p className="text-xs text-gray-400 mb-1">Pix copia e cola:</p>
            <p className="text-xs text-gray-700 break-all font-mono leading-relaxed">{pixData?.pixCopyPaste}</p>
          </div>

          <button
            onClick={copyPix}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl transition"
          >
            {copied ? "✅ Copiado!" : "📋 Copiar código Pix"}
          </button>

          <div className="text-2xl font-black text-green-700">R$ 9,99</div>
          <p className="text-xs text-gray-400">Após o pagamento, você receberá sua figurinha em até 2 minutos no WhatsApp 🚀</p>
        </div>
      </div>
    );
  }

  return null;
}
