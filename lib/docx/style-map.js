var _ = require("underscore");

var promises = require("../promises");
var officeXml = require("./office-xml-reader");
var xml = require("../xml");

exports.writeStyleMap = writeStyleMap;
exports.readStyleMap = readStyleMap;


var schema = "http://schemas.zwobble.org/mammoth/style-map";
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
            var relationshipsContainer = relationshipsDocument.root;
            var relationships = relationshipsContainer.children;
            var relationshipId = "rMammothStyleMap";
            var attributes = {
                "Id": relationshipId,
                "Type": schema,
                "Target": "/" + styleMapPath
            };
            
            var existingRelationship = _.find(relationships, function(relationship) {
                return relationship.attributes.Id === relationshipId;
            });
            if (existingRelationship) {
                existingRelationship.attributes = attributes;
            } else {
                relationships.push(xml.element("{" + relationshipsUri + "}Relationship", attributes));
            }
            var namespaces = {"": relationshipsUri};
            return docxFile.write(path, xml.writeString(relationshipsContainer, namespaces));
        });
    
}

function readStyleMap(docxFile) {
    if (docxFile.exists(styleMapPath)) {
        return docxFile.read(styleMapPath, "utf8");
    } else {
        return promises.resolve(null);
    }
}
