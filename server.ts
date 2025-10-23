import 'reflect-metadata'
import sourceMapSupport from 'source-map-support'
import { Ignitor } from '@adonisjs/core/build/standalone'
import fs from 'fs'
import path from 'path'

// 🔹 Caminho absoluto da pasta temporária (fora do build se quiser)
const tmpPath = path.join(__dirname, 'tmp', 'uploads')

// 🔹 Cria tmp/uploads de forma segura
try {
  if (!fs.existsSync(tmpPath)) {
    fs.mkdirSync(tmpPath, { recursive: true })
    console.log('📁 Pasta tmp/uploads criada:', tmpPath)
  }
} catch (err) {
  console.error('❌ Erro ao criar pasta tmp/uploads:', err)
}

sourceMapSupport.install({ handleUncaughtExceptions: false })

// 🚀 Inicia o servidor Adonis
new Ignitor(__dirname).httpServer().start()
