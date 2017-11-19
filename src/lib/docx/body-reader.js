import { Result, warning } from '../results'
import * as documents from '../documents'
import * as uris from './uris'
import { flatten, negate } from '../utils'

const combineResults = results => {
  const result = Result.combine(results.map(x => x._result))
  return new ReadResult(
    flatten(result.value.map(x => x.element)),
    flatten(result.value.map(x => x.extra)).filter(x => x),
    result.messages
  )
}

const joinElements = (first, second) => flatten([first, second])

class BodyReader {
  constructor (options) {
    this.options = options
    this.complexFieldStack = []
    this.currentInstrText = []
    this.relationships = options.relationships
    this.contentTypes = options.contentTypes
    this.docxFile = options.docxFile
    this.files = options.files
    this.numbering = options.numbering
    this.styles = options.styles

    this.unknownComplexField = {type: 'unknown'}

    this.xmlElementReaders = {
      'w:p': element => this.readXmlElements(element.children)
        .map(children => {
          const properties = children.find(isParagraphProperties)
          return new documents.Paragraph(
            children.filter(negate(isParagraphProperties)),
            properties
          )
        })
        .insertExtra(),
      'w:pPr': element => this.readParagraphStyle(element).map(style => ({
        type: 'paragraphProperties',
        styleId: style.styleId,
        styleName: style.name,
        alignment: element.firstOrEmpty('w:jc').attributes['w:val'],
        numbering: readNumberingProperties(element.firstOrEmpty('w:numPr'), this.numbering)
      })),
      'w:r': element => this.readXmlElements(element.children)
        .map(children => {
          const properties = children.find(isRunProperties)
          children = children.filter(negate(isRunProperties))

          const hyperlinkHref = this.currentHyperlinkHref()
          if (hyperlinkHref !== null) children = [new documents.Hyperlink(children, {href: hyperlinkHref})]

          return new documents.Run(children, properties)
        }),
      'w:rPr': this.readRunProperties.bind(this),
      'w:fldChar': this.readFldChar.bind(this),
      'w:instrText': this.readInstrText.bind(this),
      'w:t': element => elementResult(new documents.Text(element.text())),
      'w:tab': element => elementResult(new documents.Tab()),
      'w:noBreakHyphen': () => elementResult(new documents.Text('\u2011')),
      'w:hyperlink': element => {
        const relationshipId = element.attributes['r:id']
        const anchor = element.attributes['w:anchor']
        return this.readXmlElements(element.children).map(children => {
          const create = options => {
            const targetFrame = element.attributes['w:tgtFrame'] || null

            return new documents.Hyperlink(
              children,
              Object.assign({targetFrame: targetFrame}, options)
            )
          }

          if (relationshipId) {
            let href = this.relationships[relationshipId].target
            if (anchor) href = uris.replaceFragment(href, anchor)
            return create({href: href})
          } else if (anchor) return create({anchor: anchor})
          else return children
        })
      },
      'w:tbl': this.readTable.bind(this),
      'w:tr': this.readTableRow.bind(this),
      'w:tc': this.readTableCell.bind(this),
      'w:footnoteReference': this.noteReferenceReader('footnote').bind(this),
      'w:endnoteReference': this.noteReferenceReader('endnote').bind(this),
      'w:commentReference': this.readCommentReference.bind(this),
      'w:br': element => {
        const breakType = element.attributes['w:type']
        if (breakType == null || breakType === 'textWrapping') return elementResult(documents.lineBreak)
        else if (breakType === 'page') return elementResult(documents.pageBreak)
        else if (breakType === 'column') return elementResult(documents.columnBreak)
        else return emptyResultWithMessages([warning('Unsupported break type: ' + breakType)])
      },
      'w:bookmarkStart': element => {
        const name = element.attributes['w:name']
        if (name === '_GoBack') return emptyResult()
        else return elementResult(new documents.BookmarkStart({name: name}))
      },

      'mc:AlternateContent': element => this.readChildElements(element.first('mc:Fallback')),

      'w:sdt': element => this.readXmlElements(element.firstOrEmpty('w:sdtContent').children),

      'w:ins': this.readChildElements.bind(this),
      'w:object': this.readChildElements.bind(this),
      'w:smartTag': this.readChildElements.bind(this),
      'w:drawing': this.readChildElements.bind(this),
      'w:pict': element => this.readChildElements(element).toExtra(),
      'v:roundrect': this.readChildElements.bind(this),
      'v:shape': this.readChildElements.bind(this),
      'v:textbox': this.readChildElements.bind(this),
      'w:txbxContent': this.readChildElements.bind(this),
      'wp:inline': this.readDrawingElement.bind(this),
      'wp:anchor': this.readDrawingElement.bind(this),
      'v:imagedata': this.readImageData.bind(this),
      'v:group': this.readChildElements.bind(this)
    }
  }

