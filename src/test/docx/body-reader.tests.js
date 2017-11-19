import _ from 'underscore'
import assert from 'assert'
import * as path from 'path'
import { allOf, assertThat, contains, FeatureMatcher, hasProperties, promiseThat, willBe } from 'hamjest'

import { warning } from '../../lib/results'
import * as xml from '../../lib/xml'
import * as documents from '../../lib/documents'
import { _readNumberingProperties, CreateBodyReader as createBodyReader } from '../../lib/docx/body-reader'
import { Numbering } from '../../lib/docx/numbering-xml'
import { Styles } from '../../lib/docx/styles-reader'
import * as documentMatchers from './document-matchers'

import * as testing from '../testing'

const isEmptyRun = documentMatchers.isEmptyRun
const isHyperlink = documentMatchers.isHyperlink
const isRun = documentMatchers.isRun
const isText = documentMatchers.isText
const isTable = documentMatchers.isTable
const isRow = documentMatchers.isRow
const XmlElement = xml.Element
const test = require('../test')(module)
const createFakeDocxFile = testing.createFakeDocxFile

const createEmbeddedBlip = relationshipId => new XmlElement('a:blip', {'r:embed': relationshipId})

const createLinkedBlip = relationshipId => new XmlElement('a:blip', {'r:link': relationshipId})

const runOfText = text => {
  const textXml = new XmlElement('w:t', {}, [xml.text(text)])
  return new XmlElement('w:r', {}, [textXml])
}

const readXmlElement = (element, options = {}) => {
  options = Object.create(options)
  options.styles = options.styles || new Styles({}, {})
  return createBodyReader(options).readXmlElement(element)
}

const readXmlElementValue = (element, options) => {
  const result = readXmlElement(element, options)
  assert.deepEqual(result.messages, [])
  return result.value
}

const fakeContentTypes = {
  findContentType: filePath => {
    const extensionTypes = {
      '.png': 'image/png',
      '.emf': 'image/x-emf'
    }
    return extensionTypes[path.extname(filePath)]
  }
}

test('paragraph has no style if it has no properties', function () {
  const paragraphXml = new XmlElement('w:p', {}, [])
  const paragraph = readXmlElementValue(paragraphXml)
  assert.deepEqual(paragraph.styleId, null)
})

test('paragraph has style ID and name read from paragraph properties if present', function () {
  const styleXml = new XmlElement('w:pStyle', {'w:val': 'Heading1'}, [])
  const propertiesXml = new XmlElement('w:pPr', {}, [styleXml])
  const paragraphXml = new XmlElement('w:p', {}, [propertiesXml])

  const styles = new Styles({'Heading1': {name: 'Heading 1'}}, {})

  const paragraph = readXmlElementValue(paragraphXml, {styles: styles})
  assert.deepEqual(paragraph.styleId, 'Heading1')
  assert.deepEqual(paragraph.styleName, 'Heading 1')
})

test('warning is emitted when paragraph style cannot be found', function () {
  const styleXml = new XmlElement('w:pStyle', {'w:val': 'Heading1'}, [])
  const propertiesXml = new XmlElement('w:pPr', {}, [styleXml])
  const paragraphXml = new XmlElement('w:p', {}, [propertiesXml])

  const styles = new Styles({}, {})

  const result = readXmlElement(paragraphXml, {styles: styles})
  const paragraph = result.value
  assert.deepEqual(paragraph.styleId, 'Heading1')
  assert.deepEqual(paragraph.styleName, null)
  assert.deepEqual(result.messages, [warning('Paragraph style with ID Heading1 was referenced but not defined in the document')])
})

test('paragraph has justification read from paragraph properties if present', function () {
  const justificationXml = new XmlElement('w:jc', {'w:val': 'center'}, [])
  const propertiesXml = new XmlElement('w:pPr', {}, [justificationXml])
  const paragraphXml = new XmlElement('w:p', {}, [propertiesXml])
  const paragraph = readXmlElementValue(paragraphXml)
  assert.deepEqual(paragraph.alignment, 'center')
})

test('paragraph has numbering properties from paragraph properties if present', function () {
  const numberingPropertiesXml = new XmlElement('w:numPr', {}, [
    new XmlElement('w:ilvl', {'w:val': '1'}),
    new XmlElement('w:numId', {'w:val': '42'})
  ])
  const propertiesXml = new XmlElement('w:pPr', {}, [numberingPropertiesXml])
  const paragraphXml = new XmlElement('w:p', {}, [propertiesXml])

  const numbering = new Numbering({'42': {'1': {isOrdered: true, level: '1'}}})

  const paragraph = readXmlElementValue(paragraphXml, {numbering: numbering})
  assert.deepEqual(paragraph.numbering, {level: '1', isOrdered: true})
})

test('numbering properties are converted to numbering at specified level', function () {
  const numberingPropertiesXml = new XmlElement('w:numPr', {}, [
    new XmlElement('w:ilvl', {'w:val': '1'}),
    new XmlElement('w:numId', {'w:val': '42'})
  ])

  const numbering = new Numbering({'42': {'1': {isOrdered: true, level: '1'}}})

  const numberingLevel = _readNumberingProperties(numberingPropertiesXml, numbering)
  assert.deepEqual(numberingLevel, {level: '1', isOrdered: true})
})

