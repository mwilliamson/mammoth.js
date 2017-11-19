import assert from 'assert'

import * as results from '../lib/results'
import * as Html from '../lib/html/index'
import * as htmlPaths from '../lib/styles/html-paths'
import * as documentMatchers from '../lib/styles/document-matchers'
import * as xml from '../lib/xml'
import * as documents from '../lib/documents'

import { commentAuthorLabel, DocumentConverter } from '../lib/document-to-html'

const test = require('./test')(module)
test('should empty document to empty string', function () {
  const document = new documents.Document([])
  const converter = new DocumentConverter()
  return converter.convertToHtml(document)
    .then(result => {
      assert.equal(result.value, '')
    })
})

test('should convert document containing one paragraph to single p element', function () {
  const document = new documents.Document([
    paragraphOfText('Hello.')
  ])
  const converter = new DocumentConverter()
  return converter.convertToHtml(document)
    .then(result => {
      assert.equal(result.value, '<p>Hello.</p>')
    })
})

test('ignores empty paragraphs', function () {
  const document = new documents.Document([
    paragraphOfText('')
  ])
  const converter = new DocumentConverter()
  return converter.convertToHtml(document)
    .then(result => {
      assert.equal(result.value, '')
    })
})

test('text is HTML-escaped', function () {
  const document = new documents.Document([
    paragraphOfText('1 < 2')
  ])
  const converter = new DocumentConverter()
  return converter.convertToHtml(document)
    .then(result => {
      assert.equal(result.value, '<p>1 &lt; 2</p>')
    })
})

test('should convert document containing multiple paragraphs to multiple p elements', function () {
  const document = new documents.Document([
    paragraphOfText('Hello.'),
    paragraphOfText('Goodbye.')
  ])
  const converter = new DocumentConverter()
  return converter.convertToHtml(document)
    .then(result => {
      assert.equal(result.value, '<p>Hello.</p><p>Goodbye.</p>')
    })
})

test('uses style mappings to pick HTML element for docx paragraph', function () {
  const document = new documents.Document([
    paragraphOfText('Hello.', 'Heading1', 'Heading 1')
  ])
  const converter = new DocumentConverter({
    styleMap: [
      {
        from: documentMatchers.paragraph({styleName: documentMatchers.equalTo('Heading 1')}),
        to: htmlPaths.topLevelElement('h1')
      }
    ]
  })
  return converter.convertToHtml(document)
    .then(result => {
      assert.equal(result.value, '<h1>Hello.</h1>')
    })
})

test('mappings for style names are case insensitive', function () {
  const document = new documents.Document([
    paragraphOfText('Hello.', 'Heading1', 'heading 1')
  ])
  const converter = new DocumentConverter({
    styleMap: [
      {
        from: documentMatchers.paragraph({styleName: documentMatchers.equalTo('Heading 1')}),
        to: htmlPaths.topLevelElement('h1')
      }
    ]
  })
  return converter.convertToHtml(document)
    .then(result => {
      assert.equal(result.value, '<h1>Hello.</h1>')
    })
})

test('can use non-default HTML element for unstyled paragraphs', function () {
  const document = new documents.Document([
    paragraphOfText('Hello.')
  ])
  const converter = new DocumentConverter({
    styleMap: [
      {
        from: documentMatchers.paragraph(),
        to: htmlPaths.topLevelElement('h1')
      }
    ]
  })
  return converter.convertToHtml(document)
    .then(result => {
      assert.equal(result.value, '<h1>Hello.</h1>')
    })
})

test('warning is emitted if paragraph style is unrecognised', function () {
  const document = new documents.Document([
    paragraphOfText('Hello.', 'Heading1', 'Heading 1')
  ])
  const converter = new DocumentConverter()
  return converter.convertToHtml(document)
    .then(result => {
      assert.deepEqual(result.messages, [results.warning(`Unrecognised paragraph style: 'Heading 1' (Style ID: Heading1)`)])
    })
})

