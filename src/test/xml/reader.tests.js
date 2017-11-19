import assert from 'assert'

import * as xmlreader from '../../lib/xml/reader'

const test = require('../test')(module)

test('should read self-closing element', function () {
  return xmlreader.readString('<body/>')
    .then(result => {
      assert.deepEqual({type: 'element', name: 'body', attributes: {}, children: []}, result)
    })
})

test('should read empty element with separate closing tag', function () {
  return xmlreader.readString('<body></body>')
    .then(result => {
      assert.deepEqual({type: 'element', name: 'body', attributes: {}, children: []}, result)
    })
})

test('should read attributes of tags', function () {
  return xmlreader.readString('<body name="bob"/>')
    .then(result => {
      assert.deepEqual({name: 'bob'}, result.attributes)
    })
})

test('can read text element', function () {
  return xmlreader.readString('<body>Hello!</body>')
    .then(result => {
      assert.deepEqual({type: 'text', value: 'Hello!'}, result.children[0])
    })
})

test('should read element with children', function () {
  return xmlreader.readString('<body><a/><b/></body>')
    .then(root => {
      assert.equal(2, root.children.length)
      assert.equal('a', root.children[0].name)
      assert.equal('b', root.children[1].name)
    })
})

test('unmapped namespaces URIs are included in braces as prefix', function () {
  return xmlreader.readString('<w:body xmlns:w="word"/>')
    .then(result => {
      assert.deepEqual(result.name, '{word}body')
    })
})

test('mapped namespaces URIs are translated using map', function () {
  const namespaceMap = {
    'word': 'x'
  }

  return xmlreader.readString('<w:body xmlns:w="word"/>', namespaceMap)
    .then(result => {
      assert.deepEqual(result.name, 'x:body')
    })
})

test('namespace of attributes is mapped to prefix', function () {
  const namespaceMap = {
    'word': 'x'
  }
  const xmlString = '<w:body xmlns:w="word" w:val="Hello!"/>'
  return xmlreader.readString(xmlString, namespaceMap)
    .then(result => {
      assert.deepEqual(result.attributes['x:val'], 'Hello!')
    })
})

test('can find first element with name', function () {
  return xmlreader.readString('<body><a/><b index="1"/><b index="2"/></body>')
    .then(result => {
      const first = result.first('b')
      assert.equal('1', first.attributes.index)
    })
})

test('whitespace between xml declaration and root tag is ignored', function () {
  return xmlreader.readString('<?xml version="1.0" ?>\n<body/>')
    .then(result => {
      assert.deepEqual('body', result.name)
    })
})

test('error if XML is badly formed', function () {
  return xmlreader.readString('<bo')
    .then(result => {
      throw new Error('Expected failure')
    }, error => {
      assert.ok(error)
      return 1
    })
})
