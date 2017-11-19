import { Result } from '../results'
import * as documents from '../documents'

export default bodyReader => {
  const readCommentsXml = element => Result.combine(
    element.getElementsByTagName('w:comment')
    .map(readCommentElement)
  )

  const readCommentElement = element => {
    const id = element.attributes['w:id']

    const readOptionalAttribute = name => (element.attributes[name] || '').trim() || null

    return bodyReader.readXmlElements(element.children)
            .map(body => new documents.Comment({
              commentId: id,
              body: body,
              authorName: readOptionalAttribute('w:author'),
              authorInitials: readOptionalAttribute('w:initials')
            }))
  }

  return readCommentsXml
}
