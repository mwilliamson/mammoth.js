exports.read = read;
exports._findPartPaths = findPartPaths;

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
        partPaths: findPartPaths(docxFile),
        docxFile: docxFile,
        files: new Files(input.path ? path.dirname(input.path) : null)
    }).also(function(result) {
        return {
            numbering: readNumberingFromZipFile(docxFile, result.partPaths.numbering),
            styles: readStylesFromZipFile(docxFile, result.partPaths.styles)
        };
    }).also(function(result) {
        return {
            footnotes: readXmlFileWithBody(result.partPaths.footnotes, result, function(bodyReader, xml) {
                if (xml) {
                    return notesReader.createFootnotesReader(bodyReader)(xml);
                } else {
                    return new Result([]);
                }
            }),
            endnotes: readXmlFileWithBody(result.partPaths.endnotes, result, function(bodyReader, xml) {
                if (xml) {
                    return notesReader.createEndnotesReader(bodyReader)(xml);
                } else {
                    return new Result([]);
                }
            }),
            comments: readXmlFileWithBody(result.partPaths.comments, result, function(bodyReader, xml) {
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
        return readXmlFileWithBody(result.partPaths.mainDocument, result, function(bodyReader, xml) {
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
        });
    });
}

function findPartPaths(docxFile) {
    return readPackageRelationships(docxFile).then(function(packageRelationships) {
        var documentFilename = findDocumentFilename(docxFile, packageRelationships);
        return {
            mainDocument: documentFilename,
            comments: "word/comments.xml",
            endnotes: "word/endnotes.xml",
            footnotes: "word/footnotes.xml",
            numbering: "word/numbering.xml",
            styles: "word/styles.xml"
        };
    });
}

function findDocumentFilename(docxFile, relationships) {
    var officeDocumentType = "http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument";
    var targets = relationships.findTargetsByType(officeDocumentType).concat(["word/document.xml"]);
    var normalisedTargets = targets.map(function(target) {
        return stripPrefix(target, "/");
    });
    var validTargets = normalisedTargets.filter(function(target) {
        return docxFile.exists(target);
    });
    if (validTargets.length === 0) {
        throw new Error("Could not find main document part. Are you sure this is a valid .docx file?");
    } else {
        return validTargets[0];
    }
}

function stripPrefix(value, prefix) {
    if (value.substring(0, prefix.length) === prefix) {
        return value.substring(prefix.length);
    } else {
        return value;
    }
}

function xmlFileReader(options) {
    return function(zipFile) {
        return readXmlFromZipFile(zipFile, options.filename)
            .then(function(element) {
                return element ? options.readElement(element) : options.defaultValue;
            });
    };
}

function readXmlFileWithBody(filename, options, func) {
    var readRelationshipsFromZipFile = xmlFileReader({
        filename: relationshipsFilename(filename),
        readElement: relationshipsReader.readRelationships,
        defaultValue: relationshipsReader.defaultValue
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
        return readXmlFromZipFile(options.docxFile, filename)
            .then(function(xml) {
                return func(bodyReader, xml);
            });
    });
}

function relationshipsFilename(filename) {
    var parts = filename.split("/");
    return parts.slice(0, parts.length - 1).join("/") +
        "/_rels/" + parts[parts.length - 1] + ".rels";
}

var readContentTypesFromZipFile = xmlFileReader({
    filename: "[Content_Types].xml",
    readElement: contentTypesReader.readContentTypesFromXml,
    defaultValue: contentTypesReader.defaultContentTypes
});

function readNumberingFromZipFile(zipFile, path) {
    return xmlFileReader({
        filename: path,
        readElement: numberingXml.readNumberingXml,
        defaultValue: numberingXml.defaultNumbering
    })(zipFile);
}

function readStylesFromZipFile(zipFile, path) {
    return xmlFileReader({
        filename: path,
        readElement: stylesReader.readStylesXml,
        defaultValue: stylesReader.defaultStyles
    })(zipFile);
}

var readPackageRelationships = xmlFileReader({
    filename: "_rels/.rels",
    readElement: relationshipsReader.readRelationships,
    defaultValue: relationshipsReader.defaultValue
});
