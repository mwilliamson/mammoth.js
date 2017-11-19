import { Result } from '../results'
import * as documents from '../documents'

export default class DocumentXmlReader {
  constructor (options) {
    this.options = options
    this.bodyReader = options.bodyReader
  }

  convertXmlToDocument (element) {
    const body = element.first('w:body')

    const result = this.bodyReader.readXmlElements(body.children)
      .map(children => new documents.Document(children, {
        notes: this.options.notes,
        comments: this.options.comments
      }))
    return new Result(result.value, result.messages)
  }
}
