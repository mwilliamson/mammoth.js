var documents = require("./documents");

function convertElementToRawText(element, options) {
    var rawTextOptions = Object.create(options || {});
    if (element.type === "text") {
        return element.value;
    } else if (element.type === documents.types.tab) {
        return "\t";
    } else if (element.type === "break" && element.breakType === "line" && rawTextOptions.allowLineBreaks === true) {
        return "\n";
    } else {
        var tail = element.type === "paragraph" ? "\n\n" : "";
        return (element.children || []).map(function(element) {
            return convertElementToRawText(element, rawTextOptions);
        }).join("") + tail;
    }
}

exports.convertElementToRawText = convertElementToRawText;
