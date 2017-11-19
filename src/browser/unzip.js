import * as zipfile from '../lib/zipfile'

export default (options = {}) => options.arrayBuffer
  ? Promise.resolve(zipfile.openArrayBuffer(options.arrayBuffer))
  : Promise.reject(new Error('Could not find file in options'))
