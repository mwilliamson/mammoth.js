var xmldom = require("@xmldom/xmldom");
var dom = require("@xmldom/xmldom/lib/dom");

function parseFromString(string, mimeType) {
    var error = null;

    var domParser = new xmldom.DOMParser({
        onError: function(level, message) {
            error = {level: level, message: message};
        }
    });

    var document = domParser.parseFromString(string, mimeType);

    if (error === null) {
        return document;
    } else {
        throw new Error(error.level + ": " + error.message);
    }
}

exports.parseFromString = parseFromString;
exports.Node = dom.Node;
