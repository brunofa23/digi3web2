const fs = require('fs')
const path = require('path')

const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS
  || path.resolve(process.cwd(), '_build/config/credentials/google-vision-service-account.json')

const credentialsJson = process.env.GOOGLE_VISION_SERVICE_ACCOUNT_JSON
const credentialsJsonBase64 = process.env.GOOGLE_VISION_SERVICE_ACCOUNT_JSON_BASE64

if (fs.existsSync(credentialsPath)) {
  process.exit(0)
}

let content = credentialsJson

if (!content && credentialsJsonBase64) {
  content = Buffer.from(credentialsJsonBase64, 'base64').toString('utf8')
}

if (!content) {
  console.error(
    'Google Vision credentials not found. Set GOOGLE_VISION_SERVICE_ACCOUNT_JSON or GOOGLE_VISION_SERVICE_ACCOUNT_JSON_BASE64.'
  )
  process.exit(1)
}

try {
  JSON.parse(content)
  fs.mkdirSync(path.dirname(credentialsPath), { recursive: true })
  fs.writeFileSync(credentialsPath, content)
  fs.chmodSync(credentialsPath, 0o600)
} catch (error) {
  console.error('Invalid Google Vision credentials JSON:', error.message)
  process.exit(1)
}
