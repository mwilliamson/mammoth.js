var types = {
    document: "document",
    paragraph: "paragraph",
    run: "run",
    text: "text",
    tab: "tab",
    hyperlink: "hyperlink",
    footnoteReference: "footnoteReference",
    image: "image",
    footnote: "footnote",
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
        footnotes: options.footnotes || new Footnotes({})
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
        isItalic: properties.isItalic
    };
}

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

function Footnotes(footnotes) {
    this._footnotes = footnotes;
}

Footnotes.prototype.findFootnoteById = function(id) {
    return this._footnotes[id] || null;
};

function Footnote(options) {
    return {
        type: types.footnote,
        body: options.body,
        id: options.id
    };
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
exports.Footnotes = Footnotes;
exports.Footnote = Footnote;
exports.Image = Image;
exports.Table = Table;
exports.TableRow = TableRow;
exports.TableCell = TableCell;
exports.LineBreak = LineBreak;
