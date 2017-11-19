import _ from 'underscore'
import assert from 'assert'
import * as path from 'path'
import * as fs from 'fs'

import * as results from '../lib/results'
import * as promises from '../lib/promises'
import * as mammoth from '../lib/index'

import * as testing from './testing'

const test = require('./test')(module)
const testData = testing.testData
const createFakeDocxFile = testing.createFakeDocxFile

test('should convert docx containing one paragraph to single p element', function () {
  const docxPath = path.join(__dirname, 'test-data/single-paragraph.docx')
  return mammoth.convertToHtml({path: docxPath})
    .then(result => {
      assert.equal(result.value, '<p>Walking on imported air</p>')
      assert.deepEqual(result.messages, [])
    })
})

test('should convert docx represented by a Buffer', function () {
  const docxPath = path.join(__dirname, 'test-data/single-paragraph.docx')
  return promises.nfcall(fs.readFile, docxPath)
    .then(buffer => mammoth.convertToHtml({buffer: buffer}))
    .then(result => {
      assert.equal(result.value, '<p>Walking on imported air</p>')
      assert.deepEqual(result.messages, [])
    })
})

test('should read docx xml files with unicode byte order mark', function () {
  const docxPath = path.join(__dirname, 'test-data/utf8-bom.docx')
  return mammoth.convertToHtml({path: docxPath})
    .then(result => {
      assert.equal(result.value, '<p>This XML has a byte order mark.</p>')
      assert.deepEqual(result.messages, [])
    })
})

test('empty paragraphs are ignored by default', function () {
  const docxPath = path.join(__dirname, 'test-data/empty.docx')
  return mammoth.convertToHtml({path: docxPath})
    .then(result => {
      assert.equal(result.value, '')
      assert.deepEqual(result.messages, [])
    })
})

test('empty paragraphs are preserved if ignoreEmptyParagraphs is false', function () {
  const docxPath = path.join(__dirname, 'test-data/empty.docx')
  return mammoth.convertToHtml({path: docxPath}, {ignoreEmptyParagraphs: false})
    .then(result => {
      assert.equal(result.value, '<p></p>')
      assert.deepEqual(result.messages, [])
    })
})

test('style map can be expressed as string', function () {
  const docxFile = createFakeDocxFile({
    'word/document.xml': testData('simple/word/document.xml')
  })
  const options = {
    styleMap: 'p => h1'
  }
  return mammoth.convertToHtml({file: docxFile}, options)
    .then(result => {
      assert.equal('<h1>Hello.</h1>', result.value)
    })
})

test('style map can be expressed as array of style mappings', function () {
  const docxFile = createFakeDocxFile({
    'word/document.xml': testData('simple/word/document.xml')
  })
  const options = {
    styleMap: ['p => h1']
  }
  return mammoth.convertToHtml({file: docxFile}, options)
    .then(result => {
      assert.equal('<h1>Hello.</h1>', result.value)
    })
})

test('embedded style map is used if present', function () {
  const docxPath = path.join(__dirname, 'test-data/embedded-style-map.docx')
  return mammoth.convertToHtml({path: docxPath})
    .then(result => {
      assert.equal(result.value, '<h1>Walking on imported air</h1>')
      assert.deepEqual(result.messages, [])
    })
})

test('explicit style map takes precedence over embedded style map', function () {
  const docxPath = path.join(__dirname, 'test-data/embedded-style-map.docx')
  const options = {
    styleMap: ['p => p']
  }
  return mammoth.convertToHtml({path: docxPath}, options)
    .then(result => {
      assert.equal(result.value, '<p>Walking on imported air</p>')
      assert.deepEqual(result.messages, [])
    })
})

test('explicit style map is combined with embedded style map', function () {
  const docxPath = path.join(__dirname, 'test-data/embedded-style-map.docx')
  const options = {
    styleMap: ['r => strong']
  }
  return mammoth.convertToHtml({path: docxPath}, options)
    .then(result => {
      assert.equal(result.value, '<h1><strong>Walking on imported air</strong></h1>')
      assert.deepEqual(result.messages, [])
    })
})

test('embedded style maps can be disabled', function () {
  const docxPath = path.join(__dirname, 'test-data/embedded-style-map.docx')
  const options = {
    includeEmbeddedStyleMap: false
  }
  return mammoth.convertToHtml({path: docxPath}, options)
    .then(result => {
      assert.equal(result.value, '<p>Walking on imported air</p>')
      assert.deepEqual(result.messages, [])
    })
})

