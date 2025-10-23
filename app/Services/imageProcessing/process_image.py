import sys, cv2, numpy as np, os

# Uso: python3 process_image.py <input> <output>
if len(sys.argv) < 3:
    raise SystemExit("Uso: python3 process_image.py <input> <output>")

inp, outp = sys.argv[1], sys.argv[2]

if not os.path.exists(inp):
    raise SystemExit(f"Imagem não encontrada: {inp}")

# 📥 Carrega imagem
img = cv2.imread(inp)
if img is None:
    raise SystemExit("Erro ao carregar imagem")

# 1️⃣ Clarear levemente e ajustar contraste (sutil)
alpha = 1.12   # leve aumento de contraste
beta = 10      # leve aumento de brilho
img = cv2.convertScaleAbs(img, alpha=alpha, beta=beta)

# 2️⃣ Equalização de contraste suave (CLAHE)
lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB)
l, a, b = cv2.split(lab)
clahe = cv2.createCLAHE(clipLimit=1.1, tileGridSize=(8, 8))
l = clahe.apply(l)
lab = cv2.merge((l, a, b))
img = cv2.cvtColor(lab, cv2.COLOR_LAB2BGR)

# 3️⃣ Realce de nitidez (sutil e equilibrado)
kernel = np.array([
    [0, -0.25, 0],
    [-0.25, 2.0, -0.25],
    [0, -0.25, 0]
], np.float32)
img = cv2.filter2D(img, -1, kernel)

# 4️⃣ Compressão eficiente sem perda perceptível
# quality=85 já reduz muito o tamanho, mantendo boa qualidade
# e com IMWRITE_JPEG_OPTIMIZE True, o OpenCV faz compactação inteligente
encode_params = [
    cv2.IMWRITE_JPEG_QUALITY, 85,        # taxa de compressão (85 é ótimo equilíbrio)
    cv2.IMWRITE_JPEG_OPTIMIZE, 1,        # ativa compressão otimizada
    cv2.IMWRITE_JPEG_PROGRESSIVE, 1       # modo progressivo (melhor para web)
]
cv2.imwrite(outp, img, encode_params)

print(outp)
