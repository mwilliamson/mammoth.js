var styles = require("./styles");

exports.read = read;


function read(string) {
    var elementStrings = string.split(/\s+/);
    var elements = elementStrings.map(readElement);
    return styles.elements(elements);
}

function readElement(string) {
    var parts = string.split(".");
    var tagName = parts[0];
    var classNames = parts.slice(1);
    var options = {};
    if (classNames.length > 0) {
        options["class"] = classNames.join(" ");
    }
    return styles.element(tagName, options);
}
