import assert from 'assert'
import * as fs from 'fs'
import * as path from 'path'

import * as promises from '../lib/promises'
import openZip from '../lib/unzip'

const test = require('./test')(module)
test('unzip fails if given empty object', function () {
  return openZip({})
    .then(() => {
      assert.ok(false, 'Expected failure')
    }, error => {
      assert.equal('Could not find file in options', error.message)
    })
})

test('unzip can open local zip file', function () {
  const zipPath = path.join(__dirname, 'test-data/hello.zip')
  return openZip({path: zipPath})
    .then(zipFile => zipFile.read('hello', 'utf8'))
    .then(contents => {
      assert.equal(contents, 'Hello world\n')
    })
})

test('unzip can open Buffer', function () {
  const zipPath = path.join(__dirname, 'test-data/hello.zip')
  return promises.nfcall(fs.readFile, zipPath)
    .then(buffer => openZip({buffer: buffer}))
    .then(zipFile => zipFile.read('hello', 'utf8'))
    .then(contents => {
      assert.equal(contents, 'Hello world\n')
    })
})
