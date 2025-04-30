import 'reflect-metadata'
import sourceMapSupport from 'source-map-support'
import { Ignitor, Server } from '@adonisjs/core/build/standalone'
import { createServer } from "https";

sourceMapSupport.install({ handleUncaughtExceptions: false })

new Ignitor(__dirname)
  .httpServer()
  .start()




