import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Check, ChevronDown, Star, X, Plus, User, ChevronRight } from 'lucide-react';
import { useCreateOrder } from '@/hooks/use-orders';
import { cn } from '@/lib/utils';
import { useDropzone } from 'react-dropzone';

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
    title: '2 Pessoas',
    slots: 2,
    roles: ['Pessoa 1', 'Pessoa 2'],
    molds: [
      { id: '2p_1', label: 'Em breve' },
      { id: '2p_2', label: 'Em breve' },
      { id: '2p_3', label: 'Em breve' },
    ],
  },
  {
    title: '3 Pessoas',
    slots: 3,
    roles: ['Pessoa 1', 'Pessoa 2', 'Pessoa 3'],
    molds: [
      { id: '3p_1', label: 'Em breve' },
      { id: '3p_2', label: 'Em breve' },
      { id: '3p_3', label: 'Em breve' },
    ],
  },
  {
    title: '4 Pessoas',
    slots: 4,
    roles: ['Pessoa 1', 'Pessoa 2', 'Pessoa 3', 'Pessoa 4'],
    molds: [
      { id: '4p_1', label: 'Em breve' },
      { id: '4p_2', label: 'Em breve' },
      { id: '4p_3', label: 'Em breve' },
    ],
  },
  {
    title: '1 Pessoa + Pet',
    slots: 2,
    roles: ['Pessoa', 'Pet'],
    molds: [
      { id: 'pet_1', label: 'Em breve' },
      { id: 'pet_2', label: 'Em breve' },
      { id: 'pet_3', label: 'Em breve' },
    ],
  },
];

interface FaceSlot {
  role: string;
  file: File | null;
  preview: string | null;
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
    <div className="flex flex-col items-center gap-2">
      {slot.preview ? (
        <div className="relative w-20 h-20 md:w-24 md:h-24 rounded-full overflow-visible group">
          <img
            src={slot.preview}
            alt={slot.role}
            className="w-full h-full object-cover rounded-full"
            data-testid={`img-face-${slot.role}`}
          />
          <button
            onClick={onRemove}
            data-testid={`button-remove-face-${slot.role}`}
            className="absolute -top-1 -right-1 bg-white/20 backdrop-blur-md text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity z-10"
            aria-label="Remover foto"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      ) : (
        <div
          {...getRootProps()}
          data-testid={`upload-face-${slot.role}`}
          className={cn(
            "w-20 h-20 md:w-24 md:h-24 rounded-full border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-colors",
            isDragActive ? "border-accent bg-accent/10" : "border-white/30 hover:border-white/60"
          )}
        >
          <input {...getInputProps()} />
          <Plus className="w-6 h-6 text-white/50" />
        </div>
      )}
    </div>
  );
}