  static createBodyReader (options) {
    return new BodyReader(options)
  }

  readXmlElements (elements) {
    const results = elements.map(this.readXmlElement.bind(this))
    return combineResults(results)
  }

  readXmlElement (element) {
    if (element.type === 'element') {
      const handler = this.xmlElementReaders[element.name]
      if (handler) return handler(element)
      else if (!Object.prototype.hasOwnProperty.call(ignoreElements, element.name)) {
        const message = warning('An unrecognised element was ignored: ' + element.name)
        return emptyResultWithMessages([message])
      }
    }
    return emptyResult()
  }

  readRunProperties (element) {
    return this.readRunStyle(element).map(style => ({
      type: 'runProperties',
      styleId: style.styleId,
      styleName: style.name,
      verticalAlignment: element.firstOrEmpty('w:vertAlign').attributes['w:val'],
      font: element.firstOrEmpty('w:rFonts').attributes['w:ascii'],
      isBold: this.readBooleanElement(element.first('w:b')),
      isUnderline: this.readBooleanElement(element.first('w:u')),
      isItalic: this.readBooleanElement(element.first('w:i')),
      isStrikethrough: this.readBooleanElement(element.first('w:strike')),
      isSmallCaps: this.readBooleanElement(element.first('w:smallCaps'))
    }))
  }

  readBooleanElement (element) {
    if (element) {
      const value = element.attributes['w:val']
      return value !== 'false' && value !== '0'
    } else return false
  }

  readParagraphStyle (element) {
    return this.readStyle(element, 'w:pStyle', 'Paragraph', id => this.styles.findParagraphStyleById(id))
  }

  readRunStyle (element) {
    return this.readStyle(element, 'w:rStyle', 'Run', id => this.styles.findCharacterStyleById(id))
  }

  readTableStyle (element) {
    return this.readStyle(element, 'w:tblStyle', 'Table', id => this.styles.findTableStyleById(id))
  }

  readStyle (element, styleTagName, styleType, findStyleById) {
    const messages = []
    const styleElement = element.first(styleTagName)
    let styleId = null
    let name = null
    if (styleElement) {
      styleId = styleElement.attributes['w:val']
      if (styleId) {
        const style = findStyleById(styleId)
        if (style) name = style.name
        else messages.push(this.undefinedStyleWarning(styleType, styleId))
      }
    }
    return elementResultWithMessages({styleId: styleId, name: name}, messages)
  }

  readFldChar (element) {
    const type = element.attributes['w:fldCharType']
    if (type === 'begin') {
      this.complexFieldStack.push(this.unknownComplexField)
      this.currentInstrText = []
    } else if (type === 'end') this.complexFieldStack.pop()
    else if (type === 'separate') {
      const href = this.parseHyperlinkFieldCode(this.currentInstrText.join(''))
      const complexField = href === null ? this.unknownComplexField : {type: 'hyperlink', href: href}
      this.complexFieldStack.pop()
      this.complexFieldStack.push(complexField)
    }
    return emptyResult()
  }