test('numbering properties are ignored if w:ilvl is missing', function () {
  const numberingPropertiesXml = new XmlElement('w:numPr', {}, [
    new XmlElement('w:numId', {'w:val': '42'})
  ])

  const numbering = new Numbering({'42': {'1': {isOrdered: true, level: '1'}}})

  const numberingLevel = _readNumberingProperties(numberingPropertiesXml, numbering)
  assert.equal(numberingLevel, null)
})

test('numbering properties are ignored if w:numId is missing', function () {
  const numberingPropertiesXml = new XmlElement('w:numPr', {}, [
    new XmlElement('w:ilvl', {'w:val': '1'})
  ])

  const numbering = new Numbering({'42': {'1': {isOrdered: true, level: '1'}}})

  const numberingLevel = _readNumberingProperties(numberingPropertiesXml, numbering)
  assert.equal(numberingLevel, null)
})

test('complex fields', (function () {
  const uri = 'http://example.com'
  const beginXml = new XmlElement('w:r', {}, [
    new XmlElement('w:fldChar', {'w:fldCharType': 'begin'})
  ])
  const endXml = new XmlElement('w:r', {}, [
    new XmlElement('w:fldChar', {'w:fldCharType': 'end'})
  ])
  const separateXml = new XmlElement('w:r', {}, [
    new XmlElement('w:fldChar', {'w:fldCharType': 'separate'})
  ])
  const hyperlinkInstrText = new XmlElement('w:instrText', {}, [
    xml.text(' HYPERLINK "' + uri + '"')
  ])
  const hyperlinkRunXml = runOfText('this is a hyperlink')

  const isEmptyHyperlinkedRun = isHyperlinkedRun({children: []})

  function isHyperlinkedRun (hyperlinkProperties) {
    return isRun({
      children: contains(
        isHyperlink(_.extend({href: uri}, hyperlinkProperties))
      )
    })
  }

  return {
    'stores instrText returns empty result': function () {
      const instrText = readXmlElementValue(hyperlinkInstrText)
      assert.deepEqual(instrText, [])
    },

    'runs in a complex field for hyperlinks are read as hyperlinks': function () {
      const hyperlinkRunXml = runOfText('this is a hyperlink')
      const paragraphXml = new XmlElement('w:p', {}, [
        beginXml,
        hyperlinkInstrText,
        separateXml,
        hyperlinkRunXml,
        endXml
      ])
      const paragraph = readXmlElementValue(paragraphXml)

      assertThat(paragraph.children, contains(
        isEmptyRun,
        isEmptyHyperlinkedRun,
        isHyperlinkedRun({
          children: contains(
            isText('this is a hyperlink')
          )
        }),
        isEmptyRun
      ))
    },

    'runs after a complex field for hyperlinks are not read as hyperlinks': function () {
      const afterEndXml = runOfText('this will not be a hyperlink')
      const paragraphXml = new XmlElement('w:p', {}, [
        beginXml,
        hyperlinkInstrText,
        separateXml,
        endXml,
        afterEndXml
      ])
      const paragraph = readXmlElementValue(paragraphXml)

      assertThat(paragraph.children, contains(
        isEmptyRun,
        isEmptyHyperlinkedRun,
        isEmptyRun,
        isRun({
          children: contains(
            isText('this will not be a hyperlink')
          )
        })
      ))
    },

    'can handle split instrText elements': function () {
      const hyperlinkInstrTextPart1 = new XmlElement('w:instrText', {}, [
        xml.text(' HYPE')
      ])
      const hyperlinkInstrTextPart2 = new XmlElement('w:instrText', {}, [
        xml.text('RLINK "' + uri + '"')
      ])
      const paragraphXml = new XmlElement('w:p', {}, [
        beginXml,
        hyperlinkInstrTextPart1,
        hyperlinkInstrTextPart2,
        separateXml,
        hyperlinkRunXml,
        endXml
      ])
      const paragraph = readXmlElementValue(paragraphXml)

      assertThat(paragraph.children, contains(
        isEmptyRun,
        isEmptyHyperlinkedRun,
        isHyperlinkedRun({
          children: contains(
            isText('this is a hyperlink')
          )
        }),
        isEmptyRun
      ))
    },

    'hyperlink is not ended by end of nested complex field': function () {
      const authorInstrText = new XmlElement('w:instrText', {}, [
        xml.text(' AUTHOR "John Doe"')
      ])
      const paragraphXml = new XmlElement('w:p', {}, [
        beginXml,
        hyperlinkInstrText,
        separateXml,
        beginXml,
        authorInstrText,
        separateXml,
        endXml,
        hyperlinkRunXml,
        endXml
      ])
      const paragraph = readXmlElementValue(paragraphXml)

      assertThat(paragraph.children, contains(
        isEmptyRun,
        isEmptyHyperlinkedRun,
        isEmptyHyperlinkedRun,
        isEmptyHyperlinkedRun,
        isEmptyHyperlinkedRun,
        isHyperlinkedRun({
          children: contains(
            isText('this is a hyperlink')
          )
        }),
        isEmptyRun
      ))
    },

    'complex field nested within a hyperlink complex field is wrapped with the hyperlink': function () {
      const authorInstrText = new XmlElement('w:instrText', {}, [
        xml.text(' AUTHOR "John Doe"')
      ])
      const paragraphXml = new XmlElement('w:p', {}, [
        beginXml,
        hyperlinkInstrText,
        separateXml,
        beginXml,
        authorInstrText,
        separateXml,
        runOfText('John Doe'),
        endXml,
        endXml
      ])
      const paragraph = readXmlElementValue(paragraphXml)

      assertThat(paragraph.children, contains(
        isEmptyRun,
        isEmptyHyperlinkedRun,
        isEmptyHyperlinkedRun,
        isEmptyHyperlinkedRun,
        isHyperlinkedRun({
          children: contains(
            isText('John Doe')
          )
        }),
        isEmptyHyperlinkedRun,
        isEmptyRun
      ))
    },

    'field without separate w:fldChar is ignored': function () {
      const hyperlinkRunXml = runOfText('this is a hyperlink')
      const paragraphXml = new XmlElement('w:p', {}, [
        beginXml,
        hyperlinkInstrText,
        separateXml,
        beginXml,
        endXml,
        hyperlinkRunXml,
        endXml
      ])
      const paragraph = readXmlElementValue(paragraphXml)

      assertThat(paragraph.children, contains(
        isEmptyRun,
        isEmptyHyperlinkedRun,
        isEmptyHyperlinkedRun,
        isEmptyHyperlinkedRun,
        isHyperlinkedRun({
          children: contains(
            isText('this is a hyperlink')
          )
        }),
        isEmptyRun
      ))
    }
  }
})())

