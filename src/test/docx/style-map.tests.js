import assert from 'assert'
import JSZip from 'jszip'

import * as zipfile from '../../lib/zipfile'
import * as styleMap from '../../lib/docx/style-map'

const test = require('../test')(module)

test('reading embedded style map on document without embedded style map returns null', function () {
  const zip = normalDocx()

  return styleMap.readStyleMap(zip).then(contents => {
    assert.equal(contents, null)
  })
})

test('embedded style map can be read after being written', function () {
  const zip = normalDocx()

  return styleMap.writeStyleMap(zip, 'p => h1')
    .then(() => styleMap.readStyleMap(zip)
      .then(contents => {
        assert.equal(contents, 'p => h1')
      })
    )
})

test('embedded style map is written to separate file', function () {
  const zip = normalDocx()

  return styleMap.writeStyleMap(zip, 'p => h1')
    .then(() => zip.read('mammoth/style-map', 'utf8')
      .then(contents => {
        assert.equal(contents, 'p => h1')
      })
    )
})

test('embedded style map is referenced in relationships', function () {
  const zip = normalDocx()

  return styleMap.writeStyleMap(zip, 'p => h1')
    .then(() => zip.read('word/_rels/document.xml.rels', 'utf8')
      .then(contents => {
        assert.equal(contents, expectedRelationshipsXml)
      })
    )
})

test('re-embedding style map replaces original', function () {
  const zip = normalDocx()

  return styleMap.writeStyleMap(zip, 'p => h1')
    .then(() => styleMap.writeStyleMap(zip, 'p => h2'))
    .then(() => zip.read('word/_rels/document.xml.rels', 'utf8')
      .then(contents => {
        assert.equal(contents, expectedRelationshipsXml)
      })
    )
    .then(() => styleMap.readStyleMap(zip)
      .then(contents => {
        assert.equal(contents, 'p => h2')
      })
    )
})

test('embedded style map has override content type in [Content_Types].xml', function () {
  const zip = normalDocx()

  return styleMap.writeStyleMap(zip, 'p => h1')
    .then(() => zip.read('[Content_Types].xml', 'utf8')
      .then(contents => {
        assert.equal(contents, expectedContentTypesXml)
      })
    )
})

test('replacing style map keeps content type', function () {
  const zip = normalDocx()

  return styleMap.writeStyleMap(zip, 'p => h1')
    .then(() => styleMap.writeStyleMap(zip, 'p => h2'))
    .then(() => zip.read('[Content_Types].xml', 'utf8')
      .then(contents => {
        assert.equal(contents, expectedContentTypesXml)
      })
    )
})

const expectedRelationshipsXml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
  '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
  '<Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/settings" Target="settings.xml"/>' +
  '<Relationship Id="rMammothStyleMap" Type="http://schemas.zwobble.org/mammoth/style-map" Target="/mammoth/style-map"/>' +
  '</Relationships>'

const expectedContentTypesXml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
  '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
  '<Default Extension="png" ContentType="image/png"/>' +
  '<Override PartName="/mammoth/style-map" ContentType="text/prs.mammoth.style-map"/>' +
  '</Types>'

const normalDocx = () => {
  const zip = new JSZip()
  const originalRelationshipsXml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
    '<Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/settings" Target="settings.xml"/>' +
    '</Relationships>'
  const originalContentTypesXml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
    '<Default Extension="png" ContentType="image/png"/>' +
    '</Types>'
  zip.file('word/_rels/document.xml.rels', originalRelationshipsXml)
  zip.file('[Content_Types].xml', originalContentTypesXml)
  const buffer = zip.generate({type: 'arraybuffer'})
  return zipfile.openArrayBuffer(buffer)
}
