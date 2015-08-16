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
        writeNode(builder, child);
    });
    return builder.end();
}

var nodeWriters = {
    element: writeElement,
    text: writeTextNode
}

function writeNode(builder, node) {
    return nodeWriters[node.type](builder, node);
}

function writeElement(builder, element) {
    var elementBuilder = builder.element(element.name);
    element.children.forEach(function(child) {
        writeNode(elementBuilder, child);
    });
}

function writeTextNode(builder, node) {
    builder.text(node.value);
}
