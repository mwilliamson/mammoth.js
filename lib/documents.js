var _ = require("underscore");

var types = {
    document: "document",
    paragraph: "paragraph",
    run: "run",
    text: "text",
    tab: "tab",
    hyperlink: "hyperlink",
    footnoteReference: "footnoteReference",
    image: "image",
    note: "note",
    table: "table",
    tableRow: "tableRow",
    tableCell: "tableCell",
    lineBreak: "lineBreak"
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
        href: options.href
    };
}

function FootnoteReference(options) {
    return {
        type: types.footnoteReference,
        footnoteId: options.footnoteId
    };
}

function Notes(notes) {
    this._notes = _.indexBy(notes, function(note) {
        return noteKey(note.noteType, note.id);
    });
}

Notes.prototype.findFootnoteById = function(id) {
    return this.findNoteByKey(noteKey("footnote", id));
};

Notes.prototype.findNoteByKey = function(key) {
    return this._notes[key] || null;
};

function Note(options) {
    return {
        type: types.note,
        noteType: options.noteType,
        id: options.id,
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

exports.Document = Document;
exports.Paragraph = Paragraph;
exports.Run = Run;
exports.Text = Text;
exports.Tab = Tab;
exports.Hyperlink = Hyperlink;
exports.FootnoteReference = FootnoteReference;
exports.Notes = Notes;
exports.Note = Note;
exports.Image = Image;
exports.Table = Table;
exports.TableRow = TableRow;
exports.TableCell = TableCell;
exports.LineBreak = LineBreak;

exports.verticalAlignment = verticalAlignment;
