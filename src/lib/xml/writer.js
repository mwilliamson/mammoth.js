import xmlbuilder from 'xmlbuilder'

export const writeString = (root, namespaces) => {
  const uriToPrefix = Object.keys(namespaces).reduce((result, prefix) => {
    result[namespaces[prefix]] = prefix
    return result
  }, {})

  const writeNode = (builder, node) => nodeWriters[node.type](builder, node)

  const writeElement = (builder, element) => {
    const elementBuilder = builder.element(mapElementName(element.name), element.attributes)
    element.children.forEach(child => {
      writeNode(elementBuilder, child)
    })
  }

  const nodeWriters = {
    element: writeElement,
    text: writeTextNode
  }

  const mapElementName = name => {
    const longFormMatch = /^\{(.*)\}(.*)$/.exec(name)
    if (longFormMatch) {
      const prefix = uriToPrefix[longFormMatch[1]]
      return prefix + (prefix === '' ? '' : ':') + longFormMatch[2]
    } else {
      return name
    }
  }

  const writeDocument = root => {
    const builder = xmlbuilder
      .create(mapElementName(root.name), {
        version: '1.0',
        encoding: 'UTF-8',
        standalone: true
      })

    Object.keys(namespaces).forEach(prefix => {
      const uri = namespaces[prefix]
      const key = `xmlns${prefix === '' ? '' : ':' + prefix}`
      builder.attribute(key, uri)
    })

    root.children.forEach(child => {
      writeNode(builder, child)
    })
    return builder.end()
  }

  return writeDocument(root)
}

const writeTextNode = (builder, node) => {
  builder.text(node.value)
}
