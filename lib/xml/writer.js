var xmlbuilder = require("xmlbuilder");


exports.writeString = writeString;


function writeString(root) {
    return xmlbuilder
        .create(root.name, {
            version: '1.0',
            encoding: 'UTF-8',
            standalone: true
        })
        .end();
}
