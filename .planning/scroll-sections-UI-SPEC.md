---
status: draft
phase: scroll-sections
created: 2026-05-11
author: gsd-ui-researcher
target_file: client/src/pages/Home.tsx (inline sections after split-screen overlay)
---

# UI-SPEC — Scroll Sections Below Portrait Overlay
## retravium.com · Quote + FAQ + Footer Redesign

---

## 1. Design System State

| Token | Value | Source |
|-------|-------|--------|
| Design system | shadcn/ui + Radix | `components.json` detected |
| Styling | Tailwind CSS v3 + CSS custom props | `tailwind.config.ts` |
| Motion | Framer Motion 11.18.2 | `package.json` |
| Font — serif | Playfair Display (400, 400i, 500, 500i, 600, 700) | `index.css` Google Fonts import |
| Font — sans | Inter (300, 400, 500, 600) | `index.css` Google Fonts import |
| Icon library | lucide-react 0.453 | `package.json` |

**No new npm packages permitted.** All animation via `framer-motion` APIs already available:
`motion`, `useInView`, `useScroll`, `useTransform`, `AnimatePresence`, `whileInView`.

---

## 2. Color Contract

| Role | Hex | CSS var / usage |
|------|-----|----------------|
| Surface — dominant (60%) | `#faf8f4` | `--background` / page base |
| Surface — secondary (30%) | `#ffffff` | Section alternation; card backgrounds |
| Accent — gold (10%) | `#C9A96E` | Brand touches ONLY: quote highlight word, decorative lines, logo text, footer dividers, label dots |
| Text — primary | `#2d2620` | All headings, quote body |
| Text — muted | `rgba(45,38,32,0.45)` | Labels, body copy, footer sub-copy |
| Border — warm | `rgba(45,38,32,0.10)` | Dividers, separator lines, FAQ row borders |
| Accent — destructive | not used in these sections | — |

**Gold is reserved for:** the word "ficam." in the quote, the thin decorative lines flanking section labels, the logo wordmark in the footer, horizontal footer dividers, and the FAQ left-column WhatsApp contact link (`Falar no WhatsApp ↗`). Nowhere else.

---

## 3. Spacing System

8-point scale. All spacing values are multiples of 4px.

| Token | Value | Usage |
|-------|-------|-------|
| `4px` | `1` | Inline micro-gaps |
| `8px` | `2` | Label-to-content gap |
| `16px` | `4` | Tight internal padding |
| `24px` | `6` | Component internal padding |
| `32px` | `8` | Between content blocks |
| `48px` | `12` | Section internal vertical padding (mobile) |
| `64px` | `16` | Column gap (desktop) |
| `96px` | `24` | Section vertical padding (desktop) |
| `128px` | `32` | Hero quote section padding (desktop) |
| `160px` | `40` | Quote section min-height buffer |

Touch targets: minimum 44px height for all interactive FAQ row buttons.

---

## 4. Typography Scale

7 sizes, 2 weights.

| Role | Size (mobile → desktop) | Family | Weight | Line-height | Letter-spacing |
|------|--------------------------|--------|--------|-------------|----------------|
| Quote headline | `text-5xl` → `text-7xl` → `text-[5.5rem]` | `font-serif` italic | 400 | `leading-[1.08]` | default |
| Section headline | `text-4xl` → `text-5xl` | `font-serif` italic | 400 | `leading-tight` (1.25) | default |
| FAQ question | `text-base md:text-lg` (16px → 18px) | `font-serif` | 400 | `leading-tight` | default |
| Body | `text-sm` → `text-base` | `font-sans` | 300 (`font-light`) | `leading-relaxed` (1.625) | default |
| Label | `text-[10px]` fixed | `font-sans` | 400 | — | `tracking-[0.3em]` uppercase |
| Sub-label | `text-[9px]` fixed | `font-sans` | 400 | — | `tracking-[0.35em]`–`tracking-[0.4em]` uppercase |
| Footer wordmark | `clamp(2.5rem, 6vw, 5rem)` fluid | `font-serif` italic | 400 | `1` | `0.06em` |