  currentHyperlinkHref () {
    const topHyperlink = this.complexFieldStack.filter(complexField => complexField.type === 'hyperlink').slice(-1).pop()
    return topHyperlink ? topHyperlink.href : null
  }

  parseHyperlinkFieldCode (code) {
    const result = /\s*HYPERLINK "(.*)"/.exec(code)
    if (result) return result[1]
    else return null
  }

  readInstrText (element) {
    this.currentInstrText.push(element.text())
    return emptyResult()
  }

  noteReferenceReader (noteType) {
    return element => {
      const noteId = element.attributes['w:id']
      return elementResult(new documents.NoteReference({
        noteType: noteType,
        noteId: noteId
      }))
    }
  }

  readCommentReference (element) {
    return elementResult(new documents.CommentReference({
      commentId: element.attributes['w:id']
    }))
  }

  readChildElements (element) {
    return this.readXmlElements(element.children)
  }

  readTable (element) {
    const propertiesResult = this.readTableProperties(element.firstOrEmpty('w:tblPr'))
    return this.readXmlElements(element.children)
      .flatMap(this.calculateRowSpans.bind(this))
      .flatMap(children => propertiesResult.map(properties => new documents.Table(children, properties)))
  }

  readTableProperties (element) {
    return this.readTableStyle(element).map(style => ({
      styleId: style.styleId,
      styleName: style.name
    }))
  }

  readTableRow (element) {
    const properties = element.firstOrEmpty('w:trPr')
    const isHeader = !!properties.first('w:tblHeader')
    return this.readXmlElements(element.children).map(children => new documents.TableRow(children, {isHeader: isHeader}))
  }

  readTableCell (element) {
    return this.readXmlElements(element.children).map(children => {
      const properties = element.firstOrEmpty('w:tcPr')

      const gridSpan = properties.firstOrEmpty('w:gridSpan').attributes['w:val']
      const colSpan = gridSpan ? parseInt(gridSpan, 10) : 1

      const cell = new documents.TableCell(children, {colSpan: colSpan})
      cell._vMerge = this.readVMerge(properties)
      return cell
    })
  }

  readVMerge (properties) {
    const element = properties.first('w:vMerge')
    if (element) {
      let val = element.attributes['w:val']
      return val === 'continue' || !val
    } else return null
  }

  calculateRowSpans (rows) {
    const unexpectedNonRows = rows.some(row => row.type !== documents.types.tableRow)
    if (unexpectedNonRows) {
      return elementResultWithMessages(rows, [warning(
        'unexpected non-row element in table, cell merging may be incorrect'
      )])
    }
    const unexpectedNonCells = rows.some(row => row.children.some(cell => cell.type !== documents.types.tableCell))
    if (unexpectedNonCells) {
      return elementResultWithMessages(rows, [warning(
        'unexpected non-cell element in table row, cell merging may be incorrect'
      )])
    }

    const columns = {}

    rows.forEach(row => {
      let cellIndex = 0
      row.children.forEach(cell => {
        if (cell._vMerge && columns[cellIndex]) columns[cellIndex].rowSpan++
        else {
          columns[cellIndex] = cell
          cell._vMerge = false
        }
        cellIndex += cell.colSpan
      })
    })

    rows.forEach(row => {
      row.children = row.children.filter(cell => !cell._vMerge)
      row.children.forEach(cell => {
        delete cell._vMerge
      })
    })

    return elementResult(rows)
  }

  readDrawingElement (element) {
    const blips = element
      .getElementsByTagName('a:graphic')
      .getElementsByTagName('a:graphicData')
      .getElementsByTagName('pic:pic')
      .getElementsByTagName('pic:blipFill')
      .getElementsByTagName('a:blip')

    return combineResults(blips.map(this.readBlip.bind(this, element)))
  }

  readBlip (element, blip) {
    const properties = element.first('wp:docPr').attributes
    const altText = this.isBlank(properties.descr) ? properties.title : properties.descr
    return this.readImage(this.findBlipImageFile(blip), altText)
  }

