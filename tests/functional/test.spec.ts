import { test } from '@japa/runner'
import Application from '@ioc:Adonis/Core/Application'
//const sharp = require('sharp');
import fs from 'fs'
import path from 'path'
import sharp from 'sharp'
import {fileRename}from "App/Services/fileRename/fileRename"


test('test', async ({ client }) => {

  const teste = await fileRename("L389F(11)F.jpg", 236,10)
  console.log("Processamento completo!", teste);

})