**Sub-label (`text-[9px]`)** is used for: Quote top decorator (`✦ retravium`), Footer tagline (`por amor ao detalhe`), Footer legal bar copyright text.

**FAQ question (`text-base md:text-lg`)** is used exclusively for accordion question rows in the right column.

**Footer wordmark (`clamp(2.5rem, 6vw, 5rem)`)** is rendered via inline style — Tailwind has no built-in clamp utility. See implementation note 8.

---

## 5. Section-by-Section Design Contract

---

### 5.1 Quote Section

**Purpose:** Cinematic pause between the product experience and the FAQ. The quote must feel like entering a different world — a single thought that fills the viewport.

#### Layout

- Background: `#faf8f4` (cream, not white — creates a warm atmosphere shift)
- Section tag: `<section>`, full-width, no max-width constraint on the background
- Content container: `max-w-4xl mx-auto px-6 md:px-12`
- Vertical padding: `py-32 md:py-48` (128px mobile, 192px desktop)
- Layout direction: vertical, centered, `text-center`
- No side-by-side columns. Quote stands alone, full attention.

#### Decorative Elements

Top separator (entry):
```
<div class="flex items-center gap-6 justify-center mb-12 md:mb-16">
  <div class="h-px flex-1 max-w-[80px]" style="background: rgba(201,169,110,0.4)" />
  <span class="text-[9px] tracking-[0.35em] uppercase font-sans"
        style="color: rgba(45,38,32,0.4)">
    ✦ retravium
  </span>
  <div class="h-px flex-1 max-w-[80px]" style="background: rgba(201,169,110,0.4)" />
</div>
```

Bottom attribution (after quote):
```
<p class="text-[10px] tracking-[0.3em] uppercase font-sans mt-10 md:mt-14"
   style="color: rgba(45,38,32,0.35)">
  IA · Arte · Memória
</p>
```

#### Quote Typography

```tsx
<blockquote class="font-serif text-5xl md:text-7xl lg:text-[5.5rem] italic leading-[1.08] text-[#2d2620]">
  "Momentos passam.<br />
  <span style="color: #C9A96E">Retratos ficam.</span>"
</blockquote>
```

Line break must be explicit (`<br />`) on both mobile and desktop — the quote is two thoughts, each on its own line, never wrapping mid-phrase.

#### Framer Motion — Quote Section

**Strategy:** `useScroll` + `useTransform` for a subtle vertical parallax on the text block. `whileInView` staggered reveal for the label, the decorative lines, and the quote lines individually.

**Scroll parallax (wraps the entire blockquote):**
```tsx
// In component:
const quoteRef = useRef(null);
const { scrollYProgress } = useScroll({
  target: quoteRef,
  offset: ["start end", "end start"]
});
const quoteY = useTransform(scrollYProgress, [0, 1], [40, -40]);
const quoteOpacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);

// On element:
<motion.div ref={quoteRef} style={{ y: quoteY, opacity: quoteOpacity }}>
```

**Staggered reveal (whileInView):**
```tsx
const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.15, delayChildren: 0.1 }
  }
};

const lineVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1] }
  }
};
```

**Label (top decorator) reveal:**
```tsx
// Separate motion.div, triggers before quote
initial={{ opacity: 0, scaleX: 0.6 }}
whileInView={{ opacity: 1, scaleX: 1 }}
transition={{ duration: 0.8, ease: "easeOut" }}
viewport={{ once: true, margin: "-80px" }}
```

**Each line of the blockquote:**
Wrap each line of the quote in its own `motion.span` with `display: block` and the `lineVariants`. This produces a cinematic line-by-line reveal:
- Line 1: `"Momentos passam."` — delay 0
- Line 2: `"Retratos ficam."` — delay 0.15 (via stagger)

