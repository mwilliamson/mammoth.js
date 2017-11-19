import _ from 'underscore'

export const types = {
  document: 'document',
  paragraph: 'paragraph',
  run: 'run',
  text: 'text',
  tab: 'tab',
  hyperlink: 'hyperlink',
  noteReference: 'noteReference',
  image: 'image',
  note: 'note',
  commentReference: 'commentReference',
  comment: 'Comment',
  table: 'table',
  tableRow: 'tableRow',
  tableCell: 'tableCell',
  'break': 'break',
  bookmarkStart: 'bookmarkStart'
}

export class Document {
  constructor (children, options = {}) {
    this.type = types.document
    this.children = children
    this.notes = options.notes || new Notes({})
    this.comments = options.comments || []
  }
}

export class Paragraph {
  constructor (children, properties = {}) {
    this.type = types.paragraph
    this.children = children
    this.styleId = properties.styleId || null
    this.styleName = properties.styleName || null
    this.numbering = properties.numbering || null
    this.alignment = properties.alignment || null
  }
}

export class Run {
  constructor (children, properties = {}) {
    this.type = types.run
    this.children = children
    this.styleId = properties.styleId || null
    this.styleName = properties.styleName || null
    this.isBold = properties.isBold
    this.isUnderline = properties.isUnderline
    this.isItalic = properties.isItalic
    this.isStrikethrough = properties.isStrikethrough
    this.isSmallCaps = properties.isSmallCaps
    this.verticalAlignment = properties.verticalAlignment || verticalAlignment.baseline
    this.font = properties.font || null
  }
}

export const verticalAlignment = {
  baseline: 'baseline',
  superscript: 'superscript',
  subscript: 'subscript'
}

export class Text {
  constructor (value) {
    this.type = types.text
    this.value = value
  }
}

export class Tab {
  constructor () {
    this.type = types.tab
  }
}

export class Hyperlink {
  constructor (children, options) {
    this.type = types.hyperlink
    this.children = children
    this.href = options.href
    this.anchor = options.anchor
    this.targetFrame = options.targetFrame
  }
}

export class NoteReference {
  constructor (options) {
    this.type = types.noteReference
    this.noteType = options.noteType
    this.noteId = options.noteId
  }
}

export class Notes {
  constructor (notes) {
    this._notes = _.indexBy(notes, note => noteKey(note.noteType, note.noteId))
  }

  resolve (reference) {
    return this.findNoteByKey(noteKey(reference.noteType, reference.noteId))
  }

  findNoteByKey (key) {
    return this._notes[key] || null
  }
}

export class Note {
  constructor (options) {
    this.type = types.note
    this.noteType = options.noteType
    this.noteId = options.noteId
    this.body = options.body
  }
}

export class CommentReference {
  constructor (options) {
    this.type = types.commentReference
    this.commentId = options.commentId
  }
}

export class Comment {
  constructor (options) {
    this.type = types.comment
    this.commentId = options.commentId
    this.body = options.body
    this.authorName = options.authorName
    this.authorInitials = options.authorInitials
  }
}

const noteKey = (noteType, id) => noteType + '-' + id

export class Image {
  constructor (options) {
    this.type = types.image
    this.read = options.readImage
    this.altText = options.altText
    this.contentType = options.contentType
  }
}

export class Table {
  constructor (children, properties = {}) {
    this.type = types.table
    this.children = children
    this.styleId = properties.styleId || null
    this.styleName = properties.styleName || null
  }
}

export class TableRow {
  constructor (children, options = {}) {
    this.type = types.tableRow
    this.children = children
    this.isHeader = options.isHeader || false
  }
}

export class TableCell {
  constructor (children, options = {}) {
    this.type = types.tableCell
    this.children = children
    this.colSpan = options.colSpan == null ? 1 : options.colSpan
    this.rowSpan = options.rowSpan == null ? 1 : options.rowSpan
  }
}

class Break {
  constructor (breakType) {
    this.type = types['break']
    this.breakType = breakType
  }
}

export class BookmarkStart {
  constructor (options) {
    this.type = types.bookmarkStart
    this.name = options.name
  }
}

export const lineBreak = new Break('line')
export const pageBreak = new Break('page')
export const columnBreak = new Break('column')
