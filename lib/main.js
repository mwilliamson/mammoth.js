/* global process */

var fs = require("fs");
var path = require("path");
var util = require("util");

var mammoth = require("./");
var images = require("./images");

var readFile = util.promisify(fs.readFile);
var writeFile = util.promisify(fs.writeFile);

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
                var extension = element.contentType.split("/")[1];
                var filename = imageIndex + "." + extension;

                return element.read().then(function(imageBuffer) {
                    var imagePath = path.join(outputDir, filename);
                    return writeFile(imagePath, imageBuffer);
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
    }).then(null, function(error) {
        if (error && error.stack) {
            process.stderr.write(error.stack);
        }
        process.abort();
    });
}

function readStyleMap(styleMapPath) {
    if (styleMapPath) {
        return readFile(styleMapPath, "utf8");
    } else {
        return Promise.resolve(null);
    }
}

module.exports = main;
