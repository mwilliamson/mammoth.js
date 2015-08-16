var promises = require("../promises");
var officeXml = require("./office-xml-reader");
var xml = require("../xml");

exports.writeStyleMap = writeStyleMap;
exports.readStyleMap = readStyleMap;


var styleMapPath = "mammoth/style-map";

function writeStyleMap(docxFile, styleMap) {
    docxFile.write(styleMapPath, styleMap);
    return updateRelationships(docxFile);
}

function updateRelationships(docxFile) {
    var path = "word/_rels/document.xml.rels";
    var relationshipsUri = "http://schemas.openxmlformats.org/package/2006/relationships";
    return officeXml.readXmlFromZipFile(docxFile, path)
        .then(function(relationshipsDocument) {
            var relationships = relationshipsDocument.root;
            relationships.children.push(xml.element("{" + relationshipsUri + "}Relationship", {
                "Id": "rMammothStyleMap",
                "Type": "http://schemas.zwobble.org/mammoth/style-map",
                "Target": "/" + styleMapPath
            }));
            var namespaces = {"": relationshipsUri};
            return docxFile.write(path, xml.writeString(relationships, namespaces));
        });
    
}

function readStyleMap(docxFile) {
    if (docxFile.exists(styleMapPath)) {
        return docxFile.read(styleMapPath, "utf8");
    } else {
        return promises.resolve(null);
    }
}
