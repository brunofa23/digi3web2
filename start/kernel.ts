import Server from '@ioc:Adonis/Core/Server'
console.log("Inicializando - Digi3web - V63")
Server.middleware.register([
  () => import('@ioc:Adonis/Core/BodyParser'),
])

Server.middleware.registerNamed({
  auth: () => import('App/Middleware/Auth'),
  level_permission: () => import('App/Middleware/LevelPermission'),
  company_permission: () => import('App/Middleware/CompanyPermission'),
  typebook_permission: () => import('App/Middleware/TypebookPermission'),
  user_permission: () => import('App/Middleware/UserPermission'),
  bookrecord_permission: () => import('App/Middleware/BookRecordPermission'),
  indeximage_permission: () => import('App/Middleware/IndexImagePermission'),
  tokentoimages_permission: () => import('App/Middleware/TokenToImagesPermission'),
  finaccount_permission: () => import('App/Middleware/FinAccountPermission')
})

