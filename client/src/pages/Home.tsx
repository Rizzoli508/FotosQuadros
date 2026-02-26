import { useState } from 'react';
import { motion } from 'framer-motion';
import { Camera, Check, Star } from 'lucide-react';
import { useCreateOrder } from '@/hooks/use-orders';
import { cn } from '@/lib/utils';

const STYLES = [
  { id: 'casal', label: 'Casal', desc: 'A essência de vocês.' },
  { id: 'casal_1f', label: 'Casal + 1 Filho', desc: 'Três corações.' },
  { id: 'casal_2f', label: 'Casal + 2 Filhos', desc: 'Laços eternos.' },
  { id: 'fam_4', label: 'Família de 4', desc: 'Conexão profunda.' },
  { id: 'fam_5', label: 'Família de 5', desc: 'Amor multiplicado.' },
];

export default function Home() {
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
  const [finish, setFinish] = useState<'bw' | 'color'>('bw');
  const createOrder = useCreateOrder();

  const canSubmit = selectedStyle !== null;

  const handleSubmit = () => {
    if (!canSubmit) return;
    
    createOrder.mutate({
      style: selectedStyle,
      finish,
      photos: []
    });
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const fadeUp = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      {/* Header */}
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
        {/* Hero Section */}
        <section className="pt-16 pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex flex-col items-center text-center">
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
            className="text-5xl md:text-7xl lg:text-8xl font-serif text-primary text-balance leading-tight max-w-5xl"
          >
            Sua Família, <span className="italic text-accent">Imortalizada.</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mt-8 text-lg md:text-xl text-foreground/70 max-w-2xl font-light leading-relaxed"
          >
            Envie suas fotos, escolha seu estilo, receba um retrato atemporal. 
            <span className="block mt-2 font-serif italic text-foreground/90">Prévia gratuita, sem cartão de crédito.</span>
          </motion.p>
        </section>

        {/* Builder Section */}
        <section className="py-24 bg-white border-y border-border/50">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div 
              variants={staggerContainer}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-100px" }}
              className="space-y-24"
            >
              
              {/* Step 1: Style */}
              <motion.div variants={fadeUp} className="space-y-8">
                <div className="border-b border-border pb-4">
                  <span className="text-accent font-serif text-xl italic">01.</span>
                  <h2 className="text-3xl font-serif text-primary mt-1">Escolher Estilo</h2>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  {STYLES.map((style) => (
                    <button
                      key={style.id}
                      data-testid={`button-style-${style.id}`}
                      onClick={() => setSelectedStyle(style.id)}
                      className="group flex flex-col text-left hover-elevate active-elevate-2"
                    >
                      <div className={cn(
                        "w-full aspect-[3/4] bg-primary rounded-sm shadow-xl relative overflow-hidden mb-4 transition-all duration-300",
                        selectedStyle === style.id ? "ring-2 ring-accent ring-offset-4 ring-offset-white" : "opacity-90"
                      )}>
                        {/* Placeholder graphic simulating the art product */}
                        <div className="absolute inset-4 border border-white/10 flex items-center justify-center">
                          <Camera className="w-6 h-6 text-white/20" />
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-4">
                          <span className="text-white font-serif text-sm opacity-80">{style.label}</span>
                        </div>
                        {selectedStyle === style.id && (
                          <div className="absolute top-3 right-3 bg-accent text-white rounded-full p-1">
                            <Check className="w-3 h-3" />
                          </div>
                        )}
                      </div>
                      <span className="font-semibold text-sm text-primary">{style.label}</span>
                      <span className="text-xs text-muted-foreground mt-1">{style.desc}</span>
                    </button>
                  ))}
                </div>
              </motion.div>

              {/* Step 2: Finish */}
              <motion.div variants={fadeUp} className="space-y-8">
                <div className="border-b border-border pb-4">
                  <span className="text-accent font-serif text-xl italic">02.</span>
                  <h2 className="text-3xl font-serif text-primary mt-1">Acabamento</h2>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={() => setFinish('bw')}
                    data-testid="button-finish-bw"
                    className={cn(
                      "flex-1 py-6 px-6 flex items-center justify-between border rounded-sm hover-elevate active-elevate-2",
                      finish === 'bw' 
                        ? "border-accent shadow-sm" 
                        : "border-border bg-white"
                    )}
                  >
                    <div className="text-left">
                      <span className="block font-serif text-lg text-primary">Preto e Branco</span>
                      <span className="block text-sm text-muted-foreground mt-1">Clássico, atemporal e elegante.</span>
                    </div>
                    <div className={cn(
                      "w-5 h-5 rounded-full border flex items-center justify-center",
                      finish === 'bw' ? "border-accent" : "border-border"
                    )}>
                      {finish === 'bw' && <div className="w-3 h-3 rounded-full bg-accent" />}
                    </div>
                  </button>
                  
                  <button
                    onClick={() => setFinish('color')}
                    data-testid="button-finish-color"
                    className={cn(
                      "flex-1 py-6 px-6 flex items-center justify-between border rounded-sm hover-elevate active-elevate-2",
                      finish === 'color' 
                        ? "border-accent shadow-sm" 
                        : "border-border bg-white"
                    )}
                  >
                    <div className="text-left">
                      <span className="block font-serif text-lg text-primary">Colorido</span>
                      <span className="block text-sm text-muted-foreground mt-1">Vibrante, quente e contemporâneo.</span>
                    </div>
                    <div className={cn(
                      "w-5 h-5 rounded-full border flex items-center justify-center",
                      finish === 'color' ? "border-accent" : "border-border"
                    )}>
                      {finish === 'color' && <div className="w-3 h-3 rounded-full bg-accent" />}
                    </div>
                  </button>
                </div>
              </motion.div>

              {/* Submit CTA */}
              <motion.div variants={fadeUp} className="pt-12 flex flex-col items-center border-t border-border">
                <button
                  disabled={!canSubmit || createOrder.isPending}
                  onClick={handleSubmit}
                  data-testid="button-submit-order"
                  className={cn(
                    "px-12 py-5 bg-primary text-primary-foreground font-sans font-semibold tracking-widest uppercase text-sm rounded-sm shadow-xl hover-elevate active-elevate-2",
                    canSubmit && !createOrder.isPending
                      ? "cursor-pointer"
                      : "opacity-50 cursor-not-allowed shadow-none"
                  )}
                >
                  {createOrder.isPending ? "Processando..." : "Gerar Meu Retrato"}
                </button>
                
                {!canSubmit && (
                  <p className="text-sm text-muted-foreground mt-4 text-center" data-testid="text-submit-hint">
                    Escolha um estilo para continuar.
                  </p>
                )}
              </motion.div>

            </motion.div>
          </div>
        </section>

        {/* Social Proof */}
        <section className="py-20 bg-background">
          <div className="max-w-4xl mx-auto px-4 text-center flex flex-col items-center">
            <div className="flex gap-1 text-accent mb-6">
              {[1, 2, 3, 4, 5].map(i => (
                <Star key={i} className="w-6 h-6 fill-current" />
              ))}
            </div>
            <h3 className="text-2xl md:text-3xl font-serif text-primary mb-4">
              "Mais de 10.000 famílias confiam na Lumina para eternizar seus momentos."
            </h3>
            <p className="text-muted-foreground font-sans tracking-wide uppercase text-xs font-semibold">
              Avaliação de 4.9/5 no Trustpilot
            </p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 text-primary opacity-80">
            <Camera className="w-5 h-5" />
            <span className="font-serif text-lg font-semibold tracking-wider">LUMINA</span>
          </div>
          
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Lumina Studios. Todos os direitos reservados.
          </p>
          
          <a href="mailto:suporte@lumina.com" className="text-sm text-muted-foreground hover:text-primary transition-colors">
            suporte@lumina.com
          </a>
        </div>
      </footer>
    </div>
  );
}
