import _ from 'underscore'
import * as util from 'util'

export const writer = (options = {}) =>
  options.prettyPrint
    ? prettyWriter()
    : simpleWriter()

const indentedElements = {
  div: true,
  p: true,
  ul: true,
  li: true
}

const prettyWriter = () => {
  let indentationLevel = 0
  const indentation = '  '
  const stack = []
  let start = true
  let inText = false

  const writer = simpleWriter()

  const open = (tagName, attributes) => {
    if (indentedElements[tagName]) indent()
    stack.push(tagName)
    writer.open(tagName, attributes)
    if (indentedElements[tagName]) indentationLevel++
    start = false
  }

  const close = tagName => {
    if (indentedElements[tagName]) {
      indentationLevel--
      indent()
    }
    stack.pop()
    writer.close(tagName)
  }

  const text = value => {
    startText()
    writer.text(value.replace('\n', '\n' + indentation))
  }

  const selfClosing = (tagName, attributes) => {
    indent()
    writer.selfClosing(tagName, attributes)
  }

  const append = html => {
    startText()
    writer.append(html.replace('\n', '\n' + indentation))
  }

  const insideIndentedElement = () => stack.length === 0 || indentedElements[stack[stack.length - 1]]

  const startText = () => {
    if (!inText) {
      indent()
      inText = true
    }
  }

  const indent = () => {
    inText = false
    if (!start && insideIndentedElement()) {
      writer.append('\n')
      for (let i = 0; i < indentationLevel; i++) writer.append(indentation)
    }
  }

  return {
    asString: writer.asString,
    open,
    close,
    text,
    selfClosing,
    append
  }
}

const simpleWriter = () => {
  const fragments = []

  const open = (tagName, attributes) => {
    const attributeString = generateAttributeString(attributes)
    fragments.push(util.format('<%s%s>', tagName, attributeString))
  }

  const close = tagName => {
    fragments.push(util.format('</%s>', tagName))
  }

  const selfClosing = (tagName, attributes) => {
    const attributeString = generateAttributeString(attributes)
    fragments.push(util.format('<%s%s />', tagName, attributeString))
  }

  const generateAttributeString = attributes => _.map(attributes, (value, key) => util.format(' %s="%s"', key, escapeHtmlAttribute(value))).join('')

  const text = value => {
    fragments.push(escapeHtmlText(value))
  }

  const append = html => {
    fragments.push(html)
  }

  const asString = () => fragments.join('')

  return {
    asString,
    open,
    close,
    text,
    selfClosing,
    append
  }
}

const escapeHtmlText = value => value
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')

const escapeHtmlAttribute = value => value
  .replace(/&/g, '&amp;')
  .replace(/"/g, '&quot;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
