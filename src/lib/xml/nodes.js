import _ from 'underscore'

export const element = (name, attributes, children) => new Element(name, attributes, children)

export const text = value => ({
  type: 'text',
  value: value
})

const emptyElement = {
  first: () => null,
  firstOrEmpty: () => emptyElement,
  attributes: {}
}

export class Element {
  constructor (name, attributes, children) {
    this.type = 'element'
    this.name = name
    this.attributes = attributes || {}
    this.children = children || []
  }

  first (name) {
    return _.find(this.children, child => child.name === name)
  }

  firstOrEmpty (name) {
    return this.first(name) || emptyElement
  }

  getElementsByTagName (name) {
    const elements = _.filter(this.children, child => child.name === name)
    return toElementList(elements)
  }

  text () {
    if (this.children.length === 0) return ''
    else if (this.children.length !== 1 || this.children[0].type !== 'text') throw new Error('Not implemented')
    else return this.children[0].value
  }
}

const elementListPrototype = {
  getElementsByTagName: function (name) {
    return toElementList(_.flatten(this.map(element => element.getElementsByTagName(name), true)))
  }
}

const toElementList = array => _.extend(array, elementListPrototype)