test('run has no style if it has no properties', function () {
  const runXml = runWithProperties([])
  const run = readXmlElementValue(runXml)
  assert.deepEqual(run.styleId, null)
})

test('run has style ID and name read from run properties if present', function () {
  const runStyleXml = new XmlElement('w:rStyle', {'w:val': 'Heading1Char'})
  const runXml = runWithProperties([runStyleXml])

  const styles = new Styles({}, {'Heading1Char': {name: 'Heading 1 Char'}})

  const run = readXmlElementValue(runXml, {styles: styles})
  assert.deepEqual(run.styleId, 'Heading1Char')
  assert.deepEqual(run.styleName, 'Heading 1 Char')
})

test('warning is emitted when run style cannot be found', function () {
  const runStyleXml = new XmlElement('w:rStyle', {'w:val': 'Heading1Char'})
  const runXml = runWithProperties([runStyleXml])

  const styles = new Styles({}, {})

  const result = readXmlElement(runXml, {styles: styles})
  const run = result.value
  assert.deepEqual(run.styleId, 'Heading1Char')
  assert.deepEqual(run.styleName, null)
  assert.deepEqual(result.messages, [warning('Run style with ID Heading1Char was referenced but not defined in the document')])
})

test('isBold is false if bold element is not present', function () {
  const runXml = runWithProperties([])
  const run = readXmlElementValue(runXml)
  assert.deepEqual(run.isBold, false)
})

test('isBold is true if bold element is present', function () {
  const boldXml = new XmlElement('w:b')
  const runXml = runWithProperties([boldXml])
  const run = readXmlElementValue(runXml)
  assert.equal(run.isBold, true)
})

test('isBold is false if bold element is present and w:val is false', function () {
  const boldXml = new XmlElement('w:b', {'w:val': 'false'})
  const runXml = runWithProperties([boldXml])
  const run = readXmlElementValue(runXml)
  assert.equal(run.isBold, false)
})

test('isUnderline is false if underline element is not present', function () {
  const runXml = runWithProperties([])
  const run = readXmlElementValue(runXml)
  assert.deepEqual(run.isUnderline, false)
})

test('isUnderline is true if underline element is present', function () {
  const underlineXml = new XmlElement('w:u')
  const runXml = runWithProperties([underlineXml])
  const run = readXmlElementValue(runXml)
  assert.equal(run.isUnderline, true)
})

test('isStrikethrough is false if strikethrough element is not present', function () {
  const runXml = runWithProperties([])
  const run = readXmlElementValue(runXml)
  assert.deepEqual(run.isStrikethrough, false)
})

test('isStrikethrough is true if strikethrough element is present', function () {
  const strikethroughXml = new XmlElement('w:strike')
  const runXml = runWithProperties([strikethroughXml])
  const run = readXmlElementValue(runXml)
  assert.equal(run.isStrikethrough, true)
})

test('isItalic is false if bold element is not present', function () {
  const runXml = runWithProperties([])
  const run = readXmlElementValue(runXml)
  assert.deepEqual(run.isItalic, false)
})

test('isItalic is true if bold element is present', function () {
  const italicXml = new XmlElement('w:i')
  const runXml = runWithProperties([italicXml])
  const run = readXmlElementValue(runXml)
  assert.equal(run.isItalic, true)
})

test('isSmallCaps is false if smallcaps element is not present', function () {
  const runXml = runWithProperties([])
  const run = readXmlElementValue(runXml)
  assert.deepEqual(run.isSmallCaps, false)
})

test('isSmallCaps is true if smallcaps element is present', function () {
  const smallCapsXml = new XmlElement('w:smallCaps')
  const runXml = runWithProperties([smallCapsXml])
  const run = readXmlElementValue(runXml)
  assert.equal(run.isSmallCaps, true)
})

