import _ from 'underscore'
import sax from 'sax'

import * as promises from '../promises'
import * as nodes from './nodes'

const Element = nodes.Element

export const readString = (xmlString, namespaceMap) => {
  namespaceMap = namespaceMap || {}

  let finished = false
  const parser = sax.parser(true, {xmlns: true, position: false})

  const rootElement = {children: []}
  let currentElement = rootElement
  const stack = []

  const deferred = promises.defer()

  parser.onopentag = node => {
    const attributes = mapObject(node.attributes, attribute => attribute.value, mapName)

    const element = new Element(mapName(node), attributes)
    currentElement.children.push(element)
    stack.push(currentElement)
    currentElement = element
  }

  const mapName = node => {
    if (node.uri) {
      const mappedPrefix = namespaceMap[node.uri]
      let prefix
      if (mappedPrefix) prefix = `${mappedPrefix}:`
      else prefix = `{${node.uri}}`
      return prefix + node.local
    } else return node.local
  }

  parser.onclosetag = node => {
    currentElement = stack.pop()
  }

  parser.ontext = text => {
    if (currentElement !== rootElement) currentElement.children.push(nodes.text(text))
  }

  parser.onend = () => {
    if (!finished) {
      finished = true
      deferred.resolve(rootElement.children[0])
    }
  }

  parser.onerror = error => {
    if (!finished) {
      finished = true
      deferred.reject(error)
    }
  }

  parser.write(xmlString).close()

  return deferred.promise
}

function mapObject (input, valueFunc, keyFunc) {
  return _.reduce(input, (result, value, key) => {
    const mappedKey = keyFunc(value, key, input)
    result[mappedKey] = valueFunc(value, key, input)
    return result
  }, {})
}
