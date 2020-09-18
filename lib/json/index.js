var parentEl = {};
var assetsArray = [];

function getReadableElement(tagName) {
    var elMapping = {
        p: 'paragraph',
        img: 'image',
        ul: 'bulletList',
        ol: 'numberList',
        li: 'listItem'
    };
    return elMapping[tagName] || tagName;
}

function nodeWrite(writer, nodes) {
    nodes.forEach(function(node) {
        writeNode(writer, node);
    });

}
function write(writer, nodes) {
    nodes.forEach(function(node) {
        var tagName = getReadableElement(node.tag.tagName);
        if (parentEl && parentEl.type === 'bulletList' && tagName === 'bulletList') {
            if (node && node.children && node.children.length > 0) {
                parentEl = assetsArray[assetsArray.length - 1];
                nodeWrite(writer, node.children);
            }
        } else {
            var asset = {
                type: tagName,
                object: 'block',
                data: {},
                nodes: []
            };
            assetsArray.push(asset);
            if (node && node.children && node.children.length > 0) {
                parentEl = assetsArray[assetsArray.length - 1];
                nodeWrite(writer, node.children);
            }
        }
    });
    var groupedAssets = writer.groupAssets(assetsArray);
    assetsArray = [];
    parentEl = {};
    return groupedAssets;
}


function writeNode(writer, node) {
    toStrings[node.type](writer, node);
}

var toStrings = {
    element: generateElementObject,
    text: generateTextNode,
    forceWrite: function() { }
};
function generateElementObject(writer, node) {
    writer.element(node, assetsArray, parentEl);
    nodeWrite(writer, node.children);
}

function generateTextNode(writer, node) {
    writer.text(node.value, parentEl);
}

exports.write = write;
