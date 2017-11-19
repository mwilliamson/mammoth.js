import _ from 'underscore'

export const paragraph = transform => elementsOfType('paragraph', transform)

export const run = transform => elementsOfType('run', transform)

const elementsOfType = (elementType, transform) => elements(element => element.type === elementType ? transform(element) : element)

const elements = transform => function transformElement (element) {
  if (element.children) {
    const children = _.map(element.children, transformElement)
    element = _.extend(element, {children: children})
  }
  return transform(element)
}

export const getDescendantsOfType = (element, type) => getDescendants(element).filter(descendant => descendant.type === type)

export const getDescendants = element => {
  const descendants = []

  visitDescendants(element, descendant => {
    descendants.push(descendant)
  })

  return descendants
}

const visitDescendants = (element, visit) => {
  if (element.children) {
    element.children.forEach(child => {
      visitDescendants(child, visit)
      visit(child)
    })
  }
}

export { elements as _elements }
