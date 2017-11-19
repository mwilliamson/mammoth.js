import assert from 'assert'

import * as uris from '../../lib/docx/uris'

const test = require('../test')(module)

test('uriToZipEntryName', {
  'when path does not have leading slash then path is resolved relative to base': function () {
    assert.equal(
            uris.uriToZipEntryName('one/two', 'three/four'),
            'one/two/three/four'
        )
  },

  'when path has leading slash then base is ignored': function () {
    assert.equal(
            uris.uriToZipEntryName('one/two', '/three/four'),
            'three/four'
        )
  }
})