test('embedded style map can be written and then read', function () {
  const docxPath = path.join(__dirname, 'test-data/single-paragraph.docx')
  return promises.nfcall(fs.readFile, docxPath)
    .then(buffer => mammoth.embedStyleMap({buffer: buffer}, 'p => h1'))
    .then(docx => mammoth.convertToHtml({buffer: docx.toBuffer()}))
    .then(result => {
      assert.equal(result.value, '<h1>Walking on imported air</h1>')
      assert.deepEqual(result.messages, [])
    })
})

test('embedded style map can be retrieved', function () {
  const docxPath = path.join(__dirname, 'test-data/single-paragraph.docx')
  return promises.nfcall(fs.readFile, docxPath)
    .then(buffer => mammoth.embedStyleMap({buffer: buffer}, 'p => h1'))
    .then(docx => mammoth.readEmbeddedStyleMap({buffer: docx.toBuffer()}))
    .then(styleMap => {
      assert.equal(styleMap, 'p => h1')
    })
})

test('warning if style mapping is not understood', function () {
  const docxPath = path.join(__dirname, 'test-data/single-paragraph.docx')
  const options = {
    styleMap: '????\np => h1'
  }
  return mammoth.convertToHtml({path: docxPath}, options)
    .then(result => {
      assert.equal('<h1>Walking on imported air</h1>', result.value)
      const warning = `Did not understand this style mapping, so ignored it: ????
Error was at character number 1: Expected element type but got unrecognisedCharacter "?"`
      assert.deepEqual(result.messages, [results.warning(warning)])
    })
})

test('options are passed to document converter when calling mammoth.convertToHtml', function () {
  const docxFile = createFakeDocxFile({
    'word/document.xml': testData('simple/word/document.xml')
  })
  const options = {
    styleMap: 'p => h1'
  }
  return mammoth.convertToHtml({file: docxFile}, options)
    .then(result => {
      assert.equal('<h1>Hello.</h1>', result.value)
    })
})

test('options.transformDocument is used to transform document if set', function () {
  const docxFile = createFakeDocxFile({
    'word/document.xml': testData('simple/word/document.xml')
  })
  const options = {
    transformDocument: document => {
      document.children[0].styleId = 'Heading1'
      return document
    }
  }
  return mammoth.convertToHtml({file: docxFile}, options)
    .then(result => {
      assert.equal('<h1>Hello.</h1>', result.value)
    })
})

test('mammoth.transforms.paragraph only transforms paragraphs', function () {
  const docxFile = createFakeDocxFile({
    'word/document.xml': testData('simple/word/document.xml')
  })
  const options = {
    transformDocument: mammoth.transforms.paragraph(paragraph => _.extend(paragraph, {styleId: 'Heading1'}))
  }
  return mammoth.convertToHtml({file: docxFile}, options)
    .then(result => {
      assert.equal('<h1>Hello.</h1>', result.value)
    })
})

test('inline images referenced by path relative to part are included in output', function () {
  const docxPath = path.join(__dirname, 'test-data/tiny-picture.docx')
  return mammoth.convertToHtml({path: docxPath})
    .then(result => {
      assert.equal(result.value, '<p><img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAIAAAACUFjqAAAAAXNSR0IArs4c6QAAAAlwSFlzAAAOvgAADr4B6kKxwAAAABNJREFUKFNj/M+ADzDhlWUYqdIAQSwBE8U+X40AAAAASUVORK5CYII=" /></p>')
    })
})

test('inline images referenced by path relative to base are included in output', function () {
  const docxPath = path.join(__dirname, 'test-data/tiny-picture-target-base-relative.docx')
  return mammoth.convertToHtml({path: docxPath})
    .then(result => {
      assert.equal(result.value, '<p><img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAIAAAACUFjqAAAAAXNSR0IArs4c6QAAAAlwSFlzAAAOvgAADr4B6kKxwAAAABNJREFUKFNj/M+ADzDhlWUYqdIAQSwBE8U+X40AAAAASUVORK5CYII=" /></p>')
    })
})

test('src of inline images can be changed', function () {
  const docxPath = path.join(__dirname, 'test-data/tiny-picture.docx')
  const convertImage = mammoth.images.imgElement(element => element.read('base64').then(encodedImage => ({src: encodedImage.substring(0, 2) + ',' + element.contentType})))
  return mammoth.convertToHtml({path: docxPath}, {convertImage: convertImage})
    .then(result => {
      assert.equal(result.value, '<p><img src="iV,image/png" /></p>')
    })
})

test('images stored outside of document are included in output', function () {
  const docxPath = path.join(__dirname, 'test-data/external-picture.docx')
  return mammoth.convertToHtml({path: docxPath})
    .then(result => {
      assert.equal(result.value, '<p><img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAIAAAACUFjqAAAAAXNSR0IArs4c6QAAAAlwSFlzAAAOvgAADr4B6kKxwAAAABNJREFUKFNj/M+ADzDhlWUYqdIAQSwBE8U+X40AAAAASUVORK5CYII=" /></p>')
      assert.deepEqual(result.messages, [])
    })
})