const booleanRunProperties = [
  {name: 'isBold', tagName: 'w:b'},
  {name: 'isUnderline', tagName: 'w:u'},
  {name: 'isItalic', tagName: 'w:i'},
  {name: 'isStrikethrough', tagName: 'w:strike'},
  {name: 'isSmallCaps', tagName: 'w:smallCaps'}
]

booleanRunProperties.forEach(function (runProperty) {
  test(runProperty.name + ' is false if ' + runProperty.tagName + ' is present and w:val is false', function () {
    const propertyXml = new XmlElement(runProperty.tagName, {'w:val': 'false'})
    const runXml = runWithProperties([propertyXml])
    const run = readXmlElementValue(runXml)
    assert.equal(run[runProperty.name], false)
  })

  test(runProperty.name + ' is false if ' + runProperty.tagName + ' is present and w:val is 0', function () {
    const propertyXml = new XmlElement(runProperty.tagName, {'w:val': '0'})
    const runXml = runWithProperties([propertyXml])
    const run = readXmlElementValue(runXml)
    assert.equal(run[runProperty.name], false)
  })

  test(runProperty.name + ' is true if ' + runProperty.tagName + ' is present and w:val is true', function () {
    const propertyXml = new XmlElement(runProperty.tagName, {'w:val': 'true'})
    const runXml = runWithProperties([propertyXml])
    const run = readXmlElementValue(runXml)
    assert.equal(run[runProperty.name], true)
  })

  test(runProperty.name + ' is true if ' + runProperty.tagName + ' is present and w:val is 1', function () {
    const propertyXml = new XmlElement(runProperty.tagName, {'w:val': '1'})
    const runXml = runWithProperties([propertyXml])
    const run = readXmlElementValue(runXml)
    assert.equal(run[runProperty.name], true)
  })
})

test('run has baseline vertical alignment by default', function () {
  const runXml = runWithProperties([])
  const run = readXmlElementValue(runXml)
  assert.deepEqual(run.verticalAlignment, documents.verticalAlignment.baseline)
})

test('run has vertical alignment read from properties', function () {
  const verticalAlignmentXml = new XmlElement('w:vertAlign', {'w:val': 'superscript'})
  const runXml = runWithProperties([verticalAlignmentXml])

  const run = readXmlElementValue(runXml)
  assert.deepEqual(run.verticalAlignment, documents.verticalAlignment.superscript)
})

test('run has null font by default', function () {
  const runXml = runWithProperties([])

  const run = readXmlElementValue(runXml)
  assert.deepEqual(run.font, null)
})

test('run has font read from properties', function () {
  const fontXml = new XmlElement('w:rFonts', {'w:ascii': 'Arial'})
  const runXml = runWithProperties([fontXml])

  const run = readXmlElementValue(runXml)
  assert.deepEqual(run.font, 'Arial')
})

test('run properties not included as child of run', function () {
  const runStyleXml = new XmlElement('w:rStyle')
  const runPropertiesXml = new XmlElement('w:rPr', {}, [runStyleXml])
  const runXml = new XmlElement('w:r', {}, [runPropertiesXml])
  const result = readXmlElement(runXml)
  assert.deepEqual(result.value.children, [])
})

test('w:tab is read as document tab element', function () {
  const tabXml = new XmlElement('w:tab')
  const result = readXmlElement(tabXml)
  assert.deepEqual(result.value, new documents.Tab())
})

test('w:noBreakHyphen is read as non-breaking hyphen character', function () {
  const noBreakHyphenXml = new XmlElement('w:noBreakHyphen')
  const result = readXmlElement(noBreakHyphenXml)
  assert.deepEqual(result.value, new documents.Text('\u2011'))
})

test('w:tbl is read as document table element', function () {
  const tableXml = new XmlElement('w:tbl', {}, [
    new XmlElement('w:tr', {}, [
      new XmlElement('w:tc', {}, [
        new XmlElement('w:p', {}, [])
      ])
    ])
  ])
  const result = readXmlElement(tableXml)
  assert.deepEqual(result.value, new documents.Table([
    new documents.TableRow([
      new documents.TableCell([
        new documents.Paragraph([])
      ])
    ])
  ]))
})

test('table has no style if it has no properties', function () {
  const tableXml = new XmlElement('w:tbl', {}, [])
  const table = readXmlElementValue(tableXml)
  assert.deepEqual(table.styleId, null)
})

test('table has style ID and name read from table properties if present', function () {
  const styleXml = new XmlElement('w:tblStyle', {'w:val': 'TableNormal'}, [])
  const propertiesXml = new XmlElement('w:tblPr', {}, [styleXml])
  const tableXml = new XmlElement('w:tbl', {}, [propertiesXml])

  const styles = new Styles({}, {}, {'TableNormal': {name: 'Normal Table'}})

  const table = readXmlElementValue(tableXml, {styles: styles})
  assert.deepEqual(table.styleId, 'TableNormal')
  assert.deepEqual(table.styleName, 'Normal Table')
})

