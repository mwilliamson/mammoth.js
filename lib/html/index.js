var ast = require("./ast");

exports.fragment = ast.fragment;
exports.element = ast.element;
exports.elementWithTag = ast.elementWithTag;
exports.text = ast.text;

function pathToNode(path, children) {
    var result = ast.fragment(children);
    for (var index = path.length - 1; index >= 0; index--) {
        result = ast.elementWithTag(path[index], [result]);
    }
    return result;
}

exports.pathToNode = pathToNode;
exports.simplify = require("./simplify");
