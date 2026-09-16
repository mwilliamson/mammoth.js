/* global process */

var path = require("path");

var mammoth = require("./");
var fs = require("./fs");
var images = require("./images");
var promises = require("./promises");

function main(argv) {
    var docxPath = argv["docx-path"];
    var outputPath = argv["output-path"];
    var outputDir = argv.output_dir;
    var outputFormat = argv.output_format;
    var styleMapPath = argv.style_map;

    readStyleMap(styleMapPath).then(function(styleMap) {
        var options = {
            styleMap: styleMap,
            outputFormat: outputFormat
        };

        if (outputDir) {
            var basename = path.basename(docxPath, ".docx");
            outputPath = path.join(outputDir, basename + ".html");
            var imageIndex = 0;
            options.convertImage = images.imgElement(function(element) {
                imageIndex++;
                var extension = images.imageFilenameExtension(element);
                var filename = imageIndex + (extension === undefined ? "" : "." + extension);

                return element.read().then(function(imageBuffer) {
                    var imagePath = path.join(outputDir, filename);
                    return fs.writeFile(imagePath, imageBuffer);
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
        return fs.readFile(styleMapPath, "utf8");
    } else {
        return promises.resolve(null);
    }
}

module.exports = main;
