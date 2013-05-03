var docxReader = require("./docx-reader");
var DocumentConverter = require("./document-to-html").DocumentConverter;
var htmlPaths = require("./html-paths");
var documentMatchers = require("./document-matchers");

exports.Converter = Converter;
exports.read = read;
exports.convertDocumentToHtml = convertDocumentToHtml;
exports.htmlPaths = htmlPaths;
exports.standardOptions = {
    styleMap: [
        {
            from: documentMatchers.paragraph("Heading1"),
            to: htmlPaths.topLevelElement("h1")
        },
        {
            from: documentMatchers.paragraph("Heading2"),
            to: htmlPaths.topLevelElement("h2")
        },
        {
            from: documentMatchers.paragraph("Heading3"),
            to: htmlPaths.topLevelElement("h3")
        },
        {
            from: documentMatchers.paragraph("Heading4"),
            to: htmlPaths.topLevelElement("h4")
        },
        {
            from: documentMatchers.paragraph("ListParagraph"),
            to: htmlPaths.elements([
                htmlPaths.element("ul"),
                htmlPaths.element("li", {}, {fresh: true})
            ])
        }
    ]
};

function Converter(options) {
    this._options = options;
}

Converter.prototype.convertToHtml = function(inputOptions) {
    var options = this._options;
    return read(inputOptions)
        .then(function(documentResult) {
            return convertDocumentToHtml(documentResult, options);
        });
}

function read(inputOptions) {
    return docxReader.read(inputOptions);
}

function convertDocumentToHtml(documentResult, options) {
    var documentConverter = new DocumentConverter(options);
    return documentResult.flatMapThen(function(document) {
        return documentConverter.convertToHtml(document);
    });
}
