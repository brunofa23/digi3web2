import { CorsConfig } from '@ioc:Adonis/Core/Cors'
import Env from '@ioc:Adonis/Core/Env'

const frontendUrl = Env.get('FRONTEND_URL', '*')

const corsConfig: CorsConfig = {

  enabled: (request) => request.url().startsWith('/api'),
  origin: frontendUrl.includes(',')
    ? frontendUrl.split(',').map((url) => url.trim()).filter(Boolean)
    : frontendUrl,
  methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE'],
  headers: true,
  exposeHeaders: [
    'cache-control',
    'content-language',
    'content-type',
    'expires',
    'last-modified',
    'pragma',
  ],
  credentials: true,
  maxAge: 86400,
}

export default corsConfig
