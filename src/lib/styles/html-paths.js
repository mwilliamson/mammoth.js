import * as html from '../html/index'
import { deepEqual as _deepEqual } from 'assert'

const deepEqual = (obj1, obj2) => {
  try {
    _deepEqual(obj1, obj2)
    return true
  } catch (error) {
    return false
  }
}

export const topLevelElement = (tagName, attributes) => elements([element(tagName, attributes, {fresh: true})])

export const elements = elementStyles =>
  new HtmlPath(elementStyles
    .map(elementStyle => typeof elementStyle === 'string' ? element(elementStyle) : elementStyle))

class HtmlPath {
  constructor (elements) {
    this._elements = elements
  }

  wrap (children) {
    let result = children()
    for (let index = this._elements.length - 1; index >= 0; index--) {
      result = this._elements[index].wrapNodes(result)
    }
    return result
  }
}

export const element = (tagName, attributes, options) => {
  options = options || {}
  return new Element(tagName, attributes, options)
}

class Element {
  constructor (tagName, attributes, options) {
    const tagNames = {}
    if (tagName instanceof Array) {
      tagName.forEach(tagName => {
        tagNames[tagName] = true
      })
      tagName = tagName[0]
    } else tagNames[tagName] = true

    this.tagName = tagName
    this.tagNames = tagNames
    this.attributes = attributes || {}
    this.fresh = options.fresh
    this.separator = options.separator
  }

  matchesElement (element) {
    return this.tagNames[element.tagName] && deepEqual(this.attributes || {}, element.attributes || {})
  }

  wrap (generateNodes) {
    return this.wrapNodes(generateNodes())
  }

  wrapNodes (nodes) {
    return [html.elementWithTag(this, nodes)]
  }
}

export const empty = elements([])
export const ignore = {
  wrap: function () {
    return []
  }
}
