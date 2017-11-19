export class Files {
  read (uri) {
    return Promise.reject(new Error(`could not open external image: '${uri}'
cannot open linked files from a web browser`))
  }
}
