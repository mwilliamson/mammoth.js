const symmetricMarkdownElement = end => markdownElement(end, end)

const markdownElement = (start, end) => () => ({start: start, end: end})

const markdownLink = attributes => {
  const href = attributes.href || ''
  if (href) {
    return {
      start: '[',
      end: `](${href})`,
      anchorPosition: 'before'
    }
  } else return {}
}

const markdownImage = attributes => {
  const src = attributes.src || ''
  const altText = attributes.alt || ''
  if (src || altText) return {start: `![${altText}](${src})`}
  else return {}
}

const markdownList = options => (attributes, list) => ({
  start: list ? '\n' : '',
  end: list ? '' : '\n',
  list: {
    isOrdered: options.isOrdered,
    indent: list ? list.indent + 1 : 0,
    count: 0
  }
})

const markdownListItem = (attributes, list, listItem) => {
  list = list || {indent: 0, isOrdered: false, count: 0}
  list.count++
  listItem.hasClosed = false

  const bullet = list.isOrdered ? list.count + '.' : '-'
  const start = `${repeatString('\t', list.indent) + bullet} `

  return {
    start: start,
    end: () => {
      if (!listItem.hasClosed) {
        listItem.hasClosed = true
        return '\n'
      }
    }
  }
}

const htmlToMarkdown = {
  'p': markdownElement('', '\n\n'),
  'br': markdownElement('', '  \n'),
  'ul': markdownList({isOrdered: false}),
  'ol': markdownList({isOrdered: true}),
  'li': markdownListItem,
  'strong': symmetricMarkdownElement('__'),
  'em': symmetricMarkdownElement('*'),
  'a': markdownLink,
  'img': markdownImage
}

const repeatString = (value, count) => new Array(count + 1).join(value)

for (let i = 1; i <= 6; i++) {
  htmlToMarkdown['h' + i] = markdownElement(repeatString('#', i) + ' ', '\n\n')
}

export const markdownWriter = () => {
  const fragments = []
  const elementStack = []
  let list = null
  const listItem = {}

  const open = (tagName, attributes) => {
    attributes = attributes || {}

    const createElement = htmlToMarkdown[tagName] || (() => ({}))
    const element = createElement(attributes, list, listItem)
    elementStack.push({end: element.end, list: list})

    if (element.list) list = element.list

    let anchorBeforeStart = element.anchorPosition === 'before'
    if (anchorBeforeStart) writeAnchor(attributes)

    fragments.push(element.start || '')
    if (!anchorBeforeStart) writeAnchor(attributes)
  }

  const writeAnchor = attributes => {
    if (attributes.id) fragments.push(`<a id="${attributes.id}"></a>`)
  }

  const close = tagName => {
    const element = elementStack.pop()
    list = element.list
    const end = typeof element.end === 'function' ? element.end() : element.end
    fragments.push(end || '')
  }

  const selfClosing = (tagName, attributes) => {
    open(tagName, attributes)
    close(tagName)
  }

  const text = value => {
    fragments.push(escapeMarkdown(value))
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

const escapeMarkdown = value => value
  .replace(/\\/g, '\\\\')
  .replace(/([`*_{}[\]()#+\-.!])/g, '\\$1')

export { markdownWriter as writer }