**Viewport threshold:** `{ once: true, amount: 0.4 }` — triggers when 40% of the section is visible.

---

### 5.2 FAQ Section

**Purpose:** Editorial magazine-style. Feels authoritative and calm. The left column anchors with a large italic headline; the right column is a refined accordion.

#### Layout

- Background: `#ffffff`
- Top separator: `border-t` using `rgba(45,38,32,0.10)` 
- Content container: `max-w-5xl mx-auto px-6 md:px-12`
- Vertical padding: `py-24 md:py-36`
- Desktop layout: `flex-row`, left column fixed `w-72`, right column `flex-1`
- Mobile layout: `flex-col`, left column above right column, `gap-12`
- Left/right gap: `gap-16 md:gap-24`

#### Left Column

```tsx
<div class="flex-shrink-0 md:w-72">
  // Label
  <p class="text-[10px] tracking-[0.3em] uppercase font-sans mb-3"
     style="color: rgba(45,38,32,0.4)">
    Perguntas Frequentes
  </p>

  // Gold accent bar above headline
  <div class="h-px w-8 mb-5" style="background: #C9A96E" />

  // Headline
  <h3 class="font-serif text-4xl md:text-5xl italic leading-tight"
      style="color: #2d2620">
    Dúvidas,<br />respondidas.
  </h3>

  // Supporting body copy
  <p class="text-sm font-light leading-relaxed mt-6"
     style="color: rgba(45,38,32,0.55)">
    As perguntas mais comuns antes do primeiro retrato. Se precisar de mais, respondemos em minutos.
  </p>

  // Contact nudge
  <a href="https://wa.me/5500000000000"  // replace with real number
     class="inline-flex items-center gap-2 mt-8 text-[10px] tracking-[0.25em] uppercase font-sans
            transition-opacity duration-300 hover:opacity-60"
     style="color: #C9A96E">
    Falar no WhatsApp ↗
  </a>
</div>
```

#### Right Column — Accordion

Each FAQ item row:
- `min-h-[44px]` on the button to meet touch target requirement
- Border: `border-b` with `rgba(45,38,32,0.10)`
- First item: also `border-t` with `rgba(45,38,32,0.10)`
- Hover state on button: `hover:opacity-70 transition-opacity duration-200`

Question text: `font-serif text-base md:text-lg` weight 400, color `#2d2620`
Answer text: `font-sans text-sm font-light leading-relaxed`, color `rgba(45,38,32,0.55)`

ChevronDown icon: `w-4 h-4`, color `rgba(45,38,32,0.4)`, rotates `180deg` when open.

Expand/collapse animation (existing Framer Motion pattern, refined):
```tsx
<motion.div
  initial={{ height: 0, opacity: 0 }}
  animate={{ height: "auto", opacity: 1 }}
  exit={{ height: 0, opacity: 0 }}
  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
  className="overflow-hidden"
>
  <p class="pb-6 pt-1 font-sans text-sm font-light leading-relaxed"
     style="color: rgba(45,38,32,0.55)">
    {answer}
  </p>
</motion.div>
```

#### Framer Motion — FAQ Section

**Left column reveal:**
```tsx
<motion.div
  initial={{ opacity: 0, x: -32 }}
  whileInView={{ opacity: 1, x: 0 }}
  transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
  viewport={{ once: true, amount: 0.3 }}
>
```

**Right column (accordion list) — staggered row reveals:**
```tsx
const faqContainerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.07, delayChildren: 0.2 }
  }
};

const faqRowVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] }
  }
};

// Usage:
<motion.div
  variants={faqContainerVariants}
  initial="hidden"
  whileInView="visible"
  viewport={{ once: true, amount: 0.2 }}
  class="flex-1 divide-y"
  style={{ borderColor: 'rgba(45,38,32,0.10)' }}
>
  {FAQ.map((item, i) => (
    <motion.div key={i} variants={faqRowVariants}>
      {/* accordion item */}
    </motion.div>
  ))}
</motion.div>
```

