exports.read = read;

var path = require("path");

var promises = require("../promises");
var documents = require("../documents");
var Result = require("../results").Result;

var readXmlFromZipFile = require("./office-xml-reader").readXmlFromZipFile;
var createBodyReader = require("./body-reader").createBodyReader;
var DocumentXmlReader = require("./document-xml-reader").DocumentXmlReader;
var relationshipsReader = require("./relationships-reader");
var contentTypesReader = require("./content-types-reader");
var numberingXml = require("./numbering-xml");
var stylesReader = require("./styles-reader");
var notesReader = require("./notes-reader");
var commentsReader = require("./comments-reader");
var Files = require("./files").Files;


function read(docxFile, input) {
    input = input || {};
    return promises.props({
        contentTypes: readContentTypesFromZipFile(docxFile),
        numbering: readNumberingFromZipFile(docxFile),
        styles: readStylesFromZipFile(docxFile),
        docxFile: docxFile,
        files: new Files(input.path ? path.dirname(input.path) : null)
    }).also(function(result) {
        return {
            footnotes: readXmlFileWithBody("footnotes", result, function(bodyReader, xml) {
                if (xml) {
                    return notesReader.createFootnotesReader(bodyReader)(xml);
                } else {
                    return new Result([]);
                }
            }),
            endnotes: readXmlFileWithBody("endnotes", result, function(bodyReader, xml) {
                if (xml) {
                    return notesReader.createEndnotesReader(bodyReader)(xml);
                } else {
                    return new Result([]);
                }
            }),
            comments: readXmlFileWithBody("comments", result, function(bodyReader, xml) {
                if (xml) {
                    return commentsReader.createCommentsReader(bodyReader)(xml);
                } else {
                    return new Result([]);
                }
            })
        };
    }).also(function(result) {
        return {
            notes: result.footnotes.flatMap(function(footnotes) {
                return result.endnotes.map(function(endnotes) {
                    return new documents.Notes(footnotes.concat(endnotes));
                });
            })
        };
    }).then(function(result) {
        return readXmlFileWithBody("document", result, function(bodyReader, xml) {
            if (xml) {
                return result.notes.flatMap(function(notes) {
                    return result.comments.flatMap(function(comments) {
                        var reader = new DocumentXmlReader({
                            bodyReader: bodyReader,
                            notes: notes,
                            comments: comments
                        });
                        return reader.convertXmlToDocument(xml);
                    });
                });
            } else {
                throw new Error("Could not find word/document.xml in ZIP file. Are you sure this is a valid .docx file?");
            }
        });
    });
}

function xmlFileReader(options) {
    return function(zipFile) {
        return readXmlFromZipFile(zipFile, options.filename)
            .then(function(element) {
                return element ? options.readElement(element) : options.defaultValue;
            });
    };
}

function readXmlFileWithBody(name, options, func) {
    var readRelationshipsFromZipFile = xmlFileReader({
        filename: "word/_rels/" + name + ".xml.rels",
        readElement: relationshipsReader.readRelationships,
        defaultValue: {}
    });
    
    return readRelationshipsFromZipFile(options.docxFile).then(function(relationships) {
        var bodyReader = new createBodyReader({
            relationships: relationships,
            contentTypes: options.contentTypes,
            docxFile: options.docxFile,
            numbering: options.numbering,
            styles: options.styles,
            files: options.files
        });
        return readXmlFromZipFile(options.docxFile, "word/" + name + ".xml")
            .then(function(xml) {
                return func(bodyReader, xml);
            });
    });
}

var readContentTypesFromZipFile = xmlFileReader({
    filename: "[Content_Types].xml",
    readElement: contentTypesReader.readContentTypesFromXml,
    defaultValue: contentTypesReader.defaultContentTypes
});

var readNumberingFromZipFile = xmlFileReader({
    filename: "word/numbering.xml",
    readElement: numberingXml.readNumberingXml,
    defaultValue: numberingXml.defaultNumbering
});

var readStylesFromZipFile = xmlFileReader({
    filename: "word/styles.xml",
    readElement: stylesReader.readStylesXml,
    defaultValue: stylesReader.defaultStyles
});
