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

### FORMATO DE SAÍDA DO ARQUIVO
  Id{id}_{seq}({cod})_{typebook_id}_{book}_{sheet}_{termoNovo}_{lado}_{tabarqbin.tabarqbin_reg}_{data do arquivo}{extensão}


### DEPLOY
0 - npm install
1 - node ace build --production --ignore-ts-errors
2 - cd build
3 - npm ci --production
4 - 

## GERAR PASTA
mkdir -p _build/tmp/uploads

## COPIAR A PASTA BUILD PARA BUILDCOPY
cp -fR ~/digi3web2/digi3web2/build ~/digi3web2/deploy/
- run: cp -fR tmp _build
----
OU
ATUALIZAR APENAS OS NOVOS ARQUIVOS
cp -uR ~/digi3web2/digi3web2/build ~/digi3web2/deploy/

rodar na kinghost
node server.js ou pm2 start

#####
…or create a new repository on the command line
echo "# digi3deploy" >> README.md
git init
git add README.md
git commit -m "first commit"
git branch -M main
git remote add origin https://github.com/brunofa23/digi3deploy.git
git push -u origin main

###
…or push an existing repository from the command line
git init (caso não tenha o git)
git remote add origin https://github.com/brunofa23/digi3deploy.git
git branch -M main
git push -u origin main

************************************
ATENÇÃO COMANDO PARA EXCLUIR A PASTA E SUBPASTA DO LINUX
rm -rf ./*


####
Erro:
There isn't anything to compare. Nothing to compare, branches are entirely different commit histories
Rodar os comandos abaixo
git checkout master   
git branch main master -f    
git checkout main  
git push origin main -f 

### GIT 
Deletar uma branch
git branch -D ou -d <nome da branch>

Deletar um git add
git restore --staged .

chat.openai.com/chat
node _build/ace migration:refresh --seed

### LOG TRAIL
const { Logtail } = require("@logtail/node");
const logtail = new Logtail("2QyWC3ehQAWeC6343xpMSjTQ");

logtail.error("Erro testando Logtrail.");
logtail.info("Info Logtrail",token);
logtail.debug("debug",{
      "token":token,
      "usuário:":user
    })
logtail.flush()


## para pegar dados da request
ex: const data = request.only(['name', 'status', 'books_id'])


## executar uma determinada função de teste
node ace test --tags="teste3" functional

## serializar Json
JSON.parse(JSON.stringify(body))

## RELACIONAMENTO ENTRE TABELAS
## no model fazer o relacionamento
User(){
  return this.belongsTo("App/Models/User")
}
const tweet = await Tweet.query().with('nome do relacionamento').fetch()

## Rodar migration e executar seed
node ace migration:fresh --seed

## Excluir brant de test
git checkout development
git branch -d development-test
git push origin --delete development-test

## permite executar o merge ignorando as alteraçoes
git stash

## TRABALHANDO COM DATAS
function dateFormat(format, date = DateTime.local()) {
  // Verificar se a data é válida
  if (!(date instanceof DateTime)) {
    throw new Error('A data fornecida não é válida. Certifique-se de passar um objeto DateTime.');
  }
  // Formatando a data no formato especificado
  return date.toFormat(format);
}

## CÓDIGO DE TRANSAÇÃO COMMIT ROLLBACK
const trx = await Database.beginTransaction()
try {
  // Atualiza o registro
  await Event.query(trx).where('id', id).update(body)

  // Busca o registro atualizado
  const updatedEvent = await Event.find(id, trx)

  await trx.commit()

  return updatedEvent
} catch (error) {
  await trx.rollback()
  throw error
}

## RENOMEAR ARQUIVOS PELO WINDOS
Get-ChildItem -File | Rename-Item -NewName { $_.Name -replace '_1_', '_7_' }

PS D:\testeRenomearImagens> Get-ChildItem -File | Rename-Item -NewName { $_.Name -replace '(?<=\d)_7_', ')_7_' }
PS D:\testeRenomearImagens> Get-ChildItem -File | Rename-Item -NewName { $_.Name -replace '\)_1_', ')_7_' }


"engines": {
    "node": "20.x"
  }
