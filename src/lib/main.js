/* global process */
import * as fs from 'fs'
import * as path from 'path'

import * as promises from './promises'
import * as images from './images'

import * as mammoth from './index'

export default (argv) => {
  const docxPath = argv['docx-path']
  let outputPath = argv['output-path']
  const outputDir = argv.output_dir
  const outputFormat = argv.output_format
  const styleMapPath = argv.style_map

  return readStyleMap(styleMapPath)
    .then(styleMap => {
      const options = {
        styleMap: styleMap,
        outputFormat: outputFormat
      }

      if (outputDir) {
        const basename = path.basename(docxPath, '.docx')
        outputPath = path.join(outputDir, basename + '.html')
        let imageIndex = 0
        options.convertImage = images.imgElement(element => {
          imageIndex++
          const extension = element.contentType.split('/')[1]
          const filename = imageIndex + '.' + extension

          return element.read().then(imageBuffer => {
            const imagePath = path.join(outputDir, filename)
            return promises.nfcall(fs.writeFile, imagePath, imageBuffer)
          }).then(() => ({src: filename}))
        })
      }

      return mammoth.convert({path: docxPath}, options)
        .then(result => {
          result.messages.forEach(message => {
            process.stderr.write(message.message)
            process.stderr.write('\n')
          })

          const outputStream = outputPath ? fs.createWriteStream(outputPath) : process.stdout

          outputStream.write(result.value)
        })
    })
}

const readStyleMap = styleMapPath => styleMapPath
  ? promises.nfcall(fs.readFile, styleMapPath, 'utf8')
  : Promise.resolve(null)
