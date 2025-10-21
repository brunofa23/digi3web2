FROM node:20-bullseye

# Ghostscript para compressão
RUN apt-get update && apt-get install -y --no-install-recommends \
    ghostscript \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Instala deps (inclui devDeps para poder compilar)
COPY package*.json ./
RUN npm ci

# Copia código e compila para _build/
COPY . .
RUN npx node ace build --production --ignore-ts-errors

ENV NODE_ENV=production
ENV PORT=8080
ENV HOST=0.0.0.0
EXPOSE 8080

# >>> sua saída é _build
CMD ["node", "_build/server.js"]
