import { spawn } from 'child_process'
import path from 'path'

export function processImage(inputPath: string, outputPath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const script = path.resolve(__dirname, './process_image.py')
    const proc = spawn('python3', [script, inputPath, outputPath], { stdio: ['ignore','pipe','pipe'] })

    let out = '', err = ''
    proc.stdout.on('data', d => out += d.toString())
    proc.stderr.on('data', d => err += d.toString())

    proc.on('close', code => {
      if (code === 0) return resolve(out.trim() || outputPath)
      reject(new Error(err || `process_image.py exited with code ${code}`))
    })
  })
}