test('can use stacked styles to generate nested HTML elements', function () {
  const document = new documents.Document([
    paragraphOfText('Hello.')
  ])
  const converter = new DocumentConverter({
    styleMap: [
      {
        from: documentMatchers.paragraph(),
        to: htmlPaths.elements(['h1', 'span'])
      }
    ]
  })
  return converter.convertToHtml(document)
    .then(result => {
      assert.equal(result.value, '<h1><span>Hello.</span></h1>')
    })
})

test('bold runs are wrapped in <strong> tags by default', function () {
  const run = runOfText('Hello.', {isBold: true})
  const converter = new DocumentConverter()
  return converter.convertToHtml(run)
    .then(result => {
      assert.equal(result.value, '<strong>Hello.</strong>')
    })
})

test('bold runs can be configured with style mapping', function () {
  const run = runOfText('Hello.', {isBold: true})
  const converter = new DocumentConverter({
    styleMap: [
      {
        from: documentMatchers.bold,
        to: htmlPaths.elements([htmlPaths.element('em')])
      }
    ]
  })
  return converter.convertToHtml(run)
    .then(result => {
      assert.equal(result.value, '<em>Hello.</em>')
    })
})

test('bold runs can exist inside other tags', function () {
  const run = new documents.Paragraph([
    runOfText('Hello.', {isBold: true})
  ])
  const converter = new DocumentConverter()
  return converter.convertToHtml(run)
    .then(result => {
      assert.equal(result.value, '<p><strong>Hello.</strong></p>')
    })
})

test('consecutive bold runs are wrapped in a single <strong> element', function () {
  const paragraph = new documents.Paragraph([
    runOfText('Hello', {isBold: true}),
    runOfText('.', {isBold: true})
  ])
  const converter = new DocumentConverter()
  return converter.convertToHtml(paragraph)
    .then(result => {
      assert.equal(result.value, '<p><strong>Hello.</strong></p>')
    })
})

test('underline runs are ignored by default', function () {
  const run = runOfText('Hello.', {isUnderline: true})
  const converter = new DocumentConverter()
  return converter.convertToHtml(run)
    .then(result => {
      assert.equal(result.value, 'Hello.')
    })
})

test('underline runs can be mapped using style mapping', function () {
  const run = runOfText('Hello.', {isUnderline: true})
  const converter = new DocumentConverter({
    styleMap: [
      {
        from: documentMatchers.underline,
        to: htmlPaths.elements([htmlPaths.element('u')])
      }
    ]
  })
  return converter.convertToHtml(run)
    .then(result => {
      assert.equal(result.value, '<u>Hello.</u>')
    })
})

test('style mapping for underline runs does not close parent elements', function () {
  const run = runOfText('Hello.', {isUnderline: true, isBold: true})
  const converter = new DocumentConverter({
    styleMap: [
      {
        from: documentMatchers.underline,
        to: htmlPaths.elements([htmlPaths.element('u')])
      }
    ]
  })
  return converter.convertToHtml(run)
    .then(result => {
      assert.equal(result.value, '<strong><u>Hello.</u></strong>')
    })
})

test('strikethrough runs are wrapped in <s> tags by default', function () {
  const run = runOfText('Hello.', {isStrikethrough: true})
  const converter = new DocumentConverter()
  return converter.convertToHtml(run)
    .then(result => {
      assert.equal(result.value, '<s>Hello.</s>')
    })
})

test('strikethrough runs can be configured with style mapping', function () {
  const run = runOfText('Hello.', {isStrikethrough: true})
  const converter = new DocumentConverter({
    styleMap: [
      {
        from: documentMatchers.strikethrough,
        to: htmlPaths.elements([htmlPaths.element('del')])
      }
    ]
  })
  return converter.convertToHtml(run)
    .then(result => {
      assert.equal(result.value, '<del>Hello.</del>')
    })
})

test('italic runs are wrapped in <em> tags', function () {
  const run = runOfText('Hello.', {isItalic: true})
  const converter = new DocumentConverter()
  return converter.convertToHtml(run)
    .then(result => {
      assert.equal(result.value, '<em>Hello.</em>')
    })
})

test('italic runs can be configured with style mapping', function () {
  const run = runOfText('Hello.', {isItalic: true})
  const converter = new DocumentConverter({
    styleMap: [
      {
        from: documentMatchers.italic,
        to: htmlPaths.elements([htmlPaths.element('strong')])
      }
    ]
  })
  return converter.convertToHtml(run)
    .then(result => {
      assert.equal(result.value, '<strong>Hello.</strong>')
    })
})

