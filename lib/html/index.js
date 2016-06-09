var ast = require("./ast");

exports.freshElement = ast.freshElement;
exports.nonFreshElement = ast.nonFreshElement;
exports.elementWithTag = ast.elementWithTag;
exports.selfClosingElement = ast.selfClosingElement;
exports.text = ast.text;
exports.forceWrite = ast.forceWrite;

function pathToNodes(path, children) {
    var result = children;
    for (var index = path.length - 1; index >= 0; index--) {
        result = [ast.elementWithTag(path[index], result)];
    }
    return result;
}

exports.pathToNodes = pathToNodes;
exports.simplify = require("./simplify");

function write(writer, nodes) {
    nodes.forEach(function(node) {
        writeNode(writer, node);
    });
}

function writeNode(writer, node) {
    toStrings[node.type](writer, node);
}

var toStrings = {
    element: generateElementString,
    selfClosingElement: generateSelfClosingElementString,
    text: generateTextString,
    forceWrite: function() { }
};

function generateElementString(writer, node) {
    writer.open(node.tag.tagName, node.tag.attributes);
    write(writer, node.children);
    writer.close(node.tag.tagName);
}

function generateSelfClosingElementString(writer, node) {
    writer.selfClosing(node.tagName, node.attributes);
}

function generateTextString(writer, node) {
    writer.text(node.value);
}

exports.write = write;
