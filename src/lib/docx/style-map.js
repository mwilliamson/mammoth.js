import _ from 'underscore'

import * as xml from '../xml/index'

const schema = 'http://schemas.zwobble.org/mammoth/style-map'
const styleMapPath = 'mammoth/style-map'
const styleMapAbsolutePath = '/' + styleMapPath

export const writeStyleMap = (docxFile, styleMap) => {
  docxFile.write(styleMapPath, styleMap)
  return updateRelationships(docxFile).then(() => updateContentTypes(docxFile))
}

const updateRelationships = docxFile => {
  const path = 'word/_rels/document.xml.rels'
  const relationshipsUri = 'http://schemas.openxmlformats.org/package/2006/relationships'
  const relationshipElementName = '{' + relationshipsUri + '}Relationship'
  return docxFile.read(path, 'utf8')
    .then(xml.readString)
    .then(relationshipsContainer => {
      const relationships = relationshipsContainer.children
      addOrUpdateElement(relationships, relationshipElementName, 'Id', {
        'Id': 'rMammothStyleMap',
        'Type': schema,
        'Target': styleMapAbsolutePath
      })

      const namespaces = {'': relationshipsUri}
      return docxFile.write(path, xml.writeString(relationshipsContainer, namespaces))
    })
}

const updateContentTypes = docxFile => {
  const path = '[Content_Types].xml'
  const contentTypesUri = 'http://schemas.openxmlformats.org/package/2006/content-types'
  const overrideName = '{' + contentTypesUri + '}Override'
  return docxFile.read(path, 'utf8')
    .then(xml.readString)
    .then(typesElement => {
      const children = typesElement.children
      addOrUpdateElement(children, overrideName, 'PartName', {
        'PartName': styleMapAbsolutePath,
        'ContentType': 'text/prs.mammoth.style-map'
      })
      const namespaces = {'': contentTypesUri}
      return docxFile.write(path, xml.writeString(typesElement, namespaces))
    })
}

const addOrUpdateElement = (elements, name, identifyingAttribute, attributes) => {
  const existingElement = _.find(elements, element => element.name === name &&
    element.attributes[identifyingAttribute] === attributes[identifyingAttribute])
  if (existingElement) existingElement.attributes = attributes
  else elements.push(xml.element(name, attributes))
}

export const readStyleMap = docxFile => {
  if (docxFile.exists(styleMapPath)) return docxFile.read(styleMapPath, 'utf8')
  else return Promise.resolve(null)
}
