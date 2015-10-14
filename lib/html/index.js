var ast = require("./ast");

exports.fragment = ast.fragment;
exports.freshElement = ast.freshElement;
exports.nonFreshElement = ast.nonFreshElement;
exports.elementWithTag = ast.elementWithTag;
exports.selfClosingElement = ast.selfClosingElement;
exports.text = ast.text;
exports.forceWrite = ast.forceWrite;

function pathToNode(path, children) {
    var result = ast.fragment(children);
    for (var index = path.length - 1; index >= 0; index--) {
        result = ast.elementWithTag(path[index], [result]);
    }
    return result;
}

exports.pathToNode = pathToNode;
exports.simplify = require("./simplify");

function write(writer, node) {
    toStrings[node.type](writer, node);
}

var toStrings = {
    fragment: generateFragmentString,
    element: generateElementString,
    selfClosingElement: generateSelfClosingElementString,
    text: generateTextString,
    forceWrite: function() { }
};

function generateFragmentString(writer, node) {
    node.children.forEach(function(child) {
        write(writer, child);
    });
}

function generateElementString(writer, node) {
    writer.open(node.tag.tagName, node.tag.attributes);
    node.children.forEach(function(child) {
        write(writer, child);
    });
    writer.close(node.tag.tagName);
}

function generateSelfClosingElementString(writer, node) {
    writer.selfClosing(node.tagName, node.attributes);
}

function generateTextString(writer, node) {
    writer.text(node.value);
}

exports.write = write;
