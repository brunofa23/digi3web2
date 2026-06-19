import { CorsConfig } from '@ioc:Adonis/Core/Cors'
import Env from '@ioc:Adonis/Core/Env'

const frontendUrl = Env.get('FRONTEND_URL', '*')
const frontendOrigins = frontendUrl
  .split(',')
  .map((url) => url.trim())
  .filter(Boolean)

function isDevelopmentOrigin(origin: string) {
  return Env.get('NODE_ENV') === 'development'
    && /^http:\/\/(localhost|127\.0\.0\.1|192\.168\.\d{1,3}\.\d{1,3}):517[34]$/.test(origin)
}

const corsConfig: CorsConfig = {

  enabled: (request) => request.url().startsWith('/api'),
  origin: (origin) => {
    if (frontendUrl === '*') {
      return true
    }

    return frontendOrigins.includes(origin) || isDevelopmentOrigin(origin)
  },
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
