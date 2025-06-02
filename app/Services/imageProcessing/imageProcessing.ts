import fs from 'fs'
import path from 'path'
import sharp from 'sharp'

/**
 * Processa a imagem: melhora contraste, nitidez, recorta e adiciona borda.
 */
export async function imageProcessing(inputImage: string) {

  const dir = path.dirname(inputImage);
  const ext = path.extname(inputImage);
  const base = path.basename(inputImage, ext);
  const tempImage = path.join(dir, `${base}_processed${ext}`);


  try {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const buffer = await sharp(inputImage)
      .resize({ width: 2400, withoutEnlargement: true })
      .modulate({ brightness: 1.12, saturation: 1.05 })
      .linear(1.25, -15)
      .sharpen(1.5, 1.0, 0.4)
      .blur(0.3)
      .median(3)
      //.grayscale()
      .normalize()
      .toBuffer();

    await sharp(buffer)
      .trim({ threshold: 10 })
      .extend({
        top: 10,
        bottom: 10,
        left: 10,
        right: 10,
        background: { r: 0, g: 0, b: 0 } // borda preta
      })
      .sharpen(1.0, 0.5, 0.25)
      //.threshold(180) // opcional para binarização
      .toFile(tempImage);

    fs.unlinkSync(inputImage);
    fs.renameSync(tempImage, inputImage);
  } catch (err) {
    console.error("Erro ao processar e recortar imagem:", err);
     // Garante que o temporário seja excluído se o processo falhar
    if (fs.existsSync(tempImage)) {
      fs.unlinkSync(tempImage);
    }
  }
}

