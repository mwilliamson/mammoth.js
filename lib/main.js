var fs = require("fs");

var mammoth = require("./");

function main(argv) {
    var docxPath = argv["docx-path"];
    var outputPath = argv["output-path"];
    mammoth.convertToHtml({path: docxPath})
        .then(function(result) {
            var outputStream = outputPath ? fs.createWriteStream(outputPath) : process.stdout;
            
            outputStream.write(result.value);
        })
        .done();
}

module.exports = main;
