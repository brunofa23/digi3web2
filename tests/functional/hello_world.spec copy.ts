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

  // async function preprocessImage() {
  //   try {
  //     await sharp(inputImage)
  //       .resize({ width: 2400, withoutEnlargement: true }) // aumenta resolução sem distorcer
  //       .modulate({
  //         brightness: 1.15,     // leve aumento no brilho
  //         saturation: 1.1,      // reforça um pouco a tinta, sem afetar o fundo muito
  //         hue: 0                // mantém tons naturais
  //       })
  //       .linear(1.1, -10)        // contraste: multiplica por 1.1 e reduz brilho fixo
  //       .sharpen(2.5, 1, 0.5)    // nitidez mais forte, mas equilibrada
  //       .median(3)               // suaviza pequenos ruídos sem borrar letras
  //       .normalize()             // ajusta tons automaticamente
  //       .toFile(outputImage);

  //     console.log('Imagem processada com qualidade aprimorada.');
  //   } catch (err) {
  //     console.error('Erro:', err);
  //   }
  // }

  // preprocessImage();


  // async function enhanceManuscript() {
  //   try {
  //     await sharp(inputImage)
  //       .resize({ width: 2400, withoutEnlargement: true }) // aumenta resolução para dar mais detalhes
  //       .modulate({
  //         brightness: 1.2,   // clareia o fundo
  //         saturation: 1.05   // reforça tinta, sem exagero
  //       })
  //       .linear(1.25, -20)   // aumenta contraste entre fundo e texto
  //       .sharpen(3, 1.5, 0.6) // mais nitidez
  //       .median(3)           // remove pequenos ruídos ou manchas
  //       .normalize()         // melhora equilíbrio geral da imagem
  //       .toFile(outputImage);

  //     console.log('Imagem aprimorada com sucesso:', outputImage);
  //   } catch (err) {
  //     console.error('Erro ao melhorar imagem:', err);
  //   }
  // }

  // enhanceManuscript();


  // async function enhanceSoftReadable() {
  //   try {
  //     await sharp(inputImage)
  //       .resize({ width: 2400, withoutEnlargement: true }) // aumenta resolução se necessário
  //       .modulate({
  //         brightness: 1.15,
  //         saturation: 1.05
  //       })
  //       .median(3) // suaviza pequenas manchas (mais suave que blur)
  //       .blur(0.4) // leve suavização geral
  //       .linear(1.15, -10) // contraste mais equilibrado
  //       .sharpen(1.2, 0.5, 0.4) // nitidez controlada
  //       .normalize()
  //       .toFile(outputImage);

  //     console.log('Imagem com escrita suavizada gerada:', outputImage);
  //   } catch (err) {
  //     console.error('Erro:', err);
  //   }
  // }

  // enhanceSoftReadable();



  // Etapa 1: Pré-processar a imagem com sharp
  async function enhanceManuscriptHybrid() {
    try {
      console.log("passo 1")
      await sharp(inputImage)
        .resize({ width: 2400, withoutEnlargement: true })
        .modulate({
          brightness: 1.2,
          saturation: 1.05
        })
        .linear(1.25, -20)     // bom contraste sem exagerar
        .median(3)             // remove manchas leves
        .sharpen(2.0, 1, 0.5)  // nitidez balanceada
        .blur(0.3)             // leve suavização controlada
        .normalize()
        .toFile(outputImage);

      console.log("passo 2")
      console.log('Imagem gerada com realce e leve suavização:', outputImage);
    } catch (err) {
      console.log("passo 3")
      console.error('Erro ao processar imagem:', err);
    }
  }
  //enhanceManuscriptHybrid();


  // Etapa 2: Executar OCR com tesseract.js
  async function extrairTexto() {
    console.log("passo 4")
    try {
      // Realiza o OCR com o Tesseract
      const { data: { text } } = await Tesseract.recognize(
        outputImage, // A imagem processada
        'por', // Troque 'lat' para 'eng' se o manuscrito for em inglês
        {
          logger: m => console.log(m), // Mostra o progresso do OCR
        }
      );

      // Define o nome do arquivo de saída
      //const nomeArquivo = 'texto_extraido.txt';

      // Escreve o texto extraído em um arquivo .txt
      fs.writeFileSync(texto_extraido, text);

      console.log(`📝 Texto extraído e salvo em ${texto_extraido}`);
    } catch (err) {
      console.error('Erro ao realizar o OCR:', err); // Mensagem de erro em português
    }
  }


  //Pipeline completo
  (async () => {
    console.log("executando...")
    await enhanceManuscriptHybrid();
    await extrairTexto();
  })();

})
