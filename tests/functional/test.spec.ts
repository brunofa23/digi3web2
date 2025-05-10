import { test } from '@japa/runner'
import Application from '@ioc:Adonis/Core/Application'
//const sharp = require('sharp');
import fs from 'fs'
import path from 'path'
import sharp from 'sharp'

test('test', async ({ client }) => {
  // Caminho da imagem original
  const inputImage = Application.tmpPath(`transferir.jpeg`);//'input.jpg';
  const outputImage = Application.tmpPath('/test/processed.jpg')//'processed.jpg';
  const dir = path.dirname(outputImage)

  if(!fs.existsSync(dir)){
    fs.mkdirSync(dir, {recursive:true})
  }

  // Etapa 1: Pré-processar a imagem com sharp
  async function enhanceAndCropManuscript() {
    try {
      console.log('primeiro teste')
      console.log("Passo 1: Iniciando o processamento da imagem..........");
      // Etapa 1: Melhorar nitidez e contraste da imagem mantendo as cores
      const buffer = await sharp(inputImage)
        .resize({ width: 2400, withoutEnlargement: true })
        .modulate({
          brightness: 1.1,
          saturation: 1.1
        })
        .linear(1.15, -10)
        .sharpen(1.2, 0.5, 0.3)
        .blur(0.3)
        .normalize()
        .toBuffer();

      // Etapa 2: Remover bordas pretas automaticamente
      await sharp(buffer)
        .trim({ threshold: 10 }) // ✅ Correção aqui
        .extend({
          top: 10,
          bottom: 10,
          left: 10,
          right: 10,
          background: { r: 255, g: 255, b: 255 }
        })
        .toFile(outputImage);

      console.log("Passo 2: Imagem recortada e processada com sucesso!");
    } catch (err) {
      console.error("Erro ao processar e recortar imagem:", err);
    }
  }

  // Chama as funções de forma sequencial, com espera para garantir a ordem de execução
  await enhanceAndCropManuscript();
  //await extrairTexto();

  console.log("Processamento completo!");

})
