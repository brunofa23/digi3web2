import sys, cv2, numpy as np, os

# Uso: python3 process_image.py <input> <output>
if len(sys.argv) < 3:
    raise SystemExit("Uso: python3 process_image.py <input> <output>")

inp, outp = sys.argv[1], sys.argv[2]
if not os.path.exists(inp):
    raise SystemExit(f"Imagem não encontrada: {inp}")

# ------ Funções utilitárias ------
def gamma_lut(gamma: float) -> np.ndarray:
    """Tabela de correção gama (uint8). gamma < 1 clareia, > 1 escurece."""
    x = np.arange(256, dtype=np.float32) / 255.0
    y = np.power(x, gamma) * 255.0
    return np.clip(y, 0, 255).astype(np.uint8)

def write_with_compression(path, img):
    ext = os.path.splitext(path)[1].lower()
    ok = False
    if ext in (".jpg", ".jpeg"):
        params = [
            cv2.IMWRITE_JPEG_QUALITY, 86,     # equilíbrio qualidade/tamanho
            cv2.IMWRITE_JPEG_OPTIMIZE, 1,     # Huffman otimizado
            cv2.IMWRITE_JPEG_PROGRESSIVE, 1   # progressivo
        ]
        ok = cv2.imwrite(path, img, params)
    elif ext == ".webp":
        # WEBP com qualidade alta (lossy). Use 100 para "quase lossless".
        params = [cv2.IMWRITE_WEBP_QUALITY, 86]
        ok = cv2.imwrite(path, img, params)
    elif ext == ".png":
        # PNG sem perdas: nível moderado de compressão
        params = [cv2.IMWRITE_PNG_COMPRESSION, 3]  # 0 (sem) a 9 (máx)
        ok = cv2.imwrite(path, img, params)
    else:
        # fallback
        ok = cv2.imwrite(path, img)
    if not ok:
        raise SystemExit("Falha ao salvar a imagem de saída.")

# ------ Carrega imagem (preserva alpha se existir) ------
img = cv2.imread(inp, cv2.IMREAD_UNCHANGED)
if img is None:
    raise SystemExit("Erro ao carregar imagem")

has_alpha = False
if img.ndim == 2:
    # Gray -> BGR para processar em Lab depois
    img = cv2.cvtColor(img, cv2.COLOR_GRAY2BGR)
elif img.shape[2] == 4:
    has_alpha = True
    bgr, alpha = img[:, :, :3], img[:, :, 3]
    img = bgr.copy()

# ------ 1) Clareamento sutil com proteção de realces ------
# Trabalha na luminância (canal L do Lab)
lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB)
L, A, B = cv2.split(lab)

# Gama sutil apenas se os médios estiverem um pouco escuros
median_L = float(np.median(L))
gamma = 0.96 if median_L < 135 else 1.0  # bem sutil
if gamma != 1.0:
    LUT = gamma_lut(gamma)  # gamma < 1 clareia
    L_gamma = cv2.LUT(L, LUT)
else:
    L_gamma = L

# Protege áreas claras: peso maior quanto mais claro o pixel
# w ~ 1 (claro) => mantém original; w ~ 0 (escuro) => usa mais o L_gamma
w = np.power(L.astype(np.float32) / 255.0, 2.0)
L_blend = (1.0 - w) * L_gamma.astype(np.float32) + w * L.astype(np.float32)
L_blend = np.clip(L_blend, 0, 255).astype(np.uint8)

# ------ 2) Equalização local (CLAHE) bem leve + blend ------
clahe = cv2.createCLAHE(clipLimit=1.10, tileGridSize=(8, 8))
L_eq = clahe.apply(L_blend)

# Mistura para evitar efeito "exagerado" do CLAHE
# (mantém aparência próxima do original)
L2 = cv2.addWeighted(L_blend, 0.6, L_eq, 0.4, 0)

# ------ 3) Nitidez sutil só na luminância (evita halos/ruído de cor) ------
# Unsharp mask leve
blur = cv2.GaussianBlur(L2, (0, 0), sigmaX=0.7, sigmaY=0.7)
L_sharp = cv2.addWeighted(L2, 1.25, blur, -0.25, 0)

# Threshold de detalhe para não amplificar ruído em áreas lisas
hi = cv2.absdiff(L2, blur)
mask = (hi > 2).astype(np.uint8)  # 0/1
L3 = L2.copy()
L3[mask.astype(bool)] = L_sharp[mask.astype(bool)]

# Reconstrói imagem em BGR a partir do Lab ajustado
lab_out = cv2.merge((L3, A, B))
img_out = cv2.cvtColor(lab_out, cv2.COLOR_LAB2BGR)

# Restaura alpha (se havia)
if has_alpha:
    img_out = np.dstack((img_out, alpha))

# ------ 4) Grava com compressão "segura" ------
write_with_compression(outp, img_out)
print(outp)
