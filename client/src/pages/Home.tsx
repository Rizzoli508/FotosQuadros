import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { useLocation } from 'wouter';
import { Camera, Check, ChevronDown, Star, X, Plus, User, ChevronRight, Download, MessageCircle, RotateCcw, Truck, Package, Lock, ShieldCheck, CheckCircle } from 'lucide-react';
import { useCreateOrder } from '@/hooks/use-orders';
import { cn } from '@/lib/utils';
import { useDropzone } from 'react-dropzone';
import reviewMaeFilhaImg from '@assets/review_maefilha.jpg';
import reviewFilhaPaiImg from '@assets/filhapaireview.jpg';
import reviewFamilia3Img from '@assets/review3quadro.jpg';
import reviewDogImg from '@assets/quadrodogreview.jpg';
import reviewMaeFilha2Img from '@assets/maefilha2review.jpg';
import couple2pImg from '@assets/casal_pb.jpg';
import couple2pColorImg from '@assets/casal_color.jpg';
import couple2pIntimoImg from '@assets/casal_pb.jpg';
import motherBabyImg from '@assets/maebb1_pb.jpg';
import motherBabyColorImg from '@assets/maebb1_color.jpg';
import motherBabyIntimoImg from '@assets/maebb2_pb.jpg';
import motherBabyIntimoColorImg from '@assets/maebb2_color.jpg';
import motherDaughterImg from '@assets/maefilha_classico_pb.jpg';
import motherDaughterColorImg from '@assets/maefilha_classico_color.jpg';
import motherDaughterIntimoImg from '@assets/maefilha_intimo_pb.jpg';
import motherDaughterIntimoColorImg from '@assets/maefilha_intimo_color.jpg';
import fatherDaughterImg from '@assets/paifilha_classico_pb.jpg';
import fatherDaughterColorImg from '@assets/paifilha_classico_color.jpg';
import fatherDaughterIntimoImg from '@assets/paifilha_intimo_pb.jpg';
import fatherDaughterIntimoColorImg from '@assets/paifilha_intimo_color.jpg';
import motherSonImg from '@assets/maefilho_classico_pb.jpg';
import motherSonColorImg from '@assets/maefilho_classico_color.jpg';
import motherSonIntimoImg from '@assets/maefilho_intimo_pb.jpg';
import motherSonIntimoColorImg from '@assets/maefilho_intimo_color.jpg';
import fatherSonImg from '@assets/paifilho_classico_pb.jpg';
import fatherSonColorImg from '@assets/paifilho_classico_color.jpg';
import fatherSonIntimoImg from '@assets/paifilho_intimo_pb.jpg';
import fatherSonIntimoColorImg from '@assets/paifilho_intimo_color.jpg';
import threePeopleImg1 from '@assets/familia3_e1_pb.jpg';
import threePeopleImg1Color from '@assets/familia3_e1_color.jpg';
import threePeopleImg2 from '@assets/familia3_e2_pb_v2.jpg';
import threePeopleImg2Color from '@assets/familia3_e2_color_v2.jpg';
import threePeopleImg3 from '@assets/familia3_e3_pb.jpg';
import threePeopleImg3Color from '@assets/familia3_e3_color.jpg';
import threePeopleImg4 from '@assets/familia3_e4_pb.jpg';
import threePeopleImg4Color from '@assets/familia3_e4_color.jpg';
import fourPeopleImg1 from '@assets/familia4_e1_pb.jpg';
import fourPeopleImg1Color from '@assets/familia4_e1_color.jpg';
import fourPeopleImg2 from '@assets/familia4_e2_pb.jpg';
import fourPeopleImg2Color from '@assets/familia4_e2_color.jpg';
import fourPeopleImg3 from '@assets/familia4_e3_pb.jpg';
import fourPeopleImg3Color from '@assets/familia4_e3_color.jpg';
import fourPeopleImg4 from '@assets/familia4_e4_pb.jpg';
import fourPeopleImg4Color from '@assets/familia4_e4_color.jpg';
import petImg1 from '@assets/pet1_pb.jpg';
import petImg1Color from '@assets/pet1_color.jpg';
import petImg2 from '@assets/pet2_pb.jpg';
import petImg2Color from '@assets/pet2_color.jpg';
import petImg3 from '@assets/pet3_pb.jpg';
import petImg3Color from '@assets/pet3_color.jpg';

const FRAME_COLORS: Record<string, string> = {
  'Preta de madeira':   '#111111',
  'Branca de madeira':  '#f0efeb',
  'Tabaco de madeira':  '#3a1206',
  'Natural de madeira': '#c8904a',
};

const FAQ = [
  { q: 'Como funciona?', a: 'Escolha a composição, anexe as fotos e gere sua prévia gratuitamente, sem cadastro ou pagamento. Nossa IA cria seu retrato em segundos. Gostou? Finalize a compra e receba seu retrato.' },
  { q: 'Como vou receber?', a: 'Após a confirmação do pagamento, seu retrato exclusivo chegará direto no seu WhatsApp em até 2 minutos. Caso tenha pedido o quadro impresso, ele será entregue na sua casa no prazo informado no momento da compra.' },
  { q: 'Que tipo de foto devo enviar?', a: 'Fotos com rosto visível e boa iluminação garantem o melhor resultado.' },
  { q: 'A qualidade do retrato é boa?', a: 'Sim. Nossa IA gera retratos em altíssima resolução, com detalhes refinados, cores ricas e acabamento artístico único. Cada retrato é criado especialmente para a sua família, com um nível de realismo e beleza que surpreende.' },
  { q: 'Como posso usar meu retrato?', a: 'Seu retrato digital pode ser usado como foto de perfil, wallpaper do celular, compartilhado com a família ou enviado como presente. E se quiser algo ainda mais especial, peça seu quadro impresso para decorar sua casa.' },
  { q: 'Posso pedir um quadro impresso?', a: 'Sim! Você escolhe o tamanho e o estilo da moldura. O quadro chega pronto para pendurar na sua casa.' },
  { q: 'E se eu não gostar?', a: 'Você pode gerar novamente gratuitamente até ficar satisfeito.' },
];

const CATEGORIES = [
  {
    title: '💐 Especial Dias das Mães',
    slots: 2,
    roles: ['Mãe', 'Filho/Filha'],
    special: true,
    molds: [
      { id: 'mae_1', label: 'Mãe & Filha', image: motherDaughterImg, intimoImage: motherDaughterImg, colorImage: motherDaughterColorImg },
      { id: 'mae_2', label: 'Mãe & Filha 2', image: motherDaughterIntimoImg, intimoImage: motherDaughterIntimoImg, colorImage: motherDaughterIntimoColorImg },
      { id: 'mae_3', label: 'Mãe & Filho', image: motherSonImg, intimoImage: motherSonImg, colorImage: motherSonColorImg },
      { id: 'mae_4', label: 'Mãe & Filho 2', image: motherSonIntimoImg, intimoImage: motherSonIntimoImg, colorImage: motherSonIntimoColorImg },
    ],
  },
  {
    title: '2 Pessoas',
    slots: 2,
    roles: ['Pessoa 1', 'Pessoa 2'],
    molds: [
      { id: '2p_1', label: 'Casal', image: couple2pImg, intimoImage: couple2pIntimoImg, colorImage: couple2pColorImg },
      { id: '2p_2', label: 'Mãe & Bebê', image: motherBabyImg, intimoImage: motherBabyIntimoImg, colorImage: motherBabyColorImg, intimoColorImage: motherBabyIntimoColorImg },
      { id: '2p_3', label: 'Mãe & Filha', image: motherDaughterImg, intimoImage: motherDaughterIntimoImg, colorImage: motherDaughterColorImg, intimoColorImage: motherDaughterIntimoColorImg },
      { id: '2p_4', label: 'Pai & Filha', image: fatherDaughterImg, intimoImage: fatherDaughterIntimoImg, colorImage: fatherDaughterColorImg, intimoColorImage: fatherDaughterIntimoColorImg },
      { id: '2p_5', label: 'Mãe & Filho', image: motherSonImg, intimoImage: motherSonIntimoImg, colorImage: motherSonColorImg, intimoColorImage: motherSonIntimoColorImg },
      { id: '2p_6', label: 'Pai & Filho', image: fatherSonImg, intimoImage: fatherSonIntimoImg, colorImage: fatherSonColorImg, intimoColorImage: fatherSonIntimoColorImg },
    ],
  },
  {
    title: '3 Pessoas',
    slots: 3,
    roles: ['Pessoa 1', 'Pessoa 2', 'Pessoa 3'],
    molds: [
      { id: '3p_1', label: 'Estilo 1', image: threePeopleImg1, intimoImage: threePeopleImg1, colorImage: threePeopleImg1Color },
      { id: '3p_3', label: 'Estilo 2', image: threePeopleImg3, intimoImage: threePeopleImg3, colorImage: threePeopleImg3Color },
      { id: '3p_4', label: 'Estilo 3', image: threePeopleImg4, intimoImage: threePeopleImg4, colorImage: threePeopleImg4Color },
    ],
  },
  {
    title: '4 Pessoas',
    slots: 4,
    roles: ['Pessoa 1', 'Pessoa 2', 'Pessoa 3', 'Pessoa 4'],
    molds: [
      { id: '4p_1', label: 'Estilo 1', image: fourPeopleImg1, intimoImage: fourPeopleImg1, colorImage: fourPeopleImg1Color },
      { id: '4p_2', label: 'Estilo 2', image: fourPeopleImg2, intimoImage: fourPeopleImg2, colorImage: fourPeopleImg2Color },
      { id: '4p_3', label: 'Estilo 3', image: fourPeopleImg3, intimoImage: fourPeopleImg3, colorImage: fourPeopleImg3Color },
      { id: '4p_4', label: 'Estilo 4', image: fourPeopleImg4, intimoImage: fourPeopleImg4, colorImage: fourPeopleImg4Color },
    ],
  },
  {
    title: '1 Pessoa + Pet',
    slots: 2,
    roles: ['Pessoa', 'Pet'],
    molds: [
      { id: 'pet_1', label: 'Estilo 1', image: petImg1, intimoImage: petImg1, colorImage: petImg1Color },
      { id: 'pet_2', label: 'Estilo 2', image: petImg2, intimoImage: petImg2, colorImage: petImg2Color },
      { id: 'pet_3', label: 'Estilo 3', image: petImg3, intimoImage: petImg3, colorImage: petImg3Color },
    ],
  },
];

interface FaceSlot {
  role: string;
  file: File | null;
  preview: string | null;
}

// ── URL → molde direto (para anúncios) ──────────────────────────────────────
const URL_MOLD_MAP: Record<string, string> = {
  '/casal':     '2p_1',
  '/mae-bebe':  '2p_2',
  '/mae-filha': '2p_3',
  '/pai-filha': '2p_4',
  '/mae-filho': '2p_5',
  '/pai-filho': '2p_6',
  '/familia-3': '3p_1',
  '/familia-4': '4p_1',
  '/pet':       'pet_1',
};

// molde → URL (para atualizar a barra de endereço ao clicar na galeria)
const MOLD_URL_MAP: Record<string, string> = {
  '2p_1': '/casal',
  '2p_2': '/mae-bebe',
  '2p_3': '/mae-filha',
  '2p_4': '/pai-filha',
  '2p_5': '/mae-filho',
  '2p_6': '/pai-filho',
  '3p_1': '/familia-3', '3p_3': '/familia-3', '3p_4': '/familia-3',
  '4p_1': '/familia-4', '4p_2': '/familia-4', '4p_3': '/familia-4', '4p_4': '/familia-4',
  'pet_1': '/pet', 'pet_2': '/pet', 'pet_3': '/pet',
  'mae_1': '/mae-filha', 'mae_2': '/mae-filha', 'mae_3': '/mae-filho', 'mae_4': '/mae-filho',
};

function getUrlMoldId(): string | null {
  return URL_MOLD_MAP[window.location.pathname] ?? null;
}

function FaceUploadSlot({ slot, onUpload, onRemove }: { slot: FaceSlot; onUpload: (file: File) => void; onRemove: () => void }) {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      onUpload(acceptedFiles[0]);
    }
  }, [onUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.webp'] },
    maxFiles: 1,
  });

  return (
    <div className="flex flex-col items-start gap-1.5 flex-1 min-w-0">
      {slot.preview ? (
        <div className="relative w-full h-28 md:w-32 md:h-36 rounded-2xl overflow-hidden group">
          <img
            src={slot.preview}
            alt={slot.role}
            className="w-full h-full object-cover"
            data-testid={`img-face-${slot.role}`}
          />
          <button
            onClick={onRemove}
            data-testid={`button-remove-face-${slot.role}`}
            className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/55 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/75 transition-colors z-10"
            aria-label="Remover foto"
          >
            <X className="w-3.5 h-3.5" />
          </button>
          <div className="absolute bottom-0 left-0 right-0 px-2.5 pb-2 pt-4"
            style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 100%)' }}>
            <p className="text-[10px] font-medium text-white/80 truncate">{slot.role}</p>
          </div>
        </div>
      ) : (
        <div
          {...getRootProps()}
          data-testid={`upload-face-${slot.role}`}
          className={cn(
            "relative w-full h-28 md:w-32 md:h-36 rounded-2xl border flex flex-col items-center justify-center cursor-pointer transition-all duration-200",
            isDragActive
              ? "border-[#C9A96E]/60 bg-[#C9A96E]/6 scale-[1.02]"
              : "border-[#2d2620]/12 bg-[#2d2620]/[0.025] hover:border-[#C9A96E]/40 hover:bg-[#C9A96E]/4"
          )}
        >
          <input {...getInputProps()} />
          {/* Icon card */}
          <div className="relative mb-3">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(45,38,32,0.07)' }}>
              <User className="w-6 h-6" style={{ color: 'rgba(45,38,32,0.28)' }} />
            </div>
            <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(45,38,32,0.13)' }}>
              <Plus className="w-2.5 h-2.5" style={{ color: 'rgba(45,38,32,0.55)' }} />
            </div>
          </div>
          <p className="text-sm font-semibold tracking-wide" style={{ color: 'rgba(45,38,32,0.65)' }}>
            Adicionar foto
          </p>
          <p className="text-xs mt-0.5" style={{ color: 'rgba(45,38,32,0.35)' }}>
            {slot.role}
          </p>
        </div>
      )}
    </div>
  );
}

const LOADING_REVIEWS = [
  { name: 'Patricia Nunes', location: 'Rio de Janeiro, RJ', initials: 'PN', color: '#4A6B5C', photo: reviewMaeFilha2Img, text: '"Presentei minha mãe no Dia das Mães com o quadro. Ela ficou sem palavras. Presente mais especial que já fiz!"' },
  { name: 'Rafael Mendes', location: 'São Paulo, SP', initials: 'RM', color: '#8B6F47', photo: reviewDogImg, text: '"Fiz do meu cachorro e ficou uma obra de arte! Emoldurei e tá na sala, todo mundo pergunta onde comprei."' },
  { name: 'Fernanda Lima', location: 'Belo Horizonte, MG', initials: 'FL', color: '#7A5C8B', photo: reviewFamilia3Img, text: '"O retrato da minha família ficou perfeito. Já estou pedindo o segundo!"' },
  { name: 'Camila Rocha', location: 'Curitiba, PR', initials: 'CR', color: '#3D5C8B', photo: reviewFilhaPaiImg, text: '"Fiz de presente pro meu pai no Dia dos Pais. Ele ficou emocionado, nunca vi ele assim!"' },
  { name: 'Juliana Ferreira', location: 'Florianópolis, SC', initials: 'JF', color: '#8B4A5C', photo: reviewMaeFilhaImg, text: '"Presentei minha mãe no Dia das Mães com o quadro. Ela chorou na hora que abriu. Melhor presente que já dei na vida."' },
];

