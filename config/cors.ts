import { CorsConfig } from '@ioc:Adonis/Core/Cors'

const corsConfig: CorsConfig = {

  enabled: (request) => request.url().startsWith('/api'),
  origin: '*',
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
