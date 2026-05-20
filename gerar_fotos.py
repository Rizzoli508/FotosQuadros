#!/usr/bin/env python3
"""
gerar_fotos.py
Lê prompts COLORIDOS do PDF, envia a foto de referência + prompt ao Gemini,
salva a imagem gerada como _color.png e converte para preto e branco como _pb.png.
"""

# ── Instalação automática de dependências ──────────────────────────────────────
import subprocess, sys

def _install(pkg):
    subprocess.check_call([sys.executable, "-m", "pip", "install", pkg, "-q"],
                          stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

for _pkg in ["google-genai", "Pillow", "pymupdf"]:
    try:
        _import_name = {"google-genai": "google.genai"}.get(_pkg, _pkg.replace("-", "_").split("[")[0])
        __import__(_import_name)
    except ImportError:
        print(f"Instalando {_pkg}...")
        _install(_pkg)

# ── Imports ────────────────────────────────────────────────────────────────────
import os, io, re, unicodedata, time
import fitz                          # pymupdf
from PIL import Image
from google import genai
from google.genai import types

# ── Configurações ──────────────────────────────────────────────────────────────
API_KEY    = "AIzaSyDF-uVnDdE2bLRlS9qC0M5gNjxaiK7mx_Y"
MODEL_NAME = "gemini-3.1-flash-image-preview"
BASE_DIR   = r"C:\Users\joaov\FotosQuadros"
REFS_DIR   = os.path.join(BASE_DIR, "referencias")
OUT_DIR    = os.path.join(BASE_DIR, "geradas")
PDF_PATH   = os.path.join(REFS_DIR, "PROMPTS.pdf")

# Arquivo de referência por categoria
REF_BY_CAT = {
    "CASAL":      "CASAL.png",
    "MAEBB":      "MAEBB.png",
    "MAEFILHA":   "MAEFILHA.png",
    "PAIFILHA":   "PAIFILHA.png",
    "MAEFILHO":   "MAEFILHO.png",
    "PAIFILHO":   "PAIFILHO.png",
    "FAMILIA3":   "FAMILIA3.png",
    "FAMILIA4":   "FAMILIA4.png",
    "1PESSOADOG": "1PESSOADOG.png",
    "FAMILIA2DOG":"FAMILIA2DOG.png",
    "FAMILIA3DOG":"FAMILIA3DOG.png",
}

# ── Funções auxiliares ─────────────────────────────────────────────────────────

def normalize(text: str) -> str:
    """Remove acentos e passa para uppercase."""
    return unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode().upper().strip()


def title_to_category(title: str, section: str) -> str | None:
    """Retorna a chave de categoria (REF_BY_CAT) para um título de prompt."""
    t = normalize(title)
    s = normalize(section)

    if "CASAL" in t:
        return "CASAL"
    if "MAE" in t and "BEBE" in t:
        return "MAEBB"
    if "FILHA" in t and "MAE" in t:
        return "MAEFILHA"
    if "FILHA" in t and "PAI" in t:
        return "PAIFILHA"
    if "FILHO" in t and "MAE" in t:
        return "MAEFILHO"
    if "FILHO" in t and "PAI" in t:
        return "PAIFILHO"
    if "1 PESSOA" in t and "PET" in t:
        return "1PESSOADOG"
    if "2 PESSOAS" in t and "PET" in t:
        return "FAMILIA2DOG"
    if "3 PESSOAS" in t and "PET" in t:
        return "FAMILIA3DOG"
    if "ESTILO" in t:
        if "4" in s:
            return "FAMILIA4"
        return "FAMILIA3"
    return None


def title_to_slug(title: str, section: str) -> str:
    """Transforma o título num nome de arquivo curto e limpo."""
    t = normalize(title)
    s = normalize(section)

    replacements = {
        r"\+": "",
        r"&": "",
        r"INTIMO": "INTIMO",
        r"CLASSICO": "CLASSICO",
        r"ESTILO\s*(\d+).*": r"ESTILO\1",
        r"\s+": "_",
        r"_+": "_",
    }

    # Casos específicos
    if "CASAL" in t:
        m = re.search(r"CASAL\s*(\d+)", t)
        return f"CASAL{m.group(1)}" if m else "CASAL"
    if "MAE" in t and "BEBE" in t:
        m = re.search(r"(\d+)", t)
        return f"MAEBB{m.group(1)}" if m else "MAEBB"
    if "FILHA" in t and "MAE" in t:
        suffix = "INTIMO" if "INTIMO" in t else ("CLASSICO" if "CLASSICO" in t else "")
        return f"MAEFILHA{'_'+suffix if suffix else ''}"
    if "FILHA" in t and "PAI" in t:
        suffix = "INTIMO" if "INTIMO" in t else ("CLASSICO" if "CLASSICO" in t else "")
        return f"PAIFILHA{'_'+suffix if suffix else ''}"
    if "FILHO" in t and "MAE" in t:
        suffix = "INTIMO" if "INTIMO" in t else ("CLASSICO" if "CLASSICO" in t else "")
        return f"MAEFILHO{'_'+suffix if suffix else ''}"
    if "FILHO" in t and "PAI" in t:
        suffix = "INTIMO" if "INTIMO" in t else ("CLASSICO" if "CLASSICO" in t else "")
        return f"PAIFILHO{'_'+suffix if suffix else ''}"
    if "1 PESSOA" in t and "PET" in t:
        return "1PESSOADOG"
    if "2 PESSOAS" in t and "PET" in t:
        return "FAMILIA2DOG"
    if "3 PESSOAS" in t and "PET" in t:
        return "FAMILIA3DOG"
    if "ESTILO" in t:
        m = re.search(r"ESTILO\s*(\d+)", t)
        num = m.group(1) if m else ""
        prefix = "FAMILIA4" if "4" in s else "FAMILIA3"
        return f"{prefix}_ESTILO{num}"

    # fallback: slug genérico
    slug = re.sub(r"[^A-Z0-9]", "_", t)
    slug = re.sub(r"_+", "_", slug).strip("_")
    return slug[:40]


# Seções que são apenas cabeçalhos de seção, não prompts reais
SECTION_HEADERS = {"2 PESSOAS", "3 PESSOAS", "4 PESSOAS", "PET"}


def is_section_header(text: str) -> bool:
    return normalize(text) in {normalize(h) for h in SECTION_HEADERS}


# ── Extração de prompts do PDF ─────────────────────────────────────────────────

COLOR_BLUE  = 0xaaccff   # VERSÃO PRETO & BRANCO
COLOR_GREEN = 0xaaffaa   # VERSÃO COLORIDA
COLOR_WHITE = 0xffffff   # títulos / seção
COLOR_DARK  = 0x444444   # corpo do prompt

def extract_colorida_prompts(pdf_path: str) -> list[dict]:
    """
    Extrai todos os prompts VERSÃO COLORIDA do PDF.
    Retorna lista de dicts: {title, section, prompt}
    """
    doc = fitz.open(pdf_path)
    spans = []          # lista de (color, text) na ordem do PDF

    for page in doc:
        blocks = page.get_text("dict")["blocks"]
        for block in blocks:
            if block["type"] != 0:
                continue
            for line in block["lines"]:
                for span in line["spans"]:
                    text = span["text"].strip()
                    if text:
                        spans.append((span["color"], text))

    # State machine: percorre spans e coleta prompts COLORIDA
    prompts = []
    current_section = ""
    current_title   = ""
    mode            = None   # "PB" | "COLOR" | None
    collecting      = []

    def flush():
        nonlocal collecting, current_title, current_section, mode
        if mode == "COLOR" and collecting and current_title:
            text = " ".join(collecting).strip()
            prompts.append({
                "title":   current_title,
                "section": current_section,
                "prompt":  text,
            })
        collecting = []
        mode = None

    for color, text in spans:
        if color == COLOR_WHITE:
            flush()
            if is_section_header(text):
                current_section = text
            else:
                current_title = text

        elif color == COLOR_GREEN:
            # "G" ou "VERSÃO COLORIDA"
            if "COLORIDA" in text.upper():
                flush()
                mode = "COLOR"
            # "G" sozinho → ignorar

        elif color == COLOR_BLUE:
            # "G" ou "VERSÃO PRETO & BRANCO"
            if "PRETO" in text.upper() or "BRANCO" in text.upper():
                flush()
                mode = "PB"

        elif color == COLOR_DARK:
            if mode == "COLOR":
                collecting.append(text)

    flush()   # último bloco
    return prompts


# ── Geração de imagem via Gemini ───────────────────────────────────────────────

def generate_image(client: genai.Client, ref_image_path: str, prompt: str) -> Image.Image | None:
    """Chama a API Gemini com a foto de referência + prompt e retorna a imagem gerada."""
    ref_pil = Image.open(ref_image_path).convert("RGB")

    buf = io.BytesIO()
    ref_pil.save(buf, format="PNG")
    buf.seek(0)
    image_part = types.Part.from_bytes(data=buf.read(), mime_type="image/png")

    response = client.models.generate_content(
        model=MODEL_NAME,
        contents=[image_part, prompt],
        config=types.GenerateContentConfig(
            response_modalities=["IMAGE", "TEXT"],
        ),
    )

    # Extrai a imagem da resposta
    for candidate in response.candidates:
        for part in candidate.content.parts:
            if part.inline_data and part.inline_data.mime_type.startswith("image/"):
                return Image.open(io.BytesIO(part.inline_data.data))
    return None


# ── Pipeline principal ─────────────────────────────────────────────────────────

def main():
    print(f"\n{'='*60}")
    print("  GERADOR DE FOTOS - FotosQuadros")
    print(f"{'='*60}\n")

    # 1. Extrair prompts coloridos
    print("Lendo prompts do PDF...")
    prompts = extract_colorida_prompts(PDF_PATH)
    print(f"  {len(prompts)} prompts COLORIDOS encontrados.\n")

    # 2. Inicializar Gemini
    client = genai.Client(api_key=API_KEY)

    # 3. Processar cada prompt
    ok = 0
    erros = 0

    for entry in prompts:
        title   = entry["title"]
        section = entry["section"]
        prompt  = entry["prompt"]

        cat  = title_to_category(title, section)
        slug = title_to_slug(title, section)

        if cat is None:
            print(f"  [SKIP] Categoria não mapeada: '{title}'")
            continue

        ref_file = os.path.join(REFS_DIR, REF_BY_CAT[cat])
        if not os.path.exists(ref_file):
            print(f"  [SKIP] Referência não encontrada: {ref_file}")
            continue

        out_subdir = os.path.join(OUT_DIR, cat)
        os.makedirs(out_subdir, exist_ok=True)

        color_path = os.path.join(out_subdir, f"{slug}_color.png")
        pb_path    = os.path.join(out_subdir, f"{slug}_pb.png")

        # Pula se já gerado
        if os.path.exists(color_path) and os.path.exists(pb_path):
            print(f"  [OK] Já existe: {slug}")
            ok += 1
            continue

        print(f"  Gerando: {slug}  (ref: {REF_BY_CAT[cat]})")
        print(f"    Prompt: {prompt[:80]}...")

        try:
            img_color = generate_image(client, ref_file, prompt)

            if img_color is None:
                print(f"    [ERRO] API não retornou imagem para: {slug}")
                erros += 1
                continue

            # Salvar colorida
            img_color.save(color_path, "PNG")
            print(f"    Salvo: {color_path}")

            # Converter e salvar P&B
            img_pb = img_color.convert("L").convert("RGB")
            img_pb.save(pb_path, "PNG")
            print(f"    Salvo: {pb_path}")

            ok += 1
            time.sleep(2)   # respeitar rate limit

        except Exception as e:
            print(f"    [ERRO] {slug}: {e}")
            erros += 1
            time.sleep(5)

    print(f"\n{'='*60}")
    print(f"  Concluído: {ok} geradas, {erros} erros")
    print(f"  Saída: {OUT_DIR}")
    print(f"{'='*60}\n")


if __name__ == "__main__":
    main()
