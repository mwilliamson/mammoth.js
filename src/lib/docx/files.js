import * as fs from 'fs'
import * as url from 'url'
import * as os from 'os'
import { resolve as resolvePath } from 'path'
import isAbsolutePath from 'path-is-absolute'

import * as promises from '../promises'

export class Files {
  constructor (base) {
    this.base = base
  }

  read (uri, encoding) {
    return this.resolveUri(uri)
      .then(path => readFile(path, encoding)
        .catch(error => Promise.reject(new Error(`could not open external image: '${uri}' (document directory: '${this.base}')
${error.message}`))
        ))
  }

  resolveUri (uri) {
    const path = uriToPath(uri)
    if (isAbsolutePath(path)) return Promise.resolve(path)
    else if (this.base) return Promise.resolve(resolvePath(this.base, path))
    else return Promise.reject(new Error(`could not find external image '${uri}', path of input document is unknown`))
  }
}

const readFile = promises.promisify(fs.readFile.bind(fs))

export const uriToPath = (uriString, platform) => {
  if (!platform) platform = os.platform()

  const uri = url.parse(uriString)
  if (isLocalFileUri(uri) || isRelativeUri(uri)) {
    const path = decodeURIComponent(uri.path)
    if (platform === 'win32' && /^\/[a-z]:/i.test(path)) return path.slice(1)
    else return path
  } else throw new Error('Could not convert URI to path: ' + uriString)
}

const isLocalFileUri = uri => uri.protocol === 'file:' && (!uri.host || uri.host === 'localhost')

const isRelativeUri = uri => !uri.protocol && !uri.host
