export const paragraph = options => new Matcher('paragraph', options)

export const run = options => new Matcher('run', options)

export const table = options => new Matcher('table', options)

export class Matcher {
  constructor (elementType, options) {
    options = options || {}
    this._elementType = elementType
    this._styleId = options.styleId
    this._styleName = options.styleName
    if (options.list) {
      this._listIndex = options.list.levelIndex
      this._listIsOrdered = options.list.isOrdered
    }
  }

  matches (element) {
    return element.type === this._elementType &&
      (this._styleId === undefined || element.styleId === this._styleId) &&
      (this._styleName === undefined || (element.styleName && this._styleName.operator(this._styleName.operand, element.styleName))) &&
      (this._listIndex === undefined || isList(element, this._listIndex, this._listIsOrdered)) &&
      (this._breakType === undefined || this._breakType === element.breakType)
  }
}

const isList = (element, levelIndex, isOrdered) => element.numbering &&
  (typeof element.numbering.level === 'string' ? parseInt(element.numbering.level) : element.numbering.level) === levelIndex &&
  element.numbering.isOrdered === isOrdered

const operatorEqualTo = (first, second) => first.toUpperCase() === second.toUpperCase()

const operatorStartsWith = (first, second) => second.toUpperCase().indexOf(first.toUpperCase()) === 0

export const equalTo = value => ({
  operator: operatorEqualTo,
  operand: value
})

export const startsWith = value => ({
  operator: operatorStartsWith,
  operand: value
})

export const bold = new Matcher('bold')
export const italic = new Matcher('italic')
export const underline = new Matcher('underline')
export const strikethrough = new Matcher('strikethrough')
export const smallCaps = new Matcher('smallCaps')
export const commentReference = new Matcher('commentReference')
export const lineBreak = new Matcher('break', {breakType: 'line'})
export const pageBreak = new Matcher('break', {breakType: 'page'})
export const columnBreak = new Matcher('break', {breakType: 'column'})
