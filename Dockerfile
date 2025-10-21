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

# Ghostscript para compressão de PDF
RUN apt-get update && apt-get install -y --no-install-recommends \
    ghostscript \
 && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
ENV TZ=America/Sao_Paulo
WORKDIR /app

# apenas deps de produção
COPY package*.json ./
RUN npm ci --omit=dev

# artefatos compilados
COPY --from=build /app/_build ./_build
# (se tiver públicos)
# COPY --from=build /app/public ./public

# porta interna
ENV PORT=8080
ENV HOST=0.0.0.0
EXPOSE 8080

# (opcional) rodar como usuário não-root
# RUN useradd -m app && chown -R app:app /app
# USER app

CMD ["node", "_build/server.js"]