test('warning is emitted when table style cannot be found', function () {
  const styleXml = new XmlElement('w:tblStyle', {'w:val': 'TableNormal'}, [])
  const propertiesXml = new XmlElement('w:tblPr', {}, [styleXml])
  const tableXml = new XmlElement('w:tbl', {}, [propertiesXml])

  const result = readXmlElement(tableXml, {styles: Styles.EMPTY})
  const table = result.value
  assert.deepEqual(table.styleId, 'TableNormal')
  assert.deepEqual(table.styleName, null)
  assert.deepEqual(result.messages, [warning('Table style with ID TableNormal was referenced but not defined in the document')])
})

test('w:tblHeader marks table row as header', function () {
  const tableXml = new XmlElement('w:tbl', {}, [
    new XmlElement('w:tr', {}, [
      new XmlElement('w:trPr', {}, [
        new XmlElement('w:tblHeader')
      ])
    ]),
    new XmlElement('w:tr')
  ])
  const result = readXmlElementValue(tableXml)
  assertThat(result, isTable({
    children: contains(
      isRow({isHeader: true}),
      isRow({isHeader: false})
    )
  }))
})

test('w:gridSpan is read as colSpan for table cell', function () {
  const tableXml = new XmlElement('w:tbl', {}, [
    new XmlElement('w:tr', {}, [
      new XmlElement('w:tc', {}, [
        new XmlElement('w:tcPr', {}, [
          new XmlElement('w:gridSpan', {'w:val': '2'})
        ]),
        new XmlElement('w:p', {}, [])
      ])
    ])
  ])
  const result = readXmlElement(tableXml)
  assert.deepEqual(result.value, new documents.Table([
    new documents.TableRow([
      new documents.TableCell([
        new documents.Paragraph([])
      ], {colSpan: 2})
    ])
  ]))
})

test('w:vMerge is read as rowSpan for table cell', function () {
  const tableXml = new XmlElement('w:tbl', {}, [
    row(emptyCell()),
    row(emptyCell(vMerge('restart'))),
    row(emptyCell(vMerge('continue'))),
    row(emptyCell(vMerge('continue'))),
    row(emptyCell())
  ])
  const result = readXmlElement(tableXml)
  assert.deepEqual(result.value, new documents.Table([
    docRow([docEmptyCell()]),
    docRow([docEmptyCell({rowSpan: 3})]),
    docRow([]),
    docRow([]),
    docRow([docEmptyCell()])
  ]))
})

test('w:vMerge without val is treated as continue', function () {
  const tableXml = new XmlElement('w:tbl', {}, [
    row(emptyCell(vMerge('restart'))),
    row(emptyCell(vMerge()))
  ])
  const result = readXmlElement(tableXml)
  assert.deepEqual(result.value, new documents.Table([
    docRow([docEmptyCell({rowSpan: 2})]),
    docRow([])
  ]))
})

test('w:vMerge accounts for cells spanning columns', function () {
  const tableXml = new XmlElement('w:tbl', {}, [
    row(emptyCell(), emptyCell(), emptyCell(vMerge('restart'))),
    row(emptyCell(gridSpan('2')), emptyCell(vMerge('continue'))),
    row(emptyCell(), emptyCell(), emptyCell(vMerge('continue'))),
    row(emptyCell(), emptyCell(), emptyCell())
  ])
  const result = readXmlElement(tableXml)
  assert.deepEqual(result.value, new documents.Table([
    docRow([docEmptyCell(), docEmptyCell(), docEmptyCell({rowSpan: 3})]),
    docRow([docEmptyCell({colSpan: 2})]),
    docRow([docEmptyCell(), docEmptyCell()]),
    docRow([docEmptyCell(), docEmptyCell(), docEmptyCell()])
  ]))
})

test('no vertical cell merging if merged cells do not line up', function () {
  const tableXml = new XmlElement('w:tbl', {}, [
    row(emptyCell(gridSpan('2'), vMerge('restart'))),
    row(emptyCell(), emptyCell(vMerge('continue')))
  ])
  const result = readXmlElement(tableXml)
  assert.deepEqual(result.value, new documents.Table([
    docRow([docEmptyCell({colSpan: 2})]),
    docRow([docEmptyCell(), docEmptyCell()])
  ]))
})

test('warning if non-row in table', function () {
  const tableXml = new XmlElement('w:tbl', {}, [
    new XmlElement('w:p')
  ])
  const result = readXmlElement(tableXml)
  assert.deepEqual(result.messages, [warning('unexpected non-row element in table, cell merging may be incorrect')])
})

test('warning if non-cell in table row', function () {
  const tableXml = new XmlElement('w:tbl', {}, [
    row(new XmlElement('w:p'))
  ])
  const result = readXmlElement(tableXml)
  assert.deepEqual(result.messages, [warning('unexpected non-cell element in table row, cell merging may be incorrect')])
})

function row () {
  return new XmlElement('w:tr', {}, Array.prototype.slice.call(arguments))
}

function emptyCell () {
  return new XmlElement('w:tc', {}, [
    new XmlElement('w:tcPr', {}, Array.prototype.slice.call(arguments))
  ])
}

function vMerge (val) {
  return new XmlElement('w:vMerge', {'w:val': val}, [])
}

function gridSpan (val) {
  return new XmlElement('w:gridSpan', {'w:val': val})
}

function docRow (children) {
  return new documents.TableRow(children)
}

function docEmptyCell (properties) {
  return new documents.TableCell([], properties)
}

