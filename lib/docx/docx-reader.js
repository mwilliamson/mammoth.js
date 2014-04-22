exports.read = read;

var promises = require("../promises");
var unzip = require("../unzip");

var readXmlFromZipFile = require("./office-xml-reader").readXmlFromZipFile;
var documents = require("../documents");
var DocumentXmlReader = require("./document-xml-reader").DocumentXmlReader;
var relationshipsReader = require("./relationships-reader");
var contentTypesReader = require("./content-types-reader");
var numberingXml = require("./numbering-xml");
var stylesReader = require("./styles-reader");


function read(options) {
    var docxFile = unzip.openZip(options);
    return promises.when(docxFile).then(function(docxFile) {
        return promises.all([
            readRelationshipsFromZipFile(docxFile),
            readContentTypesFromZipFile(docxFile),
            readNumberingFromZipFile(docxFile),
            readStylesFromZipFile(docxFile),
            readXmlFromZipFile(docxFile, "word/document.xml"),
        ]).spread(function(relationships, contentTypes, numbering, styles, documentXml) {
            var reader = new DocumentXmlReader({
                relationships: relationships,
                contentTypes: contentTypes,
                docxFile: docxFile,
                numbering: numbering,
                styles: styles
            });
            return reader.convertXmlToDocument(documentXml);
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
