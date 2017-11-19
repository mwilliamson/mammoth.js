export class Styles {
  constructor (paragraphStyles, characterStyles, tableStyles) {
    this.paragraphStyles = paragraphStyles
    this.characterStyles = characterStyles
    this.tableStyles = tableStyles
  }

  findParagraphStyleById (styleId) {
    return this.paragraphStyles[styleId]
  }

  findCharacterStyleById (styleId) {
    return this.characterStyles[styleId]
  }

  findTableStyleById (styleId) {
    return this.tableStyles[styleId]
  }

  static get EMPTY () {
    return new Styles({}, {}, {})
  }
}

export const readStylesXml = root => {
  const paragraphStyles = {}
  const characterStyles = {}
  const tableStyles = {}

  const styles = {
    'paragraph': paragraphStyles,
    'character': characterStyles,
    'table': tableStyles
  }

  root.getElementsByTagName('w:style').forEach(styleElement => {
    const style = readStyleElement(styleElement)
    const styleSet = styles[style.type]
    if (styleSet) styleSet[style.styleId] = style
  })

  return new Styles(paragraphStyles, characterStyles, tableStyles)
}

const readStyleElement = styleElement => {
  const type = styleElement.attributes['w:type']
  const styleId = styleElement.attributes['w:styleId']
  const name = styleName(styleElement)
  return {type: type, styleId: styleId, name: name}
}

const styleName = styleElement => {
  const nameElement = styleElement.first('w:name')
  return nameElement ? nameElement.attributes['w:val'] : null
}

export const defaultStyles = new Styles({}, {})
