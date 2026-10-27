const assert = require('node:assert/strict')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const ts = require('typescript')
const sharp = require('sharp')

const sourcePath = path.join(__dirname, '../../app/Services/googleDrive/googledrive.ts')
const source = `${fs.readFileSync(sourcePath, 'utf8')}\nexport { compressImageForDrive }`
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true },
}).outputText
const exportsObject = {}
const resolve = (name) => {
  if (name === 'App/Models/Token') return { default: {} }
  if (name === '@ioc:Adonis/Core/Helpers') return { types: {} }
  if (name === 'googleapis') return { google: {} }
  return require(name)
}
new Function('exports', 'require', compiled)(exportsObject, resolve)

async function run() {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'digi3-drive-compression-'))
  try {
    const jpegPath = path.join(directory, 'image.jpg')
    await sharp({ create: { width: 4000, height: 3000, channels: 3, background: '#eeeeee' } })
      .jpeg({ quality: 100 })
      .toFile(jpegPath)
    const originalSize = fs.statSync(jpegPath).size
    await exportsObject.compressImageForDrive(jpegPath)
    const jpeg = await sharp(jpegPath).metadata()
    assert.equal(jpeg.format, 'jpeg')
    assert.ok(jpeg.width <= 3200 && jpeg.height <= 3200)
    assert.ok(fs.statSync(jpegPath).size < originalSize)

    for (const format of ['png', 'webp', 'gif', 'tiff']) {
      const imagePath = path.join(directory, `image.${format}`)
      await sharp({ create: { width: 32, height: 32, channels: 3, background: '#eeeeee' } })
        .toFormat(format)
        .toFile(imagePath)
      await exportsObject.compressImageForDrive(imagePath)
      assert.equal((await sharp(imagePath).metadata()).format, format)
    }

    const pdfPath = path.join(directory, 'document.pdf')
    fs.writeFileSync(pdfPath, '%PDF-unchanged')
    await exportsObject.compressImageForDrive(pdfPath)
    assert.equal(fs.readFileSync(pdfPath, 'utf8'), '%PDF-unchanged')

    const bmpPath = path.join(directory, 'image.bmp')
    fs.writeFileSync(bmpPath, 'BMP')
    await assert.rejects(exportsObject.compressImageForDrive(bmpPath), /BMP não pode ser compactada/)
    assert.equal(fs.readdirSync(directory).length, 7)
  } finally {
    fs.rmSync(directory, { recursive: true, force: true })
  }
}

run().catch((error) => { console.error(error); process.exitCode = 1 })
