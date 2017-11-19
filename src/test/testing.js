import _ from 'underscore'
import * as path from 'path'
import * as fs from 'fs'

import * as promises from '../lib/promises'

export const testPath = filename => path.join(__dirname, 'test-data', filename)

export const testData = testDataPath => {
  const fullPath = testPath(testDataPath)
  return promises.nfcall(fs.readFile, fullPath, 'utf-8')
}

export const createFakeDocxFile = files => {
  const exists = path => !!files[path]

  return {
    read: createRead(files),
    exists: exists
  }
}

export const createFakeFiles = files => ({
  read: createRead(files)
})

const createRead = files => (path, encoding) =>
  Promise.resolve(files[path], buffer => {
    if (_.isString(buffer)) buffer = Buffer.from(buffer)

    if (!Buffer.isBuffer(buffer)) return Promise.reject(new Error('file was not a buffer'))
    else if (encoding) return Promise.resolve(buffer.toString(encoding))
    else return Promise.resolve(buffer)
  })
