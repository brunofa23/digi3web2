# ---------- STAGE 1: BUILD ----------
FROM node:22-bookworm-slim AS build
WORKDIR /app

# deps para compilar (devDeps)
COPY package*.json ./
RUN npm ci

# código + build do Adonis (gera _build/)
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


# 🌎 Configuração de ambiente
ENV NODE_ENV=production
ENV TZ=America/Sao_Paulo
WORKDIR /app

# 📦 Apenas dependências de produção do Node
COPY package*.json ./
RUN npm ci --omit=dev

# 🚀 Copia os artefatos compilados do Adonis
COPY --from=build /app/_build ./_build
# (se tiver públicos)
# COPY --from=build /app/public ./public

# 🔥 Porta e host
ENV PORT=8080
ENV HOST=0.0.0.0
EXPOSE 8080

# (opcional) segurança — executar como usuário não-root
# RUN useradd -m app && chown -R app:app /app
# USER app

CMD ["node", "_build/server.js"]
