import assert from 'assert'
import { assertThat, contains, hasProperties } from 'hamjest'

import * as documents from '../lib/documents'
import * as mammoth from '../lib/index'

const test = require('./test')(module)

test('mammoth.images.inline() should be an alias of mammoth.images.imgElement()', function () {
  assert.ok(mammoth.images.inline === mammoth.images.imgElement)
})

test('mammoth.images.dataUri() encodes images in base64', function () {
  const imageBuffer = Buffer.from('abc')
  const image = new documents.Image({
    readImage: encoding => Promise.resolve(imageBuffer.toString(encoding)),
    contentType: 'image/jpeg'
  })

  return mammoth.images.dataUri(image).then(result => {
    assertThat(result, contains(
      hasProperties({tag: hasProperties({attributes: {'src': 'data:image/jpeg;base64,YWJj'}})})
    ))
  })
})