test('w:bookmarkStart is read as a bookmarkStart', function () {
  const bookmarkStart = new XmlElement('w:bookmarkStart', {'w:name': '_Peter', 'w:id': '42'})
  const result = readXmlElement(bookmarkStart)
  assert.deepEqual(result.value.name, '_Peter')
  assert.deepEqual(result.value.type, 'bookmarkStart')
})

test('_GoBack bookmark is ignored', function () {
  const bookmarkStart = new XmlElement('w:bookmarkStart', {'w:name': '_GoBack'})
  const result = readXmlElement(bookmarkStart)
  assert.deepEqual(result.value, [])
})

const IMAGE_BUFFER = Buffer.from('Not an image at all!')
const IMAGE_RELATIONSHIP_ID = 'rId5'

function isSuccess (valueMatcher) {
  return hasProperties({
    messages: [],
    value: valueMatcher
  })
}

function isImage (options) {
  const matcher = hasProperties(_.extend({type: 'image'}, _.omit(options, 'buffer')))
  if (options.buffer) {
    return allOf(
      matcher,
      new FeatureMatcher(willBe(options.buffer), 'buffer', 'buffer', function (element) {
        return element.read()
      })
    )
  } else {
    return matcher
  }
}

function readEmbeddedImage (element) {
  return readXmlElement(element, {
    relationships: {
      'rId5': {target: 'media/hat.png'}
    },
    contentTypes: fakeContentTypes,
    docxFile: createFakeDocxFile({
      'word/media/hat.png': IMAGE_BUFFER
    })
  })
}

test('can read imagedata elements with r:id attribute', function () {
  const imagedataElement = new XmlElement('v:imagedata', {
    'r:id': IMAGE_RELATIONSHIP_ID,
    'o:title': 'It\'s a hat'
  })

  const result = readEmbeddedImage(imagedataElement)

  return promiseThat(result, isSuccess(isImage({
    altText: `It's a hat`,
    contentType: 'image/png',
    buffer: IMAGE_BUFFER
  })))
})

test('when v:imagedata element has no relationship ID then it is ignored with warning', function () {
  const imagedataElement = new XmlElement('v:imagedata')

  const result = readXmlElement(imagedataElement)

  assert.deepEqual(result.value, [])
  assert.deepEqual(result.messages, [warning('A v:imagedata element without a relationship ID was ignored')])
})

test('can read inline pictures', function () {
  const drawing = createInlineImage({
    blip: createEmbeddedBlip(IMAGE_RELATIONSHIP_ID),
    description: 'It\'s a hat'
  })

  const result = readEmbeddedImage(drawing)

  return promiseThat(result, isSuccess(contains(isImage({
    altText: `It's a hat`,
    contentType: 'image/png',
    buffer: IMAGE_BUFFER
  }))))
})

test('alt text title is used if alt text description is missing', function () {
  const drawing = createInlineImage({
    blip: createEmbeddedBlip(IMAGE_RELATIONSHIP_ID),
    title: 'It\'s a hat'
  })

  const result = readEmbeddedImage(drawing)

  return promiseThat(result, isSuccess(contains(isImage({
    altText: `It's a hat`
  }))))
})

test('alt text title is used if alt text description is blank', function () {
  const drawing = createInlineImage({
    blip: createEmbeddedBlip(IMAGE_RELATIONSHIP_ID),
    description: ' ',
    title: 'It\'s a hat'
  })

  const result = readEmbeddedImage(drawing)

  return promiseThat(result, isSuccess(contains(isImage({
    altText: `It's a hat`
  }))))
})

test('alt text description is preferred to alt text title', function () {
  const drawing = createInlineImage({
    blip: createEmbeddedBlip(IMAGE_RELATIONSHIP_ID),
    description: 'It\'s a hat',
    title: 'hat'
  })

  const result = readEmbeddedImage(drawing)

  return promiseThat(result, isSuccess(contains(isImage({
    altText: `It's a hat`
  }))))
})

test('can read anchored pictures', function () {
  const drawing = new XmlElement('w:drawing', {}, [
    new XmlElement('wp:anchor', {}, [
      new XmlElement('wp:docPr', {descr: 'It\'s a hat'}),
      new XmlElement('a:graphic', {}, [
        new XmlElement('a:graphicData', {}, [
          new XmlElement('pic:pic', {}, [
            new XmlElement('pic:blipFill', {}, [
              new XmlElement('a:blip', {'r:embed': IMAGE_RELATIONSHIP_ID})
            ])
          ])
        ])
      ])
    ])
  ])

  const result = readEmbeddedImage(drawing)

  return promiseThat(result, isSuccess(contains(isImage({
    altText: `It's a hat`,
    contentType: 'image/png',
    buffer: IMAGE_BUFFER
  }))))
})

test('can read linked pictures', function () {
  const drawing = createInlineImage({
    blip: createLinkedBlip('rId5'),
    description: 'It\'s a hat'
  })

  const element = single(readXmlElementValue(drawing, {
    relationships: {
      'rId5': {target: 'file:///media/hat.png'}
    },
    contentTypes: fakeContentTypes,
    files: testing.createFakeFiles({
      'file:///media/hat.png': IMAGE_BUFFER
    })
  }))
  return promiseThat(element, isImage({
    altText: `It's a hat`,
    contentType: 'image/png',
    buffer: IMAGE_BUFFER
  }))
})

