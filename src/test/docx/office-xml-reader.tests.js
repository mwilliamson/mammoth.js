import assert from 'assert'

import * as xml from '../../lib/xml'
import * as officeXmlReader from '../../lib/docx/office-xml-reader'

const test = require('../test')(module)

test('mc:AlternateContent is replaced by contents of mc:Fallback', function () {
  const xmlString =
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<numbering xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006">' +
    '<mc:AlternateContent>' +
    '<mc:Choice Requires="w14">' +
    '<choice/>' +
    '</mc:Choice>' +
    '<mc:Fallback>' +
    '<fallback/>' +
    '</mc:Fallback>' +
    '</mc:AlternateContent>' +
    '</numbering>'
  return officeXmlReader.read(xmlString).then(element => {
    assert.deepEqual(element.children, [xml.element('fallback')])
  })
})
