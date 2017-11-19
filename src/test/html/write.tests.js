import assert from 'assert'

import * as html from '../../lib/html/index'
import * as writers from '../../lib/writers'

const test = require('../test')(module)
test('text is HTML escaped', function () {
  assert.equal(
        generateString(html.text('<>&')),
        '&lt;&gt;&amp;')
})

test('double quotes outside of attributes are not escaped', function () {
  assert.equal(
        generateString(html.text('"')),
        '"')
})

test('element attributes are HTML escaped', function () {
  assert.equal(
        generateString(html.freshElement('p', {'x': '<'})),
        '<p x="&lt;"></p>')
})

test('double quotes inside attributes are escaped', function () {
  assert.equal(
        generateString(html.freshElement('p', {'x': '"'})),
        '<p x="&quot;"></p>')
})

test('element children are written', function () {
  assert.equal(
        generateString(html.freshElement('p', {}, [html.text('Hello')])),
        '<p>Hello</p>')
})

const generateString = node => {
  const writer = writers.writer()
  html.write(writer, [node])
  return writer.asString()
}
