import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Check, Star, X, Plus, User } from 'lucide-react';
import { useCreateOrder } from '@/hooks/use-orders';
import { cn } from '@/lib/utils';
import { useDropzone } from 'react-dropzone';

const STYLES = [
  { id: 'casal', label: 'Casal', desc: 'A essência de vocês.', slots: 2, roles: ['Pessoa 1', 'Pessoa 2'] },
  { id: 'casal_1f', label: 'Casal + 1 Filho', desc: 'Três corações.', slots: 3, roles: ['Pessoa 1', 'Pessoa 2', 'Filho 1'] },
  { id: 'casal_2f', label: 'Casal + 2 Filhos', desc: 'Laços eternos.', slots: 4, roles: ['Pessoa 1', 'Pessoa 2', 'Filho 1', 'Filho 2'] },
  { id: 'fam_4', label: 'Família de 4', desc: 'Conexão profunda.', slots: 4, roles: ['Pessoa 1', 'Pessoa 2', 'Pessoa 3', 'Pessoa 4'] },
  { id: 'fam_5', label: 'Família de 5', desc: 'Amor multiplicado.', slots: 5, roles: ['Pessoa 1', 'Pessoa 2', 'Pessoa 3', 'Pessoa 4', 'Pessoa 5'] },
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
  const [faceSlots, setFaceSlots] = useState<FaceSlot[]>([]);
  const [finish, setFinish] = useState<'bw' | 'color'>('bw');
  const createOrder = useCreateOrder();

  const openStyle = STYLES.find(s => s.id === openStyleId) || null;

  const handleOpenStyle = (styleId: string) => {
    const style = STYLES.find(s => s.id === styleId);
    if (!style) return;
    setFaceSlots(style.roles.map(role => ({ role, file: null, preview: null })));
    setOpenStyleId(styleId);
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
      style: openStyleId,
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
            O Presente Perfeito
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
                  <span className="text-accent font-serif text-xl italic">01.</span>
                  <h2 className="text-3xl font-serif text-primary mt-1">Escolher Estilo</h2>
                  <p className="text-sm text-muted-foreground mt-2">Clique em um estilo para começar.</p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  {STYLES.map((style) => (
                    <button
                      key={style.id}
                      data-testid={`button-style-${style.id}`}
                      onClick={() => handleOpenStyle(style.id)}
                      className="group flex flex-col text-left hover-elevate active-elevate-2"
                    >
                      <div className="w-full aspect-[3/4] bg-primary rounded-sm shadow-xl relative overflow-hidden mb-4">
                        <div className="absolute inset-4 border border-white/10 flex items-center justify-center">
                          <Camera className="w-6 h-6 text-white/20" />
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-4">
                          <span className="text-white font-serif text-sm opacity-80">{style.label}</span>
                        </div>
                        <div className="absolute bottom-12 left-0 right-0 flex justify-center gap-1 px-2">
                          {Array.from({ length: style.slots }).map((_, i) => (
                            <div key={i} className="w-4 h-4 rounded-full border border-white/30 flex items-center justify-center">
                              <User className="w-2.5 h-2.5 text-white/30" />
                            </div>
                          ))}
                        </div>
                      </div>
                      <span className="font-semibold text-sm text-primary">{style.label}</span>
                      <span className="text-xs text-muted-foreground mt-1">{style.desc}</span>
                    </button>
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
        {openStyle && (
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

              <div className="flex-1 relative bg-primary">
                <div className="absolute inset-8 border border-white/10 flex items-center justify-center">
                  <Camera className="w-16 h-16 text-white/10" />
                </div>

                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent pt-24 pb-6 px-6">
                  <div className="mb-6">
                    <span className="text-white font-serif text-2xl md:text-3xl">{openStyle.label}</span>
                    <span className="block text-white/60 text-sm mt-1">{openStyle.desc}</span>
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