test('error if images stored outside of document are specified when passing file without path', function () {
  const docxPath = path.join(__dirname, 'test-data/external-picture.docx')
  const buffer = fs.readFileSync(docxPath)
  return mammoth.convertToHtml({buffer: buffer})
    .then(result => {
      assert.equal(result.value, '')
      assert.equal(result.messages[0].message, `could not find external image 'tiny-picture.png', path of input document is unknown`)
      assert.equal(result.messages[0].type, 'error')
    })
})

test('simple list is converted to list elements', function () {
  const docxPath = path.join(__dirname, 'test-data/simple-list.docx')
  return mammoth.convertToHtml({path: docxPath})
    .then(result => {
      assert.equal(result.value, '<ul><li>Apple</li><li>Banana</li></ul>')
    })
})

test('word tables are converted to html tables', function () {
  const docxPath = path.join(__dirname, 'test-data/tables.docx')
  return mammoth.convertToHtml({path: docxPath})
    .then(result => {
      const expectedHtml = '<p>Above</p>' +
        '<table>' +
        '<tr><td><p>Top left</p></td><td><p>Top right</p></td></tr>' +
        '<tr><td><p>Bottom left</p></td><td><p>Bottom right</p></td></tr>' +
        '</table>' +
        '<p>Below</p>'
      assert.equal(result.value, expectedHtml)
      assert.deepEqual(result.messages, [])
    })
})

test('footnotes are appended to text', function () {
  // TODO: don't duplicate footnotes with multiple references
  const docxPath = path.join(__dirname, 'test-data/footnotes.docx')
  const options = {
    idPrefix: 'doc-42-'
  }
  return mammoth.convertToHtml({path: docxPath}, options)
    .then(result => {
      const expectedOutput = '<p>Ouch' +
        '<sup><a href="#doc-42-footnote-1" id="doc-42-footnote-ref-1">[1]</a></sup>.' +
        '<sup><a href="#doc-42-footnote-2" id="doc-42-footnote-ref-2">[2]</a></sup></p>' +
        '<ol><li id="doc-42-footnote-1"><p> A tachyon walks into a bar. <a href="#doc-42-footnote-ref-1">↑</a></p></li>' +
        '<li id="doc-42-footnote-2"><p> Fin. <a href="#doc-42-footnote-ref-2">↑</a></p></li></ol>'
      assert.equal(result.value, expectedOutput)
      assert.deepEqual(result.messages, [])
    })
})

test('endnotes are appended to text', function () {
  const docxPath = path.join(__dirname, 'test-data/endnotes.docx')
  const options = {
    idPrefix: 'doc-42-'
  }
  return mammoth.convertToHtml({path: docxPath}, options)
    .then(result => {
      const expectedOutput = '<p>Ouch' +
        '<sup><a href="#doc-42-endnote-2" id="doc-42-endnote-ref-2">[1]</a></sup>.' +
        '<sup><a href="#doc-42-endnote-3" id="doc-42-endnote-ref-3">[2]</a></sup></p>' +
        '<ol><li id="doc-42-endnote-2"><p> A tachyon walks into a bar. <a href="#doc-42-endnote-ref-2">↑</a></p></li>' +
        '<li id="doc-42-endnote-3"><p> Fin. <a href="#doc-42-endnote-ref-3">↑</a></p></li></ol>'
      assert.equal(result.value, expectedOutput)
      assert.deepEqual(result.messages, [])
    })
})

test('relationships are handled properly in footnotes', function () {
  const docxPath = path.join(__dirname, 'test-data/footnote-hyperlink.docx')
  const options = {
    idPrefix: 'doc-42-'
  }
  return mammoth.convertToHtml({path: docxPath}, options)
    .then(result => {
      const expectedOutput =
        '<p><sup><a href="#doc-42-footnote-1" id="doc-42-footnote-ref-1">[1]</a></sup></p>' +
        '<ol><li id="doc-42-footnote-1"><p> <a href="http://www.example.com">Example</a> <a href="#doc-42-footnote-ref-1">↑</a></p></li></ol>'
      assert.equal(result.value, expectedOutput)
      assert.deepEqual(result.messages, [])
    })
})