test('run can be both bold and italic', function () {
  const run = runOfText('Hello.', {isBold: true, isItalic: true})
  const converter = new DocumentConverter()
  return converter.convertToHtml(run)
    .then(result => {
      assert.equal(result.value, '<strong><em>Hello.</em></strong>')
    })
})

test('superscript runs are wrapped in <sup> tags', function () {
  const run = runOfText('Hello.', {
    verticalAlignment: documents.verticalAlignment.superscript
  })
  const converter = new DocumentConverter()
  return converter.convertToHtml(run)
    .then(result => {
      assert.equal(result.value, '<sup>Hello.</sup>')
    })
})

test('subscript runs are wrapped in <sub> tags', function () {
  const run = runOfText('Hello.', {
    verticalAlignment: documents.verticalAlignment.subscript
  })
  const converter = new DocumentConverter()
  return converter.convertToHtml(run)
    .then(result => {
      assert.equal(result.value, '<sub>Hello.</sub>')
    })
})

test('small caps runs are ignored by default', function () {
  const run = runOfText('Hello.', {isSmallCaps: true})
  const converter = new DocumentConverter()
  return converter.convertToHtml(run)
    .then(result => {
      assert.equal(result.value, 'Hello.')
    })
})

test('small caps runs can be configured with style mapping', function () {
  const run = runOfText('Hello.', {isSmallCaps: true})
  const converter = new DocumentConverter({
    styleMap: [
      {
        from: documentMatchers.smallCaps,
        to: htmlPaths.elements([htmlPaths.element('span')])
      }
    ]
  })
  return converter.convertToHtml(run)
    .then(result => {
      assert.equal(result.value, '<span>Hello.</span>')
    })
})

test('run styles are converted to HTML if mapping exists', function () {
  const run = runOfText('Hello.', {styleId: 'Heading1Char', styleName: 'Heading 1 Char'})
  const converter = new DocumentConverter({
    styleMap: [
      {
        from: documentMatchers.run({styleName: documentMatchers.equalTo('Heading 1 Char')}),
        to: htmlPaths.elements(['strong'])
      }
    ]
  })
  return converter.convertToHtml(run)
    .then(result => {
      assert.equal(result.value, '<strong>Hello.</strong>')
    })
})

test('warning is emitted if run style is unrecognised', function () {
  const run = runOfText('Hello.', {styleId: 'Heading1Char', styleName: 'Heading 1 Char'})
  const converter = new DocumentConverter()
  return converter.convertToHtml(run)
    .then(result => {
      assert.deepEqual(result.messages, [results.warning(`Unrecognised run style: 'Heading 1 Char' (Style ID: Heading1Char)`)])
    })
})

test('docx hyperlink is converted to <a>', function () {
  const hyperlink = new documents.Hyperlink(
    [runOfText('Hello.')],
    {href: 'http://www.example.com'}
  )
  const converter = new DocumentConverter()
  return converter.convertToHtml(hyperlink)
    .then(result => {
      assert.equal(result.value, '<a href="http://www.example.com">Hello.</a>')
    })
})

test('docx hyperlink with anchor is converted to <a>', function () {
  const hyperlink = new documents.Hyperlink(
    [runOfText('Hello.')],
    {anchor: '_Peter'}
  )
  const converter = new DocumentConverter({
    idPrefix: 'doc-42-'
  })
  return converter.convertToHtml(hyperlink)
    .then(result => {
      assert.equal(result.value, '<a href="#doc-42-_Peter">Hello.</a>')
    })
})

test('hyperlink target frame is used as anchor target', function () {
  const hyperlink = new documents.Hyperlink(
    [runOfText('Hello.')],
    {anchor: 'start', targetFrame: '_blank'}
  )
  const converter = new DocumentConverter()
  return converter.convertToHtml(hyperlink)
    .then(result => {
      assert.equal(result.value, '<a href="#start" target="_blank">Hello.</a>')
    })
})

