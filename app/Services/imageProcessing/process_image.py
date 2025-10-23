import sys, cv2, numpy as np

inp, outp = sys.argv[1], sys.argv[2]
img = cv2.imread(inp)
if img is None:
    raise SystemExit("Imagem de entrada não encontrada")

# detecção (auxiliar) em cinza; saída continua colorida
gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
blur = cv2.GaussianBlur(gray, (5,5), 0)
edges = cv2.Canny(blur, 50, 150)

cnts, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
if not cnts: raise SystemExit("Nenhum contorno encontrado")
cnt = max(cnts, key=cv2.contourArea)
peri = cv2.arcLength(cnt, True)
approx = cv2.approxPolyDP(cnt, 0.02 * peri, True)

if len(approx) != 4: raise SystemExit("Contorno quadrangular não detectado")

pts = approx.reshape(4, 2).astype(np.float32)
def order(p):
    s = p.sum(axis=1); d = np.diff(p, axis=1)
    return np.array([p[np.argmin(s)], p[np.argmin(d)], p[np.argmax(s)], p[np.argmax(d)]], dtype=np.float32)
pts = order(pts)

dst = np.array([[0,0],[800,0],[800,800],[0,800]], dtype=np.float32)
M = cv2.getPerspectiveTransform(pts, dst)
warped = cv2.warpPerspective(img, M, (800, 800))

enhanced = cv2.convertScaleAbs(warped, alpha=1.2, beta=20)
kernel = np.array([[-1,-1,-1],[-1,9,-1],[-1,-1,-1]], np.float32)
sharp = cv2.filter2D(enhanced, -1, kernel)

cv2.imwrite(outp, sharp)
print(outp)