**Gold accent bar reveal on left:**
```tsx
<motion.div
  class="h-px w-8 mb-5"
  style={{ background: '#C9A96E' }}
  initial={{ scaleX: 0, originX: 0 }}
  whileInView={{ scaleX: 1 }}
  transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
  viewport={{ once: true }}
/>
```

---

### 5.3 Footer

**Purpose:** Brand closing moment. Intimate, warm, unhurried. The last thing the user sees should feel like a quiet exhale — not a navigation dump.

#### Layout

- Background: `#faf8f4` (back to cream — creates a warm bookend with the quote section)
- No border-top at the footer container level; use an internal spacer instead
- Structure: three stacked zones

**Zone 1 — Brand centerpiece:**
```
py-20 md:py-28, border-b rgba(45,38,32,0.10)
```

**Zone 2 — Info grid:**
```
py-14, max-w-5xl mx-auto px-6 md:px-12
grid grid-cols-1 md:grid-cols-3 gap-10
```

**Zone 3 — Legal bar:**
```
border-t rgba(45,38,32,0.10), py-6 px-6
```

#### Zone 1 — Brand Centerpiece

```tsx
<div class="text-center py-20 md:py-28 border-b" style="border-color: rgba(45,38,32,0.10)">

  // Top thin line
  <div class="flex items-center justify-center gap-5 mb-10">
    <div class="h-px flex-1 max-w-[120px]" style="background: rgba(201,169,110,0.3)" />
    <div class="w-1.5 h-1.5 rounded-full" style="background: #C9A96E; opacity: 0.5" />
    <div class="h-px flex-1 max-w-[120px]" style="background: rgba(201,169,110,0.3)" />
  </div>

  // Wordmark
  <span class="font-serif italic block"
        style="color: #C9A96E; letter-spacing: 0.06em; font-weight: 400;
               font-size: clamp(2.5rem, 6vw, 5rem); line-height: 1">
    retravium
  </span>

  // Tagline
  <div class="flex items-center justify-center gap-4 mt-5">
    <div class="h-px w-12" style="background: rgba(45,38,32,0.12)" />
    <span class="text-[9px] tracking-[0.4em] uppercase font-sans"
          style="color: rgba(45,38,32,0.38)">
      por amor ao detalhe
    </span>
    <div class="h-px w-12" style="background: rgba(45,38,32,0.12)" />
  </div>

</div>
```

Wordmark uses `clamp(2.5rem, 6vw, 5rem)` — scales fluidly from 40px on mobile to 80px on large desktop without breakpoint jumps.

#### Zone 2 — Info Grid

Three columns. Column labels use label style (10px, 0.25em tracking, uppercase, muted).

**Column 1 — Suporte:**
```
Label: "Suporte"
Link: suporte@retravium.com
      font-sans text-sm, color #2d2620, hover:text-[#C9A96E] transition-colors duration-200
```

**Column 2 — Sobre:**
```
Label: "Sobre a retravium"
Body:  "Retratos artísticos gerados por IA, entregues no seu WhatsApp em minutos.
        Feito com cuidado para cada família."
       font-sans text-sm font-light leading-relaxed, color rgba(45,38,32,0.55)
```

**Column 3 — Legal:**
```
Label: "Legal"
Items: "Termos de Uso" / "Política de Privacidade"
       font-sans text-sm, color rgba(45,38,32,0.55), hover:text-[#2d2620] transition-colors
       space-y-2
```

#### Zone 3 — Legal Bar

```
text-[9px] tracking-[0.2em] uppercase text-center, color rgba(45,38,32,0.35)
"© 2026 retravium · Todos os direitos reservados"
```

#### Framer Motion — Footer

**Brand zone reveal:**
```tsx
<motion.div
  initial={{ opacity: 0, y: 32 }}
  whileInView={{ opacity: 1, y: 0 }}
  transition={{ duration: 1.0, ease: [0.22, 1, 0.36, 1] }}
  viewport={{ once: true, amount: 0.4 }}
>
```