test('bookmarks are converted to anchors', function () {
  const bookmarkStart = new documents.BookmarkStart({name: '_Peter'})
  const converter = new DocumentConverter({
    idPrefix: 'doc-42-'
  })
  const document = new documents.Document([bookmarkStart])
  return converter.convertToHtml(document)
    .then(result => {
      assert.equal(result.value, '<a id="doc-42-_Peter"></a>')
    })
})

test('docx tab is converted to tab in HTML', function () {
  const tab = new documents.Tab()
  const converter = new DocumentConverter()
  return converter.convertToHtml(tab)
    .then(result => {
      assert.equal(result.value, '\t')
    })
})

test('docx table is converted to table in HTML', function () {
  const table = new documents.Table([
    new documents.TableRow([
      new documents.TableCell([paragraphOfText('Top left')]),
      new documents.TableCell([paragraphOfText('Top right')])
    ]),
    new documents.TableRow([
      new documents.TableCell([paragraphOfText('Bottom left')]),
      new documents.TableCell([paragraphOfText('Bottom right')])
    ])
  ])
  const converter = new DocumentConverter()

  return converter.convertToHtml(table)
    .then(result => {
      const expectedHtml = '<table>' +
        '<tr><td><p>Top left</p></td><td><p>Top right</p></td></tr>' +
        '<tr><td><p>Bottom left</p></td><td><p>Bottom right</p></td></tr>' +
        '</table>'
      assert.equal(result.value, expectedHtml)
    })
})

test('table style mappings can be used to map tables', function () {
  const table = new documents.Table([], {styleName: 'Normal Table'})
  const converter = new DocumentConverter({
    styleMap: [
      {
        from: documentMatchers.table({styleName: documentMatchers.equalTo('Normal Table')}),
        to: htmlPaths.topLevelElement('table', {'class': 'normal-table'})
      }
    ]
  })

  return converter.convertToHtml(table)
    .then(result => {
      const expectedHtml = '<table class="normal-table"></table>'
      assert.equal(result.value, expectedHtml)
    })
})

test('header rows are wrapped in thead', function () {
  const table = new documents.Table([
    new documents.TableRow([new documents.TableCell([])], {isHeader: true}),
    new documents.TableRow([new documents.TableCell([])], {isHeader: true}),
    new documents.TableRow([new documents.TableCell([])], {isHeader: false})
  ])
  const converter = new DocumentConverter()

  return converter.convertToHtml(table)
    .then(result => {
      const expectedHtml = '<table>' +
        '<thead><tr><th></th></tr><tr><th></th></tr></thead>' +
        '<tbody><tr><td></td></tr></tbody>' +
        '</table>'
      assert.equal(result.value, expectedHtml)
    })
})

test('tbody is omitted if all rows are headers', function () {
  const table = new documents.Table([
    new documents.TableRow([new documents.TableCell([])], {isHeader: true})
  ])
  const converter = new DocumentConverter()

  return converter.convertToHtml(table)
    .then(result => {
      const expectedHtml = '<table>' +
        '<thead><tr><th></th></tr></thead>' +
        '</table>'
      assert.equal(result.value, expectedHtml)
    })
})

test('unexpected table children do not cause error', function () {
  const table = new documents.Table([
    new documents.Tab()
  ])
  const converter = new DocumentConverter()

  return converter.convertToHtml(table)
    .then(result => {
      const expectedHtml = '<table>\t</table>'
      assert.equal(result.value, expectedHtml)
    })
})

test('empty cells are preserved in table', function () {
  const table = new documents.Table([
    new documents.TableRow([
      new documents.TableCell([paragraphOfText('')]),
      new documents.TableCell([paragraphOfText('Top right')])
    ])
  ])
  const converter = new DocumentConverter()

  return converter.convertToHtml(table)
    .then(result => {
      const expectedHtml = '<table>' +
        '<tr><td></td><td><p>Top right</p></td></tr>' +
        '</table>'
      assert.equal(result.value, expectedHtml)
    })
})

