var styles = require("./styles");

exports.read = read;


function read(string) {
    var elementStrings = string.split(/\s+/);
    var elements = elementStrings.map(readElement);
    return styles.elements(elements);
}

function readElement(string) {
    var colonParts = string.split(":");
    var parts = colonParts[0].split(".");
    var tagName = parts[0];
    var classNames = parts.slice(1);
    var options = {};
    if (classNames.length > 0) {
        options["class"] = classNames.join(" ");
    }
    if (colonParts[1] === "fresh") {
        options.fresh = true;
    }
    return styles.element(tagName, options);
}
