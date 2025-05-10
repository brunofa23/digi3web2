import { test } from '@japa/runner'
import Application from '@ioc:Adonis/Core/Application'
//const sharp = require('sharp');
import fs from 'fs'
import path from 'path'
import sharp from 'sharp'

test('test2', async ({ client }) => {
  const inputImage = Application.tmpPath(`transferir.jpeg`);//'input.jpg';
  const outputImage = Application.tmpPath('/test2/processed.jpg')//'processed.jpg';
  const dir = path.dirname(outputImage)

  if(!fs.existsSync(dir)){
    fs.mkdirSync(dir, {recursive:true})
  }

  // Etapa 1: Pré-processar a imagem com sharp
 async function enhanceAndCropManuscript() {
  try {
    console.log("Passo 1: Iniciando o processamento da imagem com melhoria de contraste...");

    const buffer = await sharp(inputImage)
      .resize({ width: 2400, withoutEnlargement: true })
      .modulate({
        brightness: 1.12,   // ligeiro ajuste no brilho
        saturation: 1.05     // mantém a cor neutra (pode ajustar conforme imagem)
      })
      .linear(1.25, -15)     // mais contraste: multiplicador maior, offset menor
      .sharpen(1.5, 1.0, 0.4)  // aumenta nitidez para destacar escrita
      .blur(0.3)
      .median(3)           // leve suavização do fundo
      //.greyscale()        // opcional: converte para escala de cinza
      .normalize()          // normaliza valores de cor
      .toBuffer();

    // Etapa 2: Remover bordas pretas e aplicar fundo branco
    await sharp(buffer)
      .trim({ threshold: 12 })  // mais sensível à borda
      .extend({
        top: 10,
        bottom: 10,
        left: 10,
        right: 10,
        background: { r: 0, g: 0, b: 0 } // preto
      })
      //.sharpen(1.0, 0.5, 0.25) // novo passo
      .toFile(outputImage);

    console.log("Passo 2: Imagem recortada e melhorada com sucesso!");
  } catch (err) {
    console.error("Erro ao processar e recortar imagem:", err);
  }
}
  // Chama as funções de forma sequencial, com espera para garantir a ordem de execução
  await enhanceAndCropManuscript();
  console.log("Processamento completo!");

})
