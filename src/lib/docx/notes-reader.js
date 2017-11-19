import { Result } from '../results'
import * as documents from '../documents'

const createReader = (noteType, bodyReader) => {
  const readNotesXml = element => Result.combine(
    element.getElementsByTagName('w:' + noteType)
      .filter(isFootnoteElement)
      .map(readFootnoteElement)
  )

  const isFootnoteElement = element => {
    const type = element.attributes['w:type']
    return type !== 'continuationSeparator' && type !== 'separator'
  }

  const readFootnoteElement = footnoteElement => {
    const id = footnoteElement.attributes['w:id']
    return bodyReader.readXmlElements(footnoteElement.children)
      .map(body => new documents.Note({noteType: noteType, noteId: id, body: body}))
  }

  return readNotesXml
}

export const createFootnotesReader = createReader.bind(this, 'footnote')
export const createEndnotesReader = createReader.bind(this, 'endnote')