export default function Home() {
  const [openStyleId, setOpenStyleId] = useState<string | null>(null);
  const [selectedSubStyle, setSelectedSubStyle] = useState<'classico' | 'intimo'>('classico');
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [faceSlots, setFaceSlots] = useState<FaceSlot[]>([]);
  const [finish, setFinish] = useState<'bw' | 'color'>('bw');
  const createOrder = useCreateOrder();

  const openMold = openStyleId
    ? CATEGORIES.flatMap(c => c.molds.map(m => ({ ...m, categoryTitle: c.title, slots: c.slots, roles: c.roles }))).find(m => m.id === openStyleId) || null
    : null;

  const handleOpenStyle = (moldId: string, category: typeof CATEGORIES[number]) => {
    setFaceSlots(category.roles.map(role => ({ role, file: null, preview: null })));
    setOpenStyleId(moldId);
    setSelectedSubStyle('classico');
  };

  const handleCloseModal = () => {
    faceSlots.forEach(s => { if (s.preview) URL.revokeObjectURL(s.preview); });
    setOpenStyleId(null);
    setFaceSlots([]);
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
        <div className="flex items-center gap-2 text-primary">
          <Camera className="w-6 h-6" />
          <span className="font-serif text-xl font-semibold tracking-wider">LUMINA</span>
        </div>
        <nav className="hidden md:flex gap-8 text-sm font-medium tracking-wide text-foreground/80">
          <a href="#como-funciona" data-testid="link-como-funciona" className="hover-elevate">Como Funciona</a>
          <a href="#galeria" data-testid="link-galeria" className="hover-elevate">Galeria</a>
          <a href="#contato" data-testid="link-contato" className="hover-elevate">Contato</a>
        </nav>
      </header>

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
            Prévia gratuita, sem pagamento prévio.
          </motion.p>
        </section>

        <section className="py-12 bg-white border-y border-border/50">
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
                    <div key={category.title} className="relative group">
                      <h3 className="font-serif text-xl text-primary mb-4">{category.title}</h3>
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
                            if (dragged) {
                              el.addEventListener('click', (ev) => ev.stopPropagation(), { once: true, capture: true });
                            }
                          };
                          document.addEventListener('mousemove', onMove);
                          document.addEventListener('mouseup', onUp);
                        }}
                      >
                        {category.molds.map((mold) => (
                          <button
                            key={mold.id}
                            data-testid={`button-style-${mold.id}`}
                            onClick={() => handleOpenStyle(mold.id, category)}
                            className="group flex-shrink-0 w-[160px] md:w-[180px] flex flex-col text-left hover-elevate active-elevate-2"
                          >
                            <div className="w-full aspect-[3/4] bg-primary rounded-sm shadow-xl relative overflow-hidden mb-3">
                              <div className="absolute inset-4 border border-white/10 flex items-center justify-center">
                                <Camera className="w-6 h-6 text-white/20" />
                              </div>
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
                          if (container) {
                            container.scrollBy({ left: 200, behavior: 'smooth' });
                          }
                        }}
                        className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/20 backdrop-blur-md text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
              </motion.div>

            </motion.div>
          </div>
        </section>

        <section className="py-20 bg-background">
          <div className="max-w-4xl mx-auto px-4 text-center flex flex-col items-center">
            <div className="flex gap-1 text-accent mb-6">
              {[1, 2, 3, 4, 5].map(i => (
                <Star key={i} className="w-6 h-6 fill-current" />
              ))}
            </div>
            <h3 className="text-2xl md:text-3xl font-serif text-primary mb-4" data-testid="text-social-proof">
              "Mais de 10.000 famílias confiam na Lumina para eternizar seus momentos."
            </h3>
            <p className="text-muted-foreground font-sans tracking-wide uppercase text-xs font-semibold">
              Avaliação de 4.9/5 no Trustpilot
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

      <footer className="border-t border-border/50 py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 text-primary opacity-80">
            <Camera className="w-5 h-5" />
            <span className="font-serif text-lg font-semibold tracking-wider">LUMINA</span>
          </div>
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Lumina Studios. Todos os direitos reservados.
          </p>
          <a href="mailto:suporte@lumina.com" data-testid="link-support-email" className="text-sm text-muted-foreground hover-elevate">
            suporte@lumina.com
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
            className="fixed inset-0 z-50 flex flex-col bg-black/95"
            onClick={handleCloseModal}
            data-testid="modal-style-overlay"
          >
            <div
              className="relative flex-1 flex flex-col"
              onClick={(e) => e.stopPropagation()}
              data-testid="modal-style-content"
            >
              <button
                onClick={handleCloseModal}
                data-testid="button-close-modal"
                className="absolute top-4 right-4 z-20 bg-white/10 backdrop-blur-md text-white rounded-full p-2 hover-elevate active-elevate-2"
                aria-label="Fechar"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex-1 relative bg-primary overflow-hidden group/modal">
                <div className="absolute inset-0 flex transition-transform duration-500 ease-in-out" style={{ transform: `translateX(${selectedSubStyle === 'classico' ? '0%' : '-100%'})` }}>
                  {/* Classico View */}
                  <div className="min-w-full h-full relative border-r border-white/5">
                    <div className="absolute inset-8 border border-white/10 flex items-center justify-center">
                      <Camera className="w-16 h-16 text-white/10" />
                    </div>
                  </div>
                  {/* Intimo View */}
                  <div className="min-w-full h-full relative">
                    <div className="absolute inset-8 border border-white/10 flex items-center justify-center bg-white/5">
                      <Star className="w-16 h-16 text-white/10" />
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => setSelectedSubStyle(prev => prev === 'classico' ? 'intimo' : 'classico')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-white/20 backdrop-blur-md text-white rounded-full p-2 hover:bg-white/30 transition-all shadow-lg"
                >
                  <ChevronRight className={cn("w-6 h-6 transition-transform duration-500", selectedSubStyle === 'intimo' && "rotate-180")} />
                </button>

                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent pt-24 pb-6 px-6">
                  <div className="mb-6 text-center">
                    <span className="text-white font-serif text-2xl md:text-3xl block">{openMold.categoryTitle}</span>
                    <span className="text-white/60 text-sm mt-1 uppercase tracking-widest">
                      {selectedSubStyle === 'classico' ? 'Retrato Clássico' : 'Retrato Íntimo'}
                    </span>
                  </div>

                  <p className="text-white/70 text-xs text-center mb-4 font-medium tracking-wide leading-relaxed">
                    Envie uma foto do grupo ou uma foto separada de cada pessoa.
                  </p>
                  <div className="flex justify-center gap-4 md:gap-6 flex-wrap">
                    {faceSlots.map((slot, index) => (
                      <FaceUploadSlot
                        key={slot.role}
                        slot={slot}
                        onUpload={(file) => handleFaceUpload(index, file)}
                        onRemove={() => handleFaceRemove(index)}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="shrink-0 px-4 py-5 flex flex-col items-center bg-black">
                <button
                  disabled={!hasAtLeastOnePhoto || createOrder.isPending}
                  onClick={handleSubmit}
                  data-testid="button-submit-order"
                  className={cn(
                    "w-full max-w-md py-4 bg-white text-primary font-sans font-semibold tracking-widest uppercase text-sm rounded-sm hover-elevate active-elevate-2",
                    hasAtLeastOnePhoto && !createOrder.isPending
                      ? "cursor-pointer"
                      : "opacity-40 cursor-not-allowed"
                  )}
                >
                  {createOrder.isPending ? "Processando..." : "Gerar Meu Retrato"}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
