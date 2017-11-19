import assert from 'assert'

import { Element as XmlElement } from '../../lib/xml'
import * as documents from '../../lib/documents'
import { CreateBodyReader } from '../../lib/docx/body-reader'
import { createFootnotesReader } from '../../lib/docx/notes-reader'

const test = require('../test')(module)

test('ID and body of footnote are read', function () {
  const bodyReader = CreateBodyReader({})
  const footnoteBody = [new XmlElement('w:p', {}, [])]
  const footnotes = createFootnotesReader(bodyReader)(
    new XmlElement('w:footnotes', {}, [
      new XmlElement('w:footnote', {'w:id': '1'}, footnoteBody)
    ])
  )
  assert.equal(footnotes.value.length, 1)
  assert.deepEqual(footnotes.value[0].body, [new documents.Paragraph([])])
  assert.deepEqual(footnotes.value[0].noteId, '1')
})

footnoteTypeIsIgnored('continuationSeparator')
footnoteTypeIsIgnored('separator')

function footnoteTypeIsIgnored (type) {
  test('footnotes of type ' + type + ' are ignored', function () {
    const footnotes = createFootnotesReader()(
      new XmlElement('w:footnotes', {}, [
        new XmlElement('w:footnote', {'w:id': '1', 'w:type': type}, [])
      ])
    )
    assert.equal(footnotes.value.length, 0)
  })
}
