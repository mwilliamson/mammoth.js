exports.read = read;

var promises = require("../promises");
var unzip = require("../unzip");

var readXmlFromZipFile = require("./office-xml-reader").readXmlFromZipFile;
var BodyReader = require("./body-reader").BodyReader;
var DocumentXmlReader = require("./document-xml-reader").DocumentXmlReader;
var relationshipsReader = require("./relationships-reader");
var contentTypesReader = require("./content-types-reader");
var numberingXml = require("./numbering-xml");
var stylesReader = require("./styles-reader");
var notesReader = require("./notes-reader");


function read(options) {
    return promises.props({
        docxFile: unzip.openZip(options)
    }).also(function(result) {
        return {
            relationships: readRelationshipsFromZipFile(result.docxFile),
            contentTypes: readContentTypesFromZipFile(result.docxFile),
            numbering: readNumberingFromZipFile(result.docxFile),
            styles: readStylesFromZipFile(result.docxFile)
        };
    }).also(function(result) {
        var bodyReader = new BodyReader({
            relationships: result.relationships,
            contentTypes: result.contentTypes,
            docxFile: result.docxFile,
            numbering: result.numbering,
            styles: result.styles
        });
        return {
            documentBodyReader: bodyReader, 
            footnotes: readFootnotesFromZipFile(result.docxFile),
            endnotes: readEndnotesFromZipFile(result.docxFile),
            documentXml: readXmlFromZipFile(result.docxFile, "word/document.xml")
        };
    }).then(function(result) {
        var reader = new DocumentXmlReader({
            bodyReader: result.documentBodyReader,
            footnotes: result.footnotes,
            endnotes: result.endnotes
        });
        return reader.convertXmlToDocument(result.documentXml);
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

var readContentTypesFromZipFile = xmlFileReader({
    filename: "[Content_Types].xml",
    readElement: contentTypesReader.readContentTypesFromXml,
    defaultValue: contentTypesReader.defaultContentTypes
});

var readRelationshipsFromZipFile = xmlFileReader({
    filename: "word/_rels/document.xml.rels",
    readElement: relationshipsReader.readRelationships,
    defaultValue: {}
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

var readFootnotesFromZipFile = xmlFileReader({
    filename: "word/footnotes.xml",
    readElement: notesReader.readFootnotesXml,
    defaultValue: undefined
});

var readEndnotesFromZipFile = xmlFileReader({
    filename: "word/endnotes.xml",
    readElement: notesReader.readEndnotesXml,
    defaultValue: undefined
});
