var readXmlFromZipFile = require("./office-xml-reader").readXmlFromZipFile;

exports.readContentTypesFromZipFile = readContentTypesFromZipFile;
exports.readContentTypesFromXml = readContentTypesFromXml;


function readContentTypesFromZipFile(file) {
    return readXmlFromZipFile(file, "[Content_Types].xml")
        .then(function(xml) {
            return xml ? readContentTypesFromXml(xml) : defaultContentTypes;
        });
}

function readContentTypesFromXml(xml) {
    var extensionDefaults = {};
    
    xml.root.children.forEach(function(child) {
        if (child.name === "content-types:Default") {
            extensionDefaults[child.attributes.Extension] = child.attributes.ContentType;
        }
    });
    
    return {
        findContentType: function(path) {
            var pathParts = path.split(".");
            var extension = pathParts[pathParts.length - 1];
            return extensionDefaults[extension];
        }
    }
}


var defaultContentTypes = {
    findContentType: function(path) {
        return null;
    }
};
