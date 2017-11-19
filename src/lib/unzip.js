import * as fs from 'fs'

import * as promises from './promises'
import * as zipfile from './zipfile'

const readFile = promises.promisify(fs.readFile)

export default (options = {}) => {
  if (options.path) return readFile(options.path).then(zipfile.openArrayBuffer)
  else if (options.buffer) return Promise.resolve(zipfile.openArrayBuffer(options.buffer))
  else if (options.file) return Promise.resolve(options.file)
  else return Promise.reject(new Error('Could not find file in options'))
}
