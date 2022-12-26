1 - instalar adonis

2 - instalar lucid
npm i @adonisjs/lucid

3 - configurar o lucid
node ace configure @adonisjs/lucid

4 - configurar Cors
-vai em config -> cors.ts
-colocar a linha de comando:
enabled: (request) => request.url().startsWith('/api'),

5 - seed específica
node ace db:seed --files "./database/seeders/1 Company.ts"

abrir servidor
 node ace serve --watch



