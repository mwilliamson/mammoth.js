import * as htmlPaths from '../styles/html-paths'

export const nonFreshElement = (tagName, attributes, children) => elementWithTag(
  htmlPaths.element(tagName, attributes, {fresh: false}),
  children)

export const freshElement = (tagName, attributes, children) => {
  const tag = htmlPaths.element(tagName, attributes, {fresh: true})
  return elementWithTag(tag, children)
}

export const elementWithTag = (tag, children) => ({
  type: 'element',
  tag: tag,
  children: children || []
})

export const text = value => ({
  type: 'text',
  value: value
})

export const forceWrite = {
  type: 'forceWrite'
}

const voidTagNames = {
  'br': true,
  'hr': true,
  'img': true
}

export const isVoidElement = node => (node.children.length === 0) && voidTagNames[node.tag.tagName]