test('warning if unsupported image type', function () {
  const drawing = createInlineImage({
    blip: createEmbeddedBlip('rId5'),
    description: 'It\'s a hat'
  })

  const result = readXmlElement(drawing, {
    relationships: {
      'rId5': {target: 'media/hat.emf'}
    },
    contentTypes: fakeContentTypes,
    docxFile: createFakeDocxFile({
      'word/media/hat.emf': IMAGE_BUFFER
    })
  })
  assert.deepEqual(result.messages, [warning('Image of type image/x-emf is unlikely to display in web browsers')])
  const element = single(result.value)
  assert.equal(element.contentType, 'image/x-emf')
})

test('no elements created if image cannot be found in w:drawing', function () {
  const drawing = new XmlElement('w:drawing', {}, [])

  const result = readXmlElement(drawing)
  assert.deepEqual(result.messages, [])
  assert.deepEqual(result.value, [])
})

test('no elements created if image cannot be found in wp:inline', function () {
  const drawing = new XmlElement('wp:inline', {}, [])

  const result = readXmlElement(drawing)
  assert.deepEqual(result.messages, [])
  assert.deepEqual(result.value, [])
})

test('children of w:ins are converted normally', function () {
  assertChildrenAreConvertedNormally('w:ins')
})

test('children of w:object are converted normally', function () {
  assertChildrenAreConvertedNormally('w:object')
})

test('children of w:smartTag are converted normally', function () {
  assertChildrenAreConvertedNormally('w:smartTag')
})

test('children of v:group are converted normally', function () {
  assertChildrenAreConvertedNormally('v:group')
})

function assertChildrenAreConvertedNormally (tagName) {
  const runXml = new XmlElement('w:r', {}, [])
  const result = readXmlElement(new XmlElement(tagName, {}, [runXml]))
  assert.deepEqual(result.value[0].type, 'run')
}

test('w:hyperlink', {
  'is read as external hyperlink if it has a relationship ID': function () {
    const runXml = new XmlElement('w:r', {}, [])
    const hyperlinkXml = new XmlElement('w:hyperlink', {'r:id': 'r42'}, [runXml])
    const relationships = {
      'r42': {target: 'http://example.com'}
    }
    const result = readXmlElement(hyperlinkXml, {relationships: relationships})
    assert.deepEqual(result.value.href, 'http://example.com')
    assert.deepEqual(result.value.children[0].type, 'run')
  },

  'is read as external hyperlink if it has a relationship ID and an anchor': function () {
    const runXml = new XmlElement('w:r', {}, [])
    const hyperlinkXml = new XmlElement('w:hyperlink', {'r:id': 'r42', 'w:anchor': 'fragment'}, [runXml])
    const relationships = {
      'r42': {target: 'http://example.com/'}
    }
    const result = readXmlElement(hyperlinkXml, {relationships: relationships})
    assert.deepEqual(result.value.href, 'http://example.com/#fragment')
    assert.deepEqual(result.value.children[0].type, 'run')
  },

  'existing fragment is replaced when anchor is set on external link': function () {
    const runXml = new XmlElement('w:r', {}, [])
    const hyperlinkXml = new XmlElement('w:hyperlink', {'r:id': 'r42', 'w:anchor': 'fragment'}, [runXml])
    const relationships = {
      'r42': {target: 'http://example.com/#previous'}
    }
    const result = readXmlElement(hyperlinkXml, {relationships: relationships})
    assert.deepEqual(result.value.href, 'http://example.com/#fragment')
    assert.deepEqual(result.value.children[0].type, 'run')
  },

  'is read as internal hyperlink if it has an anchor': function () {
    const runXml = new XmlElement('w:r', {}, [])
    const hyperlinkXml = new XmlElement('w:hyperlink', {'w:anchor': '_Peter'}, [runXml])
    const result = readXmlElement(hyperlinkXml)
    assert.deepEqual(result.value.anchor, '_Peter')
    assert.deepEqual(result.value.children[0].type, 'run')
  },

  'is ignored if it does not have a relationship ID nor anchor': function () {
    const runXml = new XmlElement('w:r', {}, [])
    const hyperlinkXml = new XmlElement('w:hyperlink', {}, [runXml])
    const result = readXmlElement(hyperlinkXml)
    assert.deepEqual(result.value[0].type, 'run')
  },

  'target frame is read': function () {
    const hyperlinkXml = new XmlElement('w:hyperlink', {
      'w:anchor': 'Introduction',
      'w:tgtFrame': '_blank'
    })
    const result = readXmlElementValue(hyperlinkXml)
    assertThat(result, hasProperties({targetFrame: '_blank'}))
  },

  'empty target frame is ignored': function () {
    const hyperlinkXml = new XmlElement('w:hyperlink', {
      'w:anchor': 'Introduction',
      'w:tgtFrame': ''
    })
    const result = readXmlElementValue(hyperlinkXml)
    assertThat(result, hasProperties({targetFrame: null}))
  }
})

test('w:br without explicit type is read as line break', function () {
  const breakXml = new XmlElement('w:br', {}, [])
  const result = readXmlElementValue(breakXml)
  assert.deepEqual(result, documents.lineBreak)
})

