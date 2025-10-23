import 'reflect-metadata'
import sourceMapSupport from 'source-map-support'
import { Ignitor, Server } from '@adonisjs/core/build/standalone'
//import { createServer } from "https";

sourceMapSupport.install({ handleUncaughtExceptions: false })

new Ignitor(__dirname)
  .httpServer()
  .start()



//******************************************************

// import 'reflect-metadata'
// import sourceMapSupport from 'source-map-support'
// import { Ignitor } from '@adonisjs/core/build/standalone'
// import { createServer } from 'https'
// import { readFileSync } from 'fs'
// import { join } from 'path'

// sourceMapSupport.install({ handleUncaughtExceptions: false })

// // Função assíncrona para iniciar o servidor HTTPS
// async function startServer() {
//   try {
//     // Lê os arquivos de certificado SSL
//     const options = {
//       key: readFileSync(join(__dirname, 'cert', 'key.pem')),    // Caminho correto para a chave privada
//       cert: readFileSync(join(__dirname, 'cert', 'cert.pem')),  // Caminho correto para o certificado público
//     }

//     // Inicializa o servidor HTTP do AdonisJS
//     const { server } = await new Ignitor(__dirname).httpServer()

//     // Cria o servidor HTTPS
//     const httpsServer = createServer(options, server)

//     // Inicia o servidor HTTPS na porta 3333
//     httpsServer.listen(3333, '0.0.0.0', () => {
//       console.log('Servidor HTTPS rodando em https://0.0.0.0:3333')
//     })
//   } catch (error) {
//     console.error('Erro ao iniciar o servidor:', error)
//   }
// }

// // Chama a função para iniciar o servidor
// startServer()
