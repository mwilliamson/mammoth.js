import assert from 'assert'
import * as fs from 'fs'
import * as path from 'path'

import * as promises from '../../lib/promises'
import { Files, uriToPath } from '../../lib/docx/files'

import * as testing from '../testing'

const test = require('../test')(module)

const readFile = promises.promisify(fs.readFile.bind(fs))

test('Files', {
  'can open files with file URI': function () {
    const filePath = path.resolve(testing.testPath('tiny-picture.png'))
    const files = new Files(null)
    return files.read('file:///' + filePath.replace(/^\//, ''), 'base64')
      .then(contents => readFile(filePath, 'base64')
        .then(expectedContents => {
          assert.deepEqual(contents, expectedContents)
        })
      )
  },

  'can open files with relative URI': function () {
    const filePath = path.resolve(testing.testPath('tiny-picture.png'))
    const files = new Files(testing.testPath('.'))
    return files.read('tiny-picture.png', 'base64')
      .then(contents => readFile(filePath, 'base64')
        .then(expectedContents => {
          assert.deepEqual(contents, expectedContents)
        })
      )
  },

  'given base is not set when opening relative uri then error is raised': function () {
    const files = new Files(null)
    return assertError(files.read('not-a-real-file.png', 'base64'), err => {
      assert.equal(err.message, `could not find external image 'not-a-real-file.png', path of input document is unknown`)
    })
  },

  'error if relative uri cannot be opened': function () {
    const files = new Files('/tmp')
    return assertError(files.read('not-a-real-file.png', 'base64'), err => {
      assertRegex(err.message, /could not open external image: 'not-a-real-file.png' \(document directory: '\/tmp'\)\nENOENT.*\/tmp\/not-a-real-file.png.*/)
    })
  }
})

function assertError (promise, func) {
  return promise.then(() => {
    assert(false, 'Expected error')
  }, func)
}

function assertRegex (actual, expected) {
  assert.ok(expected.test(actual), 'Expected regex: ' + expected + '\nbut was: ' + actual)
}

test('uriToPath', {
  'leading slash is retained on non-Windows file URIs': function () {
    assert.equal(uriToPath('file:///a/b/c', 'linux'), '/a/b/c')
    assert.equal(uriToPath('file:///a/b/c', 'win32'), '/a/b/c')
  },

  'URI is unquoted': function () {
    assert.equal(uriToPath('file:///a%20b'), '/a b')
  },

  'when host is set to localhost then path can be found': function () {
    assert.equal(uriToPath('file://localhost/a/b/c'), '/a/b/c')
  },

  'when host is set but not localhost then path cannot be found': function () {
    assert.throws(function () {
      uriToPath('file://example/a/b/c')
    }, /Could not convert URI to path: file:\/\/example\/a\/b\/c/)
  },

  'leading slash is not dropped on Windows file URIs when platform is not Windows': function () {
    assert.equal(uriToPath('file:///c:/a', 'linux'), '/c:/a')
  },

  'leading slash is dropped on Windows file URIs when platform is Windows': function () {
    assert.equal(uriToPath('file:///c:/a', 'win32'), 'c:/a')
    assert.equal(uriToPath('file:///C:/a', 'win32'), 'C:/a')
  },

  'relative URI is unquoted': function () {
    assert.equal(uriToPath('a%20b/c'), 'a b/c')
  }
})
