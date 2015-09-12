var _ = require("underscore");

var promises = require("../promises");
var xml = require("../xml");

exports.writeStyleMap = writeStyleMap;
exports.readStyleMap = readStyleMap;


var schema = "http://schemas.zwobble.org/mammoth/style-map";
var styleMapPath = "mammoth/style-map";
var styleMapAbsolutePath = "/" + styleMapPath;

function writeStyleMap(docxFile, styleMap) {
    docxFile.write(styleMapPath, styleMap);
    return updateRelationships(docxFile).then(function() {
        return updateContentTypes(docxFile);
    });
}

function updateRelationships(docxFile) {
    var path = "word/_rels/document.xml.rels";
    var relationshipsUri = "http://schemas.openxmlformats.org/package/2006/relationships";
    return docxFile.read(path, "utf8")
        .then(xml.readString)
        .then(function(relationshipsDocument) {
            var relationshipsContainer = relationshipsDocument.root;
            var relationships = relationshipsContainer.children;
            var relationshipId = "rMammothStyleMap";
            var attributes = {
                "Id": relationshipId,
                "Type": schema,
                "Target": styleMapAbsolutePath
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

function updateContentTypes(docxFile) {
    var path = "[Content_Types].xml";
    var contentTypesUri = "http://schemas.openxmlformats.org/package/2006/content-types";
    var overrideName = "{" + contentTypesUri + "}Override";
    return docxFile.read(path, "utf8")
        .then(xml.readString)
        .then(function(typesDocument) {
            var typesElement = typesDocument.root;
            var children = typesElement.children;
            var attributes = {
                "PartName": styleMapAbsolutePath,
                "ContentType": "text/prs.mammoth.style-map"
            };
            
            var existingOverride = _.find(children, function(child) {
                return child.name === overrideName && child.attributes.PartName === styleMapAbsolutePath;
            });
            if (existingOverride) {
                existingOverride.attributes = attributes;
            } else {
                children.push(xml.element(overrideName, attributes));
            }
            var namespaces = {"": contentTypesUri};
            return docxFile.write(path, xml.writeString(typesElement, namespaces));
        });
}

function readStyleMap(docxFile) {
    if (docxFile.exists(styleMapPath)) {
        return docxFile.read(styleMapPath, "utf8");
    } else {
        return promises.resolve(null);
    }
}
