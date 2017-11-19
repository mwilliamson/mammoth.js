import assert from 'assert'
import JSZip from 'jszip'

import * as zipfile from '../lib/zipfile'

const test = require('./test')(module)

test('file in zip can be read after being written', function () {
  const zip = emptyZipFile()
  assert(!zip.exists('song/title'))

  zip.write('song/title', 'Dark Blue')

  assert(zip.exists('song/title'))
  return zip.read('song/title', 'utf8')
    .then(contents => {
      assert.equal(contents, 'Dark Blue')
    })
})

const emptyZipFile = () => {
  const zip = new JSZip()
  const buffer = zip.generate({type: 'arraybuffer'})
  return zipfile.openArrayBuffer(buffer)
}
