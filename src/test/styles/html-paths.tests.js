import assert from 'assert'

import * as htmlPaths from '../../lib/styles/html-paths'

const test = require('../test')(module)
test('element can match multiple tag names', function () {
  const pathPart = htmlPaths.element(['ul', 'ol'])
  assert.ok(pathPart.matchesElement({tagName: 'ul'}))
  assert.ok(pathPart.matchesElement({tagName: 'ol'}))
  assert.ok(!pathPart.matchesElement({tagName: 'p'}))
})

test('element matches if attributes are the same', function () {
  const pathPart = htmlPaths.element(['p'], {'class': 'tip'})
  assert.ok(!pathPart.matchesElement({tagName: 'p'}))
  assert.ok(!pathPart.matchesElement({tagName: 'p', attributes: {'class': 'tip help'}}))
  assert.ok(pathPart.matchesElement({tagName: 'p', attributes: {'class': 'tip'}}))
})
