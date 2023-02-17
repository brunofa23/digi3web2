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

6 - Criar uma classe de validação
node ace make:validator CreateCompany

abrir servidor
 node ace serve --watch

 iniciar docker
 sudo service docker start
 npm run docker:dev



enviar para o git via prompt
git status
git add .
git status
git commit -m 'seu comentário'
git push origin master