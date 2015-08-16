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
        builder.element(child.name);
    });
    return builder.end();
}
