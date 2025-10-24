# ---------- STAGE 1: BUILD ----------
FROM node:22-bookworm-slim AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

# Copia todo o código e builda
COPY . .
RUN npx node ace build --production --ignore-ts-errors

# ---------- STAGE 2: RUNTIME ----------
FROM node:22-bookworm-slim AS runtime

RUN apt-get update && apt-get install -y --no-install-recommends \
    ghostscript \
    python3 \
    python3-pip \
 && pip3 install --no-cache-dir --break-system-packages \
    opencv-python-headless \
    numpy \
    Pillow \
 && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
ENV TZ=America/Sao_Paulo
WORKDIR /app

# Só deps de produção
COPY package*.json ./
RUN npm ci --omit=dev

# Copia o build TS->JS
COPY --from=build /app/_build ./_build
# (se tiver /public)
# COPY --from=build /app/public ./public

# 🔽 COPIAR EXPLICITAMENTE O PYTHON PARA O LOCAL ONDE O JS ESPERA
# ATENÇÃO: Respeite a mesmíssima capitalização dos diretórios do seu projeto (“Services” vs “services”).
# Se o seu arquivo compilado fica em: _build/app/Services/imageProcessing/process_image.js
# então copie o .py para esse mesmo caminho-irmão:
RUN mkdir -p /app/_build/app/Services/imageProcessing
COPY app/Services/imageProcessing/process_image.py /app/_build/app/Services/imageProcessing/process_image.py
RUN chmod 755 /app/_build/app/Services/imageProcessing/process_image.py

# 🗂️ Criar diretórios de runtime (tmp e subpastas) com permissão de escrita
RUN mkdir -p /app/_build/tmp/uploads && chmod -R 777 /app/_build/tmp

# Porta/host
ENV PORT=8080
ENV HOST=0.0.0.0
EXPOSE 8080

# (opcional) rodar como não-root
# RUN useradd -m app && chown -R app:app /app
# USER app

CMD ["node", "_build/server.js"]