test('w:br with textWrapping type is read as line break', function () {
  const breakXml = new XmlElement('w:br', {'w:type': 'textWrapping'}, [])
  const result = readXmlElementValue(breakXml)
  assert.deepEqual(result, documents.lineBreak)
})

test('w:br with page type is read as page break', function () {
  const breakXml = new XmlElement('w:br', {'w:type': 'page'}, [])
  const result = readXmlElementValue(breakXml)
  assert.deepEqual(result, documents.pageBreak)
})

test('w:br with column type is read as column break', function () {
  const breakXml = new XmlElement('w:br', {'w:type': 'column'}, [])
  const result = readXmlElementValue(breakXml)
  assert.deepEqual(result, documents.columnBreak)
})

test(`warning on breaks that aren't recognised`, function () {
  const breakXml = new XmlElement('w:br', {'w:type': 'unknownBreakType'}, [])
  const result = readXmlElement(breakXml)
  assert.deepEqual(result.value, [])
  assert.deepEqual(result.messages, [warning('Unsupported break type: unknownBreakType')])
})

test('w:footnoteReference has ID read', function () {
  const referenceXml = new XmlElement('w:footnoteReference', {'w:id': '4'})
  const result = readXmlElement(referenceXml)
  assert.deepEqual(
    result.value,
    new documents.NoteReference({noteType: 'footnote', noteId: '4'})
  )
  assert.deepEqual(result.messages, [])
})

test('w:commentReference has ID read', function () {
  const referenceXml = new XmlElement('w:commentReference', {'w:id': '4'})
  const result = readXmlElement(referenceXml)
  assert.deepEqual(
    result.value,
    new documents.CommentReference({commentId: '4'})
  )
  assert.deepEqual(result.messages, [])
})

test('emits warning on unrecognised element', function () {
  const unrecognisedElement = new XmlElement('w:not-an-element')
  const result = readXmlElement(unrecognisedElement)
  assert.deepEqual(
    result.messages,
    [{
      type: 'warning',
      message: 'An unrecognised element was ignored: w:not-an-element'
    }]
  )
  assert.deepEqual(result.value, [])
})

test('w:bookmarkEnd is ignored without warning', function () {
  const ignoredElement = new XmlElement('w:bookmarkEnd')
  const result = readXmlElement(ignoredElement)
  assert.deepEqual(result.messages, [])
  assert.deepEqual([], result.value)
})

test('text boxes have content appended after containing paragraph', function () {
  const textbox = new XmlElement('w:pict', {}, [
    new XmlElement('v:shape', {}, [
      new XmlElement('v:textbox', {}, [
        new XmlElement('w:txbxContent', {}, [
          paragraphWithStyleId('textbox-content')
        ])
      ])
    ])
  ])
  const paragraph = new XmlElement('w:p', {}, [
    new XmlElement('w:r', {}, [textbox])
  ])
  const result = readXmlElement(paragraph)
  assert.deepEqual(result.value[1].styleId, 'textbox-content')
})

test('mc:Fallback is used when mc:AlternateContent is read', function () {
  const styles = new Styles({'first': {name: 'First'}, 'second': {name: 'Second'}}, {})
  const textbox = new XmlElement('mc:AlternateContent', {}, [
    new XmlElement('mc:Choice', {'Requires': 'wps'}, [
      paragraphWithStyleId('first')
    ]),
    new XmlElement('mc:Fallback', {}, [
      paragraphWithStyleId('second')
    ])
  ])
  const result = readXmlElement(textbox, {styles: styles})
  assert.deepEqual(result.value[0].styleId, 'second')
})

test('w:sdtContent is used when w:sdt is read', function () {
  const element = xml.element('w:sdt', {}, [
    xml.element('w:sdtContent', {}, [
      xml.element('w:t', {}, [xml.text('Blackdown')])
    ])
  ])
  const result = readXmlElement(element)
  assert.deepEqual(result.value, [new documents.Text('Blackdown')])
})

test('text nodes are ignored when reading children', function () {
  const runXml = new XmlElement('w:r', {}, [xml.text('[text]')])
  const run = readXmlElementValue(runXml)
  assert.deepEqual(run, new documents.Run([]))
})

const paragraphWithStyleId = styleId => new XmlElement('w:p', {}, [
  new XmlElement('w:pPr', {}, [
    new XmlElement('w:pStyle', {'w:val': styleId}, [])
  ])
])

const runWithProperties = children => new XmlElement('w:r', {}, [createRunPropertiesXml(children)])

const createRunPropertiesXml = children => new XmlElement('w:rPr', {}, children)

const single = array => {
  if (array.length === 1) return array[0]
  else throw new Error('Array has ' + array.length + ' elements')
}

const createInlineImage = options => {
  return new XmlElement('w:drawing', {}, [
    new XmlElement('wp:inline', {}, [
      new XmlElement('wp:docPr', {descr: options.description, title: options.title}),
      new XmlElement('a:graphic', {}, [
        new XmlElement('a:graphicData', {}, [
          new XmlElement('pic:pic', {}, [
            new XmlElement('pic:blipFill', {}, [
              options.blip
            ])
          ])
        ])
      ])
    ])
  ])
}
