/*
|--------------------------------------------------------------------------
| Validating Environment Variables
|--------------------------------------------------------------------------
|
| In this file we define the rules for validating environment variables.
| By performing validation we ensure that your application is running in
| a stable environment with correct configuration values.
|
| This file is read automatically by the framework during the boot lifecycle
| and hence do not rename or move this file to a different location.
|
*/

import Env from '@ioc:Adonis/Core/Env'

export default Env.rules({
	HOST: Env.schema.string({ format: 'host' }),
	PORT: Env.schema.number(),
	APP_KEY: Env.schema.string(),
  APP_NAME: Env.schema.string(),
  WEBAUTHN_RP_NAME: Env.schema.string.optional(),
  WEBAUTHN_RP_ID: Env.schema.string.optional(),
  WEBAUTHN_ORIGIN: Env.schema.string.optional(),
  FRONTEND_URL: Env.schema.string.optional(),
  DEVICE_COOKIE_DOMAIN: Env.schema.string.optional(),
  DEVICE_COOKIE_SECURE: Env.schema.boolean.optional(),
  DRIVE_DISK: Env.schema.enum(['local'] as const),
  GOOGLE_APPLICATION_CREDENTIALS: Env.schema.string.optional(),
  SMTP_HOST: Env.schema.string.optional(),
  SMTP_PORT: Env.schema.number.optional(),
  SMTP_USERNAME: Env.schema.string.optional(),
  SMTP_PASSWORD: Env.schema.string.optional(),
	NODE_ENV: Env.schema.enum(['development', 'production', 'test'] as const),
})
