import * as promises from './promises'
import * as results from './results'
import * as images from './images'
import * as Html from './html/index'
import * as htmlPaths from './styles/html-paths'
import * as documents from './documents'
import * as writers from './writers/index'
import { flatMap, indexBy } from './utils'

class DocumentConversion {
  constructor (options, comments) {
    this.noteNumber = 1

    this.noteReferences = []

    this.referencedComments = []
    this.comments = comments
    this.options = Object.assign({ignoreEmptyParagraphs: true}, options)
    this.idPrefix = this.options.idPrefix === undefined ? '' : this.options.idPrefix
    this.ignoreEmptyParagraphs = this.options.ignoreEmptyParagraphs

    this.defaultParagraphStyle = htmlPaths.topLevelElement('p')

    this.styleMap = this.options.styleMap || []

    this.defaultTablePath = htmlPaths.elements([
      htmlPaths.element('table', {}, {fresh: true})
    ])

    this.elementConverters = {
      'document': (document, messages, options) => {
        const children = this.convertElements(document.children, messages, options)
        const notes = this.noteReferences.map(noteReference => document.notes.resolve(noteReference))
        const notesNodes = this.convertElements(notes, messages, options)
        return children.concat([
          Html.freshElement('ol', {}, notesNodes),
          Html.freshElement('dl', {}, flatMap(this.referencedComments, (referencedComment) => this.convertComment(referencedComment, messages, options)))
        ])
      },
      'paragraph': this.convertParagraph.bind(this),
      'run': this.convertRun.bind(this),
      'text': (element, messages, options) => [Html.text(element.value)],
      'tab': (element, messages, options) => [Html.text('\t')],
      'hyperlink': (element, messages, options) => {
        const href = element.anchor ? '#' + this.htmlId(element.anchor) : element.href
        const attributes = {href: href}
        if (element.targetFrame != null) {
          attributes.target = element.targetFrame
        }

        const children = this.convertElements(element.children, messages, options)
        return [Html.freshElement('a', attributes, children)]
      },
      'bookmarkStart': (element, messages, options) => {
        const anchor = Html.freshElement('a', {
          id: this.htmlId(element.name)
        }, [Html.forceWrite])
        return [anchor]
      },
      'noteReference': (element, messages, options) => {
        this.noteReferences.push(element)
        const anchor = Html.freshElement('a', {
          href: '#' + this.noteHtmlId(element),
          id: this.noteRefHtmlId(element)
        }, [Html.text('[' + (this.noteNumber++) + ']')])

        return [Html.freshElement('sup', {}, [anchor])]
      },
      'note': (element, messages, options) => {
        const children = this.convertElements(element.body, messages, options)
        const backLink = Html.elementWithTag(htmlPaths.element('p', {}, {fresh: false}), [
          Html.text(' '),
          Html.freshElement('a', {href: '#' + this.noteRefHtmlId(element)}, [Html.text('↑')])
        ])
        const body = children.concat([backLink])

        return Html.freshElement('li', {id: this.noteHtmlId(element)}, body)
      },
      'commentReference': this.convertCommentReference.bind(this),
      'comment': this.convertComment.bind(this),
      'image': deferredConversion(this.recoveringConvertImage(this.options.convertImage || images.dataUri)),
      'table': this.convertTable.bind(this),
      'tableRow': this.convertTableRow.bind(this),
      'tableCell': this.convertTableCell.bind(this),
      'break': this.convertBreak.bind(this)
    }
  }

  convertToHtml (document) {
    const messages = []

    const html = this.elementToHtml(document, messages, {})

    const deferredNodes = []
    walkHtml(html, node => {
      if (node.type === 'deferred') deferredNodes.push(node)
    })
    const deferredValues = {}
    return promises.mapSeries(deferredNodes, deferred => deferred.value()
      .then(value => {
        deferredValues[deferred.id] = value
      }))
      .then(() => {
        const replaceDeferred = nodes => flatMap(nodes, node => {
          if (node.type === 'deferred') return deferredValues[node.id]
          else if (node.children) {
            return [
              Object.assign({}, node, {
                children: replaceDeferred(node.children)
              })
            ]
          } else return [node]
        })

        const writer = writers.writer({
          prettyPrint: this.options.prettyPrint,
          outputFormat: this.options.outputFormat
        })
        Html.write(writer, Html.simplify(replaceDeferred(html)))
        return new results.Result(writer.asString(), messages)
      })
  }

