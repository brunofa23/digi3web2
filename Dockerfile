FROM node:16.18.1-alpine3.16

ENV NODE_VERSION 16.18.1

WORKDIR /home/node/app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

EXPOSE 8080

CMD [ "node", "_build/server.js"]