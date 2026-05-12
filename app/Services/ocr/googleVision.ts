import vision from '@google-cloud/vision'
import { existsSync } from 'fs'
import { join } from 'path'

let client: vision.ImageAnnotatorClient | null = null

function getClient() {
  if (!client) {
    const defaultKeyFilename = join(
      process.cwd(),
      'config',
      'credentials',
      'google-vision-service-account.json'
    )

    const keyFilename = process.env.GOOGLE_APPLICATION_CREDENTIALS || defaultKeyFilename

    if (!existsSync(keyFilename)) {
      throw new Error(`Credencial do Google Vision não encontrada em: ${keyFilename}`)
    }

    client = new vision.ImageAnnotatorClient(
      { keyFilename }
    )
  }

  return client
}

export async function extractDocumentTextFromBuffer(imageBuffer: Buffer): Promise<string> {
  const [result] = await getClient().documentTextDetection({
    image: {
      content: imageBuffer,
    },
  })

  return result.fullTextAnnotation?.text || result.textAnnotations?.[0]?.description || ''
}