  convertElements (elements, messages, options) {
    return flatMap(elements, element => this.elementToHtml(element, messages, options))
  }

  elementToHtml (element, messages, options) {
    if (!options) throw new Error('options not set')
    const handler = this.elementConverters[element.type]
    if (handler) return handler(element, messages, options)
    else return []
  }

  convertParagraph (element, messages, options) {
    return this.htmlPathForParagraph(element, messages).wrap(() => {
      const content = this.convertElements(element.children, messages, options)
      if (this.ignoreEmptyParagraphs) return content
      else return [Html.forceWrite].concat(content)
    })
  }

  htmlPathForParagraph (element, messages) {
    const style = this.findStyle(element)

    if (style) return style.to
    else {
      if (element.styleId) messages.push(unrecognisedStyleWarning('paragraph', element))
      return this.defaultParagraphStyle
    }
  }

  convertRun (run, messages, options) {
    let nodes = () => this.convertElements(run.children, messages, options)

    const paths = []
    if (run.isSmallCaps) paths.push(this.findHtmlPathForRunProperty('smallCaps'))

    if (run.isStrikethrough) paths.push(this.findHtmlPathForRunProperty('strikethrough', 's'))

    if (run.isUnderline) paths.push(this.findHtmlPathForRunProperty('underline'))

    if (run.verticalAlignment === documents.verticalAlignment.subscript) paths.push(htmlPaths.element('sub', {}, {fresh: false}))

    if (run.verticalAlignment === documents.verticalAlignment.superscript) paths.push(htmlPaths.element('sup', {}, {fresh: false}))

    if (run.isItalic) paths.push(this.findHtmlPathForRunProperty('italic', 'em'))

    if (run.isBold) paths.push(this.findHtmlPathForRunProperty('bold', 'strong'))

    let stylePath = htmlPaths.empty
    const style = this.findStyle(run)
    if (style) stylePath = style.to
    else if (run.styleId) messages.push(unrecognisedStyleWarning('run', run))

    paths.push(stylePath)

    paths.forEach(path => {
      nodes = path.wrap.bind(path, nodes)
    })

    return nodes()
  }

  findHtmlPathForRunProperty (elementType, defaultTagName) {
    const path = this.findHtmlPath({type: elementType})
    if (path) return path
    else if (defaultTagName) return htmlPaths.element(defaultTagName, {}, {fresh: false})
    else return htmlPaths.empty
  }

  findHtmlPath (element, defaultPath) {
    const style = this.findStyle(element)
    return style ? style.to : defaultPath
  }

  findStyle (element) {
    for (let i = 0; i < this.styleMap.length; i++) {
      if (this.styleMap[i].from.matches(element)) {
        return this.styleMap[i]
      }
    }
  }

  recoveringConvertImage (convertImage) {
    return (image, messages) =>
      promises.attempt(() => convertImage(image, messages))
        .catch(error => {
          messages.push(results.error(error))
          return []
        })
  }

  noteHtmlId (note) {
    return this.referentHtmlId(note.noteType, note.noteId)
  }

  noteRefHtmlId (note) {
    return this.referenceHtmlId(note.noteType, note.noteId)
  }

  referentHtmlId (referenceType, referenceId) {
    return this.htmlId(referenceType + '-' + referenceId)
  }

  referenceHtmlId (referenceType, referenceId) {
    return this.htmlId(referenceType + '-ref-' + referenceId)
  }

  htmlId (suffix) {
    return this.idPrefix + suffix
  }

  convertTable (element, messages, options) {
    return this.findHtmlPath(element, this.defaultTablePath)
      .wrap(() => this.convertTableChildren(element, messages, options))
  }