**Wordmark scale reveal (nested inside above):**
```tsx
<motion.span
  initial={{ opacity: 0, scale: 0.94 }}
  whileInView={{ opacity: 1, scale: 1 }}
  transition={{ duration: 0.9, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
  viewport={{ once: true }}
>
```

**Info grid — staggered columns:**
```tsx
const footerGridVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.1, delayChildren: 0.05 }
  }
};

const footerColVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] }
  }
};
```

**Gold decorative lines (flanking the footer wordmark):**
```tsx
// Both lines use the same reveal pattern:
initial={{ scaleX: 0 }}
whileInView={{ scaleX: 1 }}
transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
viewport={{ once: true }}
style={{ originX: "center" }}  // grows from center outward
```

---

## 6. Copywriting Contract

All copy is final. No placeholders.

### Quote Section

| Element | Copy |
|---------|------|
| Top label | `✦ retravium` |
| Quote line 1 | `"Momentos passam.` |
| Quote line 2 (gold) | `Retratos ficam."` |
| Bottom attribution | `IA · Arte · Memória` |

### FAQ Section

| Element | Copy |
|---------|------|
| Section label | `Perguntas Frequentes` |
| Headline line 1 | `Dúvidas,` |
| Headline line 2 | `respondidas.` |
| Supporting body | `As perguntas mais comuns antes do primeiro retrato. Se precisar de mais, respondemos em minutos.` |
| Contact CTA | `Falar no WhatsApp ↗` |

FAQ items (7 total — unchanged from existing data):

| # | Question | Answer |
|---|----------|--------|
| 1 | Como funciona? | Escolha a composição, anexe as fotos e gere sua prévia gratuitamente, sem cadastro ou pagamento. Nossa IA cria seu retrato em segundos. Gostou? Finalize a compra e receba seu retrato. |
| 2 | Como vou receber? | Após a confirmação do pagamento, seu retrato exclusivo chegará direto no seu WhatsApp em até 2 minutos. Caso tenha pedido o quadro impresso, ele será entregue na sua casa no prazo informado no momento da compra. |
| 3 | Que tipo de foto devo enviar? | Fotos com rosto visível e boa iluminação garantem o melhor resultado. |
| 4 | A qualidade do retrato é boa? | Sim. Nossa IA gera retratos em altíssima resolução, com detalhes refinados, cores ricas e acabamento artístico único. Cada retrato é criado especialmente para a sua família, com um nível de realismo e beleza que surpreende. |
| 5 | Como posso usar meu retrato? | Seu retrato digital pode ser usado como foto de perfil, wallpaper do celular, compartilhado com a família ou enviado como presente. E se quiser algo ainda mais especial, peça seu quadro impresso para decorar sua casa. |
| 6 | Posso pedir um quadro impresso? | Sim! Você escolhe o tamanho e o estilo da moldura. O quadro chega pronto para pendurar na sua casa. |
| 7 | E se eu não gostar? | Você pode gerar novamente gratuitamente até ficar satisfeito. |

### Footer

| Element | Copy |
|---------|------|
| Wordmark | `retravium` |
| Tagline | `por amor ao detalhe` |
| Suporte label | `Suporte` |
| Suporte link | `suporte@retravium.com` |
| Sobre label | `Sobre a retravium` |
| Sobre body | `Retratos artísticos gerados por IA, entregues no seu WhatsApp em minutos. Feito com cuidado para cada família.` |
| Legal label | `Legal` |
| Legal item 1 | `Termos de Uso` |
| Legal item 2 | `Política de Privacidade` |
| Copyright bar | `© 2026 retravium · Todos os direitos reservados` |

No empty states in these sections (no conditional data). No destructive actions.

---

## 7. Animation Summary Table

