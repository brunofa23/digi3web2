# ---------- STAGE 1: BUILD ----------
FROM node:20-bullseye AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci
COPY . .
RUN npx node ace build --production --ignore-ts-errors

# ---------- STAGE 2: RUNTIME ----------
FROM node:20-bullseye AS runtime

RUN apt-get update && apt-get install -y --no-install-recommends \
    ghostscript \
 && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
ENV TZ=America/Sao_Paulo
WORKDIR /app

# só deps de produção no runtime
COPY package*.json ./
RUN npm ci --omit=dev

# copia apenas artefatos compilados
COPY --from=build /app/_build ./_build
# (se tiver estáticos públicos)
# COPY --from=build /app/public ./public

ENV PORT=8080
ENV HOST=0.0.0.0
EXPOSE 8080

# (opcional) usuário não-root
# RUN useradd -m app && chown -R app:app /app
# USER app

CMD ["node", "_build/server.js"]
