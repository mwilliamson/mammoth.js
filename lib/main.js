var fs = require("fs");
var path = require("path");

var mammoth = require("./");
var promises = require("./promises");
var images = require("./images");

function main(argv) {
    var docxPath = argv["docx-path"];
    var outputPath = argv["output-path"];
    var outputDir = argv["output-dir"];
    var outputFormat = argv["output-format"];
    var styleMapPath = argv["style-map"];
    
    readStyleMap(styleMapPath).then(function(styleMap) {
        var options = {
            styleMap: styleMap,
            outputFormat: outputFormat
        };
        
        if (outputDir) {
            var basename = path.basename(docxPath, ".docx");
            outputPath = path.join(outputDir, basename + ".html");
            var imageIndex = 0;
            options.convertImage = images.inline(function(element) {
                imageIndex++;
                var extension = element.contentType.split("/")[1];
                var filename = imageIndex + "." + extension;
                
                return element.read().then(function(imageBuffer) {
                    var imagePath = path.join(outputDir, filename);
                    return promises.nfcall(fs.writeFile, imagePath, imageBuffer);
                }).then(function() {
                    return {src: filename};
                });
            });
        }
        
        return mammoth.convert({path: docxPath}, options)
            .then(function(result) {
                result.messages.forEach(function(message) {
                    process.stderr.write(message.message);
                    process.stderr.write("\n");
                });
                
                var outputStream = outputPath ? fs.createWriteStream(outputPath) : process.stdout;
                
                outputStream.write(result.value);
            });
    }).done();
}

function readStyleMap(styleMapPath) {
    if (styleMapPath) {
        return promises.nfcall(fs.readFile, styleMapPath, "utf8");
    } else {
        return promises.resolve(null);
    }
}

module.exports = main;