test('table cells are written with colSpan if not equal to one', function () {
  const table = new documents.Table([
    new documents.TableRow([
      new documents.TableCell([paragraphOfText('Top left')], {colSpan: 2}),
      new documents.TableCell([paragraphOfText('Top right')])
    ])
  ])
  const converter = new DocumentConverter()

  return converter.convertToHtml(table)
    .then(result => {
      const expectedHtml = '<table>' +
        '<tr><td colspan="2"><p>Top left</p></td><td><p>Top right</p></td></tr>' +
        '</table>'
      assert.equal(result.value, expectedHtml)
    })
})

test('table cells are written with rowSpan if not equal to one', function () {
  const table = new documents.Table([
    new documents.TableRow([
      new documents.TableCell([], {rowSpan: 2})
    ])
  ])
  const converter = new DocumentConverter()

  return converter.convertToHtml(table)
    .then(result => {
      const expectedHtml = '<table>' +
        '<tr><td rowspan="2"></td></tr>' +
        '</table>'
      assert.equal(result.value, expectedHtml)
    })
})

test('line break is converted to <br>', function () {
  const converter = new DocumentConverter()

  return converter.convertToHtml(documents.lineBreak)
    .then(result => {
      assert.equal(result.value, '<br />')
    })
})

test('breaks that are not line breaks are ignored', function () {
  const converter = new DocumentConverter()

  return converter.convertToHtml(documents.pageBreak)
    .then(result => {
      assert.equal(result.value, '')
    })
})

test('breaks can be mapped using style mappings', function () {
  const converter = new DocumentConverter({
    styleMap: [
      {
        from: documentMatchers.pageBreak,
        to: htmlPaths.topLevelElement('hr')
      }
    ]
  })

  return converter.convertToHtml(documents.pageBreak)
    .then(result => {
      assert.equal(result.value, '<hr />')
    })
})

test('footnote reference is converted to superscript intra-page link', function () {
  const footnoteReference = new documents.NoteReference({
    noteType: 'footnote',
    noteId: '4'
  })
  const converter = new DocumentConverter({
    idPrefix: 'doc-42-'
  })
  return converter.convertToHtml(footnoteReference)
    .then(result => {
      assert.equal(result.value, '<sup><a href="#doc-42-footnote-4" id="doc-42-footnote-ref-4">[1]</a></sup>')
    })
})

test('footnotes are included after the main body', function () {
  const footnoteReference = new documents.NoteReference({
    noteType: 'footnote',
    noteId: '4'
  })
  const document = new documents.Document(
    [new documents.Paragraph([
      runOfText('Knock knock'),
      new documents.Run([footnoteReference])
    ])],
    {
      notes: new documents.Notes({
        4: new documents.Note({
          noteType: 'footnote',
          noteId: '4',
          body: [paragraphOfText('Who\'s there?')]
        })
      })
    }
  )

  const converter = new DocumentConverter({
    idPrefix: 'doc-42-'
  })
  return converter.convertToHtml(document)
    .then(result => {
      const expectedOutput = '<p>Knock knock<sup><a href="#doc-42-footnote-4" id="doc-42-footnote-ref-4">[1]</a></sup></p>' +
        '<ol><li id="doc-42-footnote-4"><p>Who\'s there? <a href="#doc-42-footnote-ref-4">↑</a></p></li></ol>'
      assert.equal(result.value, expectedOutput)
    })
})

test('comments are ignored by default', function () {
  const reference = new documents.CommentReference({commentId: '4'})
  const comment = new documents.Comment({
    commentId: '4',
    body: [paragraphOfText('Who\'s there?')]
  })
  const document = new documents.Document([
    new documents.Paragraph([
      runOfText('Knock knock'),
      new documents.Run([reference])
    ])
  ], {comments: [comment]})

  const converter = new DocumentConverter({})
  return converter.convertToHtml(document)
    .then(result => {
      assert.equal(result.value, '<p>Knock knock</p>')
      assert.deepEqual(result.messages, [])
    })
})

