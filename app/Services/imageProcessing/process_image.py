#!/usr/bin/env python3
import sys, os, cv2, numpy as np

# Uso:
# python3 process_image.py <input> <output> [--mode auto|doc|photo] [--sr caminho.pb] [--algo fsrcnn|edsr|lapsrn|espcn] [--scale 2|3|4]
# Exemplo (com SR FSRCNN x2):
# python3 process_image.py in.jpg out.jpg --sr models/FSRCNN_x2.pb --algo fsrcnn --scale 2

# ------------------------- CLI -------------------------
if len(sys.argv) < 3:
    raise SystemExit("Uso: python3 process_image.py <input> <output> [--mode auto|doc|photo] [--sr caminho.pb] [--algo fsrcnn|edsr|lapsrn|espcn] [--scale 2|3|4]")

inp, outp = sys.argv[1], sys.argv[2]
if not os.path.exists(inp):
    raise SystemExit(f"Imagem não encontrada: {inp}")

mode = "auto"
sr_model_path = None
sr_algo = "fsrcnn"
sr_scale = 2

args = sys.argv[3:]
i = 0
while i < len(args):
    if args[i] == "--mode" and i+1 < len(args):
        mode = args[i+1].lower(); i += 2
    elif args[i] == "--sr" and i+1 < len(args):
        sr_model_path = args[i+1]; i += 2
    elif args[i] == "--algo" and i+1 < len(args):
        sr_algo = args[i+1].lower(); i += 2
    elif args[i] == "--scale" and i+1 < len(args):
        sr_scale = int(args[i+1]); i += 2
    else:
        i += 1

# ---------------------- Utilitários ---------------------
def write_with_compression(path, img):
    ext = os.path.splitext(path)[1].lower()
    ok = False
    if ext in (".jpg", ".jpeg"):
        params = [
            cv2.IMWRITE_JPEG_QUALITY, 90,
            cv2.IMWRITE_JPEG_OPTIMIZE, 1,
            cv2.IMWRITE_JPEG_PROGRESSIVE, 1,
        ]
        ok = cv2.imwrite(path, img, params)
    elif ext == ".webp":
        ok = cv2.imwrite(path, img, [cv2.IMWRITE_WEBP_QUALITY, 90])
    elif ext == ".png":
        ok = cv2.imwrite(path, img, [cv2.IMWRITE_PNG_COMPRESSION, 3])
    else:
        ok = cv2.imwrite(path, img)
    if not ok:
        raise SystemExit("Falha ao salvar a imagem de saída.")

def soft_knee_clip(L, knee_start=245, knee_end=255):
    """Compressão suave perto do branco para evitar estouro (uint8)."""
    Lf = L.astype(np.float32)
    mask = Lf > knee_start
    Lf[mask] = knee_start + (Lf[mask] - knee_start) * (knee_end - knee_start) / (knee_end - knee_start + (Lf[mask] - knee_start))
    return np.clip(Lf, 0, 255).astype(np.uint8)

def percentile_stretch(L, p_low=3.0, p_high=97.0):
    lo, hi = np.percentile(L, p_low), np.percentile(L, p_high)
    if hi - lo < 1: return L.copy()
    Lf = (L.astype(np.float32) - lo) / (hi - lo)
    return np.clip(Lf * 255.0, 0, 255).astype(np.uint8)

def edge_aware_sharpen(L, strength=0.7, sigma_color=18, sigma_space=8, thresh=2):
    base = cv2.bilateralFilter(L, d=0, sigmaColor=sigma_color, sigmaSpace=sigma_space)
    detail = L.astype(np.int16) - base.astype(np.int16)
    mask = (np.abs(detail) > thresh).astype(np.int16)
    out = L.astype(np.int16) + (detail * strength * mask)
    return np.clip(out, 0, 255).astype(np.uint8)

def midtone_sigmoid(L, gain=8.0, cutoff=0.5):
    """S-curve suave nos médios (0..255) sem mexer muito em pretos/brancos."""
    x = L.astype(np.float32) / 255.0
    y = 1.0 / (1.0 + np.exp(-gain*(x - cutoff)))
    # normaliza para manter preto=0, branco=1 aproximadamente
    y0 = 1.0 / (1.0 + np.exp(-gain*(0.0 - cutoff)))
    y1 = 1.0 / (1.0 + np.exp(-gain*(1.0 - cutoff)))
    y = (y - y0) / (y1 - y0 + 1e-8)
    return np.clip(y * 255.0, 0, 255).astype(np.uint8)

def slight_chroma_tame(A, B, factor=0.99):
    A32, B32 = A.astype(np.float32), B.astype(np.float32)
    Aout = 128.0 + factor * (A32 - 128.0)
    Bout = 128.0 + factor * (B32 - 128.0)
    return np.clip(Aout, 0, 255).astype(np.uint8), np.clip(Bout, 0, 255).astype(np.uint8)

def fast_denoise_bgr(img, h=5, hColor=4):
    """Denoise leve em BGR (NLM), preserva bordas melhor que Gaussian."""
    return cv2.fastNlMeansDenoisingColored(img, None, h, hColor, 7, 21)

def illumination_correction_L(L, radius_frac=0.06):
    """Remove sombreado/amarelo do papel: divide por background borrado."""
    h, w = L.shape[:2]
    sigma = max(5, int(min(h, w)*radius_frac))
    if sigma % 2 == 0: sigma += 1
    bg = cv2.GaussianBlur(L, (sigma, sigma), 0)
    bg = np.maximum(bg.astype(np.float32), 1.0)
    Lf = (L.astype(np.float32) / bg) * np.mean(bg)
    return np.clip(Lf, 0, 255).astype(np.uint8)

