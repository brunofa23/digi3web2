import path from 'path'
import { spawn } from 'child_process'
import fs from 'fs'

export function processImage(inputPath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      console.log("passo 1##")

      // 🔹 Verifica se o arquivo de entrada existe
      if (!fs.existsSync(inputPath)) {
        console.log("passo 1.1##")
        return reject(new Error(`Arquivo não encontrado: ${inputPath}`))
      }

      // 🔹 Caminho do script Python
      console.log("passo 1.2##")
      const script = path.resolve(__dirname, './process_image.py')
      console.log("passo 1.2-2##", script)
      if (!fs.existsSync(script)) {
        console.log("passo 1.3##")
        return reject(new Error(`Script Python não encontrado: ${script}`))
      }

      console.log("passo 2##")

      // 🔹 Gera automaticamente o nome do novo arquivo com "c" no final
      const { dir, name, ext } = path.parse(inputPath)
      const outputPath = path.join(dir, `${name}c${ext}`)

      console.log("passo 3##")

      // 🔹 Executa o script Python
      const proc = spawn('python3', [script, inputPath, outputPath], {
        stdio: ['ignore', 'pipe', 'pipe']
      })

      console.log("passo 4##")

      let out = ''
      let err = ''

      proc.stdout.on('data', (d) => (out += d.toString()))
      proc.stderr.on('data', (d) => (err += d.toString()))

      // 🔹 Erros diretos do processo (por exemplo, falha ao spawnar)
      proc.on('error', (error) => {
        reject(new Error(`Erro ao executar Python: ${error.message}`))
      })

      // 🔹 Ao encerrar
      proc.on('close', (code) => {
        if (code === 0) {
          console.log("Processamento concluído com sucesso.")
          return resolve(out.trim() || outputPath)
        }
        reject(new Error(err || `process_image.py saiu com código ${code}`))
      })
    } catch (error: any) {
      reject(new Error(`Erro inesperado: ${error.message}`))
    }
  })
}
