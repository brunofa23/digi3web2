import { test } from '@japa/runner'

import Application from '@ioc:Adonis/Core/Application'

const sharp = require('sharp');
const Tesseract = require('tesseract.js');
const fs = require('fs');

test('display welcome page', async ({ client }) => {
  //console.log("PASSO gerando teste", client)
  // Caminho da imagem original
  const inputImage = Application.tmpPath(`transferir.jpeg`);//'input.jpg';
  const outputImage = Application.tmpPath('processed.jpg')//'processed.jpg';
  const texto_extraido = Application.tmpPath('texto_extraido.txt')//'processed.jpg';

  // Etapa 1: Pré-processar a imagem com sharp
  async function enhanceAndCropManuscript() {
    try {
      console.log("Passo 1: Iniciando o processamento da imagem...");

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


  // Etapa 2: Executar OCR com tesseract.js
  async function extrairTexto() {
    console.log("Passo 3: Iniciando a extração de texto com OCR...");
    try {
      // Realiza o OCR com o Tesseract
      const { data: { text } } = await Tesseract.recognize(
        outputImage, // Passando a imagem processada
        'por', // Idioma: português
        {
          logger: m => console.log(m), // Exibe o progresso do OCR
          config: [
            'preserve_interword_spaces=1', // Preserva espaços entre palavras
            'psm=6', // Usando PSM 6 para uma única coluna de texto
            'oem=1'  // Usando o motor LSTM
          ],
        }
      );

      // Escreve o texto extraído em um arquivo .txt
      fs.writeFileSync(texto_extraido, text);
      console.log(`Passo 4: Texto extraído e salvo em ${texto_extraido}`);
    } catch (err) {
      console.error('Erro ao realizar o OCR:', err);
    }
  }


  // Chama as funções de forma sequencial, com espera para garantir a ordem de execução
  await enhanceAndCropManuscript();
  //await extrairTexto();

  console.log("Processamento completo!");

})
