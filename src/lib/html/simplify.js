import _ from 'underscore'

import * as ast from './ast'

export default nodes => collapse(removeEmpty(nodes))

const collapse = nodes => {
  const children = []

  nodes.map(collapseNode).forEach(child => {
    appendChild(children, child)
  })
  return children
}

const collapseNode = node => collapsers[node.type](node)

const collapseElement = node => ast.elementWithTag(node.tag, collapse(node.children))

const identity = value => value

const collapsers = {
  element: collapseElement,
  text: identity,
  forceWrite: identity
}

const appendChild = (children, child) => {
  const lastChild = children[children.length - 1]
  if (child.type === 'element' && !child.tag.fresh && lastChild && lastChild.type === 'element' && child.tag.matchesElement(lastChild.tag)) {
    if (child.tag.separator) appendChild(lastChild.children, ast.text(child.tag.separator))
    child.children.forEach(grandChild => {
      // Mutation is fine since simplifying elements create a copy of the children.
      appendChild(lastChild.children, grandChild)
    })
  } else children.push(child)
}

const removeEmpty = nodes => flatMap(nodes, node => emptiers[node.type](node))

const flatMap = (values, func) => _.flatten(_.map(values, func), true)

const neverEmpty = node => [node]

const elementEmptier = element => {
  const children = removeEmpty(element.children)
  if (children.length === 0 && !ast.isVoidElement(element)) return []
  else return [ast.elementWithTag(element.tag, children)]
}

const textEmptier = node => (node.value.length === 0) ? [] : [node]

const emptiers = {
  element: elementEmptier,
  text: textEmptier,
  forceWrite: neverEmpty
}