def guess_doc_vs_photo(bgr):
    """Heurística simples: baixa saturação + bordas duras => doc."""
    hsv = cv2.cvtColor(bgr, cv2.COLOR_BGR2HSV)
    sat = hsv[:, :, 1].astype(np.float32)
    sat_mean = float(np.mean(sat))
    gray = cv2.cvtColor(bgr, cv2.COLOR_BGR2GRAY)
    edges = cv2.Canny(gray, 60, 120)
    edge_density = np.mean(edges > 0)
    # valores típicos: doc -> saturação baixa e edge_density mais alto (contornos/linhas)
    return (sat_mean < 40 and edge_density > 0.06)

def try_superres(bgr, model_path, algo="fsrcnn", scale=2):
    """Tenta aplicar SR x{scale} com dnn_superres, cai fora se não disponível."""
    if (model_path is None) or (not os.path.exists(model_path)):
        return bgr, False, "no_model"
    try:
        # requer opencv-contrib-python
        sr = cv2.dnn_superres.DnnSuperResImpl_create()
        sr.readModel(model_path)
        sr.setModel(algo, scale)
        up = sr.upsample(bgr)
        return up, True, "ok"
    except Exception as e:
        return bgr, False, f"error:{e}"

# --------------------- Carregamento ---------------------
img = cv2.imread(inp, cv2.IMREAD_UNCHANGED)
if img is None:
    raise SystemExit("Erro ao carregar imagem")

has_alpha = False
if img.ndim == 2:
    img = cv2.cvtColor(img, cv2.COLOR_GRAY2BGR)
elif img.shape[2] == 4:
    has_alpha = True
    alpha = img[:, :, 3]
    img = img[:, :, :3]

# --------------- Escolha do preset ----------------------
preset = mode
if mode == "auto":
    preset = "doc" if guess_doc_vs_photo(img) else "photo"

# -------------------- Pipelines -------------------------
if preset == "doc":
    # 1) Denoise leve (antes de corrigir iluminação)
    den = fast_denoise_bgr(img, h=4, hColor=3)

    # 2) Trabalhar no Lab
    lab = cv2.cvtColor(den, cv2.COLOR_BGR2LAB)
    L, A, B = cv2.split(lab)

    # 3) Correção de iluminação (tira amarelo/sombra de papel)
    L1 = illumination_correction_L(L, radius_frac=0.08)

    # 4) Stretch por percentis + knee no alto
    L2 = percentile_stretch(L1, 2.0, 98.0)
    L2 = soft_knee_clip(L2, knee_start=245, knee_end=255)

    # 5) CLAHE sutil para equalizar fundo sem “plastificar”
    clahe = cv2.createCLAHE(clipLimit=1.5, tileGridSize=(8, 8))
    L3 = clahe.apply(L2)

    # 6) Nitidez sem halo com limiar (reforça letras)
    L4 = edge_aware_sharpen(L3, strength=0.75, sigma_color=16, sigma_space=6, thresh=2)

    # 7) Domar crominância (remove “chiado” colorido em papel)
    A2, B2 = slight_chroma_tame(A, B, factor=0.985)

    out_lab = cv2.merge((L4, A2, B2))
    out = cv2.cvtColor(out_lab, cv2.COLOR_LAB2BGR)

    # 8) (Opcional) SR x2 + downscale para suavizar jaggies em bordas finas
    up, ok, _ = try_superres(out, sr_model_path, algo=sr_algo, scale=sr_scale)
    if ok:
        h, w = img.shape[:2]
        out = cv2.resize(up, (w, h), interpolation=cv2.INTER_AREA)

elif preset == "photo":
    # 1) Denoise leve
    den = fast_denoise_bgr(img, h=5, hColor=4)

    # 2) SR x2 se disponível (antes de contraste/nitidez)
    up, ok, _ = try_superres(den, sr_model_path, algo=sr_algo, scale=sr_scale)
    work = up if ok else den

    # 3) Trabalhar no Lab
    lab = cv2.cvtColor(work, cv2.COLOR_BGR2LAB)
    L, A, B = cv2.split(lab)

    # 4) S-curve nos médios + proteção de highlights
    L1 = midtone_sigmoid(L, gain=6.0, cutoff=0.52)
    L1 = soft_knee_clip(L1, knee_start=248, knee_end=255)

    # 5) CLAHE muito leve para microcontraste
    clahe = cv2.createCLAHE(clipLimit=1.10, tileGridSize=(8, 8))
    L2 = cv2.addWeighted(L1, 0.7, clahe.apply(L1), 0.3, 0)

    # 6) Nitidez edge-aware com limiar
    L3 = edge_aware_sharpen(L2, strength=0.60, sigma_color=18, sigma_space=8, thresh=2)

    # 7) Chroma tame para evitar “bordas coloridas”
    A2, B2 = slight_chroma_tame(A, B, factor=0.992)

    out = cv2.cvtColor(cv2.merge((L3, A2, B2)), cv2.COLOR_LAB2BGR)

    # 8) Se fez SR, volta ao tamanho original para ganhar “detalhe limpo”
    if ok:
        h, w = img.shape[:2]
        out = cv2.resize(out, (w, h), interpolation=cv2.INTER_AREA)

else:
    raise SystemExit("Modo inválido. Use auto, doc ou photo.")

# Restaura alpha (se havia)
if has_alpha:
    out = np.dstack((out, alpha))

# --------------------- Salvar ---------------------------
write_with_compression(outp, out)
print(f"{outp} ({preset})")
