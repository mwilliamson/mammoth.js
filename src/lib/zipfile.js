import JSZip from 'jszip'

export const openArrayBuffer = arrayBuffer => {
  const zipFile = new JSZip(arrayBuffer)

  return {
    exists (name) {
      return zipFile.file(name) !== null
    },
    read (name, encoding) {
      const array = zipFile.file(name).asUint8Array()
      const buffer = Buffer.from(array)
      if (encoding) {
        return Promise.resolve(buffer.toString(encoding))
      } else {
        return Promise.resolve(buffer)
      }
    },
    write (name, contents) {
      zipFile.file(name, contents)
    },
    toBuffer () {
      return zipFile.generate({type: 'nodebuffer'})
    }
  }
}
