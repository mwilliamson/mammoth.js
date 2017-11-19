import assert from 'assert'

import * as xml from '../../lib/xml'
import * as documents from '../../lib/documents'
import { CreateBodyReader as createBodyReader } from '../../lib/docx/body-reader'
import createCommentsReader from '../../lib/docx/comments-reader'

const test = require('../test')(module)

const readComment = element => {
  const bodyReader = createBodyReader({})
  const commentsReader = createCommentsReader(bodyReader)
  const comments = commentsReader(element)
  assert.equal(comments.value.length, 1)
  return comments.value[0]
}

test('ID and body of comment are read', function () {
  const body = [xml.element('w:p')]
  const comment = readComment(xml.element('w:comments', {}, [
    xml.element('w:comment', {'w:id': '1'}, body)
  ]))
  assert.deepEqual(comment.body, [new documents.Paragraph([])])
  assert.deepEqual(comment.commentId, '1')
})

test('when optional attributes of comment are missing then they are read as null', function () {
  const comment = readComment(xml.element('w:comments', {}, [
    xml.element('w:comment', {'w:id': '1'})
  ]))
  assert.strictEqual(comment.authorName, null)
  assert.strictEqual(comment.authorInitials, null)
})

test('when optional attributes of comment are blank then they are read as null', function () {
  const comment = readComment(xml.element('w:comments', {}, [
    xml.element('w:comment', {'w:id': '1', 'w:author': ' ', 'w:initials': ' '})
  ]))
  assert.strictEqual(comment.authorName, null)
  assert.strictEqual(comment.authorInitials, null)
})

test('when optional attributes of comment are not blank then they are read', function () {
  const comment = readComment(xml.element('w:comments', {}, [
    xml.element('w:comment', {'w:id': '1', 'w:author': 'The Piemaker', 'w:initials': 'TP'})
  ]))
  assert.strictEqual(comment.authorName, 'The Piemaker')
  assert.strictEqual(comment.authorInitials, 'TP')
})
