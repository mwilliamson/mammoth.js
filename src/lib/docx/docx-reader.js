import * as path from 'path'

import * as promises from '../promises'
import { Result } from '../results'
import * as documents from '../documents'
import { CreateBodyReader } from './body-reader'
import createCommentsReader from './comments-reader'
import { default as readContentTypesFromXml, defaultContentTypes } from './content-types-reader'
import DocumentXmlReader from './document-xml-reader'
import { Files } from './files'
import * as notesReader from './notes-reader'
import * as numberingXml from './numbering-xml'
import { readXmlFromZipFile } from './office-xml-reader'
import readRelationships from './relationships-reader'
import * as stylesReader from './styles-reader'

export const read = (docxFile, input = {}) =>
  promises.props({
    contentTypes: readContentTypesFromZipFile(docxFile),
    numbering: readNumberingFromZipFile(docxFile),
    styles: readStylesFromZipFile(docxFile),
    docxFile: docxFile,
    files: new Files(input.path ? path.dirname(input.path) : null)
  })
    .then(promises.also(result => ({
      footnotes: readXmlFileWithBody('footnotes', result, (bodyReader, xml) => xml ? notesReader.createFootnotesReader(bodyReader)(xml) : new Result([])),
      endnotes: readXmlFileWithBody('endnotes', result, (bodyReader, xml) => xml ? notesReader.createEndnotesReader(bodyReader)(xml) : new Result([])),
      comments: readXmlFileWithBody('comments', result, (bodyReader, xml) => xml ? createCommentsReader(bodyReader)(xml) : new Result([]))
    })))
    .then(promises.also(result => ({
      notes: result.footnotes.flatMap(footnotes => result.endnotes.map(endnotes => new documents.Notes(footnotes.concat(endnotes))))
    })))
    .then(result => readXmlFileWithBody('document', result, (bodyReader, xml) => {
      if (xml) {
        return result.notes.flatMap(notes => result.comments.flatMap(comments => {
          const reader = new DocumentXmlReader({
            bodyReader: bodyReader,
            notes: notes,
            comments: comments
          })
          return reader.convertXmlToDocument(xml)
        }))
      } else throw new Error('Could not find word/document.xml in ZIP file. Are you sure this is a valid .docx file?')
    }))

const xmlFileReader = options => zipFile =>
  readXmlFromZipFile(zipFile, options.filename)
    .then(element => element ? options.readElement(element) : options.defaultValue)

const readXmlFileWithBody = (name, options, func) => {
  const readRelationshipsFromZipFile = xmlFileReader({
    filename: 'word/_rels/' + name + '.xml.rels',
    readElement: readRelationships,
    defaultValue: {}
  })

  return readRelationshipsFromZipFile(options.docxFile).then(relationships => {
    const bodyReader = CreateBodyReader({
      relationships: relationships,
      contentTypes: options.contentTypes,
      docxFile: options.docxFile,
      numbering: options.numbering,
      styles: options.styles,
      files: options.files
    })
    return readXmlFromZipFile(options.docxFile, 'word/' + name + '.xml')
      .then(xml => func(bodyReader, xml))
  })
}

const readContentTypesFromZipFile = xmlFileReader({
  filename: '[Content_Types].xml',
  readElement: readContentTypesFromXml,
  defaultValue: defaultContentTypes
})

const readNumberingFromZipFile = xmlFileReader({
  filename: 'word/numbering.xml',
  readElement: numberingXml.readNumberingXml,
  defaultValue: numberingXml.defaultNumbering
})

const readStylesFromZipFile = xmlFileReader({
  filename: 'word/styles.xml',
  readElement: stylesReader.readStylesXml,
  defaultValue: stylesReader.defaultStyles
})
