import hamjest from 'hamjest'

import * as documents from '../../lib/documents'

export const isDocumentElement = (type, properties) => hamjest.hasProperties(Object.assign({type: hamjest.equalTo(type)}, properties))

export const isRun = properties => isDocumentElement(documents.types.run, properties)

export const isEmptyRun = isRun({children: []})

export const isText = text => isDocumentElement(documents.types.text, {value: text})

export const isHyperlink = properties => isDocumentElement(documents.types.hyperlink, properties)

export const isTable = options => isDocumentElement(documents.types.table, options)

export const isRow = options => isDocumentElement(documents.types.tableRow, options)