type CategoryType = typeof CATEGORIES[0];
type MoldType = CategoryType['molds'][0];

function CategorySection({ category, onOpenStyle }: { category: CategoryType; onOpenStyle: (id: string, cat: CategoryType) => void }) {
  const [showColor, setShowColor] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    let interval: ReturnType<typeof setInterval> | null = null;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          interval = setInterval(() => setShowColor(prev => !prev), 3000);
        } else {
          if (interval) { clearInterval(interval); interval = null; }
          setShowColor(false);
        }
      },
      { threshold: 0.4 }
    );
    observer.observe(el);
    return () => { observer.disconnect(); if (interval) clearInterval(interval); };
  }, []);

  const getImgSrc = (mold: MoldType) => {
    const isIntimo = category.title === '2 Pessoas' && mold.id !== '2p_1';
    if (showColor) {
      return isIntimo
        ? ((mold as any).intimoColorImage || (mold as any).colorImage || mold.intimoImage)
        : ((mold as any).colorImage || mold.image);
    }
    return isIntimo ? mold.intimoImage : mold.image;
  };

  return (
    <div ref={sectionRef} className={`relative group ${(category as any).special ? 'bg-gradient-to-r from-rose-50 to-pink-50 -mx-4 px-4 py-6 rounded-2xl border border-rose-100' : ''}`}>
      <h3 className={`font-serif text-xl mb-4 ${(category as any).special ? 'text-rose-700 text-2xl' : 'text-primary'}`}>{category.title}</h3>
      <div
        className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide cursor-grab active:cursor-grabbing scroll-smooth"
        onMouseDown={(e) => {
          const el = e.currentTarget;
          const startX = e.pageX - el.offsetLeft;
          const scrollLeft = el.scrollLeft;
          let dragged = false;
          const onMove = (ev: MouseEvent) => {
            ev.preventDefault();
            const x = ev.pageX - el.offsetLeft;
            const walk = (x - startX) * 1.5;
            if (Math.abs(x - startX) > 5) dragged = true;
            el.scrollLeft = scrollLeft - walk;
          };
          const onUp = () => {
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup', onUp);
            if (dragged) el.addEventListener('click', (ev) => ev.stopPropagation(), { once: true, capture: true });
          };
          document.addEventListener('mousemove', onMove);
          document.addEventListener('mouseup', onUp);
        }}
      >
        {category.molds.map((mold) => (
          <button
            key={mold.id}
            data-testid={`button-style-${mold.id}`}
            onClick={() => onOpenStyle(mold.id, category)}
            className="group flex-shrink-0 w-[200px] md:w-[240px] flex flex-col text-left hover-elevate active-elevate-2 transition-all duration-300"
          >
            <div className="w-full aspect-[3/4] bg-primary rounded-xl shadow-xl relative overflow-hidden mb-3">
              {mold.image ? (
                <AnimatePresence mode="sync" initial={false}>
                  <motion.img
                    key={showColor ? 'color' : 'bw'}
                    src={getImgSrc(mold)}
                    alt={mold.label}
                    className={`absolute inset-0 w-full h-full object-cover ${(mold.id === '3p_3' || mold.id === '4p_2') ? 'scale-110' : ''}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.9 }}
                  />
                </AnimatePresence>
              ) : (
                <div className="absolute inset-4 border border-white/10 flex items-center justify-center">
                  <Camera className="w-6 h-6 text-white/20" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-3">
                <span className="text-white/60 font-sans text-xs">{mold.label}</span>
              </div>
            </div>
          </button>
        ))}
      </div>
      <button
        onClick={(e) => {
          const container = e.currentTarget.previousElementSibling;
          if (container) container.scrollBy({ left: 200, behavior: 'smooth' });
        }}
        className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/20 backdrop-blur-md text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
      >
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
}

export default function Home() {
  const [, navigate] = useLocation();
  const [openStyleId, setOpenStyleId] = useState<string | null>(() => getUrlMoldId());
  const [selectedSubStyle, setSelectedSubStyle] = useState<'classico' | 'intimo'>(() => {
    const id = getUrlMoldId();
    return (id && id !== '2p_1' && id.startsWith('2p')) ? 'intimo' : 'classico';
  });
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // ── Scroll refs para efeitos cinematográficos ──
  const overlayScrollRef = useRef<HTMLDivElement>(null);
  const quoteContainerRef = useRef<HTMLElement>(null);
  const { scrollYProgress: quoteScrollProgress } = useScroll({
    target: quoteContainerRef,
    container: overlayScrollRef,
    offset: ["start end", "end start"],
  });
  const quoteY = useTransform(quoteScrollProgress, [0, 1], [40, -40]);
  const quoteOpacity = useTransform(quoteScrollProgress, [0, 0.15, 0.85, 1], [0, 1, 1, 0]);
  const [faceSlots, setFaceSlots] = useState<FaceSlot[]>(() => {
    const id = getUrlMoldId();
    if (!id) return [];
    const cat = CATEGORIES.find(c => c.molds.some(m => m.id === id));
    return cat ? cat.roles.map(r => ({ role: r, file: null, preview: null })) : [];
  });
  const [finish, setFinish] = useState<'bw' | 'color'>('bw');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [timeLeft, setTimeLeft] = useState(20 * 60);
  const [fineArtSize, setFineArtSize] = useState('A4 (20×30 cm)');
  const [canvasSize, setCanvasSize] = useState('A4 (20×30 cm)');
  const [canvasFrame, setCanvasFrame] = useState('Preta de madeira');

  // Checkout
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [checkoutProduct, setCheckoutProduct] = useState<{ description: string; amount: number; isPhysical: boolean } | null>(null);
  const [checkoutStep, setCheckoutStep] = useState<'form' | 'pix' | 'card' | 'success'>('form');
  const [payMethod, setPayMethod] = useState<'PIX' | 'CREDIT_CARD'>('PIX');
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');
  const [pixData, setPixData] = useState<{ qrCode: string; pixCopyPaste: string } | null>(null);
  const [pixOrderId, setPixOrderId] = useState<number | null>(null);
  const [boletoUrl, setBoletoUrl] = useState('');
  const [form, setForm] = useState({ name: '', email: '', cpf: '', phone: '', cep: '', street: '', number: '', complement: '', neighborhood: '', city: '', state: '' });
  const [cepLoading, setCepLoading] = useState(false);
  const [pixTimer, setPixTimer] = useState(0);
  const [pixCopied, setPixCopied] = useState(false);
  const [cardForm, setCardForm] = useState({ holderName: '', number: '', expiryMonth: '', expiryYear: '', ccv: '' });
  const [checkoutFormPage, setCheckoutFormPage] = useState<1 | 2 | 3>(1);
  const [plansOpen, setPlansOpen] = useState(false);
  const [genProgress, setGenProgress] = useState(0);
  const [reviewIndex, setReviewIndex] = useState(0);
  const [packCredits, setPackCredits] = useState(0);
  const [packTotal, setPackTotal] = useState(0);
  const [packScreenOpen, setPackScreenOpen] = useState(false);
  const [packPortraits, setPackPortraits] = useState<(string | null)[]>([]);
  const [activePackSlot, setActivePackSlot] = useState<number | null>(null);
  const [packRegens, setPackRegens] = useState<number[]>([]);
  const [portraitId, setPortraitId] = useState<string | null>(null);
  const [whatsappStatus, setWhatsappStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [successPhone, setSuccessPhone] = useState('');
  const [packPortraitIds, setPackPortraitIds] = useState<(string | null)[]>([]);
  const [packWhatsappStatus, setPackWhatsappStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');


  const handleCepBlur = async (cep: string) => {
    const clean = cep.replace(/\D/g, '');
    if (clean.length !== 8) return;
    setCepLoading(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${clean}/json/`);
      const data = await res.json();
      if (!data.erro) {
        setForm(f => ({ ...f, street: data.logradouro || '', neighborhood: data.bairro || '', city: data.localidade || '', state: data.uf || '' }));
      }
    } catch { /* silently fail */ } finally {
      setCepLoading(false);
    }
  };

  const openCheckout = (description: string, amount: number, isPhysical = false) => {
    setCheckoutProduct({ description, amount, isPhysical });
    setCheckoutOpen(true);
    setCheckoutStep('form');
    (window as any).fbq?.('track', 'InitiateCheckout', { value: amount, currency: 'BRL', content_name: description });
    setPayMethod('PIX');
    setCheckoutError('');
    setPixData(null);
    setBoletoUrl('');
    setForm({ name: '', email: '', cpf: '', phone: '', cep: '', street: '', number: '', complement: '', neighborhood: '', city: '', state: '' });
    setCardForm({ holderName: '', number: '', expiryMonth: '', expiryYear: '', ccv: '' });
    setCheckoutFormPage(1);
    setPixCopied(false);
    setPixTimer(0);
    setWhatsappStatus('idle');
  };

  const saveOrderToSheet = async (orderId?: number) => {
    if (!checkoutProduct) return;
    try {
      await fetch('/api/orders/sheet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: form.name,
          cpf: form.cpf,
          telefone: form.phone,
          produto: checkoutProduct.description,
          cep: form.cep,
          rua: form.street,
          numero: form.number,
          complemento: form.complement,
          cidade: form.city,
          estado: form.state,
          orderId,
        }),
      });
    } catch { /* silently ignore */ }
  };

  const handlePayment = async () => {
    if (!checkoutProduct) return;
    setCheckoutLoading(true);
    setCheckoutError('');
    (window as any).fbq?.('track', 'AddPaymentInfo', { value: checkoutProduct.amount, currency: 'BRL' });
    try {
      if (payMethod === 'PIX') {
        const res = await fetch('/api/payments/pix', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...form, amount: checkoutProduct.amount, description: checkoutProduct.description }),
        });
        const data = await res.json();
        if (!res.ok) { setCheckoutError(data.message || 'Erro ao gerar Pix.'); return; }
        setPixData({ qrCode: data.qrCode, pixCopyPaste: data.pixCopyPaste });
        setPixOrderId(data.orderId || null);
        setPixTimer(30 * 60);
        const totalPix = getPackCredits(checkoutProduct.description);
        const remainingPix = totalPix - 1;
        if (remainingPix > 0) {
          setPackCredits(remainingPix); setPackTotal(totalPix);
          savePackCredits(remainingPix, totalPix, form.phone);
          setPackPortraits([generatedImage, ...Array(remainingPix).fill(null)]);
          setPackRegens(Array(totalPix).fill(0));
        }
        setCheckoutStep('pix');
      } else {
        const res = await fetch('/api/payments/card', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...form, amount: checkoutProduct.amount, description: checkoutProduct.description, card: cardForm }),
        });
        const data = await res.json();
        if (!res.ok) { setCheckoutError(data.message || 'Cartão recusado. Verifique os dados.'); return; }
        const total = getPackCredits(checkoutProduct.description);
        const remaining = total - 1;
        if (remaining > 0) {
          setPackCredits(remaining); setPackTotal(total);
          savePackCredits(remaining, total, form.phone);
          setPackPortraits([generatedImage, ...Array(remaining).fill(null)]);
          setPackRegens(Array(total).fill(0));
          setCheckoutOpen(false);
          setCheckoutStep('form');
          setPackScreenOpen(true);
        } else {
          await saveOrderToSheet();
          (window as any).fbq?.('track', 'Purchase', { value: checkoutProduct?.amount, currency: 'BRL' });
          setCheckoutStep('success');
        }
      }
    } catch {
      setCheckoutError('Erro de conexão. Tente novamente.');
    } finally {
      setCheckoutLoading(false);
    }
  };

  const SIZES = [
    { label: 'A5 (15×20 cm)', fineArtPrice: 79,  canvasPrice: 119 },
    { label: 'A4 (20×30 cm)', fineArtPrice: 99,  canvasPrice: 159 },
    { label: 'A3 (30×40 cm)', fineArtPrice: 139, canvasPrice: 199 },
    { label: 'A2 (40×60 cm)', fineArtPrice: 219, canvasPrice: 349 },
    { label: 'A1 (60×90 cm)', fineArtPrice: 329, canvasPrice: 599 },
  ];
  const createOrder = useCreateOrder();

  // Progresso fake da geração
  useEffect(() => {
    if (!isGenerating) { setGenProgress(0); return; }
    setGenProgress(5);
    const interval = setInterval(() => {
      setGenProgress(prev => {
        if (prev >= 88) return prev;
        return Math.min(88, prev + Math.random() * 5 + 1.5);
      });
    }, 900);
    return () => clearInterval(interval);
  }, [isGenerating]);

  // Ciclo de reviews a cada 5s
  useEffect(() => {
    if (!isGenerating) return;
    const interval = setInterval(() => setReviewIndex(i => {
      let next;
      do { next = Math.floor(Math.random() * LOADING_REVIEWS.length); } while (next === i);
      return next;
    }), 5000);
    return () => clearInterval(interval);
  }, [isGenerating]);

  useEffect(() => {
    if (!generatedImage) return;
    setTimeLeft(20 * 60);
    const timer = setInterval(() => setTimeLeft(t => Math.max(0, t - 1)), 1000);
    return () => clearInterval(timer);
  }, [generatedImage]);


  const formatTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  useEffect(() => {
    if (checkoutStep !== 'pix' || pixTimer <= 0) return;
    const t = setInterval(() => setPixTimer(p => Math.max(0, p - 1)), 1000);
    return () => clearInterval(t);
  }, [checkoutStep, pixTimer]);

  // Polling de confirmação do Pix
  useEffect(() => {
    if (checkoutStep !== 'pix' || !pixOrderId) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/payments/status/${pixOrderId}`);
        const data = await res.json();
        if (data.paid) {
          clearInterval(interval);
          await saveOrderToSheet(pixOrderId ?? undefined);
          (window as any).fbq?.('track', 'Purchase', { value: checkoutProduct?.amount, currency: 'BRL' });
          setCheckoutStep('success');
        }
      } catch { /* silently ignore */ }
    }, 4000);
    return () => clearInterval(interval);
  }, [checkoutStep, pixOrderId]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('retravium_pack');
      if (saved) {
        const { credits, total } = JSON.parse(saved);
        if (credits > 0) { setPackCredits(credits); setPackTotal(total); }
      }
    } catch {}
  }, []);

  const getPackCredits = (description: string) => {
    if (description.includes('6 Retratos')) return 6;
    if (description.includes('3 Retratos')) return 3;
    return 1;
  };

  const savePackCredits = (remaining: number, total: number, phone: string) => {
    if (remaining <= 0) { localStorage.removeItem('retravium_pack'); return; }
    localStorage.setItem('retravium_pack', JSON.stringify({ credits: remaining, total, phone }));
  };

  const handleNextPortrait = (slotIndex: number) => {
    setActivePackSlot(slotIndex);
    setGeneratedImage(null);
    // Mantém os slots do mesmo estilo mas limpa as fotos — upload aparece pronto
    setFaceSlots(prev => prev.map(s => ({ ...s, file: null, preview: null })));
    setIsGenerating(false);
    setCheckoutOpen(false);
    setPackScreenOpen(false);
    setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 50);
  };

  const handleSaveToPackSlot = () => {
    if (activePackSlot === null || !generatedImage) return;
    const updated = [...packPortraits];
    updated[activePackSlot] = generatedImage;
    setPackPortraits(updated);
    const newCredits = packCredits - 1;
    setPackCredits(newCredits);
    savePackCredits(newCredits, packTotal, form.phone);
    setActivePackSlot(null);
    setGeneratedImage(null);
    setPackScreenOpen(true);
  };

  const openMold = openStyleId
    ? CATEGORIES.flatMap(c => c.molds.map(m => ({ ...m, categoryTitle: c.title, slots: c.slots, roles: c.roles }))).find(m => m.id === openStyleId) || null
    : null;

  const handleOpenStyle = (moldId: string, category: typeof CATEGORIES[number]) => {
    setFaceSlots(category.roles.map(role => ({ role, file: null, preview: null })));
    setOpenStyleId(moldId);
    const isIntimo = (category.title === '2 Pessoas' && moldId !== '2p_1') || moldId === 'mae_2' || moldId === 'mae_4';
    setSelectedSubStyle(isIntimo ? 'intimo' : 'classico');
    setGeneratedImage(null);
    setIsGenerating(false);
    const url = MOLD_URL_MAP[moldId];
    if (url) navigate(url);
  };

  const handleCloseModal = () => {
    faceSlots.forEach(s => { if (s.preview) URL.revokeObjectURL(s.preview); });
    setOpenStyleId(null);
    setFaceSlots([]);
    setGeneratedImage(null);
    setIsGenerating(false);
    navigate('/');
  };

  const handleGoHome = () => {
    handleCloseModal();
    setGeneratedImage(null);
    setPackScreenOpen(false);
    setCheckoutOpen(false);
    setPlansOpen(false);
    setActivePackSlot(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Converte qualquer src (blob URL, data URI, caminho de asset) para base64
  const imageToBase64 = async (src: string): Promise<string> => {
    if (src.startsWith('data:')) return src;
    const res = await fetch(src);
    const blob = await res.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  // Salva retrato no servidor e retorna o ID (falha silenciosa)
  const savePortraitToServer = async (imageSrc: string): Promise<string | null> => {
    try {
      const imageBase64 = await imageToBase64(imageSrc);
      const res = await fetch('/api/portraits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64 }),
      });
      if (!res.ok) throw new Error('save failed');
      const data = await res.json();
      return data.id as string;
    } catch {
      return null; // falha silenciosa — botão WhatsApp simplesmente não aparece
    }
  };

  const handleGenerate = async () => {
    if (!openStyleId || !hasAtLeastOnePhoto || isGenerating) return;
    const currentPackSlot = activePackSlot;
    setIsGenerating(true);
    setGeneratedImage(null);
    setPortraitId(null);
    (window as any).fbq?.('trackCustom', 'GeneratePortrait');
    setWhatsappStatus('idle');

    try {
      // Converte todas as fotos para base64
      const images = await Promise.all(
        faceSlots.filter(s => s.preview).map(s => imageToBase64(s.preview!))
      );

      // IDs especiais Dias das Mães → mapeiam para prompts no n8n
      const MAE_MAP: Record<string, { moldId: string; subStyle: string }> = {
        'mae_1': { moldId: '2p_3', subStyle: 'classico' },
        'mae_2': { moldId: '2p_3', subStyle: 'intimo' },
        'mae_3': { moldId: '2p_5', subStyle: 'classico' },
        'mae_4': { moldId: '2p_5', subStyle: 'intimo' },
      };

      const mapped = MAE_MAP[openStyleId];
      const moldId  = mapped ? mapped.moldId   : openStyleId;
      const subStyle = mapped ? mapped.subStyle : selectedSubStyle;
      const finishParam = finish === 'color' ? 'color' : 'pb';

      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ moldId, subStyle, finish: finishParam, images }),
        signal: AbortSignal.timeout(130_000),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || `Erro ${response.status} ao gerar retrato.`);
      }

      const data = await response.json();
      const newImage = `data:${data.mimeType};base64,${data.imageBase64}`;
      setIsGenerating(false);

      // Salva no servidor em background para envio via WhatsApp
      savePortraitToServer(newImage).then(id => {
        if (currentPackSlot !== null) {
          if (id) setPackPortraitIds(prev => {
            const updated = [...prev];
            updated[currentPackSlot] = id;
            return updated;
          });
        } else {
          if (id) setPortraitId(id);
        }
      });

      if (currentPackSlot !== null) {
        setPackPortraits(prev => {
          const updated = [...prev];
          updated[currentPackSlot] = newImage;
          return updated;
        });
        setActivePackSlot(null);
        setPackScreenOpen(true);
      } else {
        setGeneratedImage(newImage);
      }
    } catch (err: any) {
      console.error('[Geração] Erro:', err.message);
      setIsGenerating(false);
      alert(`Erro ao gerar retrato: ${err.message || 'Tente novamente.'}`);
    }
  };

  const handleFaceUpload = (index: number, file: File) => {
    const preview = URL.createObjectURL(file);
    setFaceSlots(prev => prev.map((s, i) => i === index ? { ...s, file, preview } : s));
  };

  const handleFaceRemove = (index: number) => {
    setFaceSlots(prev => prev.map((s, i) => {
      if (i === index) {
        if (s.preview) URL.revokeObjectURL(s.preview);
        return { ...s, file: null, preview: null };
      }
      return s;
    }));
  };

  useEffect(() => {
    if (openStyleId) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [openStyleId]);

  const hasAtLeastOnePhoto = faceSlots.some(s => s.file !== null);

  // Checkout helpers
  const checkoutTotalPages = checkoutProduct?.isPhysical ? 3 : 2;
  const checkoutStepLabels = checkoutProduct?.isPhysical
    ? ['Identificação', 'Entrega', 'Pagamento']
    : ['Identificação', 'Pagamento'];
  const checkoutIsLastPage = checkoutFormPage === checkoutTotalPages;

  const handleSubmit = () => {
    if (!openStyleId || !hasAtLeastOnePhoto) return;
    createOrder.mutate({
      style: `${openStyleId}_${selectedSubStyle}`,
      finish,
      photos: faceSlots.map(s => ({ role: s.role, filename: s.file?.name }))
    });
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const fadeUp = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      <header className="w-full py-6 px-6 md:px-12 flex items-center justify-between z-10 relative">
        <div className="flex items-center">
          <span className="font-serif text-3xl italic cursor-pointer hover:opacity-70 transition-opacity" style={{ color: '#C9A96E', letterSpacing: '0.05em', fontWeight: 400 }} onClick={handleGoHome}>retravium</span>
        </div>
        <nav className="hidden md:flex gap-8 text-sm font-medium tracking-wide text-foreground/80">
          <a href="#como-funciona" data-testid="link-como-funciona" className="hover-elevate">Como Funciona</a>
          <a href="#galeria" data-testid="link-galeria" className="hover-elevate">Galeria</a>
          <a href="#contato" data-testid="link-contato" className="hover-elevate">Contato</a>
        </nav>
      </header>

      {/* ── Faixa persistente do pack ── */}
      {packTotal > 0 && !packScreenOpen && (
        <div className="sticky top-0 z-50 w-full px-4 py-3 flex items-center justify-between gap-4" style={{ background: '#C9A96E' }}>
          <div className="flex items-center gap-3">
            <div className="flex gap-1">
              {Array.from({ length: packTotal }).map((_, i) => (
                <div
                  key={i}
                  className="w-2.5 h-2.5 rounded-full border-2 border-white/60 transition-all"
                  style={{ background: packPortraits[i] ? 'white' : 'transparent' }}
                />
              ))}
            </div>
            <span className="text-white text-sm font-medium">
              <strong>{packPortraits.filter(Boolean).length} de {packTotal}</strong> retratos gerados
            </span>
          </div>
          <button
            onClick={() => setPackScreenOpen(true)}
            className="flex-shrink-0 bg-white text-sm font-bold px-4 py-1.5 rounded-lg hover:opacity-90 transition-opacity"
            style={{ color: '#C9A96E' }}
          >
            Ver meu Pack →
          </button>
        </div>
      )}

      <main className="flex-1">
        <section className="pt-16 pb-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex flex-col items-center text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="inline-block mb-6 px-4 py-1.5 rounded-full border border-accent/30 bg-accent/5 text-accent text-xs font-semibold tracking-widest uppercase"
          >
            Eternize Quem Você Ama
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-5xl md:text-7xl lg:text-8xl font-serif text-primary text-balance leading-tight max-w-5xl italic"
          >
            <span className="text-accent">Imortalize</span><br />sua Família em uma<br />Obra Atemporal.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mt-2 font-sans text-foreground/70 text-sm md:text-base font-light"
          >
            Prévia gratuita, receba no WhatsApp instantaneamente.
          </motion.p>
        </section>

        <section id="como-funciona" className="py-12 bg-white border-y border-border/50">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-100px" }}
              className="space-y-24"
            >
              <motion.div variants={fadeUp} className="space-y-8">
                <div className="border-b border-border pb-4">
                  <h2 className="text-3xl font-serif italic text-primary">Escolha o Estilo</h2>
                  <p className="text-sm text-muted-foreground mt-2">Clique em um estilo para começar.</p>
                </div>

                <div className="space-y-10">
                  {CATEGORIES.map((category) => (
                    <CategorySection
                      key={category.title}
                      category={category}
                      onOpenStyle={handleOpenStyle}
                    />
                  ))}
                </div>
              </motion.div>

            </motion.div>
          </div>
        </section>

        <section id="galeria" className="py-20 bg-background">
          <div className="max-w-4xl mx-auto px-4 text-center flex flex-col items-center">
            <div className="flex gap-1 text-accent mb-6">
              {[1, 2, 3, 4, 5].map(i => (
                <Star key={i} className="w-6 h-6 fill-current" />
              ))}
            </div>
            <h3 className="text-2xl md:text-3xl font-serif text-primary mb-4" data-testid="text-social-proof">
              "Mais de 10.000 famílias confiam na retravium para eternizar seus momentos."
            </h3>
            <p className="text-muted-foreground font-sans tracking-wide uppercase text-xs font-semibold">
              Avaliação de 4.9/5 no Reclame Aqui
            </p>
          </div>
        </section>

        <section className="py-20 bg-white">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <h3 className="text-3xl font-serif italic text-primary text-center mb-12" data-testid="text-faq-title">
              Perguntas Frequentes
            </h3>
            <div className="divide-y divide-border/50">
              {FAQ.map((item, i) => (
                <div key={i} data-testid={`faq-item-${i}`}>
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    data-testid={`button-faq-${i}`}
                    className="w-full flex items-center justify-between py-5 text-left hover-elevate active-elevate-2"
                  >
                    <span className="font-serif text-lg text-primary pr-4">{item.q}</span>
                    <ChevronDown
                      className={cn(
                        "w-5 h-5 text-muted-foreground flex-shrink-0 transition-transform duration-300",
                        openFaq === i && "rotate-180"
                      )}
                    />
                  </button>
                  <AnimatePresence>
                    {openFaq === i && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="overflow-hidden"
                      >
                        <p className="pb-5 text-muted-foreground font-sans text-sm leading-relaxed" data-testid={`text-faq-answer-${i}`}>
                          {item.a}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </div>
        </section>

      </main>

      <footer id="contato" className="border-t border-border/50 py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center">
            <span className="font-serif text-2xl italic" style={{ color: '#C9A96E', letterSpacing: '0.05em', fontWeight: 400 }}>retravium</span>
          </div>
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} retravium. Todos os direitos reservados.
          </p>
          <a href="mailto:suporte@retravium.com" data-testid="link-support-email" className="text-sm text-muted-foreground hover-elevate">
            suporte@retravium.com
          </a>
        </div>
      </footer>

      <AnimatePresence>
        {openMold && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50 overflow-y-auto"
            style={{ background: '#faf8f4' }}
            data-testid="modal-style-overlay"
            ref={overlayScrollRef}
          >
            {/* Botão fechar (fixo) */}
            <button
              onClick={handleCloseModal}
              data-testid="button-close-modal"
              className="fixed top-4 right-4 md:top-6 md:right-6 z-[60] transition-all"
              style={{ color: 'rgba(45,38,32,0.4)' }}
              aria-label="Fechar"
            >
              <X className="w-5 h-5" />
            </button>

            {/* ── Split-screen (ocupa a tela inteira) ── */}
            <div className="relative h-screen md:flex md:flex-row md:h-screen">

              {/* ── IMAGEM: full-screen no mobile, coluna esquerda no desktop ── */}
              <div className="absolute inset-0 md:relative md:inset-auto md:flex-shrink-0 md:w-[58%] md:h-full overflow-hidden" style={{ background: '#111' }}>
                <AnimatePresence mode="crossfade">
                  <motion.img
                    key={finish}
                    src={finish === 'color' ? ((openMold as any).colorImage || openMold.image) : openMold.image}
                    alt={openMold.label}
                    className="absolute inset-0 w-full h-full object-cover object-top"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                  />
                </AnimatePresence>
                {/* Gradiente mobile: imagem → creme (de cima pra baixo) */}
                <div className="absolute inset-0 pointer-events-none md:hidden"
                  style={{ background: 'linear-gradient(to bottom, transparent 28%, rgba(250,248,244,0.45) 44%, rgba(250,248,244,0.90) 58%, #faf8f4 70%)' }} />
              </div>

              {/* ── CONTEÚDO: direto sobre a imagem no mobile, coluna direita no desktop ── */}
              <div
                className="absolute inset-0 flex flex-col justify-between pt-4 px-6 pb-6 overflow-y-auto md:relative md:inset-auto md:overflow-visible md:flex-1 md:flex md:flex-col md:justify-center md:px-14 md:py-16 md:bg-[#faf8f4]"
                data-testid="modal-style-content"
              >
                {/* Toggle no topo — mobile only */}
                <div className="flex justify-center md:hidden">
                  <div className="flex p-0.5 rounded-full border border-[#efe8d8] bg-white/90 shadow-sm">
                    <button
                      onClick={() => setFinish('bw')}
                      data-testid="button-finish-bw-top"
                      className={cn("px-4 py-1.5 rounded-full text-[10px] font-serif uppercase tracking-[0.12em] transition-all duration-300", finish === 'bw' ? "shadow text-white" : "bg-transparent text-foreground/50")}
                      style={finish === 'bw' ? { background: '#C9A96E' } : {}}
                    >Preto e Branco</button>
                    <button
                      onClick={() => setFinish('color')}
                      data-testid="button-finish-color-top"
                      className={cn("px-4 py-1.5 rounded-full text-[10px] font-serif uppercase tracking-[0.12em] transition-all duration-300", finish === 'color' ? "shadow text-white" : "bg-transparent text-foreground/50")}
                      style={finish === 'color' ? { background: '#C9A96E' } : {}}
                    >Colorido</button>
                  </div>
                </div>

                {/* Conteúdo inferior — empurrado pro fundo */}
                <div className="flex flex-col md:contents">

                {/* Overlay: geração em andamento */}
                {isGenerating && (
                  <div className="absolute inset-0 z-40 flex flex-col items-center justify-center px-6" style={{ background: '#faf8f4' }}>
                    <div className="w-full max-w-md sm:max-w-2xl rounded-3xl px-8 py-10 sm:px-20 sm:py-16 flex flex-col items-center gap-7 sm:gap-10" style={{ background: 'white', border: '1.5px solid #ddd6c8', boxShadow: '0 8px 48px rgba(100,80,50,0.13), 0 2px 8px rgba(100,80,50,0.07)' }}>
                      <div className="relative flex items-center justify-center w-20 h-20 sm:w-28 sm:h-28">
                        <div className="absolute inset-0 rounded-full border-2 border-black/5" />
                        <div className="absolute inset-0 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'rgba(201,169,110,0.2)', borderTopColor: '#C9A96E' }} />
                        <Camera className="absolute w-7 h-7 sm:w-10 sm:h-10" style={{ color: '#C9A96E' }} />
                      </div>
                      <div className="text-center space-y-2">
                        <p className="font-serif text-2xl sm:text-4xl italic" style={{ color: '#2d2620' }}>Criando sua obra...</p>
                        <p className="text-xs sm:text-sm tracking-widest uppercase" style={{ color: 'rgba(45,38,32,0.4)' }}>Pode levar até 30 segundos</p>
                      </div>
                      <div className="w-full space-y-2">
                        <div className="h-px rounded-full overflow-hidden" style={{ background: 'rgba(45,38,32,0.1)' }}>
                          <div className="h-full rounded-full transition-all duration-700 ease-out" style={{ background: 'linear-gradient(90deg, #C9A96E, #e8c98a)', width: `${genProgress}%` }} />
                        </div>
                        <p className="text-center text-xs sm:text-sm font-medium" style={{ color: '#C9A96E' }}>{Math.round(genProgress)}%</p>
                      </div>
                      <div className="w-full h-px" style={{ background: 'rgba(45,38,32,0.08)' }} />
                      <div className="w-full">
                        <AnimatePresence mode="wait">
                          <motion.div
                            key={reviewIndex}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.4 }}
                            className="flex items-stretch gap-5"
                          >
                            <div className="flex-shrink-0 w-24 h-32 sm:w-36 sm:h-52 rounded-2xl overflow-hidden shadow-lg">
                              {(LOADING_REVIEWS[reviewIndex] as any).photo ? (
                                <img src={(LOADING_REVIEWS[reviewIndex] as any).photo} alt={LOADING_REVIEWS[reviewIndex].name} className="w-full h-full object-cover" style={(LOADING_REVIEWS[reviewIndex] as any).photo === reviewDogImg ? { transform: 'scale(1.08)', transformOrigin: 'left center' } : {}} />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-white text-2xl sm:text-3xl font-bold" style={{ background: `linear-gradient(135deg, ${LOADING_REVIEWS[reviewIndex].color}, ${LOADING_REVIEWS[reviewIndex].color}99)` }}>
                                  {LOADING_REVIEWS[reviewIndex].initials}
                                </div>
                              )}
                            </div>
                            <div className="flex flex-col justify-center gap-1.5 sm:gap-2">
                              <div className="flex gap-0.5">{[1,2,3,4,5].map(s => <span key={s} style={{ color: '#C9A96E', fontSize: '16px' }}>★</span>)}</div>
                              <p className="text-base sm:text-lg font-semibold leading-tight" style={{ color: 'rgba(45,38,32,0.85)' }}>{LOADING_REVIEWS[reviewIndex].name}</p>
                              <p className="text-xs sm:text-sm" style={{ color: 'rgba(45,38,32,0.35)' }}>{LOADING_REVIEWS[reviewIndex].location}</p>
                              <p className="text-sm sm:text-base leading-relaxed italic mt-1" style={{ color: 'rgba(45,38,32,0.6)' }}>{LOADING_REVIEWS[reviewIndex].text}</p>
                            </div>
                          </motion.div>
                        </AnimatePresence>
                        <div className="flex justify-center gap-1.5 mt-4">
                          {LOADING_REVIEWS.map((_, i) => (
                            <div
                              key={i}
                              className="rounded-full transition-all duration-300"
                              style={{
                                width: i === reviewIndex ? '16px' : '5px',
                                height: '5px',
                                background: i === reviewIndex ? '#C9A96E' : 'rgba(45,38,32,0.15)',
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    </div>{/* fim card */}
                  </div>
                )}

                {/* Toggle P&B / Colorido — desktop only (mobile fica no topo) */}
                <div className="hidden md:flex p-0.5 rounded-full border border-[#efe8d8] bg-white shadow-sm self-start mb-4">
                  <button
                    onClick={() => setFinish('bw')}
                    data-testid="button-finish-bw"
                    className={cn("px-4 py-1.5 rounded-full text-[10px] font-serif uppercase tracking-[0.12em] transition-all duration-300", finish === 'bw' ? "shadow text-white" : "bg-transparent text-foreground/50 hover:text-foreground/80")}
                    style={finish === 'bw' ? { background: '#C9A96E' } : {}}
                  >Preto e Branco</button>
                  <button
                    onClick={() => setFinish('color')}
                    data-testid="button-finish-color"
                    className={cn("px-4 py-1.5 rounded-full text-[10px] font-serif uppercase tracking-[0.12em] transition-all duration-300", finish === 'color' ? "shadow text-white" : "bg-transparent text-foreground/50 hover:text-foreground/80")}
                    style={finish === 'color' ? { background: '#C9A96E' } : {}}
                  >Colorido</button>
                </div>

                {/* Headline */}
                <h1 className="font-serif text-2xl md:text-4xl lg:text-5xl leading-tight mb-1 text-center md:text-left" style={{ color: '#2d2620' }}>
                  Eternize <em style={{ color: '#C9A96E' }}>{openMold.label}</em><br />
                  em uma Obra Atemporal.
                </h1>
                <p className="text-xs mb-4 font-light text-center md:text-left" style={{ color: 'rgba(45,38,32,0.5)' }}>
                  Prévia gratuita
                </p>

                {/* Upload */}
                <p className="text-[11px] mb-3 font-medium tracking-wide text-center md:text-left" style={{ color: 'rgba(45,38,32,0.5)' }}>
                  Envie uma foto do grupo ou separada de cada pessoa.
                </p>
                <div className="flex gap-2.5 mb-4 w-full">
                  {faceSlots.map((slot, index) => (
                    <FaceUploadSlot
                      key={slot.role}
                      slot={slot}
                      onUpload={(file) => handleFaceUpload(index, file)}
                      onRemove={() => handleFaceRemove(index)}
                    />
                  ))}
                </div>

                {/* Botão gerar */}
                <button
                  disabled={!hasAtLeastOnePhoto || isGenerating}
                  onClick={handleGenerate}
                  data-testid="button-submit-order"
                  className={cn(
                    "w-full max-w-sm mx-auto block py-3.5 font-sans font-semibold tracking-widest uppercase text-sm rounded-xl text-white transition-all",
                    hasAtLeastOnePhoto && !isGenerating ? "cursor-pointer hover:opacity-90" : "opacity-40 cursor-not-allowed"
                  )}
                  style={{ background: '#C9A96E' }}
                >
                  {generatedImage ? "Gerar Novamente" : "Gerar Meu Retrato"}
                </button>

                {/* Prova social */}
                <div className="mt-4 flex items-center justify-center gap-2">
                  <div className="flex gap-0.5">{[1,2,3,4,5].map(s => <span key={s} style={{ color: '#C9A96E', fontSize: '12px' }}>★</span>)}</div>
                  <span className="text-[11px] font-light tracking-wide" style={{ color: 'rgba(45,38,32,0.4)' }}>Mais de 10.000 retratos gerados</span>
                </div>
                </div>{/* fim conteúdo inferior */}
              </div>
            </div>{/* fim split-screen */}

            {/* ── QUOTE — cinematic dark com glow ── */}
            <motion.section
              ref={quoteContainerRef as any}
              className="relative overflow-hidden py-28 md:py-44"
              style={{ background: '#ffffff' }}
            >
              {/* Glow radial dourado centrado — visível sobre fundo branco */}
              <div className="pointer-events-none absolute inset-0" style={{
                background: 'radial-gradient(ellipse 70% 85% at 50% 50%, rgba(201,169,110,0.35) 0%, rgba(201,169,110,0.14) 40%, transparent 70%)',
              }} />
              {/* Suave escurecimento nas bordas para dar profundidade */}
              <div className="pointer-events-none absolute inset-0" style={{
                background: 'radial-gradient(ellipse 130% 130% at 50% 50%, transparent 40%, rgba(201,169,110,0.06) 65%, rgba(220,210,195,0.25) 100%)',
              }} />

              <div className="relative z-10 max-w-5xl mx-auto px-8 md:px-16 text-center">
                {/* Label */}
                <motion.p
                  className="text-[9px] tracking-[0.4em] uppercase font-sans mb-12 md:mb-16"
                  style={{ color: 'rgba(201,169,110,0.7)' }}
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  viewport={{ once: true, amount: 0.4 }}
                >
                  ✦ retravium
                </motion.p>

                {/* Quote com parallax */}
                <motion.div style={{ y: quoteY }}>
                  <motion.blockquote
                    className="font-serif italic leading-[1.08] text-5xl md:text-6xl lg:text-7xl"
                    variants={{
                      hidden: {},
                      visible: { transition: { staggerChildren: 0.18, delayChildren: 0.1 } },
                    }}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.3 }}
                  >
                    <motion.span className="block" style={{ color: '#2d2620' }}
                      variants={{ hidden: { opacity: 0, y: 28 }, visible: { opacity: 1, y: 0, transition: { duration: 1.0, ease: [0.22, 1, 0.36, 1] } } }}
                    >
                      "Momentos passam.
                    </motion.span>
                    <motion.span className="block" style={{ color: '#C9A96E' }}
                      variants={{ hidden: { opacity: 0, y: 28 }, visible: { opacity: 1, y: 0, transition: { duration: 1.0, ease: [0.22, 1, 0.36, 1] } } }}
                    >
                      Retratos ficam."
                    </motion.span>
                  </motion.blockquote>

                  {/* Subtexto menor abaixo */}
                  <motion.p
                    className="mt-8 text-sm md:text-base font-light leading-relaxed"
                    style={{ color: 'rgba(45,38,32,0.45)' }}
                    initial={{ opacity: 0, y: 14 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.55, ease: [0.22, 1, 0.36, 1] }}
                    viewport={{ once: true, amount: 0.3 }}
                  >
                    Um retrato feito só para a sua família. Para sempre.
                  </motion.p>
                </motion.div>
              </div>
            </motion.section>

            {/* ── FAQ — editorial ── */}
            <section className="py-24 md:py-36 bg-white" style={{ borderTop: '1px solid rgba(45,38,32,0.10)' }}>
              <div className="max-w-5xl mx-auto px-6 md:px-12 flex flex-col md:flex-row gap-12 md:gap-24">

                {/* Coluna esquerda */}
                <motion.div
                  className="flex-shrink-0 md:w-72 flex flex-col items-center md:items-start text-center md:text-left"
                  initial={{ opacity: 0, x: -32 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                  viewport={{ once: true, amount: 0.3 }}
                >
                  <p className="text-[10px] tracking-[0.3em] uppercase font-sans mb-3" style={{ color: 'rgba(45,38,32,0.4)' }}>
                    Perguntas Frequentes
                  </p>
                  <motion.div
                    className="h-px w-8 mb-5"
                    style={{ background: '#C9A96E', transformOrigin: 'left' }}
                    initial={{ scaleX: 0 }}
                    whileInView={{ scaleX: 1 }}
                    transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
                    viewport={{ once: true }}
                  />
                  <h3 className="font-serif text-4xl md:text-5xl italic leading-tight" style={{ color: '#2d2620' }}>
                    Dúvidas,<br />respondidas.
                  </h3>
                  <p className="text-sm font-light leading-relaxed mt-6" style={{ color: 'rgba(45,38,32,0.55)' }}>
                    As perguntas mais comuns antes do primeiro retrato. Se precisar de mais, respondemos em minutos.
                  </p>
                  <a
                    href="https://wa.me/5511999999999"
                    className="inline-flex items-center gap-2 mt-8 py-3 text-[10px] tracking-[0.25em] uppercase font-sans transition-opacity duration-300 hover:opacity-60"
                    style={{ color: '#C9A96E' }}
                  >
                    Falar no WhatsApp ↗
                  </a>
                </motion.div>

                {/* Acordeão */}
                <motion.div
                  className="flex-1"
                  style={{ borderTop: '1px solid rgba(45,38,32,0.10)' }}
                  variants={{
                    hidden: {},
                    visible: { transition: { staggerChildren: 0.07, delayChildren: 0.2 } },
                  }}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, amount: 0.2 }}
                >
                  {FAQ.slice(0, 3).map((item, i) => (
                    <motion.div
                      key={i}
                      style={{ borderBottom: '1px solid rgba(45,38,32,0.10)' }}
                      variants={{
                        hidden: { opacity: 0, y: 16 },
                        visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
                      }}
                    >
                      <button
                        onClick={() => setOpenFaq(openFaq === i ? null : i)}
                        className="w-full flex items-center justify-between py-5 text-left min-h-[44px] hover:opacity-70 transition-opacity duration-200"
                      >
                        <span className="font-serif text-base md:text-lg pr-4" style={{ color: '#2d2620' }}>{item.q}</span>
                        <ChevronDown
                          className={cn("w-4 h-4 flex-shrink-0 transition-transform duration-300", openFaq === i && "rotate-180")}
                          style={{ color: 'rgba(45,38,32,0.4)' }}
                        />
                      </button>
                      <AnimatePresence>
                        {openFaq === i && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                            className="overflow-hidden"
                          >
                            <p className="pb-6 pt-1 font-sans text-sm font-light leading-relaxed" style={{ color: 'rgba(45,38,32,0.55)' }}>{item.a}</p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  ))}
                </motion.div>
              </div>
            </section>

            {/* ── FOOTER — brand closing ── */}
            <footer style={{ background: '#faf8f4' }}>

              {/* Zona 1 — Brand centerpiece */}
              <motion.div
                className="text-center py-20 md:py-28"
                style={{ borderBottom: '1px solid rgba(45,38,32,0.10)' }}
                initial={{ opacity: 0, y: 32 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 1.0, ease: [0.22, 1, 0.36, 1] }}
                viewport={{ once: true, amount: 0.4 }}
              >
                {/* Linha + ponto decorativo */}
                <div className="flex items-center justify-center gap-5 mb-10">
                  <motion.div
                    className="h-px flex-1 max-w-[120px]"
                    style={{ background: 'rgba(201,169,110,0.3)', transformOrigin: 'center' }}
                    initial={{ scaleX: 0 }}
                    whileInView={{ scaleX: 1 }}
                    transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
                    viewport={{ once: true }}
                  />
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#C9A96E', opacity: 0.5 }} />
                  <motion.div
                    className="h-px flex-1 max-w-[120px]"
                    style={{ background: 'rgba(201,169,110,0.3)', transformOrigin: 'center' }}
                    initial={{ scaleX: 0 }}
                    whileInView={{ scaleX: 1 }}
                    transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
                    viewport={{ once: true }}
                  />
                </div>

                {/* Wordmark */}
                <motion.span
                  className="font-serif italic block"
                  style={{ color: '#C9A96E', letterSpacing: '0.06em', fontWeight: 400, fontSize: 'clamp(2.5rem, 6vw, 5rem)', lineHeight: 1 }}
                  initial={{ opacity: 0, scale: 0.94 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.9, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
                  viewport={{ once: true }}
                >
                  retravium
                </motion.span>

                {/* Tagline */}
                <div className="flex items-center justify-center gap-4 mt-5">
                  <div className="h-px w-12" style={{ background: 'rgba(45,38,32,0.12)' }} />
                  <span className="text-[9px] tracking-[0.4em] uppercase font-sans" style={{ color: 'rgba(45,38,32,0.38)' }}>por amor ao detalhe</span>
                  <div className="h-px w-12" style={{ background: 'rgba(45,38,32,0.12)' }} />
                </div>
              </motion.div>

              {/* Zona 2 — Info grid */}
              <motion.div
                className="max-w-5xl mx-auto px-6 md:px-12 py-14 grid grid-cols-1 md:grid-cols-3 gap-10"
                variants={{
                  hidden: {},
                  visible: { transition: { staggerChildren: 0.1, delayChildren: 0.05 } },
                }}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.2 }}
              >
                <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } } }}>
                  <p className="text-[10px] tracking-[0.25em] uppercase font-sans mb-4" style={{ color: 'rgba(45,38,32,0.4)' }}>Suporte</p>
                  <a href="mailto:suporte@retravium.com" className="text-sm transition-colors duration-200" style={{ color: '#2d2620' }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#C9A96E')}
                    onMouseLeave={e => (e.currentTarget.style.color = '#2d2620')}
                  >suporte@retravium.com</a>
                </motion.div>
                <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } } }}>
                  <p className="text-[10px] tracking-[0.25em] uppercase font-sans mb-4" style={{ color: 'rgba(45,38,32,0.4)' }}>Sobre a retravium</p>
                  <p className="text-sm font-light leading-relaxed" style={{ color: 'rgba(45,38,32,0.55)' }}>Retratos artísticos gerados por IA, entregues no seu WhatsApp em minutos. Feito com cuidado para cada família.</p>
                </motion.div>
                <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } } }}>
                  <p className="text-[10px] tracking-[0.25em] uppercase font-sans mb-4" style={{ color: 'rgba(45,38,32,0.4)' }}>Legal</p>
                  <div className="space-y-2">
                    <p className="text-sm" style={{ color: 'rgba(45,38,32,0.55)' }}>Termos de Uso</p>
                    <p className="text-sm" style={{ color: 'rgba(45,38,32,0.55)' }}>Política de Privacidade</p>
                  </div>
                </motion.div>
              </motion.div>

              {/* Zona 3 — Legal bar */}
              <div style={{ borderTop: '1px solid rgba(45,38,32,0.10)' }} className="py-6 px-6">
                <p className="text-[9px] tracking-[0.2em] uppercase text-center" style={{ color: 'rgba(45,38,32,0.35)' }}>
                  &copy; {new Date().getFullYear()} retravium · Todos os direitos reservados
                </p>
              </div>
            </footer>

          </motion.div>
        )}
      </AnimatePresence>

      {/* ── TELA DE RESULTADO ── */}
      <AnimatePresence>
        {generatedImage && !isGenerating && activePackSlot === null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="fixed inset-0 z-[60] bg-white overflow-y-auto"
          >
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-border/50 bg-white/90 backdrop-blur-md">
              <div className="flex items-center">
                <span className="font-serif text-3xl italic cursor-pointer hover:opacity-70 transition-opacity" style={{ color: '#C9A96E', letterSpacing: '0.05em', fontWeight: 400 }} onClick={handleGoHome}>retravium</span>
              </div>
              <button
                onClick={() => { setGeneratedImage(null); handleCloseModal(); }}
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Fechar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="max-w-[1380px] mx-auto px-4 py-14">
              {/* Título */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="text-center mb-10"
              >
                <h2 className="text-3xl md:text-5xl font-serif italic text-primary mb-3">Sua Obra está Pronta!</h2>
                <p className="text-muted-foreground text-sm tracking-wide">Prévia com marca d'água — remove automaticamente ao finalizar o pedido</p>
              </motion.div>

              {/* Imagem com marca d'água */}
              <motion.div
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.25 }}
                className="relative mx-auto max-w-md md:max-w-lg mb-6"
              >
                <div
                  className="relative overflow-hidden rounded-2xl shadow-2xl shadow-primary/10 select-none"
                  onContextMenu={e => e.preventDefault()}
                >
                  <img
                    src={generatedImage}
                    alt="Retrato Gerado"
                    className="w-full block pointer-events-none"
                    draggable={false}
                    onContextMenu={e => e.preventDefault()}
                  />
                  {/* Marca d'água tiled */}
                  <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">
                    {[0,1,2,3,4,5,6].map(row => (
                      <div key={row} className="flex justify-around items-center" style={{ marginTop: row === 0 ? '6%' : 0, height: '14%' }}>
                        {[0,1,2,3].map(col => (
                          <span
                            key={col}
                            className="font-serif text-sm tracking-[0.25em] uppercase font-bold"
                            style={{
                              transform: 'rotate(-30deg)',
                              color: 'rgba(201,169,110,0.55)',
                              textShadow: '0 1px 3px rgba(0,0,0,0.3)',
                              display: 'block',
                            }}
                          >
                            retravium
                          </span>
                        ))}
                      </div>
                    ))}
                  </div>
                  {/* Overlay semi-transparente extra para dificultar captura */}
                  <div className="absolute inset-0 pointer-events-none" style={{ background: 'rgba(201,169,110,0.04)' }} />
                </div>
              </motion.div>

              {/* Gerar novamente */}
              <div className="text-center mb-14">
                <button
                  onClick={() => { setGeneratedImage(null); }}
                  className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground text-xs transition-colors"
                >
                  <RotateCcw className="w-3 h-3" />
                  Não gostou? Gerar novamente
                </button>
              </div>

              {/* Seção de formatos */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
              >
                <h3 className="text-2xl md:text-3xl font-serif italic text-primary text-center mb-12">Escolha seu Formato</h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">

                  {/* Card 1 — Digital HD */}
                  <div className="relative rounded-2xl border-2 border-primary/15 bg-primary/5 p-8 flex flex-col shadow-lg">
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 whitespace-nowrap">
                      <span className="bg-accent text-white text-[11px] font-bold uppercase tracking-widest px-5 py-1.5 rounded-full shadow-md">Mais Popular</span>
                    </div>
                    <div className="flex flex-col items-center text-center mb-6 mt-3">
                      <Download className="w-8 h-8 text-primary/25 mb-4" />
                      <h4 className="font-serif text-3xl text-primary mb-3">Retrato Digital HD</h4>
                      <div className="flex items-baseline justify-center gap-2 mb-1">
                        <span className="text-muted-foreground text-base line-through">R$ 49</span>
                        <span className="flex items-end gap-1">
                          <span className="text-primary text-2xl font-serif font-bold">R$</span>
                          <span className="text-primary text-5xl font-serif font-bold">29</span>
                        </span>
                      </div>
                      <div className="text-foreground/45 text-xs font-semibold uppercase tracking-widest mb-3">Expira em {formatTime(timeLeft)}</div>
                      <p className="text-foreground/55 text-sm leading-relaxed">
                        Download instantâneo em alta resolução — perfeito para compartilhar ou imprimir.
                      </p>
                    </div>
                    <div className="h-px bg-primary/10 mb-6" />
                    <ul className="space-y-3 mb-7 flex-1">
                      {["Sem marca d'água", 'Download instantâneo', 'Retrato em alta resolução', 'Perfeito para wallpaper', 'Foto de perfil', 'Postar e compartilhar'].map(item => (
                        <li key={item} className={`flex items-center gap-3 text-base ${item === 'Perfeito para wallpaper' || item === 'Foto de perfil' || item === 'Postar e compartilhar' ? 'text-foreground/85 font-semibold' : 'text-foreground/65'}`}>
                          <Check className="w-4 h-4 text-primary/40 flex-shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                    <button
                      onClick={() => openCheckout('Retrato Digital HD retravium', 29, false)}
                      className="w-full py-4 bg-primary text-white font-sans font-bold text-sm uppercase tracking-widest rounded-xl text-center hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 mb-3"
                    >
                      <Download className="w-4 h-4" />
                      Comprar Agora
                    </button>
                    <div className="mt-1">
                      <div className="h-px bg-primary/10 mb-4" />
                      <p className="text-center text-foreground/40 text-sm mb-2">Quer mais estilos e retratos?</p>
                      <button
                        onClick={() => setPlansOpen(true)}
                        className="w-full py-3 rounded-xl border border-primary/20 text-sm font-bold text-foreground/60 hover:border-primary/40 hover:text-foreground/80 transition-all duration-200 bg-transparent cursor-pointer"
                      >
                        Ver Planos e Preços →
                      </button>
                    </div>
                  </div>

                  {/* Card 2 — Fine Art */}
                  <div className="relative rounded-2xl border-2 border-primary/15 bg-primary/5 p-8 flex flex-col shadow-lg">
                    <div className="flex flex-col items-center text-center mb-6">
                      <Package className="w-8 h-8 text-primary/25 mb-4" />
                      <h4 className="font-serif text-3xl text-primary mb-3">Impressão Fine Art</h4>
                      <div className="flex items-end justify-center gap-1 mb-3">
                        <span className="text-primary text-2xl font-serif font-bold">R$</span>
                        <span className="text-primary text-5xl font-serif font-bold">
                          {SIZES.find(s => s.label === fineArtSize)?.fineArtPrice ?? 79}
                        </span>
                      </div>
                      <p className="text-foreground/55 text-sm leading-relaxed">
                        Impresso em papel museológico 300g com tintas resistentes à luz.
                      </p>
                    </div>
                    <div className="mb-5">
                      <label className="block text-xs font-bold text-foreground/50 uppercase tracking-widest mb-2">Escolha o Tamanho</label>
                      <select
                        value={fineArtSize}
                        onChange={e => setFineArtSize(e.target.value)}
                        className="w-full border-2 border-border rounded-xl px-4 py-3 text-sm text-primary bg-white focus:outline-none focus:border-primary/40 cursor-pointer"
                      >
                        {SIZES.map(s => <option key={s.label} value={s.label}>{s.label}</option>)}
                      </select>
                    </div>
                    <div className="h-px bg-border mb-6" />
                    <ul className="space-y-3 mb-7 flex-1">
                      {['Papel archival qualidade museu', 'Tintas resistentes ao desbotamento', 'Feito para durar décadas'].map(item => (
                        <li key={item} className="flex items-center gap-3 text-foreground/60 text-base">
                          <Check className="w-4 h-4 text-primary/30 flex-shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                    <div className="mb-3 flex items-center gap-3 p-3 rounded-xl bg-primary/5 border border-primary/10">
                      <Truck className="w-6 h-6 text-primary/40 flex-shrink-0" />
                      <div>
                        <p className="text-base font-bold text-foreground/70">Frete Grátis</p>
                        <p className="text-sm text-foreground/45">Entrega: 1–4 dias úteis</p>
                      </div>
                    </div>
                    <p className="text-accent text-sm font-medium mb-4">+ Inclui download digital</p>
                    <button
                      onClick={() => openCheckout(`Impressão Fine Art retravium - ${fineArtSize}`, SIZES.find(s => s.label === fineArtSize)?.fineArtPrice ?? 99, true)}
                      className="w-full py-4 border-2 border-primary text-primary font-sans font-bold text-sm uppercase tracking-widest rounded-xl text-center hover:bg-primary hover:text-white transition-colors"
                    >
                      Comprar Agora
                    </button>
                  </div>

                  {/* Card 3 — Quadro em Tela */}
                  <div className="relative rounded-2xl border-2 border-amber-300 bg-amber-50 p-8 flex flex-col shadow-lg">
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 whitespace-nowrap">
                      <span className="bg-amber-400 text-white text-[11px] font-bold uppercase tracking-widest px-5 py-1.5 rounded-full shadow-md">O Presente Perfeito</span>
                    </div>
                    <div className="flex flex-col items-center text-center mb-6 mt-3">
                      <Package className="w-8 h-8 text-amber-500/50 mb-4" />
                      <h4 className="font-serif text-3xl text-amber-900 mb-3">Quadro em Tela</h4>
                      <div className="flex items-end justify-center gap-1 mb-3">
                        <span className="text-amber-800 text-2xl font-serif font-bold">R$</span>
                        <span className="text-amber-800 text-5xl font-serif font-bold">
                          {SIZES.find(s => s.label === canvasSize)?.canvasPrice ?? 199}
                        </span>
                      </div>
                      <p className="text-amber-900/60 text-sm leading-relaxed">
                        Canvas premium em madeira — chega com moldura, pronto para pendurar.
                      </p>
                    </div>
                    <div className="mb-4">
                      <label className="block text-xs font-bold text-amber-700/60 uppercase tracking-widest mb-2">Escolha o Tamanho</label>
                      <select
                        value={canvasSize}
                        onChange={e => setCanvasSize(e.target.value)}
                        className="w-full border-2 border-amber-300 rounded-xl px-4 py-3 text-sm text-amber-900 bg-white focus:outline-none focus:border-amber-400 cursor-pointer"
                      >
                        {SIZES.map(s => <option key={s.label} value={s.label}>{s.label}</option>)}
                      </select>
                    </div>
                    <div className="mb-4">
                      <label className="block text-xs font-bold text-amber-700/60 uppercase tracking-widest mb-2">Escolha a Moldura</label>
                      <select
                        value={canvasFrame}
                        onChange={e => setCanvasFrame(e.target.value)}
                        className="w-full border-2 border-amber-300 rounded-xl px-4 py-3 text-sm text-amber-900 bg-white focus:outline-none focus:border-amber-400 cursor-pointer"
                      >
                        {['Preta de madeira', 'Branca de madeira', 'Tabaco de madeira', 'Natural de madeira'].map(f => (
                          <option key={f} value={f}>{f}</option>
                        ))}
                      </select>
                    </div>
                    <div className="h-px bg-amber-200 mb-6" />
                    <ul className="space-y-3 mb-7 flex-1">
                      {['Pronto para pendurar', 'Tela de algodão premium', 'Suporte incluso'].map(item => (
                        <li key={item} className="flex items-center gap-3 text-amber-900/70 text-base font-semibold">
                          <Check className="w-4 h-4 text-amber-500 flex-shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                    <div className="mb-3 flex items-center gap-3 p-3 rounded-xl bg-amber-100 border border-amber-200">
                      <Truck className="w-6 h-6 text-amber-500 flex-shrink-0" />
                      <div>
                        <p className="text-base font-bold text-amber-900/70">Frete Grátis</p>
                        <p className="text-sm text-amber-900/45">Entrega: 1–4 dias úteis</p>
                      </div>
                    </div>
                    <p className="text-amber-600 text-sm font-medium mb-4">+ Inclui download digital</p>
                    <button
                      onClick={() => openCheckout(`Quadro em Tela retravium - ${canvasSize} - Moldura: ${canvasFrame}`, SIZES.find(s => s.label === canvasSize)?.canvasPrice ?? 159, true)}
                      className="w-full py-4 bg-amber-500 text-white font-sans font-bold text-sm uppercase tracking-widest rounded-xl text-center hover:bg-amber-600 transition-colors"
                    >
                      Comprar Agora
                    </button>
                  </div>

                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>


      {/* ── MODAL DE CHECKOUT ── */}
      <AnimatePresence>
        {checkoutOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.55)' }}
            onClick={() => setCheckoutOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 60 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 60 }}
              transition={{ duration: 0.32, ease: 'easeOut' }}
              className="bg-white w-full sm:max-w-xl sm:rounded-2xl rounded-t-3xl shadow-2xl max-h-[95vh] flex flex-col overflow-hidden"
              onClick={e => e.stopPropagation()}
            >

              {/* ── TOP BAR ── */}
              <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-100 flex-shrink-0">
                <div className="flex items-center gap-3">
                  {checkoutStep === 'form' && checkoutFormPage > 1 ? (
                    <button
                      onClick={() => {
                        setCheckoutFormPage((checkoutFormPage - 1) as 1 | 2 | 3);
                        setCheckoutError('');
                      }}
                      className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 transition-colors font-medium"
                    >
                      ← Voltar
                    </button>
                  ) : (
                    <>
                      <span className="font-serif text-xl italic" style={{ color: '#C9A96E' }}>retravium</span>
                      <div className="flex items-center gap-1.5 pl-3 border-l border-gray-100">
                        <img
                          src="https://www.google.com/s2/favicons?domain=appmax.com.br&sz=32"
                          alt=""
                          className="w-4 h-4 grayscale opacity-50"
                        />
                        <span className="text-xs font-medium text-gray-300 tracking-tight">AppMax</span>
                      </div>
                    </>
                  )}
                </div>
                <button onClick={() => setCheckoutOpen(false)} className="text-gray-400 hover:text-gray-700 transition-colors p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* ── STEPPER ── */}
              {checkoutStep === 'form' && (
                <div className="px-6 pt-5 pb-2 flex-shrink-0">
                  <div className="relative flex justify-between items-start">
                    {/* Linha base */}
                    <div className="absolute top-4 left-4 right-4 h-0.5 bg-gray-100 rounded-full" />
                    {/* Linha progresso */}
                    <div
                      className="absolute top-4 left-4 h-0.5 rounded-full transition-all duration-500"
                      style={{
                        background: '#C9A96E',
                        width: `calc(${(checkoutFormPage - 1) / (checkoutTotalPages - 1)} * (100% - 2rem))`,
                      }}
                    />
                    {checkoutStepLabels.map((label, i) => {
                      const stepNum = i + 1;
                      const isDone = checkoutFormPage > stepNum;
                      const isCurrent = checkoutFormPage === stepNum;
                      return (
                        <div key={label} className="flex flex-col items-center gap-2 relative z-10">
                          <div
                            className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold transition-all duration-300"
                            style={isDone || isCurrent
                              ? {
                                  background: '#C9A96E',
                                  color: 'white',
                                  boxShadow: isCurrent ? '0 0 0 4px rgba(201,169,110,0.2)' : 'none',
                                }
                              : { background: '#f3f4f6', color: '#9ca3af' }
                            }
                          >
                            {isDone ? '✓' : stepNum}
                          </div>
                          <span
                            className="text-[11px] sm:text-sm font-semibold text-center leading-tight"
                            style={{ color: isCurrent ? '#111827' : isDone ? '#C9A96E' : '#9ca3af' }}
                          >
                            {label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ── RESUMO DO PEDIDO ── */}
              {checkoutStep === 'form' && (
                <div className="mx-5 mt-3 mb-1 flex-shrink-0">
                  <div className="flex items-start gap-3 px-4 py-3 rounded-xl" style={{ background: '#faf8f4', border: '1px solid #efe8d8' }}>
                    <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: 'rgba(201,169,110,0.15)' }}>
                      {checkoutProduct?.isPhysical
                        ? <Package className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: '#C9A96E' }} />
                        : <Download className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: '#C9A96E' }} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-medium text-gray-600 leading-relaxed">{checkoutProduct?.description}</p>
                      <p className="text-sm sm:text-lg font-bold text-gray-900 mt-1">R$ {checkoutProduct?.amount},00</p>
                    </div>
                  </div>
                </div>
              )}

              {/* ── CONTEÚDO SCROLLÁVEL ── */}
              <div className="flex-1 overflow-y-auto">
                <div className="px-5 py-5">

                  {/* ETAPA 1 — Identificação */}
                  {checkoutStep === 'form' && checkoutFormPage === 1 && (
                    <div className="space-y-4">
                      <div>
                        <h2 className="text-lg sm:text-2xl font-serif text-gray-900">Identifique-se</h2>
                        <p className="text-sm sm:text-base text-gray-400 mt-0.5">Seus dados para emissão do pedido</p>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm sm:text-base font-medium text-gray-700 mb-1.5">Nome completo</label>
                          <input
                            value={form.name}
                            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                            onFocus={e => { e.currentTarget.style.borderColor = '#C9A96E'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(201,169,110,0.12)'; }}
                            onBlur={e => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.boxShadow = 'none'; }}
                            className="w-full border border-gray-200 rounded-xl px-4 py-3.5 sm:py-4 text-base sm:text-lg outline-none transition-all"
                            placeholder="João Silva"
                          />
                        </div>
                        <div>
                          <label className="block text-sm sm:text-base font-medium text-gray-700 mb-1.5">CPF</label>
                          <input
                            value={form.cpf}
                            onChange={e => setForm(f => ({ ...f, cpf: e.target.value }))}
                            onFocus={e => { e.currentTarget.style.borderColor = '#C9A96E'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(201,169,110,0.12)'; }}
                            onBlur={e => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.boxShadow = 'none'; }}
                            className="w-full border border-gray-200 rounded-xl px-4 py-3.5 sm:py-4 text-base sm:text-lg outline-none transition-all"
                            placeholder="000.000.000-00"
                          />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1.5">
                            <label className="block text-sm sm:text-base font-medium text-gray-700">WhatsApp</label>
                            <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: '#eef7f0', color: '#3a7d52' }}>📲 Você receberá as fotos aqui</span>
                          </div>
                          <input
                            value={form.phone}
                            onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                            onFocus={e => { e.currentTarget.style.borderColor = '#C9A96E'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(201,169,110,0.12)'; }}
                            onBlur={e => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.boxShadow = 'none'; }}
                            type="tel"
                            className="w-full border border-gray-200 rounded-xl px-4 py-3.5 sm:py-4 text-base sm:text-lg outline-none transition-all"
                            placeholder="(11) 99999-9999"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ETAPA 2 — Entrega (só físico) */}
                  {checkoutStep === 'form' && checkoutFormPage === 2 && checkoutProduct?.isPhysical && (
                    <div className="space-y-4">
                      <div>
                        <h2 className="text-lg sm:text-2xl font-serif text-gray-900">Entrega</h2>
                        <p className="text-sm sm:text-base text-gray-400 mt-0.5">Para onde enviamos seu quadro?</p>
                      </div>
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-sm sm:text-base font-medium text-gray-700 mb-1.5">CEP</label>
                            <input
                              value={form.cep}
                              onChange={e => setForm(f => ({ ...f, cep: e.target.value }))}
                              onFocus={e => { e.currentTarget.style.borderColor = '#C9A96E'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(201,169,110,0.12)'; }}
                              onBlur={e => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.boxShadow = 'none'; handleCepBlur(e.currentTarget.value); }}
                              className="w-full border border-gray-200 rounded-xl px-4 py-3.5 sm:py-4 text-base sm:text-lg outline-none transition-all"
                              placeholder="00000-000" maxLength={9}
                            />
                            {cepLoading && <p className="text-xs text-gray-400 mt-1">Buscando...</p>}
                          </div>
                          <div>
                            <label className="block text-sm sm:text-base font-medium text-gray-700 mb-1.5">Número</label>
                            <input
                              value={form.number}
                              onChange={e => setForm(f => ({ ...f, number: e.target.value }))}
                              onFocus={e => { e.currentTarget.style.borderColor = '#C9A96E'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(201,169,110,0.12)'; }}
                              onBlur={e => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.boxShadow = 'none'; }}
                              className="w-full border border-gray-200 rounded-xl px-4 py-3.5 sm:py-4 text-base sm:text-lg outline-none transition-all"
                              placeholder="123"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm sm:text-base font-medium text-gray-700 mb-1.5">Rua</label>
                          <input
                            value={form.street}
                            onChange={e => setForm(f => ({ ...f, street: e.target.value }))}
                            onFocus={e => { e.currentTarget.style.borderColor = '#C9A96E'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(201,169,110,0.12)'; }}
                            onBlur={e => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.boxShadow = 'none'; }}
                            className="w-full border border-gray-200 rounded-xl px-4 py-3.5 sm:py-4 text-base sm:text-lg outline-none transition-all"
                            placeholder="Preenchido pelo CEP"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-sm sm:text-base font-medium text-gray-700 mb-1.5">Bairro</label>
                            <input
                              value={form.neighborhood}
                              onChange={e => setForm(f => ({ ...f, neighborhood: e.target.value }))}
                              onFocus={e => { e.currentTarget.style.borderColor = '#C9A96E'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(201,169,110,0.12)'; }}
                              onBlur={e => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.boxShadow = 'none'; }}
                              className="w-full border border-gray-200 rounded-xl px-4 py-3.5 sm:py-4 text-base sm:text-lg outline-none transition-all"
                              placeholder="Centro"
                            />
                          </div>
                          <div>
                            <label className="block text-sm sm:text-base font-medium text-gray-700 mb-1.5">Complemento</label>
                            <input
                              value={form.complement}
                              onChange={e => setForm(f => ({ ...f, complement: e.target.value }))}
                              onFocus={e => { e.currentTarget.style.borderColor = '#C9A96E'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(201,169,110,0.12)'; }}
                              onBlur={e => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.boxShadow = 'none'; }}
                              className="w-full border border-gray-200 rounded-xl px-4 py-3.5 sm:py-4 text-base sm:text-lg outline-none transition-all"
                              placeholder="Apto (opcional)"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-sm sm:text-base font-medium text-gray-700 mb-1.5">Cidade</label>
                            <input
                              value={form.city}
                              onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
                              onFocus={e => { e.currentTarget.style.borderColor = '#C9A96E'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(201,169,110,0.12)'; }}
                              onBlur={e => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.boxShadow = 'none'; }}
                              className="w-full border border-gray-200 rounded-xl px-4 py-3.5 sm:py-4 text-base sm:text-lg outline-none transition-all"
                              placeholder="São Paulo"
                            />
                          </div>
                          <div>
                            <label className="block text-sm sm:text-base font-medium text-gray-700 mb-1.5">Estado</label>
                            <input
                              value={form.state}
                              onChange={e => setForm(f => ({ ...f, state: e.target.value }))}
                              onFocus={e => { e.currentTarget.style.borderColor = '#C9A96E'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(201,169,110,0.12)'; }}
                              onBlur={e => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.boxShadow = 'none'; }}
                              className="w-full border border-gray-200 rounded-xl px-4 py-3.5 sm:py-4 text-base sm:text-lg outline-none transition-all"
                              placeholder="SP" maxLength={2}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ETAPA PAGAMENTO — página 2 (digital) ou 3 (físico) */}
                  {checkoutStep === 'form' && checkoutIsLastPage && (
                    <div className="space-y-4">
                      <div>
                        <h2 className="text-lg sm:text-2xl font-serif text-gray-900">Pagamento</h2>
                        <p className="text-sm sm:text-base text-gray-400 mt-0.5">Escolha como prefere pagar</p>
                      </div>

                      {/* Tabs */}
                      <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-gray-100">
                        {(['PIX', 'CREDIT_CARD'] as const).map(m => (
                          <button
                            key={m}
                            onClick={() => setPayMethod(m)}
                            className={cn(
                              'flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-semibold transition-all duration-200',
                              payMethod === m ? 'bg-white shadow-sm' : 'text-gray-500 hover:text-gray-700'
                            )}
                            style={payMethod === m ? { color: '#C9A96E' } : {}}
                          >
                            <span className="text-base">{m === 'PIX' ? '⚡' : '💳'}</span>
                            {m === 'PIX' ? 'Pix' : 'Crédito'}
                          </button>
                        ))}
                      </div>

                      {/* PIX info */}
                      {payMethod === 'PIX' && (
                        <div className="rounded-xl p-4" style={{ background: '#faf8f4', border: '1px solid #efe8d8' }}>
                          <div className="flex items-start gap-3 mb-3">
                            <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(201,169,110,0.15)' }}>
                              <span className="text-xl">⚡</span>
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900 text-sm">Pix — Instantâneo</p>
                              <p className="text-xs text-gray-500 mt-0.5">QR Code gerado na próxima tela. Válido por 30 min.</p>
                            </div>
                          </div>
                          <div className="space-y-2">
                            {['Funciona em qualquer banco 24h/7', 'Aprovação em segundos', 'Sem taxas adicionais'].map((t, i) => (
                              <div key={i} className="flex items-center gap-2">
                                <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: '#C9A96E' }}>
                                  <Check className="w-2.5 h-2.5 text-white" />
                                </div>
                                <span className="text-xs text-gray-600">{t}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Cartão */}
                      {payMethod === 'CREDIT_CARD' && (
                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm sm:text-base font-medium text-gray-700 mb-1.5">Nome no cartão</label>
                            <input
                              value={cardForm.holderName}
                              onChange={e => setCardForm(f => ({ ...f, holderName: e.target.value }))}
                              onFocus={e => { e.currentTarget.style.borderColor = '#C9A96E'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(201,169,110,0.12)'; }}
                              onBlur={e => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.boxShadow = 'none'; }}
                              className="w-full border border-gray-200 rounded-xl px-4 py-3.5 sm:py-4 text-base sm:text-lg outline-none transition-all"
                              placeholder="JOAO SILVA"
                            />
                          </div>
                          <div>
                            <label className="block text-sm sm:text-base font-medium text-gray-700 mb-1.5">Número do cartão</label>
                            <input
                              value={cardForm.number}
                              onChange={e => setCardForm(f => ({ ...f, number: e.target.value }))}
                              onFocus={e => { e.currentTarget.style.borderColor = '#C9A96E'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(201,169,110,0.12)'; }}
                              onBlur={e => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.boxShadow = 'none'; }}
                              className="w-full border border-gray-200 rounded-xl px-4 py-3.5 sm:py-4 text-base sm:text-lg outline-none transition-all"
                              placeholder="0000 0000 0000 0000" maxLength={19}
                            />
                          </div>
                          <div className="grid grid-cols-3 gap-3">
                            <div>
                              <label className="block text-sm sm:text-base font-medium text-gray-700 mb-1.5">Mês</label>
                              <input
                                value={cardForm.expiryMonth}
                                onChange={e => setCardForm(f => ({ ...f, expiryMonth: e.target.value }))}
                                onFocus={e => { e.currentTarget.style.borderColor = '#C9A96E'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(201,169,110,0.12)'; }}
                                onBlur={e => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.boxShadow = 'none'; }}
                                className="w-full border border-gray-200 rounded-xl px-4 py-3.5 sm:py-4 text-base sm:text-lg outline-none transition-all"
                                placeholder="MM" maxLength={2}
                              />
                            </div>
                            <div>
                              <label className="block text-sm sm:text-base font-medium text-gray-700 mb-1.5">Ano</label>
                              <input
                                value={cardForm.expiryYear}
                                onChange={e => setCardForm(f => ({ ...f, expiryYear: e.target.value }))}
                                onFocus={e => { e.currentTarget.style.borderColor = '#C9A96E'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(201,169,110,0.12)'; }}
                                onBlur={e => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.boxShadow = 'none'; }}
                                className="w-full border border-gray-200 rounded-xl px-4 py-3.5 sm:py-4 text-base sm:text-lg outline-none transition-all"
                                placeholder="AAAA" maxLength={4}
                              />
                            </div>
                            <div>
                              <label className="block text-sm sm:text-base font-medium text-gray-700 mb-1.5">CVV</label>
                              <input
                                value={cardForm.ccv}
                                onChange={e => setCardForm(f => ({ ...f, ccv: e.target.value }))}
                                onFocus={e => { e.currentTarget.style.borderColor = '#C9A96E'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(201,169,110,0.12)'; }}
                                onBlur={e => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.boxShadow = 'none'; }}
                                className="w-full border border-gray-200 rounded-xl px-4 py-3.5 sm:py-4 text-base sm:text-lg outline-none transition-all"
                                placeholder="123" maxLength={4}
                              />
                            </div>
                          </div>
                          {!checkoutProduct?.isPhysical && (
                            <div>
                              <label className="block text-sm sm:text-base font-medium text-gray-700 mb-1.5">Telefone</label>
                              <input
                                value={form.phone}
                                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                                onFocus={e => { e.currentTarget.style.borderColor = '#C9A96E'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(201,169,110,0.12)'; }}
                                onBlur={e => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.boxShadow = 'none'; }}
                                className="w-full border border-gray-200 rounded-xl px-4 py-3.5 sm:py-4 text-base sm:text-lg outline-none transition-all"
                                placeholder="(11) 99999-9999"
                              />
                            </div>
                          )}
                        </div>
                      )}

                      {checkoutError && (
                        <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                          <span className="text-red-400 flex-shrink-0 text-sm">⚠️</span>
                          <p className="text-red-600 text-sm">{checkoutError}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ── TELA PIX ── */}
                  {checkoutStep === 'pix' && pixData && (
                    <div className="space-y-4">
                      <div
                        className="flex items-center justify-between rounded-xl px-4 py-3"
                        style={pixTimer > 300
                          ? { background: '#f0fdf4', border: '1px solid #bbf7d0' }
                          : { background: '#fef2f2', border: '1px solid #fecaca' }}
                      >
                        <span className={cn('text-sm font-semibold', pixTimer > 300 ? 'text-green-700' : 'text-red-600')}>⏱ Expira em</span>
                        <span className={cn('font-bold text-lg tabular-nums', pixTimer > 300 ? 'text-green-700' : 'text-red-600')}>{formatTime(pixTimer)}</span>
                      </div>
                      <div className="text-center">
                        <p className="font-serif text-lg text-gray-900">Escaneie o QR Code</p>
                        <p className="text-sm sm:text-base text-gray-400 mt-0.5">ou copie o código abaixo</p>
                      </div>
                      <div className="flex justify-center">
                        <div className="w-52 h-52 p-3 bg-white border border-gray-200 rounded-2xl shadow-sm">
                          {pixData.qrCode
                            ? <img src={`data:image/png;base64,${pixData.qrCode}`} alt="QR Code Pix" className="w-full h-full object-contain" />
                            : <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">QR Code indisponível</div>
                          }
                        </div>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                        <p className="text-xs font-mono text-gray-500 break-all leading-relaxed line-clamp-3">{pixData.pixCopyPaste}</p>
                      </div>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(pixData.pixCopyPaste || '');
                          setPixCopied(true);
                          setTimeout(() => setPixCopied(false), 3000);
                        }}
                        className="w-full py-4 rounded-2xl font-bold text-base text-white transition-all duration-300 shadow-md"
                        style={{ background: pixCopied ? '#22c55e' : '#C9A96E' }}
                      >
                        {pixCopied ? '✅ Copiado!' : '📋 Copiar código Pix'}
                      </button>
                      <div className="rounded-xl p-4 space-y-2.5" style={{ background: '#faf8f4', border: '1px solid #efe8d8' }}>
                        <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: '#C9A96E' }}>Como pagar</p>
                        {['Abra o app do seu banco', 'Vá em Pix → Pagar com código', 'Cole o código e confirme'].map((step, i) => (
                          <div key={i} className="flex items-center gap-3">
                            <div className="w-5 h-5 rounded-full text-white text-xs font-bold flex items-center justify-center flex-shrink-0" style={{ background: '#C9A96E' }}>{i + 1}</div>
                            <p className="text-sm text-gray-700">{step}</p>
                          </div>
                        ))}
                      </div>
                      <button onClick={() => setCheckoutStep('form')} className="w-full text-center text-sm text-gray-400 hover:text-gray-600 transition-colors py-1">
                        ← Voltar
                      </button>
                    </div>
                  )}

                  {/* ── SUCESSO ── */}
                  {checkoutStep === 'success' && (
                    <div className="flex flex-col items-center gap-5 py-8 text-center">
                      <div>
                        <p className="font-serif text-2xl mb-2" style={{ color: '#2d2620' }}>Pagamento Aprovado! 🎉</p>
                        <p className="text-sm leading-relaxed" style={{ color: '#7a6a5a' }}>
                          {checkoutProduct?.isPhysical
                            ? 'Seu quadro está sendo preparado e em breve será enviado para entrega.'
                            : packCredits > 0
                              ? `Seu 1º retrato está pronto. Você ainda tem ${packCredits} retrato${packCredits > 1 ? 's' : ''} no seu pack!`
                              : 'Seu retrato está pronto! Baixe ou receba no WhatsApp.'}
                        </p>
                      </div>

                      {/* Aviso produto físico */}
                      {checkoutProduct?.isPhysical && (
                        <div className="w-full rounded-2xl p-4 text-left space-y-1" style={{ background: '#fdf6ec', border: '1px solid #e8d5b0' }}>
                          <p className="font-semibold text-sm" style={{ color: '#8a6a2a' }}>📦 Pedido de impressão recebido</p>
                          <p className="text-xs leading-relaxed" style={{ color: '#7a6a5a' }}>
                            Seu retrato digital está pronto abaixo. O quadro impresso será produzido e enviado para o endereço informado no prazo de 1–7 dias úteis. Você receberá atualizações no WhatsApp.
                          </p>
                        </div>
                      )}

                      {generatedImage ? (
                        <motion.div
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ type: 'spring', stiffness: 200, damping: 18 }}
                          className="relative w-full rounded-2xl overflow-hidden shadow-xl"
                        >
                          <img src={generatedImage} alt="Seu retrato" className="w-full h-full object-cover" />
                          <div className="absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center shadow-md" style={{ background: '#C9A96E' }}>
                            <Check className="w-4 h-4 text-white" />
                          </div>
                        </motion.div>
                      ) : (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                          className="w-20 h-20 rounded-full flex items-center justify-center"
                          style={{ background: '#fdf6ec' }}
                        >
                          <Check className="w-10 h-10" style={{ color: '#C9A96E' }} />
                        </motion.div>
                      )}

                      {generatedImage && (
                        <a
                          href={generatedImage}
                          download="retrato-retravium.jpg"
                          className="w-full py-4 rounded-2xl font-bold text-base text-white shadow-lg flex items-center justify-center gap-2"
                          style={{ background: '#C9A96E' }}
                        >
                          <Download className="w-5 h-5" />
                          Baixar Retrato
                        </a>
                      )}

                      {/* ── Botão Receber no WhatsApp ── */}
                      {portraitId && generatedImage && (
                        <div className="w-full space-y-2">
                          {/* Telefone — sempre mostra com opção de corrigir */}
                          {whatsappStatus !== 'sent' && (
                            <div className="space-y-1">
                              <label className="text-xs font-medium text-left block" style={{ color: '#7a6a5a' }}>
                                WhatsApp para receber o retrato:
                              </label>
                              <input
                                type="tel"
                                placeholder="(11) 99999-9999"
                                className="w-full border rounded-xl px-4 py-3 text-base outline-none"
                                style={{ borderColor: '#e8d5b0' }}
                                value={successPhone || form.phone}
                                onChange={e => setSuccessPhone(e.target.value)}
                              />
                              <p className="text-xs text-left" style={{ color: '#aaa' }}>Número errado? Edite acima antes de enviar.</p>
                            </div>
                          )}
                          {whatsappStatus === 'sent' ? (
                            <div className="w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2" style={{ background: '#fdf6ec', color: '#8a6a2a' }}>
                              ✅ Enviado para {successPhone || form.phone}
                            </div>
                          ) : (
                            <button
                              disabled={whatsappStatus === 'sending'}
                              onClick={async () => {
                                const phoneToSend = (successPhone || form.phone).trim();
                                if (!phoneToSend) { setCheckoutError('Informe seu WhatsApp.'); return; }
                                setWhatsappStatus('sending');
                                setCheckoutError('');
                                try {
                                  const res = await fetch(`/api/portraits/${portraitId}/send`, {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ phone: phoneToSend, name: form.name }),
                                  });
                                  if (res.ok) {
                                    setWhatsappStatus('sent');
                                    // Para produtos físicos, envia também mensagem sobre o quadro
                                    if (checkoutProduct?.isPhysical) {
                                      fetch('/api/whatsapp/text', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({
                                          phone: phoneToSend,
                                          message: `Olá ${form.name || ''}! 📦\n\nSeu pedido de impressão *retravium* foi confirmado!\n\nSeu quadro está sendo preparado com carinho e será enviado para entrega em breve. Assim que despacharmos, você receberá o código de rastreio aqui. 🎨\n\nQualquer dúvida é só falar!`.trim(),
                                        }),
                                      }).catch(() => {});
                                    }
                                  } else {
                                    const data = await res.json().catch(() => ({}));
                                    setWhatsappStatus('error');
                                    setCheckoutError(data.message || 'Erro ao enviar. Tente novamente.');
                                  }
                                } catch {
                                  setWhatsappStatus('error');
                                  setCheckoutError('Erro de conexão. Tente novamente.');
                                }
                              }}
                              className="w-full py-4 rounded-2xl font-bold text-base text-white shadow-lg flex items-center justify-center gap-2 transition-opacity disabled:opacity-60"
                              style={{ background: '#25D366' }}
                            >
                              {whatsappStatus === 'sending' ? (
                                <>⏳ Enviando para o WhatsApp...</>
                              ) : (
                                <>📲 Receber no WhatsApp{whatsappStatus === 'error' ? ' (tentar novamente)' : ''}</>
                              )}
                            </button>
                          )}
                          {whatsappStatus === 'error' && (
                            <p className="text-xs text-red-500 text-center mt-1">{checkoutError}</p>
                          )}
                        </div>
                      )}

                      {packCredits > 0 && (
                        <button
                          onClick={handleNextPortrait}
                          className="w-full py-4 rounded-2xl font-bold text-base text-white shadow-lg"
                          style={{ background: '#C9A96E' }}
                        >
                          Gerar Próximo Retrato ({packCredits} restante{packCredits > 1 ? 's' : ''}) →
                        </button>
                      )}
                      <button
                        onClick={() => setCheckoutOpen(false)}
                        className="w-full py-3 rounded-2xl font-bold text-sm text-gray-500 border border-gray-200"
                      >
                        Fechar
                      </button>
                    </div>
                  )}

                </div>
              </div>

              {/* ── FOOTER FIXO — CTA ── */}
              {checkoutStep === 'form' && (
                <div className="flex-shrink-0 px-5 pt-3 pb-6 border-t border-gray-100 space-y-3 bg-white">
                  <button
                    onClick={() => {
                      if (checkoutFormPage === 1) {
                        if (!form.name.trim()) { setCheckoutError('Informe seu nome completo.'); return; }
                        const cpfDigits = form.cpf.replace(/\D/g, '');
                        if (cpfDigits.length !== 11) { setCheckoutError('CPF inválido — deve ter 11 dígitos.'); return; }
                        const phoneDigits = form.phone.replace(/\D/g, '');
                        if (phoneDigits.length < 10 || phoneDigits.length > 11) { setCheckoutError('WhatsApp inválido — informe DDD + número (ex: 11 99999-9999).'); return; }
                        setCheckoutError('');
                      }
                      if (!checkoutIsLastPage) {
                        setCheckoutFormPage((checkoutFormPage + 1) as 1 | 2 | 3);
                      } else {
                        handlePayment();
                      }
                    }}
                    disabled={checkoutLoading}
                    className="w-full py-4 sm:py-5 rounded-2xl font-bold text-base sm:text-lg text-white transition-all duration-200 disabled:opacity-60 shadow-md"
                    style={{ background: checkoutLoading ? '#d4b483' : '#C9A96E' }}
                  >
                    {checkoutLoading
                      ? '⏳ Processando...'
                      : !checkoutIsLastPage
                        ? 'Continuar →'
                        : payMethod === 'PIX'
                          ? '⚡ Gerar QR Code Pix'
                          : `💳 Pagar R$ ${checkoutProduct?.amount},00`
                    }
                  </button>
                  <div className="flex items-center justify-center gap-4 text-gray-400">
                    <div className="flex items-center gap-1">
                      <Lock className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                      <span className="text-xs sm:text-sm">SSL Seguro</span>
                    </div>
                    <div className="w-px h-3 bg-gray-200" />
                    <div className="flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                      <span className="text-xs sm:text-sm">Antifraude</span>
                    </div>
                    <div className="w-px h-3 bg-gray-200" />
                    <div className="flex items-center gap-1">
                      <CheckCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                      <span className="text-xs sm:text-sm">100% Seguro</span>
                    </div>
                  </div>
                </div>
              )}

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── MODAL DE PLANOS ── */}
      <AnimatePresence>
        {plansOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6"
            style={{ background: 'rgba(0,0,0,0.55)' }}
            onClick={() => setPlansOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 20 }}
              transition={{ duration: 0.28, ease: 'easeOut' }}
              className="w-full max-w-5xl rounded-2xl shadow-2xl flex flex-col bg-white"
              style={{ maxHeight: '92vh' }}
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-8 pt-6 pb-5 flex-shrink-0 border-b border-gray-100">
                <div>
                  <span className="font-serif text-2xl italic" style={{ color: '#C9A96E' }}>retravium</span>
                  <p className="text-gray-400 text-xs mt-0.5 font-medium tracking-wide">Escolha seu pacote</p>
                </div>
                <button onClick={() => setPlansOpen(false)} className="text-gray-300 hover:text-gray-600 transition-colors p-1.5 rounded-xl hover:bg-gray-50">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Title */}
              <div className="px-8 pt-7 pb-2 flex-shrink-0 text-center">
                <h2 className="font-serif text-3xl sm:text-4xl italic text-gray-900 leading-tight">Mais retratos, mais memórias</h2>
                <p className="text-gray-400 text-sm sm:text-base mt-2">Quanto mais retratos, menor o preço por unidade</p>
              </div>

              {/* Cards — scrollable */}
              <div className="flex-1 overflow-y-auto px-6 sm:px-8 pb-8 pt-7">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

                  {/* ── Digital Pack ── */}
                  <div className="rounded-2xl p-7 flex flex-col" style={{ background: '#faf8f4', border: '2px solid #efe8d8' }}>
                    {/* spacer to align vertically with badged cards */}
                    <div className="h-9 mb-4" />
                    {/* Centered name + price block */}
                    <div className="text-center mb-6">
                      <p className="font-serif text-2xl text-gray-800 mb-3">Digital Pack</p>
                      <div className="flex items-end justify-center gap-1 mb-2">
                        <span className="text-gray-500 text-xl font-serif font-bold mt-1">R$</span>
                        <span className="text-gray-900 font-serif font-bold leading-none" style={{ fontSize: '56px', lineHeight: 1 }}>29</span>
                      </div>
                      <p className="text-gray-400 text-sm">R$ 29 por retrato</p>
                    </div>
                    <div className="h-px bg-gray-200 mb-6" />
                    <ul className="space-y-3.5 mb-8 flex-1">
                      {["1 retrato artístico HD", "Download instantâneo", "Sem marca d'água", "Estilo clássico ou íntimo"].map(item => (
                        <li key={item} className="flex items-center gap-3 text-gray-600 text-sm">
                          <Check className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#C9A96E' }} />
                          {item}
                        </li>
                      ))}
                    </ul>
                    <button
                      onClick={() => { setPlansOpen(false); openCheckout('Retrato Digital HD retravium', 29, false); }}
                      className="w-full py-4 rounded-xl font-bold text-sm transition-all duration-200 border-2 border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white"
                    >
                      Começar →
                    </button>
                  </div>

                  {/* ── Starter Pack — MAIS POPULAR ── */}
                  <div className="rounded-2xl p-7 flex flex-col bg-white" style={{ border: '2px solid #C9A96E', boxShadow: '0 8px 48px rgba(201,169,110,0.18)' }}>
                    <div className="flex justify-center mb-4">
                      <span className="text-[11px] font-bold uppercase tracking-[0.18em] px-5 py-2 rounded-full text-white shadow-md" style={{ background: '#C9A96E' }}>
                        ★ Mais Popular
                      </span>
                    </div>
                    {/* Centered name + price block */}
                    <div className="text-center mb-6">
                      <p className="font-serif text-2xl text-gray-800 mb-3">Starter Pack</p>
                      <div className="flex items-end justify-center gap-1 mb-2">
                        <span className="text-gray-500 text-xl font-serif font-bold mt-1">R$</span>
                        <span className="text-gray-900 font-serif font-bold leading-none" style={{ fontSize: '56px', lineHeight: 1 }}>49</span>
                      </div>
                      <div className="flex items-center justify-center gap-2">
                        <span className="text-gray-400 text-sm line-through">R$ 87</span>
                        <span className="text-sm font-semibold" style={{ color: '#C9A96E' }}>economize R$ 38</span>
                      </div>
                      <p className="text-gray-400 text-sm mt-0.5">R$ 16,30 por retrato</p>
                    </div>
                    <div className="h-px mb-6" style={{ background: '#efe8d8' }} />
                    <ul className="space-y-3.5 mb-8 flex-1">
                      {["3 retratos artísticos HD", "Estilos diferentes em cada um", "Downloads instantâneos", "Todos sem marca d'água", "Preto e branco + Colorido"].map(item => (
                        <li key={item} className="flex items-center gap-3 text-gray-600 text-sm">
                          <Check className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#C9A96E' }} />
                          {item}
                        </li>
                      ))}
                    </ul>
                    <button
                      onClick={() => { setPlansOpen(false); openCheckout('Pack Família — 3 Retratos HD retravium', 49, false); }}
                      className="w-full py-4 rounded-xl font-bold text-sm transition-all duration-200 hover:opacity-90 shadow-md text-white"
                      style={{ background: '#C9A96E' }}
                    >
                      Escolher Starter Pack →
                    </button>
                  </div>

                  {/* ── Studio Pack — MELHOR VALOR ── */}
                  <div className="rounded-2xl p-7 flex flex-col" style={{ background: '#faf8f4', border: '2px solid #efe8d8' }}>
                    <div className="flex justify-center mb-4">
                      <span className="text-[11px] font-bold uppercase tracking-[0.18em] px-5 py-2 rounded-full text-gray-600 bg-white border border-gray-300">
                        Melhor Valor
                      </span>
                    </div>
                    {/* Centered name + price block */}
                    <div className="text-center mb-6">
                      <p className="font-serif text-2xl text-gray-800 mb-3">Studio Pack</p>
                      <div className="flex items-end justify-center gap-1 mb-2">
                        <span className="text-gray-500 text-xl font-serif font-bold mt-1">R$</span>
                        <span className="text-gray-900 font-serif font-bold leading-none" style={{ fontSize: '56px', lineHeight: 1 }}>89</span>
                      </div>
                      <div className="flex items-center justify-center gap-2">
                        <span className="text-gray-400 text-sm line-through">R$ 174</span>
                        <span className="text-sm font-semibold" style={{ color: '#C9A96E' }}>economize 49%</span>
                      </div>
                      <p className="text-gray-400 text-sm mt-0.5">R$ 14,80 por retrato</p>
                    </div>
                    <div className="h-px bg-gray-200 mb-6" />
                    <ul className="space-y-3.5 mb-8 flex-1">
                      {["6 retratos artísticos HD", "Perfeito para toda a família", "Todos os estilos disponíveis", "Todos sem marca d'água", "Preto e branco + Colorido", "Prioridade no atendimento"].map(item => (
                        <li key={item} className="flex items-center gap-3 text-gray-600 text-sm">
                          <Check className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#C9A96E' }} />
                          {item}
                        </li>
                      ))}
                    </ul>
                    <button
                      onClick={() => { setPlansOpen(false); openCheckout('Pack Memórias — 6 Retratos HD retravium', 89, false); }}
                      className="w-full py-4 rounded-xl font-bold text-sm transition-all duration-200 border-2 border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white"
                    >
                      Escolher Studio Pack →
                    </button>
                  </div>

                </div>

                <p className="text-center text-gray-400 text-xs mt-6">Download instantâneo · Pagamento 100% seguro via AppMax</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <footer className="py-12 px-6 border-t border-white/5 flex flex-col items-center">
        <div className="text-white/20 font-serif text-2xl mb-8 text-center">Retratos de Família</div>
        <div className="flex flex-wrap justify-center gap-8 mb-8">
          <a href="#" className="text-white/40 hover:text-white transition-colors text-sm uppercase tracking-widest">Instagram</a>
          <a href="#" className="text-white/40 hover:text-white transition-colors text-sm uppercase tracking-widest">WhatsApp</a>
          <a href="/lumina_export.zip" download className="text-white hover:text-white transition-colors text-sm uppercase tracking-widest underline font-bold">Download do Projeto</a>
        </div>
        <div className="text-white/10 text-[10px] uppercase tracking-[0.2em] text-center">© 2026 Retratos de Família. Todos os direitos reservados.</div>
      </footer>

      {/* ── TELA DO PACK ── */}
      <AnimatePresence>
        {packScreenOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[70] bg-[#faf8f4] overflow-y-auto"
          >
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-[#efe8d8] bg-[#faf8f4]/90 backdrop-blur-md">
              <span className="font-serif text-3xl italic cursor-pointer hover:opacity-70 transition-opacity" style={{ color: '#C9A96E', fontWeight: 400 }} onClick={handleGoHome}>retravium</span>
              <div className="text-sm font-medium text-foreground/50">
                {packPortraits.filter(Boolean).length} de {packTotal} retratos concluídos
              </div>
            </div>

            <div className="max-w-4xl mx-auto px-6 py-10">
              {/* Título */}
              <div className="text-center mb-10">
                <h2 className="font-serif text-4xl text-gray-900 mb-2">Seu Pack de {packTotal} Retratos</h2>
                <p className="text-foreground/50 text-base">Gere cada retrato no seu ritmo — seus créditos ficam salvos aqui.</p>
              </div>

              {/* Barra de progresso */}
              <div className="flex items-center gap-3 mb-10">
                <div className="flex-1 h-2 rounded-full bg-[#efe8d8] overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ background: '#C9A96E', width: `${(packPortraits.filter(Boolean).length / packTotal) * 100}%` }}
                  />
                </div>
                <span className="text-sm font-bold text-[#C9A96E] whitespace-nowrap">
                  {packPortraits.filter(Boolean).length}/{packTotal}
                </span>
              </div>

              {/* Grid de slots */}
              <div className={`grid gap-6 ${packTotal === 3 ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-2 sm:grid-cols-3'}`}>
                {packPortraits.map((portrait, i) => (
                  <div key={i} className="flex flex-col gap-3">
                    <div
                      className="relative aspect-[3/4] rounded-2xl overflow-hidden border-2"
                      style={{ borderColor: portrait ? '#C9A96E' : '#efe8d8', background: portrait ? 'transparent' : '#f5f0e8' }}
                    >
                      {portrait ? (
                        <img src={portrait} alt={`Retrato ${i + 1}`} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-foreground/30">
                          <div className="w-12 h-12 rounded-full border-2 border-dashed border-foreground/20 flex items-center justify-center">
                            <span className="text-xl font-serif text-foreground/25">{i + 1}</span>
                          </div>
                          <p className="text-xs font-medium">Retrato {i + 1}</p>
                        </div>
                      )}
                      {portrait && (
                        <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-[#C9A96E] flex items-center justify-center shadow">
                          <Check className="w-3.5 h-3.5 text-white" />
                        </div>
                      )}
                    </div>
                    {portrait ? (
                      <div className="flex flex-col gap-2">
                        <a
                          href={portrait}
                          download={`retrato-retravium-${i + 1}.jpg`}
                          className="w-full py-2.5 rounded-xl text-sm font-bold text-center border-2 border-[#C9A96E] text-[#C9A96E] hover:bg-[#C9A96E] hover:text-white transition-all flex items-center justify-center gap-2"
                        >
                          <Download className="w-4 h-4" />
                          Baixar
                        </a>
                        {(packRegens[i] ?? 0) < 2 && (
                          <button
                            onClick={() => {
                              setPackRegens(prev => { const r = [...prev]; r[i] = (r[i] ?? 0) + 1; return r; });
                              handleNextPortrait(i);
                            }}
                            className="w-full py-2 rounded-xl text-xs font-semibold text-foreground/45 border border-foreground/15 hover:border-foreground/30 hover:text-foreground/60 transition-all"
                          >
                            Gerar novamente ({(packRegens[i] ?? 0) + 1}/2)
                          </button>
                        )}
                      </div>
                    ) : (
                      <button
                        onClick={() => handleNextPortrait(i)}
                        className="w-full py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90"
                        style={{ background: '#C9A96E' }}
                      >
                        Gerar retrato {i + 1} →
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Botão WhatsApp — sempre visível, bloqueado até completar */}
              <div className="mt-10 p-6 rounded-2xl border-2 space-y-4" style={{ borderColor: packPortraits.every(Boolean) ? '#C9A96E' : '#e5e7eb', background: 'white' }}>
                {packPortraits.every(Boolean)
                  ? <p className="font-serif text-xl text-gray-900 text-center">🎉 Pack completo! Receba tudo no WhatsApp.</p>
                  : <p className="text-sm text-gray-400 text-center">Gere todos os retratos para receber no WhatsApp<br/>({packPortraits.filter(Boolean).length}/{packTotal} prontos)</p>
                }

                {/* Campo de WhatsApp se não tiver número */}
                {!form.phone.trim() && packWhatsappStatus !== 'sent' && packPortraits.every(Boolean) && (
                  <input
                    type="tel"
                    placeholder="(11) 99999-9999"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base outline-none"
                    value={successPhone}
                    onChange={e => setSuccessPhone(e.target.value)}
                  />
                )}

                {packWhatsappStatus === 'sent' ? (
                  <div className="w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 text-green-700" style={{ background: '#dcfce7' }}>
                    ✅ Todos os retratos enviados no WhatsApp!
                  </div>
                ) : (
                  <button
                    disabled={!packPortraits.every(Boolean) || packWhatsappStatus === 'sending'}
                    onClick={async () => {
                      const phoneToSend = form.phone.trim() || successPhone.trim();
                      if (!phoneToSend) { alert('Informe seu WhatsApp.'); return; }
                      setPackWhatsappStatus('sending');
                      const ids = packPortraitIds.filter(Boolean) as string[];
                      let allOk = true;
                      for (let i = 0; i < ids.length; i++) {
                        try {
                          const res = await fetch(`/api/portraits/${ids[i]}/send`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            // Só a primeira foto leva o texto, as demais vão sem legenda
                            body: JSON.stringify({ phone: phoneToSend, name: i === 0 ? form.name : '', caption: i === 0 }),
                          });
                          if (!res.ok) allOk = false;
                        } catch { allOk = false; }
                      }
                      setPackWhatsappStatus(allOk ? 'sent' : 'error');
                    }}
                    className="w-full py-4 rounded-2xl font-bold text-base text-white shadow-lg flex items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{ background: '#25D366' }}
                  >
                    {packWhatsappStatus === 'sending'
                      ? '⏳ Enviando retratos...'
                      : packWhatsappStatus === 'error'
                        ? '📲 Tentar novamente'
                        : `📲 Receber todos no WhatsApp (${packPortraits.filter(Boolean).length}/${packTotal})`}
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── DEV ONLY: simulador de pós-pagamento ── */}
      {import.meta.env.DEV && (
        <div className="fixed bottom-4 left-4 z-[999] flex flex-col gap-2">
          <button
            onClick={() => {
              const total = 3;
              const remaining = total - 1;
              setPackCredits(remaining); setPackTotal(total);
              savePackCredits(remaining, total, '11999999999');
              setPackPortraits([generatedImage ?? 'https://picsum.photos/seed/r1/400/400', null, null]);
              setPackRegens([0, 0, 0]);
              setPackScreenOpen(true);
            }}
            className="px-3 py-2 rounded-lg text-xs font-bold text-white shadow-lg"
            style={{ background: '#7c3aed' }}
          >
            🧪 Pack 3
          </button>
          <button
            onClick={() => {
              const total = 6;
              const remaining = total - 1;
              setPackCredits(remaining); setPackTotal(total);
              savePackCredits(remaining, total, '11999999999');
              setPackPortraits([generatedImage ?? 'https://picsum.photos/seed/r1/400/400', null, null, null, null, null]);
              setPackRegens([0, 0, 0, 0, 0, 0]);
              setPackScreenOpen(true);
            }}
            className="px-3 py-2 rounded-lg text-xs font-bold text-white shadow-lg"
            style={{ background: '#7c3aed' }}
          >
            🧪 Pack 6
          </button>
          <button
            onClick={() => { setPackCredits(0); setPackTotal(0); setPackPortraits([]); setPackScreenOpen(false); setActivePackSlot(null); localStorage.removeItem('retravium_pack'); }}
            className="px-3 py-2 rounded-lg text-xs font-bold text-white shadow-lg"
            style={{ background: '#dc2626' }}
          >
            🗑 Reset
          </button>
        </div>
      )}
    </div>
  );
}
