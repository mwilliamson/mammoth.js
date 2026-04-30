var xmldom = require("@xmldom/xmldom");

function parseFromString(string) {
    var error = null;

    var domParser = new xmldom.DOMParser({
        onError: function(level, message) {
            error = {level: level, message: message};
        }
    });

    var document;
    try {
        document = domParser.parseFromString(string, "text/xml");
    } catch (e) {
        throw new Error("fatalError: " + e.message);
    }

    if (error === null) {
        return document;
    } else {
        throw new Error(error.level + ": " + error.message);
    }
}

exports.parseFromString = parseFromString;
exports.Node = xmldom.Node;