test('when style mapping is defined for comment references then comments are included', function () {
  const docxPath = path.join(__dirname, 'test-data/comments.docx')
  const options = {
    idPrefix: 'doc-42-',
    styleMap: 'comment-reference => sup'
  }
  return mammoth.convertToHtml({path: docxPath}, options)
    .then(result => {
      const expectedOutput = (
        '<p>Ouch' +
        '<sup><a href="#doc-42-comment-0" id="doc-42-comment-ref-0">[MW1]</a></sup>.' +
        '<sup><a href="#doc-42-comment-2" id="doc-42-comment-ref-2">[MW2]</a></sup></p>' +
        '<dl><dt id="doc-42-comment-0">Comment [MW1]</dt><dd><p>A tachyon walks into a bar. <a href="#doc-42-comment-ref-0">↑</a></p></dd>' +
        '<dt id="doc-42-comment-2">Comment [MW2]</dt><dd><p>Fin. <a href="#doc-42-comment-ref-2">↑</a></p></dd></dl>'
      )
      assert.equal(result.value, expectedOutput)
      assert.deepEqual(result.messages, [])
    })
})

test('textboxes are read', function () {
  const docxPath = path.join(__dirname, 'test-data/text-box.docx')
  return mammoth.convertToHtml({path: docxPath})
    .then(result => {
      const expectedOutput = '<p>Datum plane</p>'
      assert.equal(result.value, expectedOutput)
    })
})

test('underline is ignored by default', function () {
  const docxPath = path.join(__dirname, 'test-data/underline.docx')
  return mammoth.convertToHtml({path: docxPath})
    .then(result => {
      assert.equal(result.value, '<p><strong>The Sunset Tree</strong></p>')
    })
})

test('underline can be configured with style mapping', function () {
  const docxPath = path.join(__dirname, 'test-data/underline.docx')
  return mammoth.convertToHtml({path: docxPath}, {styleMap: 'u => em'})
    .then(result => {
      assert.equal(result.value, '<p><strong>The <em>Sunset</em> Tree</strong></p>')
    })
})

test('strikethrough is converted to <s> by default', function () {
  const docxPath = path.join(__dirname, 'test-data/strikethrough.docx')
  return mammoth.convertToHtml({path: docxPath})
    .then(result => {
      assert.equal(result.value, '<p><s>Today\'s Special: Salmon</s> Sold out</p>')
    })
})

test('strikethrough conversion can be configured with style mappings', function () {
  const docxPath = path.join(__dirname, 'test-data/strikethrough.docx')
  return mammoth.convertToHtml({path: docxPath}, {styleMap: 'strike => del'})
    .then(result => {
      assert.equal(result.value, '<p><del>Today\'s Special: Salmon</del> Sold out</p>')
    })
})

test('indentation is used if prettyPrint is true', function () {
  const docxPath = path.join(__dirname, 'test-data/single-paragraph.docx')
  return mammoth.convertToHtml({path: docxPath}, {prettyPrint: true})
    .then(result => {
      assert.equal(result.value, '<p>\n  Walking on imported air\n</p>')
      assert.deepEqual(result.messages, [])
    })
})

test('using styleMapping throws error', function () {
  try {
    mammoth.styleMapping()
  } catch (error) {
    assert.equal(
      error.message,
      'Use a raw string instead of mammoth.styleMapping e.g. "p[style-name=\'Title\'] => h1" instead of mammoth.styleMapping("p[style-name=\'Title\'] => h1")'
    )
  }
})

test('can convert single paragraph to markdown', function () {
  const docxPath = path.join(__dirname, 'test-data/single-paragraph.docx')
  return mammoth.convertToMarkdown({path: docxPath})
    .then(result => {
      assert.equal(result.value, 'Walking on imported air\n\n')
      assert.deepEqual(result.messages, [])
    })
})

test('extractRawText only retains raw text', function () {
  const docxPath = path.join(__dirname, 'test-data/simple-list.docx')
  return mammoth.extractRawText({path: docxPath})
    .then(result => {
      assert.equal(result.value, 'Apple\n\nBanana\n\n')
    })
})

test('extractRawText can use .docx files represented by a Buffer', function () {
  const docxPath = path.join(__dirname, 'test-data/single-paragraph.docx')
  return promises.nfcall(fs.readFile, docxPath)
    .then(buffer => mammoth.extractRawText({buffer: buffer}))
    .then(result => {
      assert.equal(result.value, 'Walking on imported air\n\n')
      assert.deepEqual(result.messages, [])
    })
})

test('should throw error if file is not a valid docx document', function () {
  const docxPath = path.join(__dirname, 'test-data/empty.zip')
  return mammoth.convertToHtml({path: docxPath})
    .then(result => {
      assert.ok(false, 'Expected error')
    }, error => {
      assert.equal(error.message, 'Could not find word/document.xml in ZIP file. Are you sure this is a valid .docx file?')
    })
})
