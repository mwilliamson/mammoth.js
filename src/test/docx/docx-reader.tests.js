import assert from 'assert'

import * as documents from '../../lib/documents'
import * as docxReader from '../../lib/docx/docx-reader'

import * as testing from '../testing'

const test = require('../test')(module)
const testData = testing.testData
const createFakeDocxFile = testing.createFakeDocxFile

test('can read document with single paragraph with single run of text', function () {
  const expectedDocument = new documents.Document([
    new documents.Paragraph([
      new documents.Run([
        new documents.Text('Hello.')
      ])
    ])
  ])
  const docxFile = createFakeDocxFile({
    'word/document.xml': testData('simple/word/document.xml')
  })
  return docxReader.read(docxFile).then(result => {
    assert.deepEqual(expectedDocument, result.value)
  })
})

test('hyperlink hrefs are read from relationships file', function () {
  const docxFile = createFakeDocxFile({
    'word/document.xml': testData('hyperlinks/word/document.xml'),
    'word/_rels/document.xml.rels': testData('hyperlinks/word/_rels/document.xml.rels')
  })
  return docxReader.read(docxFile).then(result => {
    const paragraph = result.value.children[0]
    assert.equal(1, paragraph.children.length)
    const hyperlink = paragraph.children[0]
    assert.equal(hyperlink.href, 'http://www.example.com')
    assert.equal(hyperlink.children.length, 1)
  })
})
