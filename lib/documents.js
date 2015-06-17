var _ = require("underscore");

var types = {
    document: "document",
    paragraph: "paragraph",
    run: "run",
    text: "text",
    tab: "tab",
    hyperlink: "hyperlink",
    noteReference: "noteReference",
    image: "image",
    note: "note",
    table: "table",
    tableRow: "tableRow",
    tableCell: "tableCell",
    lineBreak: "lineBreak",
    bookmarkStart: "bookmarkStart"
};

function Document(children, options) {
    options = options || {};
    return {
        type: types.document,
        children: children,
        notes: options.notes || new Notes({})
    };
}

function Paragraph(children, properties) {
    properties = properties || {};
    return {
        type: types.paragraph,
        children: children,
        styleId: properties.styleId || null,
        styleName: properties.styleName || null,
        numbering: properties.numbering || null,
        alignment: properties.alignment || null
    };
}

function Run(children, properties) {
    properties = properties || {};
    return {
        type: types.run,
        children: children,
        styleId: properties.styleId || null,
        styleName: properties.styleName || null,
        isBold: properties.isBold,
        isUnderline: properties.isUnderline,
        isItalic: properties.isItalic,
        isStrikethrough: properties.isStrikethrough,
        verticalAlignment: properties.verticalAlignment || verticalAlignment.baseline
    };
}

var verticalAlignment = {
    baseline: "baseline",
    superscript: "superscript",
    subscript: "subscript"
};

function Text(value) {
    return {
        type: types.text,
        value: value
    };
}

function Tab() {
    return {
        type: types.tab
    };
}

function Hyperlink(children, options) {
    return {
        type: types.hyperlink,
        children: children,
        href: options.href,
        anchor: options.anchor
    };
}

function NoteReference(options) {
    return {
        type: types.noteReference,
        noteType: options.noteType,
        noteId: options.noteId
    };
}

function Notes(notes) {
    this._notes = _.indexBy(notes, function(note) {
        return noteKey(note.noteType, note.noteId);
    });
}

Notes.prototype.resolve = function(reference) {
    return this.findNoteByKey(noteKey(reference.noteType, reference.noteId));
};

Notes.prototype.findNoteByKey = function(key) {
    return this._notes[key] || null;
};

function Note(options) {
    return {
        type: types.note,
        noteType: options.noteType,
        noteId: options.noteId,
        body: options.body
    };
}

function noteKey(noteType, id) {
    return noteType + "-" + id;
}

function Image(options) {
    return {
        type: types.image,
        read: options.readImage,
        altText: options.altText,
        contentType: options.contentType
    };
}

function Table(children) {
    return {
        type: types.table,
        children: children
    };
}

function TableRow(children) {
    return {
        type: types.tableRow,
        children: children
    };
}

function TableCell(children) {
    return {
        type: types.tableCell,
        children: children
    };
}

function LineBreak() {
    return {
        type: types.lineBreak
    };
}

function BookmarkStart(options) {
    return {
        type: types.bookmarkStart,
        name: options.name
    };
}

exports.Document = Document;
exports.Paragraph = Paragraph;
exports.Run = Run;
exports.Text = Text;
exports.Tab = Tab;
exports.Hyperlink = Hyperlink;
exports.NoteReference = NoteReference;
exports.Notes = Notes;
exports.Note = Note;
exports.Image = Image;
exports.Table = Table;
exports.TableRow = TableRow;
exports.TableCell = TableCell;
exports.LineBreak = LineBreak;
exports.BookmarkStart = BookmarkStart;

exports.verticalAlignment = verticalAlignment;