| Section | Element | Technique | Initial | Final | Duration | Ease | Trigger |
|---------|---------|-----------|---------|-------|----------|------|---------|
| Quote | Top label + lines | `whileInView` | `opacity:0, scaleX:0.6` | `opacity:1, scaleX:1` | 0.8s | easeOut | `amount:0.4, once:true` |
| Quote | Line 1 `"Momentos passam."` | `whileInView` stagger child | `opacity:0, y:24` | `opacity:1, y:0` | 0.9s | `[0.22,1,0.36,1]` | stagger 0 |
| Quote | Line 2 `"Retratos ficam."` | `whileInView` stagger child | `opacity:0, y:24` | `opacity:1, y:0` | 0.9s | `[0.22,1,0.36,1]` | stagger +0.15s |
| Quote | Attribution text | `whileInView` | `opacity:0` | `opacity:1` | 0.8s | easeOut | delay 0.4s |
| Quote | Entire blockquote block | `useScroll` parallax | `y:40` | `y:-40` | continuous | — | scroll position |
| FAQ | Left column | `whileInView` | `opacity:0, x:-32` | `opacity:1, x:0` | 0.8s | `[0.22,1,0.36,1]` | `amount:0.3, once:true` |
| FAQ | Gold bar above headline | `whileInView` | `scaleX:0` | `scaleX:1` | 0.6s | easeOut | delay 0.2s |
| FAQ | Each FAQ row | stagger child | `opacity:0, y:16` | `opacity:1, y:0` | 0.6s | `[0.22,1,0.36,1]` | stagger 0.07s each |
| FAQ | Answer expand | `AnimatePresence` | `height:0, opacity:0` | `height:auto, opacity:1` | 0.35s | `[0.22,1,0.36,1]` | click |
| Footer | Brand zone wrapper | `whileInView` | `opacity:0, y:32` | `opacity:1, y:0` | 1.0s | `[0.22,1,0.36,1]` | `amount:0.4, once:true` |
| Footer | Wordmark | nested `whileInView` | `opacity:0, scale:0.94` | `opacity:1, scale:1` | 0.9s | `[0.22,1,0.36,1]` | delay 0.15s |
| Footer | Gold line decorators | `whileInView` | `scaleX:0` | `scaleX:1` | 0.8s | easeOut | delay 0.3s, originX:center |
| Footer | Info grid columns | stagger children | `opacity:0, y:20` | `opacity:1, y:0` | 0.7s | `[0.22,1,0.36,1]` | stagger 0.1s each |

**Custom easing `[0.22, 1, 0.36, 1]`** — this is a custom cubic-bezier that produces a fast initial movement with a soft deceleration. Use consistently across all reveal animations for a unified feel.

**`once: true`** on all `viewport` configs — elements animate in once and stay visible. No re-triggering on scroll back up.

---

## 8. Mobile Behavior

| Behavior | Mobile spec |
|----------|-------------|
| Quote font size | `text-5xl` (48px) — bold enough to command the screen, not overflow |
| Quote line break | Explicit `<br />` preserved on mobile — no auto-wrap |
| Quote section padding | `py-32` (128px vertical) |
| Quote parallax | `useTransform` range reduced: `[20, -20]` instead of `[40, -40]` on mobile via `useMotionValueEvent` or a conditional. Prevents excessive movement on small screens. |
| FAQ layout | `flex-col` on mobile. Left column (label + headline + body) sits above the accordion list. |
| FAQ left col width | Full width on mobile, `md:w-72` on desktop |
| Footer wordmark size | `clamp(2.5rem, 6vw, 5rem)` — 40px minimum on mobile |
| Footer grid | `grid-cols-1` on mobile with `gap-10`. Three stacked columns. |
| Footer zone 1 padding | `py-20` (160px vertical) |
| Touch targets | All FAQ accordion buttons: `min-h-[44px]` enforced |
| WhatsApp CTA (FAQ left) | Full touch target on mobile: `py-3` added |
| Stagger delays | Unchanged — same timing on mobile. Motion is subtle enough to not feel broken. |

---

## 9. Exact Tailwind Class Reference