test('comment references are linked to comment after main body', function () {
  const reference = new documents.CommentReference({commentId: '4'})
  const comment = new documents.Comment({
    commentId: '4',
    body: [paragraphOfText('Who\'s there?')],
    authorName: 'The Piemaker',
    authorInitials: 'TP'
  })
  const document = new documents.Document([
    new documents.Paragraph([
      runOfText('Knock knock'),
      new documents.Run([reference])
    ])
  ], {comments: [comment]})

  const converter = new DocumentConverter({
    idPrefix: 'doc-42-',
    styleMap: [
      {from: documentMatchers.commentReference, to: htmlPaths.element('sup')}
    ]
  })
  return converter.convertToHtml(document)
    .then(result => {
      const expectedHtml = (
        '<p>Knock knock<sup><a href="#doc-42-comment-4" id="doc-42-comment-ref-4">[TP1]</a></sup></p>' +
        '<dl><dt id="doc-42-comment-4">Comment [TP1]</dt><dd><p>Who\'s there? <a href="#doc-42-comment-ref-4">↑</a></p></dd></dl>'
      )
      assert.equal(result.value, expectedHtml)
      assert.deepEqual(result.messages, [])
    })
})

test('images are written with data URIs', function () {
  const imageBuffer = Buffer.from('Not an image at all!')
  const image = new documents.Image({
    readImage: function (encoding) {
      return Promise.resolve(imageBuffer.toString(encoding))
    },
    contentType: 'image/png'
  })
  const converter = new DocumentConverter()
  return converter.convertToHtml(image)
    .then(result => {
      assert.equal(result.value, '<img src="data:image/png;base64,' + imageBuffer.toString('base64') + '" />')
    })
})

test('images have alt attribute if available', function () {
  const imageBuffer = Buffer.from('Not an image at all!')
  const image = new documents.Image({
    readImage: function () {
      return Promise.resolve(imageBuffer)
    },
    altText: 'It\'s a hat'
  })
  const converter = new DocumentConverter()
  return converter.convertToHtml(image)
    .then(result => xml.readString(result.value))
    .then(htmlImageElement => {
      assert.equal(htmlImageElement.attributes.alt, `It's a hat`)
    })
})

test('can add custom handler for images', function () {
  const imageBuffer = Buffer.from('Not an image at all!')
  const image = new documents.Image({
    readImage: encoding => Promise.resolve(imageBuffer.toString(encoding)),
    contentType: 'image/png'
  })
  const converter = new DocumentConverter({
    convertImage: (element, messages) => element.read('utf8').then(altText => [Html.freshElement('img', {alt: altText})])
  })
  return converter.convertToHtml(image).then(result => {
    assert.equal(result.value, '<img alt="Not an image at all!" />')
  })
})

test('when custom image handler throws error then error is stored in error message', function () {
  const error = new Error('Failed to convert image')
  const image = new documents.Image({
    readImage: encoding => Promise.resolve(Buffer.alloc(0).toString(encoding)),
    contentType: 'image/png'
  })
  const converter = new DocumentConverter({
    convertImage: (element, messages) => {
      throw error
    }
  })
  return converter.convertToHtml(image).then(function (result) {
    assert.equal(result.value, '')
    assert.equal(result.messages.length, 1)
    const message = result.messages[0]
    assert.equal('error', message.type)
    assert.equal('Failed to convert image', message.message)
    assert.equal(error, message.error)
  })
})

test('long documents do not cause stack overflow', function () {
  const paragraphs = []
  for (let i = 0; i < 1000; i++) {
    paragraphs.push(paragraphOfText('Hello.'))
  }
  const document = new documents.Document(paragraphs)
  const converter = new DocumentConverter()
  return converter.convertToHtml(document).then(result => {
    assert.equal(result.value.indexOf('<p>Hello.</p>'), 0)
  })
})

function paragraphOfText (text, styleId, styleName) {
  const run = runOfText(text)
  return new documents.Paragraph([run], {
    styleId: styleId,
    styleName: styleName
  })
}

function runOfText (text, properties) {
  const textElement = new documents.Text(text)
  return new documents.Run([textElement], properties)
}

test('when initials are not blank then comment author label is initials', function () {
  assert.equal(commentAuthorLabel({authorInitials: 'TP'}), 'TP')
})

test('when initials are blank then comment author label is blank', function () {
  assert.equal(commentAuthorLabel({authorInitials: ''}), '')
  assert.equal(commentAuthorLabel({authorInitials: undefined}), '')
  assert.equal(commentAuthorLabel({authorInitials: null}), '')
})
