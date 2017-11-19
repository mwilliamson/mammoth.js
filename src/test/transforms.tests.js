import assert from 'assert'

import * as transforms from '../lib/transforms'
import * as documents from '../lib/documents'

const test = require('./test')(module)

test('paragraph()', {
  'paragraph is transformed': function () {
    const paragraph = new documents.Paragraph([])
    const result = transforms.paragraph(() => new documents.Tab())(paragraph)
    assert.deepEqual(result, new documents.Tab())
  },

  'non-paragraph elements are not transformed': function () {
    const run = new documents.Run([])
    const result = transforms.paragraph(() => new documents.Tab())(run)
    assert.deepEqual(result, new documents.Run([]))
  }
})

test('run()', {
  'run is transformed': function () {
    const run = new documents.Run([])
    const result = transforms.run(() => new documents.Tab())(run)
    assert.deepEqual(result, new documents.Tab())
  },

  'non-run elements are not transformed': function () {
    const paragraph = new documents.Paragraph([])
    const result = transforms.run(() => new documents.Tab())(paragraph)
    assert.deepEqual(result, new documents.Paragraph([]))
  }
})

test('elements()', {
  'all descendants are transformed': function () {
    const root = {
      children: [
        {
          children: [
            {}
          ]
        }
      ]
    }
    let currentCount = 0

    const setCount = node => {
      currentCount++
      return Object.assign(node, {count: currentCount})
    }

    const result = transforms._elements(setCount)(root)

    assert.deepEqual(result, {
      count: 3,
      children: [
        {
          count: 2,
          children: [
                        {count: 1}
          ]
        }
      ]
    })
  }
})

test('getDescendants()', {
  'returns nothing if element has no children property': function () {
    assert.deepEqual(transforms.getDescendants({}), [])
  },

  'returns nothing if element has empty children': function () {
    assert.deepEqual(transforms.getDescendants({children: []}), [])
  },

  'includes children': function () {
    const element = {
      children: [{name: 'child 1'}, {name: 'child 2'}]
    }
    assert.deepEqual(
            transforms.getDescendants(element),
            [{name: 'child 1'}, {name: 'child 2'}]
        )
  },

  'includes indirect descendants': function () {
    const grandchild = {name: 'grandchild'}
    const child = {name: 'child', children: [grandchild]}
    const element = {children: [child]}
    assert.deepEqual(
            transforms.getDescendants(element),
            [grandchild, child]
        )
  }
})

test('getDescendantsOfType()', {
  'filters descendants to type': function () {
    const paragraph = {type: 'paragraph'}
    const run = {type: 'run'}
    const element = {
      children: [paragraph, run]
    }
    assert.deepEqual(
            transforms.getDescendantsOfType(element, 'run'),
            [run]
        )
  }
})
