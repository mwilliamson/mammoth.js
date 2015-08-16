var xmlbuilder = require("xmlbuilder");


exports.writeString = writeString;


function writeString(root) {
    var builder = xmlbuilder
        .create(root.name, {
            version: '1.0',
            encoding: 'UTF-8',
            standalone: true
        });
    root.children.forEach(function(child) {
        writeElement(builder, child);
    });
    return builder.end();
}


function writeElement(builder, element) {
    var elementBuilder = builder.element(element.name);
    element.children.forEach(function(child) {
        writeElement(elementBuilder, child);
    });
}