  convertTableChildren (element, messages, options) {
    let bodyIndex = element.children.findIndex(child => !child.type === documents.types.tableRow || !child.isHeader)
    if (bodyIndex === -1) bodyIndex = element.children.length

    let children
    if (bodyIndex === 0) {
      children = this.convertElements(
        element.children,
        messages,
        Object.assign({}, options, {isTableHeader: false})
      )
    } else {
      const headRows = this.convertElements(
        element.children.slice(0, bodyIndex),
        messages,
        Object.assign({}, options, {isTableHeader: true})
      )
      const bodyRows = this.convertElements(
        element.children.slice(bodyIndex),
        messages,
        Object.assign({}, options, {isTableHeader: false})
      )
      children = [
        Html.freshElement('thead', {}, headRows),
        Html.freshElement('tbody', {}, bodyRows)
      ]
    }
    return [Html.forceWrite].concat(children)
  }

  convertTableRow (element, messages, options) {
    return this.wrapChildrenInFreshElement(element, 'tr', messages, options)
  }

  convertTableCell (element, messages, options) {
    const tagName = options.isTableHeader ? 'th' : 'td'
    const children = this.convertElements(element.children, messages, options)
    const attributes = {}
    if (element.colSpan !== 1) attributes.colspan = element.colSpan.toString()

    if (element.rowSpan !== 1) attributes.rowspan = element.rowSpan.toString()

    return [
      Html.freshElement(tagName, attributes, [Html.forceWrite].concat(children))
    ]
  }

  convertCommentReference (reference, messages, options) {
    return this.findHtmlPath(reference, htmlPaths.ignore)
      .wrap(() => {
        const comment = this.comments[reference.commentId]
        const count = this.referencedComments.length + 1
        const label = '[' + commentAuthorLabel(comment) + count + ']'
        this.referencedComments.push({label: label, comment: comment})
        // TODO: remove duplication with note references
        return [
          Html.freshElement('a', {
            href: '#' + this.referentHtmlId('comment', reference.commentId),
            id: this.referenceHtmlId('comment', reference.commentId)
          }, [Html.text(label)])
        ]
      })
  }

  convertComment (referencedComment, messages, options) {
    // TODO: remove duplication with note references

    const label = referencedComment.label
    const comment = referencedComment.comment
    const body = this.convertElements(comment.body, messages, options).concat([
      Html.nonFreshElement('p', {}, [
        Html.text(' '),
        Html.freshElement('a', {'href': '#' + this.referenceHtmlId('comment', comment.commentId)}, [
          Html.text('↑')
        ])
      ])
    ])

    return [
      Html.freshElement(
        'dt',
        {'id': this.referentHtmlId('comment', comment.commentId)},
        [Html.text('Comment ' + label)]
      ),
      Html.freshElement('dd', {}, body)
    ]
  }

  convertBreak (element, messages, options) {
    return this.htmlPathForBreak(element).wrap(() => [])
  }

  htmlPathForBreak (element) {
    const style = this.findStyle(element)
    if (style) return style.to
    else if (element.breakType === 'line') return htmlPaths.topLevelElement('br')
    else return htmlPaths.empty
  }

  wrapChildrenInFreshElement (element, wrapElementName, messages, options) {
    const children = this.convertElements(element.children, messages, options)
    return [
      Html.freshElement(wrapElementName, {}, [Html.forceWrite].concat(children))
    ]
  }
}

export class DocumentConverter extends DocumentConversion {
  convertToHtml (element) {
    this.comments = indexBy((element.type === documents.types.document ? element.comments : []), 'commentId')

    return super.convertToHtml(element)
  }
}

let deferredId = 1

const deferredConversion = func => (element, messages, options) => [
  {
    type: 'deferred',
    id: deferredId++,
    value: () => func(element, messages, options)
  }
]

const unrecognisedStyleWarning = (type, element) => results.warning(
  'Unrecognised ' + type + ' style: \'' + element.styleName + '\'' +
  ' (Style ID: ' + element.styleId + ')'
)

const walkHtml = (nodes, callback) => {
  nodes.forEach(node => {
    callback(node)
    if (node.children) {
      walkHtml(node.children, callback)
    }
  })
}

export const commentAuthorLabel = comment => comment.authorInitials || ''
