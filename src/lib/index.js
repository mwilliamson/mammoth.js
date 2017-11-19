import _ from 'underscore'
import { Result } from './results'
import openZip from './unzip'
import * as transforms from './transforms'
import { readStyle } from './style-reader'
import { readOptions } from './options-reader'
import * as images from './images'
import { DocumentConverter } from './document-to-html'
import * as docxReader from './docx/docx-reader'
import * as docxStyleMap from './docx/style-map'
import { tap } from './promises'

export { images }
export { transforms }
export { default as underline } from './underline'

export const convertToHtml = (input, options) => convert(input, options)

export const convertToMarkdown = (input, options) => {
  const markdownOptions = Object.create(options || {})
  markdownOptions.outputFormat = 'markdown'
  return convert(input, markdownOptions)
}

export const convert = (input, options) => {
  options = readOptions(options)

  return openZip(input)
    .then(tap(docxFile => {
      return docxStyleMap.readStyleMap(docxFile).then(styleMap => {
        options.embeddedStyleMap = styleMap
      })
    }))
    .then(docxFile => docxReader.read(docxFile, input)
      .then(documentResult => documentResult.map(options.transformDocument))
      .then(documentResult => convertDocumentToHtml(documentResult, options)))
}

export const readEmbeddedStyleMap = input => openZip(input)
  .then(docxStyleMap.readStyleMap)

const convertDocumentToHtml = (documentResult, options) => {
  const styleMapResult = parseStyleMap(options.readStyleMap())
  const parsedOptions = _.extend({}, options, {
    styleMap: styleMapResult.value
  })
  const documentConverter = new DocumentConverter(parsedOptions)

  return documentResult.flatMapThen(document =>
    styleMapResult.flatMapThen(styleMap =>
      documentConverter.convertToHtml(document)
    )
  )
}

const parseStyleMap = (styleMap = []) => Result.combine(styleMap.map(readStyle))
  .map(styleMap => styleMap.filter(styleMapping => !!styleMapping))

export const extractRawText = input => openZip(input)
  .then(docxReader.read)
  .then(documentResult => documentResult.map(convertElementToRawText))

const convertElementToRawText = element => {
  if (element.type === 'text') return element.value
  else {
    const tail = element.type === 'paragraph' ? '\n\n' : ''
    return (element.children || []).map(convertElementToRawText).join('') + tail
  }
}

export const embedStyleMap = (input, styleMap) => openZip(input)
  .then(tap(docxFile => docxStyleMap.writeStyleMap(docxFile, styleMap)))
  .then(docxFile => ({
    toBuffer: docxFile.toBuffer
  }))

export const styleMapping = () => {
  throw new Error(`Use a raw string instead of mammoth.styleMapping e.g. "p[style-name='Title'] => h1" instead of mammoth.styleMapping("p[style-name='Title'] => h1")`)
}