  isBlank (value) {
    return value == null || /^\s*$/.test(value)
  }

  findBlipImageFile (blip) {
    const embedRelationshipId = blip.attributes['r:embed']
    const linkRelationshipid = blip.attributes['r:link']
    if (embedRelationshipId) return this.findEmbeddedImageFile(embedRelationshipId)
    else {
      const imagePath = this.relationships[linkRelationshipid].target
      return {
        path: imagePath,
        read: this.files.read.bind(this.files, imagePath)
      }
    }
  }

  readImageData (element) {
    const relationshipId = element.attributes['r:id']

    if (relationshipId) return this.readImage(this.findEmbeddedImageFile(relationshipId), element.attributes['o:title'])
    else return emptyResultWithMessages([warning('A v:imagedata element without a relationship ID was ignored')])
  }

  findEmbeddedImageFile (relationshipId) {
    const path = uris.uriToZipEntryName('word', this.relationships[relationshipId].target)
    return {
      path: path,
      read: this.docxFile.read.bind(this.docxFile, path)
    }
  }

  readImage (imageFile, altText) {
    const contentType = this.contentTypes.findContentType(imageFile.path)

    const image = new documents.Image({
      readImage: imageFile.read,
      altText: altText,
      contentType: contentType
    })
    const warnings = supportedImageTypes[contentType]
      ? [] : warning('Image of type ' + contentType + ' is unlikely to display in web browsers')
    return elementResultWithMessages(image, warnings)
  }

  undefinedStyleWarning (type, styleId) {
    return warning(
      type + ' style with ID ' + styleId + ' was referenced but not defined in the document')
  }
}

export const CreateBodyReader = BodyReader.createBodyReader

const readNumberingProperties = (element, numbering) => {
  const level = element.firstOrEmpty('w:ilvl').attributes['w:val']
  const numId = element.firstOrEmpty('w:numId').attributes['w:val']
  if (level === undefined || numId === undefined) return null
  else return numbering.findLevel(numId, level)
}

const supportedImageTypes = {
  'image/png': true,
  'image/gif': true,
  'image/jpeg': true,
  'image/svg+xml': true,
  'image/tiff': true
}

const ignoreElements = {
  'office-word:wrap': true,
  'v:shadow': true,
  'v:shapetype': true,
  'w:annotationRef': true,
  'w:bookmarkEnd': true,
  'w:sectPr': true,
  'w:proofErr': true,
  'w:lastRenderedPageBreak': true,
  'w:commentRangeStart': true,
  'w:commentRangeEnd': true,
  'w:del': true,
  'w:footnoteRef': true,
  'w:endnoteRef': true,
  'w:tblPr': true,
  'w:tblGrid': true,
  'w:trPr': true,
  'w:tcPr': true
}

const isParagraphProperties = element => element.type === 'paragraphProperties'

const isRunProperties = element => element.type === 'runProperties'

const emptyResultWithMessages = messages => new ReadResult(null, null, messages)

const emptyResult = () => new ReadResult(null)

const elementResult = element => new ReadResult(element)

const elementResultWithMessages = (element, messages) => new ReadResult(element, null, messages)

class ReadResult {
  constructor (element, extra, messages) {
    this.value = element || []
    this.extra = extra
    this._result = new Result({
      element: this.value,
      extra: extra
    }, messages)
    this.messages = this._result.messages
  }

  toExtra () {
    return new ReadResult(null, joinElements(this.extra, this.value), this.messages)
  }

  insertExtra () {
    const extra = this.extra
    if (extra && extra.length) return new ReadResult(joinElements(this.value, extra), null, this.messages)
    else return this
  }

  map (func) {
    const result = this._result.map(value => func(value.element))
    return new ReadResult(result.value, this.extra, result.messages)
  }

  flatMap (func) {
    const result = this._result.flatMap(value => func(value.element)._result)
    return new ReadResult(result.value.element, joinElements(this.extra, result.value.extra), result.messages)
  }
}

export { readNumberingProperties as _readNumberingProperties }