### Quote Section Outer

```
section: relative overflow-hidden
background: bg-[#faf8f4]
padding: py-32 md:py-48
```

### Quote Section Inner Container

```
max-w-4xl mx-auto px-6 md:px-12 text-center
```

### Quote Section Top Decorator

```
flex items-center justify-center gap-6 mb-12 md:mb-16
line: h-px flex-1 max-w-[80px]         [inline style: background rgba(201,169,110,0.4)]
dot label: text-[9px] tracking-[0.35em] uppercase font-sans
                                        [inline style: color rgba(45,38,32,0.4)]
```

### Blockquote

```
font-serif italic leading-[1.08] text-center
text-5xl md:text-7xl lg:text-[5.5rem]
                                        [inline style: color #2d2620]
gold span:                              [inline style: color #C9A96E]
```

### Attribution Label (below quote)

```
text-[10px] tracking-[0.3em] uppercase font-sans mt-10 md:mt-14
                                        [inline style: color rgba(45,38,32,0.35)]
```

### FAQ Section Outer

```
section: bg-white
padding: py-24 md:py-36
border-top: [inline style: border-top: 1px solid rgba(45,38,32,0.10)]
```

### FAQ Section Inner Container

```
max-w-5xl mx-auto px-6 md:px-12
flex flex-col md:flex-row gap-12 md:gap-24
```

### FAQ Left Column

```
flex-shrink-0 md:w-72
```

Label: `text-[10px] tracking-[0.3em] uppercase font-sans mb-3 [color rgba(45,38,32,0.4)]`

Gold bar: `h-px w-8 mb-5 [background #C9A96E]`

Headline: `font-serif text-4xl md:text-5xl italic leading-tight [color #2d2620]`

Body: `text-sm font-light leading-relaxed mt-6 [color rgba(45,38,32,0.55)]`

WhatsApp CTA: `inline-flex items-center gap-2 mt-8 text-[10px] tracking-[0.25em] uppercase font-sans transition-opacity duration-300 hover:opacity-60 py-3 [color #C9A96E]`

### FAQ Accordion List

```
flex-1 divide-y [divide-color: rgba(45,38,32,0.10)]
border-t [border-color: rgba(45,38,32,0.10)]
```

Button: `w-full flex items-center justify-between py-5 text-left min-h-[44px] hover:opacity-70 transition-opacity duration-200`

Question span: `font-serif text-base md:text-lg [color #2d2620]`

ChevronDown: `w-4 h-4 flex-shrink-0 transition-transform duration-300 [color rgba(45,38,32,0.4)] + rotate-180 when open`

Answer paragraph: `pb-6 pt-1 font-sans text-sm font-light leading-relaxed [color rgba(45,38,32,0.55)]`

### Footer Outer

```
footer: bg-[#faf8f4]
```

### Footer Zone 1 — Brand

```
text-center py-20 md:py-28 border-b [border-color: rgba(45,38,32,0.10)]
```

Top line group: `flex items-center justify-center gap-5 mb-10`

Lines: `h-px flex-1 max-w-[120px] [background rgba(201,169,110,0.3)]`

Dot: `w-1.5 h-1.5 rounded-full [background #C9A96E opacity-50]`

Wordmark: `font-serif italic block [color #C9A96E letter-spacing 0.06em font-size clamp(2.5rem,6vw,5rem) line-height 1 font-weight 400]`

Tagline group: `flex items-center justify-center gap-4 mt-5`

Tagline lines: `h-px w-12 [background rgba(45,38,32,0.12)]`

Tagline text: `text-[9px] tracking-[0.4em] uppercase font-sans [color rgba(45,38,32,0.38)]`

### Footer Zone 2 — Info Grid

```
max-w-5xl mx-auto px-6 md:px-12 py-14
grid grid-cols-1 md:grid-cols-3 gap-10
```

Column label: `text-[10px] tracking-[0.25em] uppercase font-sans mb-4 [color rgba(45,38,32,0.4)]`

