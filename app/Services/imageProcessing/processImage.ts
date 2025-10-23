import path from 'path'
import { spawn } from 'child_process'

export function processImage(inputPath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const script = path.resolve(__dirname, './process_image.py')

    // 🔹 Gera automaticamente o nome do novo arquivo com "c" no final
    const { dir, name, ext } = path.parse(inputPath)
    const outputPath = path.join(dir, `${name}c${ext}`)

    const proc = spawn('python3', [script, inputPath, outputPath], {
      stdio: ['ignore', 'pipe', 'pipe']
    })

    let out = ''
    let err = ''

    proc.stdout.on('data', (d) => (out += d.toString()))
    proc.stderr.on('data', (d) => (err += d.toString()))

    proc.on('close', (code) => {
      if (code === 0) {
        return resolve(out.trim() || outputPath)
      }
      reject(new Error(err || `process_image.py exited with code ${code}`))
    })
  })
}
