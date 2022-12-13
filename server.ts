/*
|--------------------------------------------------------------------------
| AdonisJs Server
|--------------------------------------------------------------------------
|
| The contents in this file is meant to bootstrap the AdonisJs application
| and start the HTTP server to accept incoming connections. You must avoid
| making this file dirty and instead make use of `lifecycle hooks` provided
| by AdonisJs service providers for custom code.
|
*/

import 'reflect-metadata'
import sourceMapSupport from 'source-map-support'
import { Ignitor } from '@adonisjs/core/build/standalone'

console.log("Antes google");
//import './config/googledrive.js'
//import {sendAuthorize} from '../digi3web2/config/googledrive.js'
//import teste from '../digi3web2/config/googledrive.js'
//teste.sendAuthorize()
const authorize = require('./config/googledrive.ts')
authorize.sendAuthorize()
authorize.sendUploadFiles()
authorize.sendListFiles()
//sendAuthorize()

console.log("depois google");
console.log("executando upload");
//import './config/googledrive.ts'

console.log("finalizando upload");




sourceMapSupport.install({ handleUncaughtExceptions: false })

new Ignitor(__dirname)
  .httpServer()
  .start()