Suporte link: `text-sm [color #2d2620] hover:text-[#C9A96E] transition-colors duration-200`

Sobre body: `text-sm font-light leading-relaxed [color rgba(45,38,32,0.55)]`

Legal items: `text-sm [color rgba(45,38,32,0.55)] hover:text-[#2d2620] transition-colors duration-200 space-y-2`

### Footer Zone 3 — Legal Bar

```
border-t [border-color: rgba(45,38,32,0.10)] py-6 px-6
text-[9px] tracking-[0.2em] uppercase text-center [color rgba(45,38,32,0.35)]
```

---

## 10. Implementation Notes for Executor

1. **`useRef` + `useScroll` placement:** The quote section parallax requires `useRef` on the section element and `useScroll` with `{ target: ref, offset: ["start end", "end start"] }`. Import `useRef` from React; import `useScroll`, `useTransform`, `motion` from `framer-motion`.

2. **Viewport `once: true` required everywhere.** Without it, re-triggering on scroll-up feels glitchy. Set on every `whileInView` call.

3. **Parallax range on mobile:** The `y` transform range `[40, -40]` assumes a large viewport. On mobile the section is shorter relative to the screen; reduce to `[20, -20]` by reading `window.innerWidth < 768` on initial render or using a `useWindowSize` hook already available in the project.

4. **The quote `<br />` is load-bearing:** The two-line structure of the quote is its core visual design. Never let it collapse to a single line or reflow mid-phrase. Use `<br />` not CSS — the line break is semantic to the rhythm of the sentence.

5. **Existing FAQ state (`openFaq`) is shared:** The `openFaq` state and `setOpenFaq` logic already exist in `Home.tsx`. The new FAQ section replaces the visual wrapper only; the state logic is unchanged.

6. **Two FAQ sections exist in the current file:** There is one in the main page scroll flow (lines ~922-962) and one inside the portrait overlay (lines ~1175-1213). This spec targets the one inside the overlay (`{/* ── FAQ ── */}` comment block, lines ~1175+). Clarify with the developer before editing which instance is in scope. If both need updating, apply the same spec to both.

7. **Background alternation:** Quote uses `#faf8f4`, FAQ uses `#ffffff`, Footer uses `#faf8f4`. This cream-white-cream rhythm creates a breathing cadence as the user scrolls.

8. **`clamp()` for footer wordmark:** Tailwind does not have a built-in utility for `clamp`. Use `style={{ fontSize: 'clamp(2.5rem, 6vw, 5rem)' }}` as an inline style on the wordmark `<span>`.

9. **No scroll-linked color changes.** Do not add `useTransform` on color values — color interpolation via Framer Motion adds complexity without perceptual benefit in warm palettes. Stick to `y` and `opacity` transforms only.

10. **Easing string for Tailwind transitions:** For CSS-only transitions (hover effects), use `transition-[property] duration-200` (200ms). For Framer Motion transitions, use the cubic-bezier `[0.22, 1, 0.36, 1]`.

---

## 11. Registry

| Source | Status |
|--------|--------|
| shadcn/ui official | view passed — no third-party blocks declared |
| Third-party registries | none declared |

No registry vetting gate required.

---

## 12. What Was Pre-Populated

| Source | Decisions used |
|--------|---------------|
| `index.css` | Font families (Playfair Display, Inter), CSS custom properties, `--background`, `--accent`, `--foreground` |
| `tailwind.config.ts` | Spacing scale, border-radius, font family tokens |
| `package.json` | Framer Motion 11.18.2 confirmed, lucide-react confirmed, no new packages needed |
| `Home.tsx` (existing sections) | Exact existing copy, FAQ data array, color values (`#C9A96E`, `#2d2620`, `#faf8f4`), current Tailwind classes, existing animation patterns |
| Objective prompt | Section purpose, Fable reference design direction, animation techniques required |
| User input this session | 0 questions asked — all answered by codebase scan + objective |
